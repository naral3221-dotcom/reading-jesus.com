-- =============================================================================
-- Migration: Add Public Meditation Comments
-- Description: 공개 묵상에 대한 댓글 시스템 테이블 생성
-- =============================================================================

-- 1. 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS public_meditation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meditation_id UUID NOT NULL,                    -- 묵상 ID (그룹/교회/개인)
  meditation_type VARCHAR(20) NOT NULL,           -- 'group' | 'church' | 'personal'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public_meditation_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- 제약조건
  CONSTRAINT content_not_empty CHECK (char_length(trim(content)) > 0),
  CONSTRAINT valid_meditation_type CHECK (meditation_type IN ('group', 'church', 'personal'))
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comments_meditation ON public_meditation_comments(meditation_id, meditation_type);
CREATE INDEX IF NOT EXISTS idx_comments_user ON public_meditation_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public_meditation_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_created ON public_meditation_comments(created_at DESC);

-- 3. 댓글 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS public_meditation_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public_meditation_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- 중복 좋아요 방지
  CONSTRAINT unique_comment_like UNIQUE(comment_id, user_id)
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public_meditation_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON public_meditation_comment_likes(user_id);

-- 5. RLS 정책 설정
ALTER TABLE public_meditation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_meditation_comment_likes ENABLE ROW LEVEL SECURITY;

-- 5.1 댓글 조회 정책 (모든 사용자 조회 가능)
CREATE POLICY "Comments are viewable by everyone"
  ON public_meditation_comments
  FOR SELECT
  USING (true);

-- 5.2 댓글 작성 정책 (로그인한 사용자)
CREATE POLICY "Users can insert comments"
  ON public_meditation_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5.3 댓글 수정 정책 (본인 댓글만)
CREATE POLICY "Users can update own comments"
  ON public_meditation_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 5.4 댓글 삭제 정책 (본인 댓글만)
CREATE POLICY "Users can delete own comments"
  ON public_meditation_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5.5 좋아요 조회 정책
CREATE POLICY "Comment likes are viewable by everyone"
  ON public_meditation_comment_likes
  FOR SELECT
  USING (true);

-- 5.6 좋아요 추가 정책
CREATE POLICY "Users can insert comment likes"
  ON public_meditation_comment_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5.7 좋아요 삭제 정책
CREATE POLICY "Users can delete own comment likes"
  ON public_meditation_comment_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. 좋아요 카운트 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public_meditation_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public_meditation_comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON public_meditation_comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
AFTER INSERT OR DELETE ON public_meditation_comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_likes_count();

-- 8. updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_comments_updated_at ON public_meditation_comments;
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public_meditation_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
