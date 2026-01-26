-- Group Meetings (소그룹 모임 일정)
-- 그룹원들이 모임 일정을 만들고 참여 신청

CREATE TABLE IF NOT EXISTS group_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  max_participants INTEGER DEFAULT 20,
  is_online BOOLEAN DEFAULT false,
  online_link TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 모임 참가자 테이블
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_meetings_group ON group_meetings(group_id);
CREATE INDEX IF NOT EXISTS idx_meetings_host ON group_meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON group_meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON meeting_participants(user_id);

-- RLS 정책
ALTER TABLE group_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- 그룹 멤버는 모임을 볼 수 있음
CREATE POLICY "Group members can view meetings"
  ON group_meetings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_meetings.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- 그룹 멤버는 모임을 생성할 수 있음
CREATE POLICY "Group members can create meetings"
  ON group_meetings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = group_meetings.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- 주최자는 자신의 모임을 수정/삭제할 수 있음
CREATE POLICY "Hosts can update own meetings"
  ON group_meetings FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid());

CREATE POLICY "Hosts can delete own meetings"
  ON group_meetings FOR DELETE
  TO authenticated
  USING (host_id = auth.uid());

-- 참가자 정책
CREATE POLICY "Users can view meeting participants"
  ON meeting_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_meetings gm
      INNER JOIN group_members gmem ON gmem.group_id = gm.group_id
      WHERE gm.id = meeting_participants.meeting_id
      AND gmem.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join meetings"
  ON meeting_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own participation"
  ON meeting_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can cancel own participation"
  ON meeting_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 모임 생성 시 그룹원에게 알림
CREATE OR REPLACE FUNCTION notify_on_meeting_created()
RETURNS TRIGGER AS $$
DECLARE
  member_id UUID;
  host_nickname TEXT;
  group_name TEXT;
BEGIN
  -- 주최자 닉네임 가져오기
  SELECT nickname INTO host_nickname
  FROM profiles
  WHERE id = NEW.host_id;

  -- 그룹 이름 가져오기
  SELECT name INTO group_name
  FROM groups
  WHERE id = NEW.group_id;

  -- 그룹의 모든 멤버에게 알림 (주최자 제외)
  FOR member_id IN
    SELECT user_id
    FROM group_members
    WHERE group_id = NEW.group_id
    AND user_id != NEW.host_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link, related_group_id, actor_id)
    VALUES (
      member_id,
      'group_notice',
      '[' || group_name || '] 새 모임 일정',
      NEW.title,
      '/group/' || NEW.group_id || '/meetings',
      NEW.group_id,
      NEW.host_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_meeting_created ON group_meetings;
CREATE TRIGGER on_meeting_created
  AFTER INSERT ON group_meetings
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_meeting_created();
