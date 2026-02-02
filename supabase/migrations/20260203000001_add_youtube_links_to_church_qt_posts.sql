-- church_qt_posts 테이블에 youtube_links 컬럼 추가
-- 사용자가 QT 글에 유튜브 링크를 첨부할 수 있게 합니다.

-- youtube_links 컬럼 추가 (text 배열로 여러 링크 저장)
ALTER TABLE church_qt_posts
ADD COLUMN IF NOT EXISTS youtube_links TEXT[] DEFAULT '{}';

-- 코멘트 추가
COMMENT ON COLUMN church_qt_posts.youtube_links IS '첨부된 유튜브 링크 목록 (배열)';

-- unified_meditations 테이블에도 youtube_links 컬럼 추가 (동기화를 위해)
ALTER TABLE unified_meditations
ADD COLUMN IF NOT EXISTS youtube_links TEXT[] DEFAULT '{}';

COMMENT ON COLUMN unified_meditations.youtube_links IS '첨부된 유튜브 링크 목록 (배열)';

-- church_qt_posts → unified_meditations 동기화 트리거 업데이트
-- 기존 트리거 함수에 youtube_links 필드 추가
CREATE OR REPLACE FUNCTION sync_church_qt_to_unified()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO unified_meditations (
      id,
      source_type,
      source_id,
      legacy_id,
      legacy_table,
      user_id,
      author_name,
      is_anonymous,
      content_type,
      content,
      bible_range,
      my_sentence,
      meditation_answer,
      gratitude,
      my_prayer,
      day_review,
      youtube_links,
      qt_date,
      day_number,
      visibility,
      likes_count,
      replies_count,
      created_at,
      updated_at
    )
    SELECT
      gen_random_uuid(),
      'church',
      NEW.church_id,
      NEW.id,
      'church_qt_posts',
      NEW.user_id,
      NEW.author_name,
      COALESCE(NEW.is_anonymous, false),
      'qt',
      NULL,
      NEW.bible_range,
      NEW.my_sentence,
      NEW.meditation_answer,
      NEW.gratitude,
      NEW.my_prayer,
      NEW.day_review,
      COALESCE(NEW.youtube_links, '{}'),
      NEW.qt_date,
      NEW.day_number,
      COALESCE(NEW.visibility, 'public'),
      0,
      0,
      NEW.created_at,
      NOW();
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE unified_meditations SET
      author_name = NEW.author_name,
      is_anonymous = COALESCE(NEW.is_anonymous, false),
      bible_range = NEW.bible_range,
      my_sentence = NEW.my_sentence,
      meditation_answer = NEW.meditation_answer,
      gratitude = NEW.gratitude,
      my_prayer = NEW.my_prayer,
      day_review = NEW.day_review,
      youtube_links = COALESCE(NEW.youtube_links, '{}'),
      qt_date = NEW.qt_date,
      day_number = NEW.day_number,
      visibility = COALESCE(NEW.visibility, 'public'),
      updated_at = NOW()
    WHERE legacy_id = NEW.id AND legacy_table = 'church_qt_posts';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM unified_meditations
    WHERE legacy_id = OLD.id AND legacy_table = 'church_qt_posts';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
