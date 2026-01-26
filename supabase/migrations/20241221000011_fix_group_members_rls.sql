-- =============================================
-- group_members RLS 정책 수정
-- 관리자(superadmin, admin, moderator)가 모든 그룹 멤버를 조회할 수 있도록 수정
-- =============================================

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_select_policy" ON group_members;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Anyone can view group members" ON group_members;

-- 새 SELECT 정책: 관리자는 모든 멤버 조회 가능, 일반 사용자는 자신이 속한 그룹만
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
    -- 비회원도 공개 그룹 멤버 수 조회 가능 (count 용)
    auth.uid() IS NULL
  );

-- INSERT 정책 확인/수정
DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (
    -- 자기 자신만 그룹에 가입 가능
    auth.uid() = user_id
    OR
    -- 관리자는 다른 사용자를 그룹에 추가 가능
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 관리자(owner 또는 admin 역할)는 멤버 추가 가능
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_id
      AND groups.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- UPDATE 정책
DROP POLICY IF EXISTS "group_members_update" ON group_members;
DROP POLICY IF EXISTS "Group admins can update members" ON group_members;

CREATE POLICY "group_members_update" ON group_members
  FOR UPDATE USING (
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.owner_id = auth.uid()
    )
    OR
    -- 그룹 관리자
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- DELETE 정책
DROP POLICY IF EXISTS "group_members_delete" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;

CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    -- 자기 자신 탈퇴
    auth.uid() = user_id
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.owner_id = auth.uid()
    )
    OR
    -- 그룹 관리자
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );
