-- church_qt_posts 테이블 생성
-- QT 나눔 게시글을 저장하는 테이블

CREATE TABLE IF NOT EXISTS church_qt_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  qt_date TEXT NOT NULL,
  one_word TEXT,
  copy_verse TEXT,
  my_sentence TEXT,
  meditation_answer TEXT,
  gratitude TEXT,
  my_prayer TEXT,
  day_review TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_church_qt_posts_church_id ON church_qt_posts(church_id);
CREATE INDEX IF NOT EXISTS idx_church_qt_posts_qt_date ON church_qt_posts(qt_date);
CREATE INDEX IF NOT EXISTS idx_church_qt_posts_created_at ON church_qt_posts(created_at DESC);

-- RLS 정책 활성화
ALTER TABLE church_qt_posts ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 사용자가 해당 교회의 QT 나눔을 볼 수 있음
CREATE POLICY "church_qt_posts_select" ON church_qt_posts
  FOR SELECT
  USING (true);

-- 삽입 정책: 모든 사용자가 QT 나눔을 작성할 수 있음
CREATE POLICY "church_qt_posts_insert" ON church_qt_posts
  FOR INSERT
  WITH CHECK (true);

-- 수정 정책: 작성자만 수정 가능
CREATE POLICY "church_qt_posts_update" ON church_qt_posts
  FOR UPDATE
  USING (user_id = auth.uid());

-- 삭제 정책: 작성자만 삭제 가능 (user_id가 있는 경우)
CREATE POLICY "church_qt_posts_delete" ON church_qt_posts
  FOR DELETE
  USING (user_id IS NOT NULL AND user_id = auth.uid());
