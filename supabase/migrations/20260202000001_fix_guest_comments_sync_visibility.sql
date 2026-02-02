-- ============================================
-- guest_comments 동기화 트리거 버그 수정
-- 문제: visibility 필드가 누락되어 기본값(group)으로 저장됨
-- 해결: INSERT/UPDATE 시 visibility 포함
-- ============================================

-- 1. 동기화 함수 수정 (visibility 추가)
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
      visibility,  -- 추가!
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
      COALESCE(NEW.visibility, 'church'),  -- 추가! 기본값 church
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
      visibility = COALESCE(NEW.visibility, 'church'),  -- 추가!
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

-- 2. 기존 데이터 수정: guest_comments의 visibility를 unified_meditations에 동기화
UPDATE unified_meditations um
SET visibility = gc.visibility
FROM guest_comments gc
WHERE um.legacy_table = 'guest_comments'
  AND um.legacy_id = gc.id
  AND um.visibility != gc.visibility;

-- 3. 코멘트 업데이트
COMMENT ON FUNCTION sync_guest_comment_to_unified IS 'guest_comments 테이블 변경을 unified_meditations에 동기화 (visibility 포함)';
