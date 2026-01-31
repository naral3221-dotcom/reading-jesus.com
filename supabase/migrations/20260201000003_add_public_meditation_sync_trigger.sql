-- ============================================
-- public_meditations → unified_meditations 동기화 트리거
-- 목적: 홈 페이지에서 작성하는 공개 묵상을 통합 테이블에 자동 동기화
-- ============================================

-- 1. 동기화 함수 생성
CREATE OR REPLACE FUNCTION sync_public_meditation_to_unified()
RETURNS TRIGGER AS $$
DECLARE
  v_author_name TEXT;
BEGIN
  -- 작성자 이름 조회 (익명이 아닌 경우)
  IF NEW.is_anonymous = FALSE THEN
    SELECT nickname INTO v_author_name
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO unified_meditations (
      user_id,
      source_type,
      source_id,
      content_type,
      day_number,
      content,
      bible_range,
      author_name,
      is_anonymous,
      visibility,
      likes_count,
      replies_count,
      created_at,
      updated_at,
      legacy_table,
      legacy_id
    ) VALUES (
      NEW.user_id,
      'public',
      NULL,  -- public 타입은 source_id 없음
      COALESCE(NEW.meditation_type, 'free'),
      NEW.day_number,
      NEW.content,
      NEW.bible_reference,
      CASE WHEN NEW.is_anonymous THEN '익명' ELSE COALESCE(v_author_name, '알 수 없음') END,
      NEW.is_anonymous,
      COALESCE(NEW.visibility, 'public'),
      COALESCE(NEW.likes_count, 0),
      COALESCE(NEW.replies_count, 0),
      NEW.created_at,
      NEW.updated_at,
      'public_meditations',
      NEW.id
    );

  ELSIF TG_OP = 'UPDATE' THEN
    -- 작성자 이름 다시 조회 (익명 상태가 변경되었을 수 있음)
    IF NEW.is_anonymous = FALSE THEN
      SELECT nickname INTO v_author_name
      FROM profiles
      WHERE id = NEW.user_id;
    END IF;

    UPDATE unified_meditations
    SET
      content = NEW.content,
      bible_range = NEW.bible_reference,
      day_number = NEW.day_number,
      content_type = COALESCE(NEW.meditation_type, 'free'),
      author_name = CASE WHEN NEW.is_anonymous THEN '익명' ELSE COALESCE(v_author_name, '알 수 없음') END,
      is_anonymous = NEW.is_anonymous,
      visibility = COALESCE(NEW.visibility, 'public'),
      likes_count = COALESCE(NEW.likes_count, 0),
      replies_count = COALESCE(NEW.replies_count, 0),
      updated_at = NEW.updated_at
    WHERE legacy_table = 'public_meditations' AND legacy_id = NEW.id;

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM unified_meditations
    WHERE legacy_table = 'public_meditations' AND legacy_id = OLD.id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거 생성 (기존 트리거가 있으면 삭제 후 재생성)
DROP TRIGGER IF EXISTS sync_public_meditation_trigger ON public_meditations;

CREATE TRIGGER sync_public_meditation_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public_meditations
  FOR EACH ROW
  EXECUTE FUNCTION sync_public_meditation_to_unified();

-- 3. 기존 데이터 마이그레이션 (public_meditations → unified_meditations)
-- 이미 존재하는 레코드는 건너뜀
INSERT INTO unified_meditations (
  user_id,
  source_type,
  source_id,
  content_type,
  day_number,
  content,
  bible_range,
  author_name,
  is_anonymous,
  visibility,
  likes_count,
  replies_count,
  created_at,
  updated_at,
  legacy_table,
  legacy_id
)
SELECT
  pm.user_id,
  'public',
  NULL,
  COALESCE(pm.meditation_type, 'free'),
  pm.day_number,
  pm.content,
  pm.bible_reference,
  CASE
    WHEN pm.is_anonymous THEN '익명'
    ELSE COALESCE(p.nickname, '알 수 없음')
  END,
  pm.is_anonymous,
  COALESCE(pm.visibility, 'public'),
  COALESCE(pm.likes_count, 0),
  COALESCE(pm.replies_count, 0),
  pm.created_at,
  pm.updated_at,
  'public_meditations',
  pm.id
FROM public_meditations pm
LEFT JOIN profiles p ON pm.user_id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM unified_meditations um
  WHERE um.legacy_table = 'public_meditations' AND um.legacy_id = pm.id
);

-- 4. 코멘트 추가
COMMENT ON FUNCTION sync_public_meditation_to_unified() IS
  'public_meditations 테이블 변경 시 unified_meditations로 자동 동기화';

-- 5. 검증 쿼리 (실행 후 확인용)
-- SELECT
--   'public_meditations' as table_name,
--   COUNT(*) as total,
--   (SELECT COUNT(*) FROM unified_meditations WHERE legacy_table = 'public_meditations') as synced
-- FROM public_meditations;
