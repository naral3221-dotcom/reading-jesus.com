-- =============================================
-- 관리자 시스템 스키마 추가
-- 역할(role), 감사 로그(audit_logs), 시스템 설정(system_settings)
-- =============================================

-- 1. profiles 테이블에 role 컬럼 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role VARCHAR(20) DEFAULT 'user';
  END IF;
END $$;

-- role 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 2. 감사 로그 테이블
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 누가
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email VARCHAR(255),

  -- 무엇을
  action VARCHAR(50) NOT NULL,  -- create, update, delete, login, logout, etc.
  entity_type VARCHAR(50),      -- user, group, post, church, etc.
  entity_id UUID,

  -- 상세 정보
  details JSONB,                -- 변경 전/후 데이터 등
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- 메타
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- 3. 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 기본 설정 값 삽입
INSERT INTO system_settings (key, value, description) VALUES
  ('site_name', '"Reading Jesus"', '사이트 이름'),
  ('site_description', '"성경 통독 앱"', '사이트 설명'),
  ('maintenance_mode', 'false', '유지보수 모드'),
  ('allow_signup', 'true', '회원가입 허용'),
  ('allow_guest_comments', 'true', '비회원 댓글 허용'),
  ('require_email_verification', 'false', '이메일 인증 필수'),
  ('max_post_length', '5000', '최대 게시글 길이')
ON CONFLICT (key) DO NOTHING;

-- 4. 신고 테이블
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 신고자
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- 신고 대상
  target_type VARCHAR(20) NOT NULL,  -- post, comment, user, group
  target_id UUID NOT NULL,

  -- 신고 내용
  reason VARCHAR(100) NOT NULL,      -- spam, harassment, inappropriate, etc.
  description TEXT,

  -- 처리 상태
  status VARCHAR(20) DEFAULT 'pending',  -- pending, resolved, dismissed
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_note TEXT,

  -- 메타
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

-- 5. RLS 정책

-- audit_logs: 관리자만 읽기 가능
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "audit_logs_insert_auth" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- system_settings: 누구나 읽기, 관리자만 수정
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_settings_select" ON system_settings
  FOR SELECT USING (true);

CREATE POLICY "system_settings_update_admin" ON system_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- reports: 인증된 사용자가 신고 가능, 관리자가 처리
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select_auth" ON reports
  FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "reports_insert_auth" ON reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_update_admin" ON reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- 6. 감사 로그 자동 기록 함수 (선택적)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action VARCHAR(50),
  p_entity_type VARCHAR(50),
  p_entity_id UUID,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
