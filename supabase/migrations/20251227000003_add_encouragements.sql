-- ============================================
-- 격려 메시지 시스템
-- 비활성 멤버에게 격려 메시지를 보낼 수 있는 기능
-- ============================================

-- 격려 메시지 테이블
CREATE TABLE IF NOT EXISTS encouragements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 하루에 같은 사람에게 한 번만 보낼 수 있음 (유니크 인덱스 사용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_encouragements_daily_unique
  ON encouragements(group_id, sender_id, receiver_id, sent_date);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_encouragements_receiver ON encouragements(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_encouragements_group ON encouragements(group_id);
CREATE INDEX IF NOT EXISTS idx_encouragements_sender ON encouragements(sender_id);

-- RLS 활성화
ALTER TABLE encouragements ENABLE ROW LEVEL SECURITY;

-- RLS 정책
DROP POLICY IF EXISTS "encouragements_select" ON encouragements;
DROP POLICY IF EXISTS "encouragements_insert" ON encouragements;
DROP POLICY IF EXISTS "encouragements_update" ON encouragements;
DROP POLICY IF EXISTS "encouragements_delete" ON encouragements;

-- 그룹 멤버는 해당 그룹의 격려 메시지 조회 가능 (본인이 보낸 것 또는 받은 것)
CREATE POLICY "encouragements_select" ON encouragements FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() = receiver_id
  );

-- 그룹 멤버만 격려 메시지 작성 가능
CREATE POLICY "encouragements_insert" ON encouragements FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM group_members WHERE group_id = encouragements.group_id AND user_id = auth.uid())
  );

-- 받은 사람만 읽음 처리 가능
CREATE POLICY "encouragements_update" ON encouragements FOR UPDATE
  USING (auth.uid() = receiver_id);

-- 보낸 사람만 삭제 가능
CREATE POLICY "encouragements_delete" ON encouragements FOR DELETE
  USING (auth.uid() = sender_id);

-- 격려 메시지 보내면 알림 생성하는 트리거
CREATE OR REPLACE FUNCTION create_encouragement_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_nickname TEXT;
BEGIN
  -- 보낸 사람 닉네임 조회
  SELECT nickname INTO sender_nickname FROM profiles WHERE id = NEW.sender_id;

  -- 알림 생성
  INSERT INTO notifications (user_id, type, title, message, related_id, actor_id)
  VALUES (
    NEW.receiver_id,
    'encouragement',
    '격려 메시지가 도착했어요!',
    COALESCE(sender_nickname, '익명') || '님이 격려 메시지를 보냈어요',
    NEW.id,
    NEW.sender_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_encouragement_notification ON encouragements;
CREATE TRIGGER trigger_encouragement_notification
  AFTER INSERT ON encouragements
  FOR EACH ROW
  EXECUTE FUNCTION create_encouragement_notification();

-- 격려 메시지 기본 템플릿 (참고용)
COMMENT ON TABLE encouragements IS '격려 메시지 테이블. 기본 메시지 예시:
- 함께 말씀 읽어요! 💪
- 오늘도 화이팅! 🔥
- 기도하고 있어요 🙏
- 함께해서 좋아요 ❤️
- 다시 시작해봐요! ✨';
