-- ============================================
-- unified_meditations 스키마 확장: public 타입 지원
-- 목적: 홈 페이지에서 작성하는 개인 공개 묵상을 통합 테이블에 저장
-- ============================================

-- 1. 기존 source_type 제약조건 삭제 후 재생성 ('public' 추가)
ALTER TABLE unified_meditations
DROP CONSTRAINT IF EXISTS unified_meditations_source_type_check;

ALTER TABLE unified_meditations
ADD CONSTRAINT unified_meditations_source_type_check
CHECK (source_type IN ('group', 'church', 'public'));

-- 2. source_id를 NULL 허용으로 변경 (public 타입은 source_id 없음)
ALTER TABLE unified_meditations
ALTER COLUMN source_id DROP NOT NULL;

-- 3. author_name도 NULL 허용으로 변경 (프로필에서 가져올 수 있음)
ALTER TABLE unified_meditations
ALTER COLUMN author_name DROP NOT NULL;

-- 4. public 타입용 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_unified_meditations_public
  ON unified_meditations(created_at DESC)
  WHERE source_type = 'public';

CREATE INDEX IF NOT EXISTS idx_unified_meditations_visibility
  ON unified_meditations(visibility, created_at DESC)
  WHERE visibility = 'public';

-- 5. 코멘트 업데이트
COMMENT ON COLUMN unified_meditations.source_type IS '출처 타입: group(그룹), church(교회), public(개인 공개)';
COMMENT ON COLUMN unified_meditations.source_id IS 'group_id 또는 church_id (public 타입은 NULL)';

-- 6. 검증 쿼리 (실행 후 확인용)
-- SELECT
--   source_type,
--   COUNT(*) as count,
--   COUNT(source_id) as with_source_id
-- FROM unified_meditations
-- GROUP BY source_type;
