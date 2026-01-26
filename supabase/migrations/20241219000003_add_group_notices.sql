-- Group Notices (그룹 공지사항)
-- 관리자가 그룹원에게 공지사항 작성

CREATE TABLE IF NOT EXISTS group_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_group_notices_group ON group_notices(group_id);
CREATE INDEX IF NOT EXISTS idx_group_notices_pinned ON group_notices(group_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_group_notices_created ON group_notices(created_at DESC);

-- RLS 정책
ALTER TABLE group_notices ENABLE ROW LEVEL SECURITY;

-- 그룹 멤버는 공지사항을 볼 수 있음
CREATE POLICY "Group members can view notices"
  ON group_notices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_notices.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- 그룹 관리자는 공지사항을 작성할 수 있음
CREATE POLICY "Group admins can create notices"
  ON group_notices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_notices.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- 작성자는 자신의 공지사항을 수정/삭제할 수 있음
CREATE POLICY "Authors can update own notices"
  ON group_notices FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own notices"
  ON group_notices FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- 공지사항 작성 시 그룹원에게 알림
CREATE OR REPLACE FUNCTION notify_on_group_notice()
RETURNS TRIGGER AS $$
DECLARE
  member_id UUID;
  author_nickname TEXT;
  group_name TEXT;
BEGIN
  -- 공지 작성자 닉네임 가져오기
  SELECT nickname INTO author_nickname
  FROM profiles
  WHERE id = NEW.author_id;

  -- 그룹 이름 가져오기
  SELECT name INTO group_name
  FROM groups
  WHERE id = NEW.group_id;

  -- 그룹의 모든 멤버에게 알림 (작성자 제외)
  FOR member_id IN
    SELECT user_id
    FROM group_members
    WHERE group_id = NEW.group_id
    AND user_id != NEW.author_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link, related_group_id, actor_id)
    VALUES (
      member_id,
      'group_notice',
      '[' || group_name || '] 새 공지사항',
      NEW.title,
      '/group/' || NEW.group_id,
      NEW.group_id,
      NEW.author_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 공지사항 트리거 생성
DROP TRIGGER IF EXISTS on_group_notice_created ON group_notices;
CREATE TRIGGER on_group_notice_created
  AFTER INSERT ON group_notices
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_group_notice();
