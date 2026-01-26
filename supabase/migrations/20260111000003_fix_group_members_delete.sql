-- =============================================
-- group_members DELETE 정책 추가/수정
-- 사용자가 본인의 그룹 멤버십을 삭제할 수 있도록 허용
-- =============================================

-- 기존 DELETE 정책 삭제
DROP POLICY IF EXISTS "멤버 탈퇴" ON group_members;
DROP POLICY IF EXISTS "group_members_delete" ON group_members;

-- DELETE 정책 재생성
CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    -- 1. 본인은 자신의 멤버십 삭제 가능 (그룹 탈퇴)
    auth.uid() = user_id
    OR
    -- 2. 그룹 관리자는 멤버 강제 퇴장 가능
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
    OR
    -- 3. 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );
