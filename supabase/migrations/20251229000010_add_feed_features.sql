-- 피드 스타일 기능 추가 마이그레이션

-- 1. guest_comments 테이블에 통독일정(day_number) 필드 추가
ALTER TABLE guest_comments ADD COLUMN IF NOT EXISTS day_number INTEGER;

-- 2. church_qt_posts 테이블에 통독일정(day_number) 필드 추가
ALTER TABLE church_qt_posts ADD COLUMN IF NOT EXISTS day_number INTEGER;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_guest_comments_day_number ON guest_comments(day_number);
CREATE INDEX IF NOT EXISTS idx_church_qt_posts_day_number ON church_qt_posts(day_number);

-- 3. 게스트 댓글(묵상)에 대한 답글 테이블 생성
CREATE TABLE IF NOT EXISTS guest_comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES guest_comments(id) ON DELETE CASCADE,
  -- 작성자 정보 (로그인 사용자)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- 비로그인 사용자용
  guest_name TEXT,
  device_id TEXT,
  -- 내용
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 최소 하나의 식별자 필수
  CONSTRAINT check_reply_identifier CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);

-- guest_comments 테이블에 replies_count 컬럼 추가
ALTER TABLE guest_comments ADD COLUMN IF NOT EXISTS replies_count INTEGER NOT NULL DEFAULT 0;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_guest_comment_replies_comment_id ON guest_comment_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_guest_comment_replies_user_id ON guest_comment_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_comment_replies_created_at ON guest_comment_replies(created_at);

-- RLS 활성화
ALTER TABLE guest_comment_replies ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 누구나 읽기 가능
CREATE POLICY "guest_comment_replies_select" ON guest_comment_replies
  FOR SELECT USING (true);

-- RLS 정책: 인증된 사용자는 답글 생성 가능
CREATE POLICY "guest_comment_replies_insert_auth" ON guest_comment_replies
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- RLS 정책: 익명 사용자도 device_id로 생성 가능
CREATE POLICY "guest_comment_replies_insert_anon" ON guest_comment_replies
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id IS NULL AND device_id IS NOT NULL
  );

-- RLS 정책: 본인 답글 삭제 가능
CREATE POLICY "guest_comment_replies_delete_auth" ON guest_comment_replies
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- 답글 카운트 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_guest_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE guest_comments
    SET replies_count = replies_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE guest_comments
    SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_guest_comment_replies_count ON guest_comment_replies;
CREATE TRIGGER trigger_update_guest_comment_replies_count
  AFTER INSERT OR DELETE ON guest_comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_comment_replies_count();

-- 4. church_qt_posts 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS church_qt_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES church_qt_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id),
  UNIQUE(post_id, device_id),
  CONSTRAINT check_qt_like_identifier CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);

-- church_qt_posts 테이블에 likes_count 컬럼 추가
ALTER TABLE church_qt_posts ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_church_qt_post_likes_post_id ON church_qt_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_church_qt_post_likes_user_id ON church_qt_post_likes(user_id);

-- RLS 활성화
ALTER TABLE church_qt_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "church_qt_post_likes_select" ON church_qt_post_likes
  FOR SELECT USING (true);

CREATE POLICY "church_qt_post_likes_insert_auth" ON church_qt_post_likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "church_qt_post_likes_insert_anon" ON church_qt_post_likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id IS NULL AND device_id IS NOT NULL
  );

CREATE POLICY "church_qt_post_likes_delete_auth" ON church_qt_post_likes
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- QT 좋아요 카운트 트리거
CREATE OR REPLACE FUNCTION update_church_qt_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE church_qt_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE church_qt_posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_church_qt_post_likes_count ON church_qt_post_likes;
CREATE TRIGGER trigger_update_church_qt_post_likes_count
  AFTER INSERT OR DELETE ON church_qt_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_church_qt_post_likes_count();

-- 5. church_qt_posts 답글 테이블 생성
CREATE TABLE IF NOT EXISTS church_qt_post_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES church_qt_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  device_id TEXT,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_qt_reply_identifier CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);

-- church_qt_posts 테이블에 replies_count 컬럼 추가
ALTER TABLE church_qt_posts ADD COLUMN IF NOT EXISTS replies_count INTEGER NOT NULL DEFAULT 0;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_church_qt_post_replies_post_id ON church_qt_post_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_church_qt_post_replies_user_id ON church_qt_post_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_church_qt_post_replies_created_at ON church_qt_post_replies(created_at);

-- RLS 활성화
ALTER TABLE church_qt_post_replies ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "church_qt_post_replies_select" ON church_qt_post_replies
  FOR SELECT USING (true);

CREATE POLICY "church_qt_post_replies_insert_auth" ON church_qt_post_replies
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "church_qt_post_replies_insert_anon" ON church_qt_post_replies
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id IS NULL AND device_id IS NOT NULL
  );

CREATE POLICY "church_qt_post_replies_delete_auth" ON church_qt_post_replies
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- QT 답글 카운트 트리거
CREATE OR REPLACE FUNCTION update_church_qt_post_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE church_qt_posts
    SET replies_count = replies_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE church_qt_posts
    SET replies_count = GREATEST(replies_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_church_qt_post_replies_count ON church_qt_post_replies;
CREATE TRIGGER trigger_update_church_qt_post_replies_count
  AFTER INSERT OR DELETE ON church_qt_post_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_church_qt_post_replies_count();
