-- 그룹에 성경 범위 설정 컬럼 추가
-- Phase 9: 그룹 말씀 범위 설정 기능

-- 성경 범위 타입: 'full' (전체), 'old' (구약), 'new' (신약), 'custom' (직접 선택)
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS bible_range_type TEXT DEFAULT 'full';

-- 커스텀 선택 시 선택된 책 목록 (JSON 배열)
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS bible_range_books TEXT[] DEFAULT NULL;

-- 기존 그룹은 기본값으로 전체 성경 설정
UPDATE groups
SET bible_range_type = 'full'
WHERE bible_range_type IS NULL;

-- 체크 제약 조건 추가 (선택적)
ALTER TABLE groups
ADD CONSTRAINT bible_range_type_check
CHECK (bible_range_type IN ('full', 'old', 'new', 'custom'));

COMMENT ON COLUMN groups.bible_range_type IS '성경 범위 타입: full(전체), old(구약), new(신약), custom(직접선택)';
COMMENT ON COLUMN groups.bible_range_books IS '커스텀 선택 시 책 이름 배열';
