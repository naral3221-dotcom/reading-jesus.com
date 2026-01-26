-- 익명 댓글 기능을 위한 컬럼 추가
-- comments 테이블에 is_anonymous 컬럼 추가

ALTER TABLE comments
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- 인덱스 추가 (선택사항: 익명 댓글 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_comments_is_anonymous ON comments(is_anonymous);

-- 코멘트 추가
COMMENT ON COLUMN comments.is_anonymous IS '익명 여부 (true: 익명, false: 실명)';
