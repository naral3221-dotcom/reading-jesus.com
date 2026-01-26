-- QT 게시판 테이블 생성
-- 관리자가 작성하는 QT 글 (통독 일정의 Day별)

CREATE TABLE IF NOT EXISTS qt_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 365),

  -- QT 콘텐츠
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,              -- 본문 (리치 텍스트)

  -- QT 질문들 (JSON 배열)
  questions JSONB DEFAULT '[]'::jsonb,

  -- 메타데이터
  is_published BOOLEAN DEFAULT true,  -- 공개 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 그룹별 Day당 하나의 QT만 존재
  UNIQUE(group_id, day_number)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_qt_posts_group_day ON qt_posts(group_id, day_number);
CREATE INDEX IF NOT EXISTS idx_qt_posts_author ON qt_posts(author_id);

-- RLS 정책
ALTER TABLE qt_posts ENABLE ROW LEVEL SECURITY;

-- 그룹 멤버는 QT 읽기 가능
CREATE POLICY "Group members can read QT posts"
  ON qt_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = qt_posts.group_id
      AND group_members.user_id = auth.uid()
    )
    AND is_published = true
  );

-- 관리자만 QT 작성 가능
CREATE POLICY "Admins can insert QT posts"
  ON qt_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = qt_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- 관리자만 QT 수정 가능
CREATE POLICY "Admins can update QT posts"
  ON qt_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = qt_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- 관리자만 QT 삭제 가능
CREATE POLICY "Admins can delete QT posts"
  ON qt_posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = qt_posts.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_qt_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_qt_posts_updated_at
  BEFORE UPDATE ON qt_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_qt_posts_updated_at();
