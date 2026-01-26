-- 묵상 댓글(리플) 테이블 생성
CREATE TABLE IF NOT EXISTS comment_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_replies_comment_id ON comment_replies(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_user_id ON comment_replies(user_id);

-- RLS 활성화
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- 누구나 읽기 가능
CREATE POLICY "Anyone can read comment replies"
  ON comment_replies FOR SELECT
  USING (true);

-- 인증된 사용자만 작성 가능
CREATE POLICY "Authenticated users can create comment replies"
  ON comment_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 본인 댓글만 수정 가능
CREATE POLICY "Users can update own comment replies"
  ON comment_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인 댓글만 삭제 가능
CREATE POLICY "Users can delete own comment replies"
  ON comment_replies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- comments 테이블에 replies_count 컬럼 추가
ALTER TABLE comments ADD COLUMN IF NOT EXISTS replies_count integer DEFAULT 0;

-- 댓글 수 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET replies_count = replies_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET replies_count = replies_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_replies_count ON comment_replies;
CREATE TRIGGER trigger_update_replies_count
  AFTER INSERT OR DELETE ON comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_replies_count();
