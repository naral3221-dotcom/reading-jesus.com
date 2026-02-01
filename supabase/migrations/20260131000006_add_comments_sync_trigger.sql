-- ============================================
-- comments → unified_meditations 동기화 트리거
-- 목적: 그룹 묵상글 작성 시 자동으로 unified_meditations에 동기화
-- ============================================

-- 1. 동기화 함수 생성
CREATE OR REPLACE FUNCTION sync_comment_to_unified()
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
      is_anonymous,
      is_pinned,
      likes_count,
      visibility,
      created_at,
      updated_at,
      legacy_table,
      legacy_id
    ) VALUES (
      NEW.user_id,
      NULL,  -- 그룹은 로그인 필수이므로 guest_token 없음
      COALESCE((SELECT nickname FROM profiles WHERE id = NEW.user_id), '사용자'),
      'group',
      NEW.group_id,
      'free',
      NEW.day_number,
      NEW.content,
      COALESCE(NEW.is_anonymous, false),
      COALESCE(NEW.is_pinned, false),
      COALESCE(NEW.likes_count, 0),
      COALESCE(NEW.visibility, 'group'),
      NEW.created_at,
      COALESCE(NEW.updated_at, NEW.created_at),
      'comments',
      NEW.id
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE unified_meditations SET
      day_number = NEW.day_number,
      content = NEW.content,
      is_anonymous = COALESCE(NEW.is_anonymous, false),
      is_pinned = COALESCE(NEW.is_pinned, false),
      likes_count = COALESCE(NEW.likes_count, 0),
      visibility = COALESCE(NEW.visibility, 'group'),
      updated_at = COALESCE(NEW.updated_at, NOW())
    WHERE legacy_table = 'comments' AND legacy_id = NEW.id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM unified_meditations
    WHERE legacy_table = 'comments' AND legacy_id = OLD.id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거 생성
DROP TRIGGER IF EXISTS sync_comment_trigger ON comments;

CREATE TRIGGER sync_comment_trigger
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION sync_comment_to_unified();

-- 3. 코멘트
COMMENT ON FUNCTION sync_comment_to_unified IS 'comments 테이블 변경을 unified_meditations에 동기화';
COMMENT ON TRIGGER sync_comment_trigger ON comments IS 'comments INSERT/UPDATE/DELETE 시 unified_meditations 자동 동기화';
