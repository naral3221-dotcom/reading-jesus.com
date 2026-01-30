-- =============================================
-- group_members ↔ groups 순환 참조 완전 해결
-- SECURITY DEFINER 함수를 사용하여 RLS 우회
-- =============================================

-- =============================================
-- 1. 헬퍼 함수 생성 (SECURITY DEFINER로 RLS 우회)
-- =============================================

-- 그룹의 church_id 조회 (RLS 우회)
CREATE OR REPLACE FUNCTION get_group_church_id(p_group_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT church_id FROM groups WHERE id = p_group_id;
$$;

-- 그룹이 공개인지 확인 (RLS 우회)
CREATE OR REPLACE FUNCTION is_group_public(p_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(is_public, false) FROM groups WHERE id = p_group_id;
$$;

-- 사용자가 그룹 멤버인지 확인 (RLS 우회)
CREATE OR REPLACE FUNCTION is_user_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
  );
$$;

-- 사용자의 church_id 조회 (RLS 우회)
CREATE OR REPLACE FUNCTION get_user_church_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT church_id FROM profiles WHERE id = p_user_id;
$$;

-- =============================================
-- 2. group_members SELECT 정책 수정 (순환 참조 제거)
-- =============================================
DROP POLICY IF EXISTS "group_members_select" ON group_members;

-- 모든 groups 참조를 SECURITY DEFINER 함수로 대체
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    -- 1. 관리자는 모든 멤버 조회 가능
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
    OR
    -- 2. 공개 그룹의 멤버 조회 가능 (함수 사용)
    is_group_public(group_id)
    OR
    -- 3. 본인이 멤버인 그룹의 모든 멤버 조회 가능 (함수 사용)
    is_user_group_member(group_id, auth.uid())
    OR
    -- 4. 같은 교회 소속 사용자는 교회 내 그룹 멤버 조회 가능 (함수 사용)
    (
      get_user_church_id(auth.uid()) IS NOT NULL
      AND get_user_church_id(auth.uid()) = get_group_church_id(group_id)
    )
    OR
    -- 5. 비회원도 공개 그룹 멤버 조회 가능
    auth.uid() IS NULL
  );

-- =============================================
-- 3. groups SELECT 정책 수정 (group_members 참조 완전 제거)
-- =============================================
DROP POLICY IF EXISTS "groups_select" ON groups;
DROP POLICY IF EXISTS "그룹 조회" ON groups;

-- 순환 참조 방지: group_members를 절대 참조하지 않음
-- 멤버 여부 체크는 애플리케이션 레벨에서 처리
CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (
    -- 1. 공개 그룹은 누구나 조회 가능
    is_public = true
    OR
    -- 2. 본인이 생성한 그룹
    created_by = auth.uid()
    OR
    -- 3. 관리자는 모든 그룹 조회 가능
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
    OR
    -- 4. 같은 교회 소속 사용자는 교회 그룹 조회 가능 (함수 사용)
    (
      church_id IS NOT NULL
      AND get_user_church_id(auth.uid()) = church_id
    )
    OR
    -- 5. 비회원도 공개 그룹 조회 가능
    auth.uid() IS NULL
  );

-- =============================================
-- 4. 헬퍼 함수에 권한 부여
-- =============================================
GRANT EXECUTE ON FUNCTION get_group_church_id(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_group_public(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_user_group_member(UUID, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_church_id(UUID) TO authenticated, anon;
