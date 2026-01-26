-- =============================================
-- 그룹 멤버 DELETE RLS 정책 수정 - 무한 재귀 문제 해결
-- group_members 테이블을 자기 참조하지 않도록 수정
-- =============================================

-- 기존 문제가 있는 정책 삭제
DROP POLICY IF EXISTS "group_members_delete" ON group_members;
DROP POLICY IF EXISTS "그룹 멤버 삭제" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

-- 헬퍼 함수 생성 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION is_group_admin_for_delete(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND role = 'admin'
  );
$$;

-- 새 DELETE 정책 생성
-- 1. 본인이 직접 탈퇴 (자기 자신의 멤버십 삭제)
-- 2. 그룹 관리자가 멤버 강퇴 (헬퍼 함수 사용)
-- 3. 시스템 관리자 (superadmin/admin)
CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    -- 1. 본인 탈퇴 (자기 자신의 레코드만)
    user_id = auth.uid()
    OR
    -- 2. 그룹 관리자 (헬퍼 함수로 재귀 방지)
    is_group_admin_for_delete(group_id, auth.uid())
    OR
    -- 3. 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- 안내: 이 마이그레이션을 Supabase 대시보드에서 직접 실행하거나
-- supabase db push 명령으로 적용하세요.
