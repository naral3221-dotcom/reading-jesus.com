-- 교회 묵상글(guest_comments) 좋아요 테이블 생성
CREATE TABLE IF NOT EXISTS guest_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES guest_comments(id) ON DELETE CASCADE,
  -- 로그인 사용자의 경우 user_id 사용
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 비로그인 사용자의 경우 device_id 사용
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 같은 댓글에 중복 좋아요 방지 (유저 또는 디바이스 기준)
  UNIQUE(comment_id, user_id),
  UNIQUE(comment_id, device_id),
  -- 최소 하나의 식별자 필수
  CONSTRAINT check_identifier CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_guest_comment_likes_comment_id ON guest_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_guest_comment_likes_user_id ON guest_comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_comment_likes_device_id ON guest_comment_likes(device_id);

-- guest_comments 테이블에 likes_count 컬럼 추가
ALTER TABLE guest_comments ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

-- RLS 활성화
ALTER TABLE guest_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 누구나 읽기 가능
CREATE POLICY "guest_comment_likes_select" ON guest_comment_likes
  FOR SELECT USING (true);

-- RLS 정책: 인증된 사용자는 자신의 좋아요 생성 가능
CREATE POLICY "guest_comment_likes_insert_auth" ON guest_comment_likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- RLS 정책: 비인증 사용자도 device_id로 생성 가능 (anon key)
CREATE POLICY "guest_comment_likes_insert_anon" ON guest_comment_likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NULL AND device_id IS NOT NULL AND user_id IS NULL
  );

-- RLS 정책: 인증된 사용자는 자신의 좋아요 삭제 가능
CREATE POLICY "guest_comment_likes_delete_auth" ON guest_comment_likes
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- RLS 정책: 비인증 사용자도 device_id로 삭제 가능
CREATE POLICY "guest_comment_likes_delete_anon" ON guest_comment_likes
  FOR DELETE USING (
    auth.uid() IS NULL AND device_id IS NOT NULL AND user_id IS NULL
  );

-- 좋아요 카운트 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_guest_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE guest_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE guest_comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_guest_comment_likes_count ON guest_comment_likes;
CREATE TRIGGER trigger_update_guest_comment_likes_count
  AFTER INSERT OR DELETE ON guest_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_comment_likes_count();
