-- =====================================================
-- 모든 글의 visibility를 'public'으로 변경
--
-- 변경 사항:
-- 1. 모든 기존 글의 visibility를 'public'으로 업데이트
-- 2. 새 글 작성 시 visibility 선택 UI가 제거됨
-- 3. 모든 글은 기본적으로 전체 공개
-- =====================================================

-- 1. comments 테이블 (그룹 묵상) - visibility를 'public'으로 변경
UPDATE comments
SET visibility = 'public'
WHERE visibility IS NOT NULL AND visibility != 'public';

-- 2. guest_comments 테이블 (교회 묵상) - visibility를 'public'으로 변경
UPDATE guest_comments
SET visibility = 'public'
WHERE visibility IS NOT NULL AND visibility != 'public';

-- 3. church_qt_posts 테이블 (교회 QT) - visibility를 'public'으로 변경
UPDATE church_qt_posts
SET visibility = 'public'
WHERE visibility IS NOT NULL AND visibility != 'public';

-- 4. unified_meditations 테이블 (통합 묵상) - visibility를 'public'으로 변경
UPDATE unified_meditations
SET visibility = 'public'
WHERE visibility IS NOT NULL AND visibility != 'public';

-- 5. public_meditations 테이블 (개인 묵상) - visibility를 'public'으로 변경
UPDATE public_meditations
SET visibility = 'public'
WHERE visibility IS NOT NULL AND visibility != 'public';

-- 6. NULL인 visibility도 'public'으로 설정
UPDATE comments SET visibility = 'public' WHERE visibility IS NULL;
UPDATE guest_comments SET visibility = 'public' WHERE visibility IS NULL;
UPDATE church_qt_posts SET visibility = 'public' WHERE visibility IS NULL;
UPDATE unified_meditations SET visibility = 'public' WHERE visibility IS NULL;
UPDATE public_meditations SET visibility = 'public' WHERE visibility IS NULL;
