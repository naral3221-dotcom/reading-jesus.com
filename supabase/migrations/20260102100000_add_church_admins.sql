-- =====================================================
-- 교회 관리자 계정 테이블 생성
-- 기존 토큰 방식과 병행하여 이메일/비밀번호 인증 지원
-- =====================================================

-- 1. church_admins 테이블 생성
CREATE TABLE IF NOT EXISTS church_admins (
  id UUID PRIMARY KEY, -- auth.users.id와 동일
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  email VARCHAR(100) NOT NULL,
  nickname VARCHAR(50),
  role VARCHAR(20) DEFAULT 'church_admin' CHECK (role IN ('church_admin', 'church_moderator')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_church_admins_church_id ON church_admins(church_id);
CREATE INDEX IF NOT EXISTS idx_church_admins_email ON church_admins(email);
CREATE INDEX IF NOT EXISTS idx_church_admins_is_active ON church_admins(is_active);

-- 3. 유니크 제약 (한 교회에 같은 이메일 중복 불가)
CREATE UNIQUE INDEX IF NOT EXISTS idx_church_admins_email_unique ON church_admins(email);

-- 4. 업데이트 트리거
CREATE OR REPLACE FUNCTION update_church_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_church_admins_updated_at ON church_admins;
CREATE TRIGGER trigger_church_admins_updated_at
  BEFORE UPDATE ON church_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_church_admins_updated_at();

-- 5. RLS 활성화
ALTER TABLE church_admins ENABLE ROW LEVEL SECURITY;

-- 6. RLS 정책

-- 본인 정보 조회 가능
CREATE POLICY "church_admins_select_own" ON church_admins
  FOR SELECT USING (auth.uid() = id);

-- 같은 교회 관리자 목록 조회 (교회 관리자끼리)
CREATE POLICY "church_admins_select_same_church" ON church_admins
  FOR SELECT USING (
    church_id IN (
      SELECT church_id FROM church_admins WHERE id = auth.uid()
    )
  );

-- 시스템 관리자는 모든 교회 관리자 조회 가능
CREATE POLICY "church_admins_select_system_admin" ON church_admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin')
    )
  );

-- 시스템 관리자만 교회 관리자 생성 가능
CREATE POLICY "church_admins_insert_system_admin" ON church_admins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin')
    )
  );

-- 본인 정보만 수정 가능 (닉네임 등)
CREATE POLICY "church_admins_update_own" ON church_admins
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 시스템 관리자는 모든 교회 관리자 정보 수정 가능
CREATE POLICY "church_admins_update_system_admin" ON church_admins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin')
    )
  );

-- 시스템 관리자만 삭제 가능
CREATE POLICY "church_admins_delete_system_admin" ON church_admins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('superadmin', 'admin')
    )
  );

-- 7. 로그인 시간 업데이트 함수
CREATE OR REPLACE FUNCTION update_church_admin_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE church_admins
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 코멘트 추가
COMMENT ON TABLE church_admins IS '교회 관리자 계정 테이블 - Supabase Auth와 연동';
COMMENT ON COLUMN church_admins.id IS 'auth.users.id와 동일한 UUID';
COMMENT ON COLUMN church_admins.church_id IS '관리하는 교회 ID';
COMMENT ON COLUMN church_admins.role IS '교회 내 역할: church_admin(관리자), church_moderator(부관리자)';
