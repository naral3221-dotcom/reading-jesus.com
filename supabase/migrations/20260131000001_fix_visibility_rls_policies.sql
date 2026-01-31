-- =====================================================
-- 긴급 버그 수정: visibility 기반 RLS 정책 재정비
--
-- 문제:
-- 1. unified_meditations의 기존 정책 "unified_meditations_select"가 USING(true)로 설정되어 있음
-- 2. 20260129000001에서 DROP하려던 정책명이 실제 정책명과 불일치하여 삭제되지 않음
-- 3. guest_comments의 RLS 정책이 visibility 기반으로 업데이트되지 않음
--
-- 해결:
-- 1. 모든 기존 SELECT 정책을 명시적으로 DROP
-- 2. visibility 기반 새 정책 생성
-- =====================================================

-- =====================================================
-- 1. unified_meditations RLS 정책 수정
-- =====================================================

-- 모든 가능한 이름의 기존 정책 삭제
DROP POLICY IF EXISTS "unified_meditations_select" ON unified_meditations;
DROP POLICY IF EXISTS "unified_meditations_select_policy" ON unified_meditations;
DROP POLICY IF EXISTS "Anyone can view unified meditations" ON unified_meditations;
DROP POLICY IF EXISTS "View unified meditations based on visibility" ON unified_meditations;
DROP POLICY IF EXISTS "unified_meditations_select_by_visibility" ON unified_meditations;

-- visibility 기반 새 정책 생성
CREATE POLICY "unified_meditations_select_by_visibility" ON unified_meditations
  FOR SELECT USING (
    -- 1. 공개 글은 누구나 볼 수 있음
    visibility = 'public'
    -- 2. 본인이 작성한 글은 항상 볼 수 있음
    OR user_id = auth.uid()
    -- 3. 그룹 공개 글은 해당 그룹 멤버만 볼 수 있음
    OR (
      visibility = 'group'
      AND source_type = 'group'
      AND EXISTS (
        SELECT 1 FROM group_members
        WHERE group_members.group_id = unified_meditations.source_id
        AND group_members.user_id = auth.uid()
      )
    )
    -- 4. 교회 공개 글은 해당 교회 멤버만 볼 수 있음
    OR (
      visibility = 'church'
      AND source_type = 'church'
      AND EXISTS (
        SELECT 1 FROM church_members
        WHERE church_members.church_id = unified_meditations.source_id
        AND church_members.user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 2. guest_comments RLS 정책 수정
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "guest_comments_select" ON guest_comments;
DROP POLICY IF EXISTS "guest_comments_select_by_visibility" ON guest_comments;

-- visibility 기반 새 정책 생성
CREATE POLICY "guest_comments_select_by_visibility" ON guest_comments
  FOR SELECT USING (
    -- 1. 공개 글은 누구나 볼 수 있음
    visibility = 'public'
    -- 2. 본인이 작성한 글 (로그인 연결된 경우)
    OR linked_user_id = auth.uid()
    -- 3. 교회 공개 글은 해당 교회 멤버만 볼 수 있음
    OR (
      visibility = 'church'
      AND EXISTS (
        SELECT 1 FROM church_members
        WHERE church_members.church_id = guest_comments.church_id
        AND church_members.user_id = auth.uid()
      )
    )
    -- 4. visibility가 NULL인 경우 (레거시 데이터) - 기본적으로 church로 취급
    OR (
      visibility IS NULL
      AND EXISTS (
        SELECT 1 FROM church_members
        WHERE church_members.church_id = guest_comments.church_id
        AND church_members.user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 3. church_qt_posts RLS 정책 확인 및 수정
-- =====================================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "View church qt posts based on visibility" ON church_qt_posts;
DROP POLICY IF EXISTS "church_qt_posts_select_by_visibility" ON church_qt_posts;

-- visibility 기반 새 정책 생성
CREATE POLICY "church_qt_posts_select_by_visibility" ON church_qt_posts
  FOR SELECT USING (
    -- 1. 공개 글은 누구나 볼 수 있음
    visibility = 'public'
    -- 2. 본인이 작성한 글은 항상 볼 수 있음
    OR user_id = auth.uid()
    -- 3. 교회 공개 글은 해당 교회 멤버만 볼 수 있음
    OR (
      visibility = 'church'
      AND EXISTS (
        SELECT 1 FROM church_members
        WHERE church_members.church_id = church_qt_posts.church_id
        AND church_members.user_id = auth.uid()
      )
    )
    -- 4. visibility가 NULL인 경우 (레거시 데이터) - 기본적으로 church로 취급
    OR (
      visibility IS NULL
      AND EXISTS (
        SELECT 1 FROM church_members
        WHERE church_members.church_id = church_qt_posts.church_id
        AND church_members.user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 4. 인덱스 추가 (성능 최적화)
-- =====================================================

-- visibility 인덱스 (없는 경우에만 추가)
CREATE INDEX IF NOT EXISTS idx_unified_meditations_visibility
  ON unified_meditations(visibility);

CREATE INDEX IF NOT EXISTS idx_guest_comments_visibility
  ON guest_comments(visibility);

CREATE INDEX IF NOT EXISTS idx_church_qt_posts_visibility
  ON church_qt_posts(visibility);

-- =====================================================
-- 5. 레거시 데이터 visibility 기본값 설정 (NULL → 'church')
-- =====================================================

-- guest_comments: NULL → 'church'
UPDATE guest_comments
SET visibility = 'church'
WHERE visibility IS NULL;

-- church_qt_posts: NULL → 'church'
UPDATE church_qt_posts
SET visibility = 'church'
WHERE visibility IS NULL;

-- unified_meditations: NULL → source_type에 따라 설정
UPDATE unified_meditations
SET visibility = CASE
  WHEN source_type = 'church' THEN 'church'::content_visibility
  WHEN source_type = 'group' THEN 'group'::content_visibility
  ELSE 'church'::content_visibility
END
WHERE visibility IS NULL;
