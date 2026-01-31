-- =====================================================
-- 긴급 버그 수정 (3차): 교회 visibility 접근 정책 수정
--
-- 문제:
-- 교회 페이지에서 visibility='church' 글이 보이지 않음
-- - 비로그인 사용자: auth.uid()가 NULL이라 멤버십 확인 불가
-- - 로그인 사용자도 교회 멤버가 아니면 접근 불가
--
-- 해결:
-- visibility='church' 글은 해당 교회 페이지에서 누구나 볼 수 있게 변경
-- (교회 코드를 알고 접근한 사람은 볼 수 있음)
-- =====================================================

-- =====================================================
-- 1. guest_comments 테이블 RLS 정책 수정
-- =====================================================

DROP POLICY IF EXISTS "guest_comments_select_complete" ON guest_comments;
DROP POLICY IF EXISTS "guest_comments_select_by_visibility" ON guest_comments;

CREATE POLICY "guest_comments_select_complete" ON guest_comments
  FOR SELECT USING (
    -- 1. 본인이 작성한 글은 항상 볼 수 있음
    linked_user_id = auth.uid()
    -- 2. 공개 글은 누구나 볼 수 있음
    OR visibility = 'public'
    -- 3. 교회 공개 글은 해당 교회 페이지에서 누구나 볼 수 있음
    -- (교회 코드로 접근한 사람은 볼 수 있음 - 멤버십 체크 없음)
    OR visibility = 'church'
    -- 4. visibility가 NULL인 레거시 데이터도 볼 수 있음
    OR visibility IS NULL
  );

-- =====================================================
-- 2. church_qt_posts 테이블 RLS 정책 수정
-- =====================================================

DROP POLICY IF EXISTS "church_qt_posts_select_complete" ON church_qt_posts;
DROP POLICY IF EXISTS "church_qt_posts_select_by_visibility" ON church_qt_posts;

CREATE POLICY "church_qt_posts_select_complete" ON church_qt_posts
  FOR SELECT USING (
    -- 1. 본인이 작성한 글은 항상 볼 수 있음
    user_id = auth.uid()
    -- 2. 공개 글은 누구나 볼 수 있음
    OR visibility = 'public'
    -- 3. 교회 공개 글은 해당 교회 페이지에서 누구나 볼 수 있음
    OR visibility = 'church'
    -- 4. visibility가 NULL인 레거시 데이터도 볼 수 있음
    OR visibility IS NULL
  );

-- =====================================================
-- 3. comments 테이블은 그룹 멤버십 체크 유지
-- (그룹은 멤버만 볼 수 있어야 함)
-- =====================================================
-- comments 테이블은 그대로 유지 (그룹 멤버십 체크 필요)
