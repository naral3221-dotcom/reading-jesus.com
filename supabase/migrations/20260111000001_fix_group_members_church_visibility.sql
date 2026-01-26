-- =============================================
-- group_members RLS 정책 수정
-- 같은 교회 소속 사용자가 교회 내 그룹 멤버 수를 조회할 수 있도록 수정
-- =============================================

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "group_members_select" ON group_members;

-- 새 SELECT 정책:
-- 1. 관리자는 모든 멤버 조회 가능
-- 2. 공개 그룹의 멤버 조회 가능
-- 3. 자신이 속한 그룹의 멤버 조회 가능
-- 4. 같은 교회 소속 사용자는 교회 내 그룹 멤버 조회 가능 (NEW!)
-- 5. 비회원도 공개 그룹 멤버 수 조회 가능
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    -- 관리자는 모든 그룹 멤버 조회 가능
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
    OR
    -- 일반 사용자는 공개 그룹의 멤버 조회 가능
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.is_public = true
    )
    OR
    -- 자신이 속한 그룹의 멤버 조회 가능
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
    OR
    -- 같은 교회 소속 사용자는 교회 내 그룹 멤버 조회 가능 (NEW!)
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN groups g ON g.church_id = p.church_id
      WHERE p.id = auth.uid()
      AND g.id = group_members.group_id
      AND p.church_id IS NOT NULL
    )
    OR
    -- 비회원도 공개 그룹 멤버 수 조회 가능 (count 용)
    auth.uid() IS NULL
  );

-- 기존 비공개 교회 그룹들을 공개로 변경
UPDATE groups
SET is_public = true
WHERE church_id IS NOT NULL
AND is_public = false;
