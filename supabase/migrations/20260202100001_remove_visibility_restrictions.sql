-- =====================================================
-- visibility 제한 제거 - 모든 글을 public으로
--
-- 문제:
-- 1. church_members 테이블이 비어있어 RLS가 제대로 작동 안 함
-- 2. visibility 옵션이 불필요하게 복잡함
--
-- 해결:
-- 1. 모든 기존 데이터의 visibility를 'public'으로 변경
-- 2. RLS 정책 단순화 (모든 SELECT 허용)
-- 3. 기본값을 'public'으로 설정
-- =====================================================

-- =====================================================
-- 1. 모든 기존 데이터 visibility → 'public'
-- =====================================================

-- unified_meditations
UPDATE unified_meditations
SET visibility = 'public'
WHERE visibility != 'public' OR visibility IS NULL;

-- guest_comments
UPDATE guest_comments
SET visibility = 'public'
WHERE visibility != 'public' OR visibility IS NULL;

-- church_qt_posts
UPDATE church_qt_posts
SET visibility = 'public'
WHERE visibility != 'public' OR visibility IS NULL;

-- =====================================================
-- 2. 기본값을 'public'으로 설정
-- =====================================================

ALTER TABLE unified_meditations
ALTER COLUMN visibility SET DEFAULT 'public';

ALTER TABLE guest_comments
ALTER COLUMN visibility SET DEFAULT 'public';

ALTER TABLE church_qt_posts
ALTER COLUMN visibility SET DEFAULT 'public';

-- =====================================================
-- 3. RLS 정책 단순화 - 모든 SELECT 허용
-- =====================================================

-- unified_meditations
DROP POLICY IF EXISTS "unified_meditations_select_by_visibility" ON unified_meditations;
DROP POLICY IF EXISTS "unified_meditations_select" ON unified_meditations;

CREATE POLICY "unified_meditations_select_public" ON unified_meditations
  FOR SELECT USING (true);

-- guest_comments
DROP POLICY IF EXISTS "guest_comments_select_by_visibility" ON guest_comments;
DROP POLICY IF EXISTS "guest_comments_select" ON guest_comments;

CREATE POLICY "guest_comments_select_public" ON guest_comments
  FOR SELECT USING (true);

-- church_qt_posts
DROP POLICY IF EXISTS "church_qt_posts_select_by_visibility" ON church_qt_posts;
DROP POLICY IF EXISTS "church_qt_posts_select" ON church_qt_posts;

CREATE POLICY "church_qt_posts_select_public" ON church_qt_posts
  FOR SELECT USING (true);

-- =====================================================
-- 4. 트리거 수정 - 새 글 작성 시 항상 public
-- =====================================================

-- guest_comments → unified_meditations 동기화 트리거 수정
CREATE OR REPLACE FUNCTION sync_guest_comment_to_unified()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO unified_meditations (
      user_id, guest_token, author_name, source_type, source_id,
      content_type, day_number, content, bible_range, qt_date,
      is_anonymous, visibility, likes_count, replies_count,
      created_at, updated_at, legacy_table, legacy_id
    ) VALUES (
      NEW.linked_user_id,
      NEW.device_id,
      NEW.guest_name,
      'church',
      NEW.church_id,
      'free',
      NEW.day_number,
      NEW.content,
      NEW.bible_range,
      NEW.schedule_date,
      COALESCE(NEW.is_anonymous, false),
      'public',  -- 항상 public
      COALESCE(NEW.likes_count, 0),
      COALESCE(NEW.replies_count, 0),
      NEW.created_at,
      NEW.updated_at,
      'guest_comments',
      NEW.id::text
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE unified_meditations SET
      author_name = NEW.guest_name,
      content = NEW.content,
      bible_range = NEW.bible_range,
      qt_date = NEW.schedule_date,
      is_anonymous = COALESCE(NEW.is_anonymous, false),
      visibility = 'public',  -- 항상 public
      likes_count = COALESCE(NEW.likes_count, 0),
      replies_count = COALESCE(NEW.replies_count, 0),
      updated_at = NEW.updated_at
    WHERE legacy_table = 'guest_comments' AND legacy_id = NEW.id::text;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM unified_meditations
    WHERE legacy_table = 'guest_comments' AND legacy_id = OLD.id::text;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- church_qt_posts → unified_meditations 동기화 트리거 수정
CREATE OR REPLACE FUNCTION sync_church_qt_post_to_unified()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO unified_meditations (
      user_id, author_name, source_type, source_id,
      content_type, day_number, bible_range, qt_date,
      my_sentence, meditation_answer, gratitude, my_prayer, day_review,
      is_anonymous, visibility, likes_count, replies_count,
      created_at, updated_at, legacy_table, legacy_id
    ) VALUES (
      NEW.user_id,
      NEW.author_name,
      'church',
      NEW.church_id,
      'qt',
      NEW.day_number,
      NEW.bible_range,
      NEW.qt_date,
      NEW.my_sentence,
      NEW.meditation_answer,
      NEW.gratitude,
      NEW.my_prayer,
      NEW.day_review,
      COALESCE(NEW.is_anonymous, false),
      'public',  -- 항상 public
      COALESCE(NEW.likes_count, 0),
      COALESCE(NEW.replies_count, 0),
      NEW.created_at,
      NOW(),
      'church_qt_posts',
      NEW.id::text
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE unified_meditations SET
      author_name = NEW.author_name,
      bible_range = NEW.bible_range,
      qt_date = NEW.qt_date,
      my_sentence = NEW.my_sentence,
      meditation_answer = NEW.meditation_answer,
      gratitude = NEW.gratitude,
      my_prayer = NEW.my_prayer,
      day_review = NEW.day_review,
      is_anonymous = COALESCE(NEW.is_anonymous, false),
      visibility = 'public',  -- 항상 public
      likes_count = COALESCE(NEW.likes_count, 0),
      replies_count = COALESCE(NEW.replies_count, 0),
      updated_at = NOW()
    WHERE legacy_table = 'church_qt_posts' AND legacy_id = NEW.id::text;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM unified_meditations
    WHERE legacy_table = 'church_qt_posts' AND legacy_id = OLD.id::text;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. 완료 확인
-- =====================================================

-- visibility 분포 확인 (모두 public이어야 함)
DO $$
DECLARE
  non_public_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO non_public_count
  FROM unified_meditations
  WHERE visibility != 'public';

  IF non_public_count > 0 THEN
    RAISE NOTICE '경고: unified_meditations에 public이 아닌 레코드 %개 존재', non_public_count;
  ELSE
    RAISE NOTICE '완료: 모든 unified_meditations가 public으로 설정됨';
  END IF;
END $$;
