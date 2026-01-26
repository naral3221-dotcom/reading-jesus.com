-- =============================================
-- RLS 순환 참조 문제 해결
-- group_members ↔ groups 간의 순환 참조로 인한 500 에러 수정
-- =============================================

-- =============================================
-- 1. group_members SELECT 정책 수정 (순환 참조 제거)
-- =============================================
DROP POLICY IF EXISTS "group_members_select" ON group_members;

-- 단순화된 정책: groups 테이블 참조 제거
CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    -- 1. 관리자는 모든 멤버 조회 가능
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
    OR
    -- 2. 본인이 멤버인 그룹의 모든 멤버 조회 가능
    group_id IN (
      SELECT gm.group_id FROM group_members gm WHERE gm.user_id = auth.uid()
    )
    OR
    -- 3. 같은 교회 소속 사용자는 교회 내 그룹 멤버 조회 가능
    -- (profiles만 참조하여 순환 참조 방지)
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.church_id IS NOT NULL
      AND p.church_id = (
        SELECT g.church_id FROM groups g WHERE g.id = group_members.group_id
      )
    )
    OR
    -- 4. 비회원도 조회 가능 (공개 그룹 체크는 애플리케이션에서)
    auth.uid() IS NULL
  );

-- =============================================
-- 2. groups SELECT 정책 수정 (순환 참조 제거)
-- =============================================
DROP POLICY IF EXISTS "그룹 조회" ON groups;
DROP POLICY IF EXISTS "groups_select" ON groups;

-- 단순화된 정책: group_members 참조 최소화
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
    -- 4. 같은 교회 소속 사용자는 교회 그룹 조회 가능
    (
      church_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.church_id = groups.church_id
      )
    )
    OR
    -- 5. 비회원도 공개 그룹 조회 가능
    auth.uid() IS NULL
  );

-- =============================================
-- 3. groups UPDATE 정책 수정 (SECURITY DEFINER 함수 사용)
-- =============================================

-- 헬퍼 함수: 그룹 관리자 여부 확인 (SECURITY DEFINER로 RLS 우회)
CREATE OR REPLACE FUNCTION is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "그룹 수정" ON groups;
DROP POLICY IF EXISTS "groups_update" ON groups;

CREATE POLICY "groups_update" ON groups
  FOR UPDATE USING (
    -- 그룹 생성자 또는 그룹 관리자
    created_by = auth.uid()
    OR is_group_admin(id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- =============================================
-- 4. groups DELETE 정책 수정
-- =============================================
DROP POLICY IF EXISTS "그룹 삭제" ON groups;
DROP POLICY IF EXISTS "groups_delete" ON groups;

CREATE POLICY "groups_delete" ON groups
  FOR DELETE USING (
    -- 그룹 생성자 또는 그룹 관리자
    created_by = auth.uid()
    OR is_group_admin(id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- =============================================
-- 5. comments SELECT 정책 수정 (순환 참조 제거)
-- =============================================
DROP POLICY IF EXISTS "Anyone can view public or own or group comments" ON comments;
DROP POLICY IF EXISTS "comments_select" ON comments;

-- 헬퍼 함수: 그룹 멤버 여부 확인
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
  );
$$;

CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (
    -- 1. 공개 댓글은 누구나 조회 가능
    is_public = true
    OR
    -- 2. 본인 댓글
    user_id = auth.uid()
    OR
    -- 3. 본인이 속한 그룹의 댓글 (SECURITY DEFINER 함수 사용)
    (group_id IS NOT NULL AND is_group_member(group_id, auth.uid()))
    OR
    -- 4. 비회원도 공개 댓글 조회 가능
    auth.uid() IS NULL
  );

-- =============================================
-- 6. comments DELETE 정책 수정
-- =============================================
DROP POLICY IF EXISTS "댓글 삭제" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;

CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (
    -- 본인 댓글 삭제
    auth.uid() = user_id
    OR
    -- 그룹 관리자는 그룹 댓글 삭제 가능
    (group_id IS NOT NULL AND is_group_admin(group_id, auth.uid()))
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );
