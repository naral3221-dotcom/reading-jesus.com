-- ============================================
-- guest_comments → unified_meditations 동기화 트리거
-- 목적: 새 guest_comments 작성 시 자동으로 unified_meditations에 동기화
-- ============================================

-- 1. 동기화 함수 생성
CREATE OR REPLACE FUNCTION sync_guest_comment_to_unified()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO unified_meditations (
      user_id,
      guest_token,
      author_name,
      source_type,
      source_id,
      content_type,
      day_number,
      content,
      bible_range,
      is_anonymous,
      is_pinned,
      likes_count,
      replies_count,
      created_at,
      updated_at,
      legacy_table,
      legacy_id
    ) VALUES (
      NEW.linked_user_id,
      NEW.device_id,
      COALESCE(NEW.guest_name, '게스트'),
      'church',
      NEW.church_id,
      'free',
      NEW.day_number,
      NEW.content,
      NEW.bible_range,
      COALESCE(NEW.is_anonymous, false),
      false,
      COALESCE(NEW.likes_count, 0),
      COALESCE(NEW.replies_count, 0),
      NEW.created_at,
      COALESCE(NEW.updated_at, NEW.created_at),
      'guest_comments',
      NEW.id
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE unified_meditations SET
      user_id = NEW.linked_user_id,
      guest_token = NEW.device_id,
      author_name = COALESCE(NEW.guest_name, '게스트'),
      day_number = NEW.day_number,
      content = NEW.content,
      bible_range = NEW.bible_range,
      is_anonymous = COALESCE(NEW.is_anonymous, false),
      likes_count = COALESCE(NEW.likes_count, 0),
      replies_count = COALESCE(NEW.replies_count, 0),
      updated_at = COALESCE(NEW.updated_at, NOW())
    WHERE legacy_table = 'guest_comments' AND legacy_id = NEW.id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM unified_meditations
    WHERE legacy_table = 'guest_comments' AND legacy_id = OLD.id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거 생성
DROP TRIGGER IF EXISTS sync_guest_comment_trigger ON guest_comments;

CREATE TRIGGER sync_guest_comment_trigger
AFTER INSERT OR UPDATE OR DELETE ON guest_comments
FOR EACH ROW EXECUTE FUNCTION sync_guest_comment_to_unified();

-- 3. 코멘트
COMMENT ON FUNCTION sync_guest_comment_to_unified IS 'guest_comments 테이블 변경을 unified_meditations에 동기화';
COMMENT ON TRIGGER sync_guest_comment_trigger ON guest_comments IS 'guest_comments INSERT/UPDATE/DELETE 시 unified_meditations 자동 동기화';
