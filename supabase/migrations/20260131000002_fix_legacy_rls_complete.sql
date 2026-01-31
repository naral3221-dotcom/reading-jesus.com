-- =====================================================
-- 긴급 버그 수정 (2차): 레거시 테이블 RLS 정책 완전 재정비
--
-- 문제:
-- 1. comments 테이블: 그룹 멤버십 체크 불완전
-- 2. guest_comments 테이블: 본인 글 조회 조건 불완전
-- 3. church_qt_posts 테이블: 본인 글 조회 조건 불완전
--
-- 해결:
-- 1. 본인 글은 visibility와 상관없이 항상 조회 가능
-- 2. public 글은 누구나 조회 가능
-- 3. 그룹/교회 멤버는 해당 그룹/교회의 글 조회 가능
-- =====================================================

-- =====================================================
-- 1. comments 테이블 (그룹 묵상) RLS 정책
-- =====================================================

-- 기존 SELECT 정책 모두 삭제
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_select_policy" ON comments;
DROP POLICY IF EXISTS "Comments are viewable by group members" ON comments;
DROP POLICY IF EXISTS "comments_select_by_visibility" ON comments;
DROP POLICY IF EXISTS "comments_select_complete" ON comments;

-- 새 SELECT 정책 생성
CREATE POLICY "comments_select_complete" ON comments
  FOR SELECT USING (
    -- 1. 본인이 작성한 글은 항상 볼 수 있음
    user_id = auth.uid()
    -- 2. 공개 글 (is_public 또는 visibility = 'public')
    OR is_public = true
    OR visibility = 'public'
    -- 3. 그룹 멤버는 해당 그룹의 글을 볼 수 있음
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = comments.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. guest_comments 테이블 (교회 묵상) RLS 정책
-- =====================================================

-- 기존 SELECT 정책 모두 삭제
DROP POLICY IF EXISTS "guest_comments_select" ON guest_comments;
DROP POLICY IF EXISTS "guest_comments_select_by_visibility" ON guest_comments;
DROP POLICY IF EXISTS "guest_comments_select_complete" ON guest_comments;

-- 새 SELECT 정책 생성
CREATE POLICY "guest_comments_select_complete" ON guest_comments
  FOR SELECT USING (
    -- 1. 본인이 작성한 글은 항상 볼 수 있음 (로그인 연결된 경우)
    linked_user_id = auth.uid()
    -- 2. 공개 글
    OR visibility = 'public'
    -- 3. 교회 멤버는 해당 교회의 글을 볼 수 있음
    OR EXISTS (
      SELECT 1 FROM church_members
      WHERE church_members.church_id = guest_comments.church_id
      AND church_members.user_id = auth.uid()
    )
    -- 4. visibility가 NULL인 레거시 데이터도 교회 멤버가 볼 수 있음
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
-- 3. church_qt_posts 테이블 (교회 QT) RLS 정책
-- =====================================================

-- 기존 SELECT 정책 모두 삭제
DROP POLICY IF EXISTS "church_qt_posts_select" ON church_qt_posts;
DROP POLICY IF EXISTS "church_qt_posts_select_by_visibility" ON church_qt_posts;
DROP POLICY IF EXISTS "church_qt_posts_select_complete" ON church_qt_posts;
DROP POLICY IF EXISTS "View church qt posts based on visibility" ON church_qt_posts;

-- 새 SELECT 정책 생성
CREATE POLICY "church_qt_posts_select_complete" ON church_qt_posts
  FOR SELECT USING (
    -- 1. 본인이 작성한 글은 항상 볼 수 있음
    user_id = auth.uid()
    -- 2. 공개 글
    OR visibility = 'public'
    -- 3. 교회 멤버는 해당 교회의 글을 볼 수 있음
    OR EXISTS (
      SELECT 1 FROM church_members
      WHERE church_members.church_id = church_qt_posts.church_id
      AND church_members.user_id = auth.uid()
    )
    -- 4. visibility가 NULL인 레거시 데이터도 교회 멤버가 볼 수 있음
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
-- 4. 레거시 데이터 visibility 기본값 설정
-- =====================================================

-- comments: NULL → 'group'
UPDATE comments
SET visibility = 'group'
WHERE visibility IS NULL;

-- guest_comments: NULL → 'church'
UPDATE guest_comments
SET visibility = 'church'
WHERE visibility IS NULL;

-- church_qt_posts: NULL → 'church'
UPDATE church_qt_posts
SET visibility = 'church'
WHERE visibility IS NULL;
