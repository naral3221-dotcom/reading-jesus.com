-- =====================================================
-- is_public 필드 추가 마이그레이션
-- 목적: 묵상을 전체 공개할 수 있도록 지원
-- =====================================================

-- 1. comments 테이블에 is_public 필드 추가
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 2. church_qt_posts 테이블에 is_public 필드 추가
ALTER TABLE church_qt_posts ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- 3. 인덱스 추가 (공개 게시물 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_comments_is_public ON comments(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_church_qt_posts_is_public ON church_qt_posts(is_public) WHERE is_public = true;

-- 4. RLS 정책 업데이트: 공개 게시물은 누구나 조회 가능
-- 기존 정책 삭제 후 새 정책 추가
DROP POLICY IF EXISTS "Group members can view comments" ON comments;
DROP POLICY IF EXISTS "Anyone can view public comments" ON comments;

CREATE POLICY "Anyone can view public or own or group comments"
  ON comments FOR SELECT
  USING (
    is_public = true
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = comments.group_id
      AND user_id = auth.uid()
    )
  );

-- 5. church_qt_posts도 동일하게 업데이트
DROP POLICY IF EXISTS "Anyone can view church qt posts" ON church_qt_posts;

CREATE POLICY "Anyone can view public or church qt posts"
  ON church_qt_posts FOR SELECT
  USING (
    is_public = true
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM church_members
      WHERE church_id = church_qt_posts.church_id
      AND user_id = auth.uid()
    )
  );
