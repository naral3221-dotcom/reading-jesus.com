-- =====================================================
-- visibility 필드 추가 마이그레이션
-- 목적: 4단계 공개 범위 지원 (private, group, church, public)
-- =====================================================

-- 1. visibility ENUM 타입 생성
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_visibility') THEN
    CREATE TYPE content_visibility AS ENUM ('private', 'group', 'church', 'public');
  END IF;
END $$;

-- 2. public_meditations 테이블에 visibility 필드 추가
ALTER TABLE public_meditations
  ADD COLUMN IF NOT EXISTS visibility content_visibility DEFAULT 'public';

-- 기존 데이터 마이그레이션 (public_meditations는 기본적으로 모두 public)
UPDATE public_meditations
SET visibility = 'public'
WHERE visibility IS NULL;

-- 3. unified_meditations 테이블에 visibility 필드 추가
ALTER TABLE unified_meditations
  ADD COLUMN IF NOT EXISTS visibility content_visibility DEFAULT 'group';

-- 기존 데이터 마이그레이션
UPDATE unified_meditations
SET visibility = CASE
  WHEN source_type = 'church' THEN 'church'::content_visibility
  ELSE 'group'::content_visibility
END
WHERE visibility IS NULL;

-- 4. church_qt_posts 테이블에 visibility 필드 추가
ALTER TABLE church_qt_posts
  ADD COLUMN IF NOT EXISTS visibility content_visibility DEFAULT 'church';

-- 기존 is_public 데이터를 visibility로 마이그레이션
UPDATE church_qt_posts
SET visibility = CASE
  WHEN is_public = true THEN 'public'::content_visibility
  ELSE 'church'::content_visibility
END
WHERE visibility IS NULL;

-- 5. comments 테이블에 visibility 필드 추가
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS visibility content_visibility DEFAULT 'group';

-- 기존 is_public 데이터를 visibility로 마이그레이션
UPDATE comments
SET visibility = CASE
  WHEN is_public = true THEN 'public'::content_visibility
  ELSE 'group'::content_visibility
END
WHERE visibility IS NULL;

-- 6. guest_comments 테이블에 visibility 필드 추가 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guest_comments') THEN
    ALTER TABLE guest_comments
      ADD COLUMN IF NOT EXISTS visibility content_visibility DEFAULT 'church';
  END IF;
END $$;

-- 7. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_public_meditations_visibility
  ON public_meditations(visibility);
CREATE INDEX IF NOT EXISTS idx_unified_meditations_visibility
  ON unified_meditations(visibility);
CREATE INDEX IF NOT EXISTS idx_church_qt_posts_visibility
  ON church_qt_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_comments_visibility
  ON comments(visibility);

-- 8. RLS 정책 업데이트 (public_meditations)
DROP POLICY IF EXISTS "Anyone can view public meditations" ON public_meditations;

CREATE POLICY "View meditations based on visibility"
  ON public_meditations FOR SELECT
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
  );

-- 9. RLS 정책 업데이트 (comments)
-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Users can view group comments" ON comments;
DROP POLICY IF EXISTS "Anyone can view public or own or group comments" ON comments;
DROP POLICY IF EXISTS "comments_select_policy" ON comments;

-- 새 정책 생성
CREATE POLICY "View comments based on visibility"
  ON comments FOR SELECT
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility IN ('group', 'church') AND group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = comments.group_id
      AND group_members.user_id = auth.uid()
    ))
  );

-- 10. RLS 정책 업데이트 (church_qt_posts)
DROP POLICY IF EXISTS "Anyone can view church qt posts" ON church_qt_posts;
DROP POLICY IF EXISTS "church_qt_posts_select_policy" ON church_qt_posts;

CREATE POLICY "View church qt posts based on visibility"
  ON church_qt_posts FOR SELECT
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'church' AND EXISTS (
      SELECT 1 FROM church_members
      WHERE church_members.church_id = church_qt_posts.church_id
      AND church_members.user_id = auth.uid()
    ))
  );

-- 11. RLS 정책 업데이트 (unified_meditations)
DROP POLICY IF EXISTS "unified_meditations_select_policy" ON unified_meditations;
DROP POLICY IF EXISTS "Anyone can view unified meditations" ON unified_meditations;

CREATE POLICY "View unified meditations based on visibility"
  ON unified_meditations FOR SELECT
  USING (
    visibility = 'public'
    OR user_id = auth.uid()
    OR (visibility = 'group' AND source_type = 'group' AND EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = unified_meditations.source_id
      AND group_members.user_id = auth.uid()
    ))
    OR (visibility = 'church' AND source_type = 'church' AND EXISTS (
      SELECT 1 FROM church_members
      WHERE church_members.church_id = unified_meditations.source_id
      AND church_members.user_id = auth.uid()
    ))
  );
