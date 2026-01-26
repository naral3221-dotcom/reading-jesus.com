-- =============================================
-- 그룹 가입 요청 테이블 및 RLS 정책
-- 가입 신청 → 관리자 승인 시스템
-- =============================================

-- 1. 그룹 가입 요청 테이블 생성
CREATE TABLE IF NOT EXISTS group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text, -- 가입 신청 메시지 (선택)
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- 처리한 관리자
  reviewed_at timestamptz, -- 처리 시간
  reject_reason text, -- 거절 사유 (선택)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 같은 그룹에 같은 사용자가 중복 신청 방지 (pending 상태만)
  UNIQUE (group_id, user_id)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_group_join_requests_group_id ON group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_user_id ON group_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_status ON group_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_group_status ON group_join_requests(group_id, status);

-- 3. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_group_join_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_group_join_requests_updated_at ON group_join_requests;
CREATE TRIGGER trigger_group_join_requests_updated_at
  BEFORE UPDATE ON group_join_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_group_join_requests_updated_at();

-- 4. RLS 활성화
ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책

-- SELECT: 본인 신청 또는 그룹 관리자
CREATE POLICY "group_join_requests_select" ON group_join_requests
  FOR SELECT USING (
    -- 본인의 신청
    user_id = auth.uid()
    OR
    -- 그룹 관리자 (헬퍼 함수 사용)
    is_group_admin_for_delete(group_id, auth.uid())
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- INSERT: 로그인 사용자 누구나 신청 가능
CREATE POLICY "group_join_requests_insert" ON group_join_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- UPDATE: 그룹 관리자만 (승인/거절)
CREATE POLICY "group_join_requests_update" ON group_join_requests
  FOR UPDATE USING (
    -- 그룹 관리자
    is_group_admin_for_delete(group_id, auth.uid())
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- DELETE: 본인 신청 취소 또는 관리자
CREATE POLICY "group_join_requests_delete" ON group_join_requests
  FOR DELETE USING (
    -- 본인이 신청 취소
    user_id = auth.uid()
    OR
    -- 그룹 관리자
    is_group_admin_for_delete(group_id, auth.uid())
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- 6. groups 테이블에 join_type, is_private 컬럼 추가 (없는 경우)
DO $$
BEGIN
  -- join_type: 가입 방식 (open=바로가입, approval=승인제)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'groups' AND column_name = 'join_type'
  ) THEN
    ALTER TABLE groups ADD COLUMN join_type text DEFAULT 'open' CHECK (join_type IN ('open', 'approval'));
  END IF;

  -- is_private: 그룹 공개 여부 (true=멤버만 열람, false=모두 열람)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'groups' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE groups ADD COLUMN is_private boolean DEFAULT true;
  END IF;
END $$;

-- 7. 가입 승인 RPC 함수
CREATE OR REPLACE FUNCTION approve_group_join_request(
  p_request_id uuid,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- 신청 정보 조회
  SELECT * INTO v_request
  FROM group_join_requests
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- 관리자 권한 확인
  IF NOT is_group_admin_for_delete(v_request.group_id, p_admin_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 이미 멤버인지 확인
  IF EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = v_request.group_id AND user_id = v_request.user_id
  ) THEN
    -- 이미 멤버면 신청만 삭제
    DELETE FROM group_join_requests WHERE id = p_request_id;
    RETURN;
  END IF;

  -- 멤버로 추가
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_request.group_id, v_request.user_id, 'member');

  -- 신청 상태 업데이트
  UPDATE group_join_requests
  SET status = 'approved',
      reviewed_by = p_admin_id,
      reviewed_at = now()
  WHERE id = p_request_id;
END;
$$;

-- 8. 가입 거절 RPC 함수
CREATE OR REPLACE FUNCTION reject_group_join_request(
  p_request_id uuid,
  p_admin_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- 신청 정보 조회
  SELECT * INTO v_request
  FROM group_join_requests
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- 관리자 권한 확인
  IF NOT is_group_admin_for_delete(v_request.group_id, p_admin_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 신청 상태 업데이트
  UPDATE group_join_requests
  SET status = 'rejected',
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      reject_reason = p_reason
  WHERE id = p_request_id;
END;
$$;

-- 안내: 이 마이그레이션을 Supabase 대시보드에서 직접 실행하거나
-- supabase db push 명령으로 적용하세요.
