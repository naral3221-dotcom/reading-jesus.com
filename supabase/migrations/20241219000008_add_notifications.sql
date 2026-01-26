-- Notifications (알림 시스템)
-- 좋아요, 댓글, 그룹 관련 알림

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'reply', 'group_invite', 'group_notice', 'reminder')),
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  -- 관련 엔티티 참조 (nullable)
  related_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  related_group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS 정책
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림만 볼 수 있음
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 알림 읽음 처리
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 알림 삭제
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 시스템/트리거가 알림 생성 (service_role 또는 trigger)
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 알림 유형 설명:
-- 'like': 내 묵상에 좋아요
-- 'comment': 내 묵상에 댓글
-- 'reply': 내 댓글에 답글
-- 'group_invite': 그룹 초대
-- 'group_notice': 그룹 공지사항
-- 'reminder': 매일 읽기 리마인더
