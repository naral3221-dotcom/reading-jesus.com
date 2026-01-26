-- =====================================================
-- 공개 묵상 테이블 마이그레이션
-- 목적: 그룹 없이 전체 공개 묵상 작성 지원 (자유 형식)
-- =====================================================

-- 1. public_meditations 테이블 생성
CREATE TABLE IF NOT EXISTS public_meditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 콘텐츠
  title TEXT,                    -- 제목 (선택)
  content TEXT NOT NULL,         -- 묵상 내용 (필수)
  bible_reference TEXT,          -- 성경 구절 참조 (자유 형식, 예: "창세기 1:1-5")

  -- 설정
  is_anonymous BOOLEAN DEFAULT false,

  -- 통계
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_public_meditations_user ON public_meditations(user_id);
CREATE INDEX IF NOT EXISTS idx_public_meditations_created ON public_meditations(created_at DESC);

-- 3. RLS 활성화
ALTER TABLE public_meditations ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책
-- 모든 사용자가 공개 묵상 조회 가능
CREATE POLICY "Anyone can view public meditations"
  ON public_meditations FOR SELECT
  USING (true);

-- 로그인한 사용자가 본인의 공개 묵상 생성 가능
CREATE POLICY "Users can create own meditations"
  ON public_meditations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 로그인한 사용자가 본인의 공개 묵상 수정 가능
CREATE POLICY "Users can update own meditations"
  ON public_meditations FOR UPDATE
  USING (auth.uid() = user_id);

-- 로그인한 사용자가 본인의 공개 묵상 삭제 가능
CREATE POLICY "Users can delete own meditations"
  ON public_meditations FOR DELETE
  USING (auth.uid() = user_id);

-- 5. public_meditation_likes 테이블 (좋아요)
CREATE TABLE IF NOT EXISTS public_meditation_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meditation_id UUID NOT NULL REFERENCES public_meditations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(meditation_id, user_id)
);

-- 6. public_meditation_replies 테이블 (댓글)
CREATE TABLE IF NOT EXISTS public_meditation_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meditation_id UUID NOT NULL REFERENCES public_meditations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,

  -- 대댓글 지원 (선택)
  parent_reply_id UUID REFERENCES public_meditation_replies(id) ON DELETE CASCADE,
  mention_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mention_nickname TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_public_meditation_likes_meditation ON public_meditation_likes(meditation_id);
CREATE INDEX IF NOT EXISTS idx_public_meditation_replies_meditation ON public_meditation_replies(meditation_id);

-- 8. RLS 활성화
ALTER TABLE public_meditation_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_meditation_replies ENABLE ROW LEVEL SECURITY;

-- 9. public_meditation_likes RLS 정책
CREATE POLICY "Anyone can view meditation likes"
  ON public_meditation_likes FOR SELECT USING (true);

CREATE POLICY "Users can like meditations"
  ON public_meditation_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike meditations"
  ON public_meditation_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 10. public_meditation_replies RLS 정책
CREATE POLICY "Anyone can view meditation replies"
  ON public_meditation_replies FOR SELECT USING (true);

CREATE POLICY "Users can create replies"
  ON public_meditation_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies"
  ON public_meditation_replies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own replies"
  ON public_meditation_replies FOR DELETE
  USING (auth.uid() = user_id);

-- 11. 트리거 함수: 좋아요 카운트 업데이트
CREATE OR REPLACE FUNCTION update_public_meditation_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public_meditations SET likes_count = likes_count + 1 WHERE id = NEW.meditation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public_meditations SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.meditation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 트리거 함수: 댓글 카운트 업데이트
CREATE OR REPLACE FUNCTION update_public_meditation_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public_meditations SET replies_count = replies_count + 1 WHERE id = NEW.meditation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public_meditations SET replies_count = GREATEST(0, replies_count - 1) WHERE id = OLD.meditation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 트리거 생성
DROP TRIGGER IF EXISTS on_public_meditation_like_change ON public_meditation_likes;
CREATE TRIGGER on_public_meditation_like_change
  AFTER INSERT OR DELETE ON public_meditation_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_public_meditation_likes_count();

DROP TRIGGER IF EXISTS on_public_meditation_reply_change ON public_meditation_replies;
CREATE TRIGGER on_public_meditation_reply_change
  AFTER INSERT OR DELETE ON public_meditation_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_public_meditation_replies_count();

-- 14. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_public_meditation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_public_meditation_update ON public_meditations;
CREATE TRIGGER on_public_meditation_update
  BEFORE UPDATE ON public_meditations
  FOR EACH ROW
  EXECUTE FUNCTION update_public_meditation_updated_at();
