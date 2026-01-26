-- 답글 테이블 생성 (Supabase SQL Editor에서 직접 실행)
-- 실행 날짜: 2025-12-30

-- =============================================
-- 1. guest_comment_replies 테이블 생성
-- =============================================
CREATE TABLE IF NOT EXISTS guest_comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES guest_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  device_id TEXT,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
DROP POLICY IF EXISTS "guest_comment_replies_select" ON guest_comment_replies;
CREATE POLICY "guest_comment_replies_select" ON guest_comment_replies
  FOR SELECT USING (true);

-- RLS 정책: 누구나 답글 작성 가능 (익명 포함)
DROP POLICY IF EXISTS "guest_comment_replies_insert" ON guest_comment_replies;
CREATE POLICY "guest_comment_replies_insert" ON guest_comment_replies
  FOR INSERT WITH CHECK (true);

-- RLS 정책: 본인 답글 삭제 가능
DROP POLICY IF EXISTS "guest_comment_replies_delete" ON guest_comment_replies;
CREATE POLICY "guest_comment_replies_delete" ON guest_comment_replies
  FOR DELETE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (device_id IS NOT NULL)
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

-- =============================================
-- 2. church_qt_post_replies 테이블 생성
-- =============================================
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

-- RLS 정책: 누구나 읽기 가능
DROP POLICY IF EXISTS "church_qt_post_replies_select" ON church_qt_post_replies;
CREATE POLICY "church_qt_post_replies_select" ON church_qt_post_replies
  FOR SELECT USING (true);

-- RLS 정책: 누구나 답글 작성 가능 (익명 포함)
DROP POLICY IF EXISTS "church_qt_post_replies_insert" ON church_qt_post_replies;
CREATE POLICY "church_qt_post_replies_insert" ON church_qt_post_replies
  FOR INSERT WITH CHECK (true);

-- RLS 정책: 본인 답글 삭제 가능
DROP POLICY IF EXISTS "church_qt_post_replies_delete" ON church_qt_post_replies;
CREATE POLICY "church_qt_post_replies_delete" ON church_qt_post_replies
  FOR DELETE USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (device_id IS NOT NULL)
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

-- =============================================
-- 완료!
-- =============================================
