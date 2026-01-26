-- church_qt_posts 테이블에 is_anonymous 컬럼 추가
-- QT 나눔 작성 시 익명 여부 선택 가능

ALTER TABLE church_qt_posts
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_church_qt_posts_is_anonymous ON church_qt_posts(is_anonymous);

-- 컬럼 설명 추가
COMMENT ON COLUMN church_qt_posts.is_anonymous IS '익명 여부 (true: 익명, false: 실명)';
