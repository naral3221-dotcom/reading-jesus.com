-- 임시저장 묵상 테이블 생성
-- 사용자가 성경을 읽으면서 작성 중인 묵상을 임시저장

CREATE TABLE IF NOT EXISTS draft_posts (
  id TEXT PRIMARY KEY,  -- 클라이언트에서 생성한 ID (draft_timestamp_random)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  is_rich_editor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_draft_posts_user_id ON draft_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_draft_posts_group_id ON draft_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_draft_posts_user_group ON draft_posts(user_id, group_id);

-- RLS 정책
ALTER TABLE draft_posts ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 드래프트만 조회 가능
CREATE POLICY "Users can view own drafts" ON draft_posts
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 드래프트만 생성 가능
CREATE POLICY "Users can create own drafts" ON draft_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 드래프트만 수정 가능
CREATE POLICY "Users can update own drafts" ON draft_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 드래프트만 삭제 가능
CREATE POLICY "Users can delete own drafts" ON draft_posts
  FOR DELETE USING (auth.uid() = user_id);
