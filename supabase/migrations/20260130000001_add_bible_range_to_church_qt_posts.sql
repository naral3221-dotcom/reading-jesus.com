-- church_qt_posts 테이블에 bible_range 컬럼 추가
-- QT 묵상의 통독 일정 표시를 위함

-- 1. bible_range 컬럼 추가
ALTER TABLE church_qt_posts
ADD COLUMN IF NOT EXISTS bible_range TEXT;

COMMENT ON COLUMN church_qt_posts.bible_range IS 'QT 통독 범위 (예: 창세기 25-28장)';

-- 2. 기존 QT 데이터에 bible_range 백필 (qt_date 기반)
-- 참고: 실제 bible_range 값은 QT JSON 데이터에 있으므로
-- 앱에서 수동으로 업데이트하거나 별도 스크립트 필요

-- 3. unified_meditations 테이블에도 bible_range 업데이트
-- church_qt_posts에서 마이그레이션된 QT 데이터의 bible_range를 동기화
-- (이 스크립트는 church_qt_posts.bible_range가 업데이트된 후 실행)

-- 트리거: church_qt_posts에 insert/update 시 unified_meditations에도 반영
CREATE OR REPLACE FUNCTION sync_qt_to_unified()
RETURNS TRIGGER AS $$
BEGIN
  -- INSERT인 경우 unified_meditations에 새 레코드 생성
  IF TG_OP = 'INSERT' THEN
    INSERT INTO unified_meditations (
      user_id,
      author_name,
      source_type,
      source_id,
      content_type,
      day_number,
      qt_date,
      bible_range,
      my_sentence,
      meditation_answer,
      gratitude,
      my_prayer,
      day_review,
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
      NEW.author_name,
      'church',
      NEW.church_id,
      'qt',
      NEW.day_number,
      NEW.qt_date::DATE,
      NEW.bible_range,
      NEW.my_sentence,
      NEW.meditation_answer,
      NEW.gratitude,
      NEW.my_prayer,
      NEW.day_review,
      COALESCE(NEW.is_anonymous, false),
      COALESCE(NEW.visibility, 'church'),
      COALESCE(NEW.likes_count, 0),
      COALESCE(NEW.replies_count, 0),
      NEW.created_at,
      NEW.created_at,
      'church_qt_posts',
      NEW.id
    )
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  -- UPDATE인 경우 unified_meditations 업데이트
  IF TG_OP = 'UPDATE' THEN
    UPDATE unified_meditations
    SET
      bible_range = NEW.bible_range,
      my_sentence = NEW.my_sentence,
      meditation_answer = NEW.meditation_answer,
      gratitude = NEW.gratitude,
      my_prayer = NEW.my_prayer,
      day_review = NEW.day_review,
      is_anonymous = COALESCE(NEW.is_anonymous, false),
      visibility = COALESCE(NEW.visibility, 'church'),
      likes_count = COALESCE(NEW.likes_count, 0),
      replies_count = COALESCE(NEW.replies_count, 0),
      updated_at = NOW()
    WHERE legacy_id = NEW.id AND legacy_table = 'church_qt_posts';
    RETURN NEW;
  END IF;

  -- DELETE인 경우 unified_meditations에서도 삭제
  IF TG_OP = 'DELETE' THEN
    DELETE FROM unified_meditations
    WHERE legacy_id = OLD.id AND legacy_table = 'church_qt_posts';
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS sync_qt_to_unified_trigger ON church_qt_posts;
CREATE TRIGGER sync_qt_to_unified_trigger
AFTER INSERT OR UPDATE OR DELETE ON church_qt_posts
FOR EACH ROW
EXECUTE FUNCTION sync_qt_to_unified();
