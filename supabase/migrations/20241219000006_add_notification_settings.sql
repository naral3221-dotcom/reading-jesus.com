-- Notification Settings (개인 알림 설정)
-- 사용자가 원하는 시간에 커스텀 메시지로 알림 받기

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  notification_time TIME NOT NULL DEFAULT '09:00:00',
  custom_message TEXT DEFAULT '오늘의 말씀을 읽어보세요 📖',
  days_of_week INTEGER[] DEFAULT ARRAY[1,2,3,4,5,6,7], -- 1=월요일, 7=일요일
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_enabled ON notification_settings(is_enabled) WHERE is_enabled = true;

-- RLS 정책
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림 설정만 조회 가능
CREATE POLICY "Users can view own notification settings"
  ON notification_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 사용자는 자신의 알림 설정 생성 가능
CREATE POLICY "Users can create own notification settings"
  ON notification_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 사용자는 자신의 알림 설정 수정 가능
CREATE POLICY "Users can update own notification settings"
  ON notification_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- 사용자는 자신의 알림 설정 삭제 가능
CREATE POLICY "Users can delete own notification settings"
  ON notification_settings FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 알림 설정 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_notification_settings_updated ON notification_settings;
CREATE TRIGGER on_notification_settings_updated
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();
