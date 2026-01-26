-- =============================================
-- 그룹 가입 방식 추가: 공개제 / 승인제
-- =============================================

-- 1. groups 테이블에 join_type 컬럼 추가
-- 'open': 공개 가입 (누구나 바로 가입 가능)
-- 'approval': 승인제 가입 (관리자 승인 필요)
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS join_type TEXT DEFAULT 'open' CHECK (join_type IN ('open', 'approval'));

-- 기존 그룹은 모두 공개 가입으로 설정
UPDATE groups SET join_type = 'open' WHERE join_type IS NULL;

-- 2. 가입 신청 테이블 생성
CREATE TABLE IF NOT EXISTS group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT, -- 가입 신청 메시지 (선택)
  rejected_reason TEXT, -- 거절 사유 (선택)
  reviewed_by UUID REFERENCES auth.users(id), -- 처리한 관리자
  reviewed_at TIMESTAMPTZ, -- 처리 시간
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 복합 인덱스로 조회 성능 향상 (UNIQUE 제약은 partial index로 대체)
  PRIMARY KEY (id)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_group_join_requests_group_id ON group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_user_id ON group_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_status ON group_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_pending ON group_join_requests(group_id) WHERE status = 'pending';

-- pending 상태에서만 중복 신청 방지 (거절 후 재신청 허용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_group_join_requests_unique_pending
  ON group_join_requests(group_id, user_id)
  WHERE status = 'pending';

-- 4. RLS 정책 설정
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- 본인의 신청 내역 조회
CREATE POLICY "group_join_requests_select_own" ON group_join_requests
  FOR SELECT USING (user_id = auth.uid());

-- 그룹 관리자는 해당 그룹의 신청 내역 조회 가능
CREATE POLICY "group_join_requests_select_admin" ON group_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_join_requests.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- 로그인한 사용자는 가입 신청 가능
CREATE POLICY "group_join_requests_insert" ON group_join_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      -- 이미 멤버인 경우 신청 불가
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_join_requests.group_id
      AND group_members.user_id = auth.uid()
    )
    AND NOT EXISTS (
      -- 이미 대기 중인 신청이 있는 경우 신청 불가
      SELECT 1 FROM group_join_requests gjr
      WHERE gjr.group_id = group_join_requests.group_id
      AND gjr.user_id = auth.uid()
      AND gjr.status = 'pending'
    )
  );

-- 본인의 대기 중인 신청 취소 가능
CREATE POLICY "group_join_requests_delete_own" ON group_join_requests
  FOR DELETE USING (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- 그룹 관리자는 신청 상태 변경 가능
CREATE POLICY "group_join_requests_update_admin" ON group_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_join_requests.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- 5. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_group_join_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_group_join_requests_updated_at ON group_join_requests;
CREATE TRIGGER trigger_update_group_join_requests_updated_at
  BEFORE UPDATE ON group_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_group_join_requests_updated_at();

-- 6. 신청 승인 시 자동으로 멤버 추가하는 함수
CREATE OR REPLACE FUNCTION approve_group_join_request(
  p_request_id UUID,
  p_admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_request group_join_requests%ROWTYPE;
BEGIN
  -- 신청 정보 조회
  SELECT * INTO v_request FROM group_join_requests WHERE id = p_request_id;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  -- 관리자 권한 확인
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_request.group_id
    AND user_id = p_admin_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 신청 상태 업데이트
  UPDATE group_join_requests
  SET status = 'approved',
      reviewed_by = p_admin_id,
      reviewed_at = NOW()
  WHERE id = p_request_id;

  -- 멤버로 추가
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_request.group_id, v_request.user_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 신청 거절 함수
CREATE OR REPLACE FUNCTION reject_group_join_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_request group_join_requests%ROWTYPE;
BEGIN
  -- 신청 정보 조회
  SELECT * INTO v_request FROM group_join_requests WHERE id = p_request_id;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  -- 관리자 권한 확인
  IF NOT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_request.group_id
    AND user_id = p_admin_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 신청 상태 업데이트
  UPDATE group_join_requests
  SET status = 'rejected',
      rejected_reason = p_reason,
      reviewed_by = p_admin_id,
      reviewed_at = NOW()
  WHERE id = p_request_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON COLUMN groups.join_type IS '그룹 가입 방식: open(공개 가입), approval(승인제)';
COMMENT ON TABLE group_join_requests IS '그룹 가입 신청 내역 (승인제 그룹용)';
