-- 배지 정의 테이블
CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- 배지 식별 코드
  name VARCHAR(100) NOT NULL, -- 배지 이름
  description TEXT, -- 배지 설명
  icon VARCHAR(10) NOT NULL, -- 이모지 아이콘
  category VARCHAR(50) NOT NULL, -- 카테고리 (streak, meditation, prayer, etc.)
  requirement_type VARCHAR(50) NOT NULL, -- 조건 유형 (streak_days, meditation_count, etc.)
  requirement_value INTEGER NOT NULL, -- 조건 값
  sort_order INTEGER DEFAULT 0, -- 정렬 순서
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 배지 테이블
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL, -- 어느 그룹에서 획득했는지 (선택)
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  is_notified BOOLEAN DEFAULT false, -- 사용자에게 알림 표시 여부
  UNIQUE(user_id, badge_id, group_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_not_notified ON user_badges(user_id, is_notified) WHERE is_notified = false;

-- RLS 정책
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 배지 정의는 모두 조회 가능
DROP POLICY IF EXISTS "배지 정의 조회" ON badge_definitions;
CREATE POLICY "배지 정의 조회" ON badge_definitions FOR SELECT
  USING (true);

-- 자신의 배지만 조회
DROP POLICY IF EXISTS "자신의 배지 조회" ON user_badges;
CREATE POLICY "자신의 배지 조회" ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- 그룹 멤버의 배지도 조회 가능
DROP POLICY IF EXISTS "그룹 멤버 배지 조회" ON user_badges;
CREATE POLICY "그룹 멤버 배지 조회" ON user_badges FOR SELECT
  USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = user_badges.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- 배지 부여 (서버에서만 가능하도록 service role 필요)
-- INSERT는 서버 함수를 통해 수행

-- 알림 상태 업데이트 (본인만)
DROP POLICY IF EXISTS "알림 상태 업데이트" ON user_badges;
CREATE POLICY "알림 상태 업데이트" ON user_badges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 기본 배지 데이터 삽입
-- ============================================

INSERT INTO badge_definitions (code, name, description, icon, category, requirement_type, requirement_value, sort_order) VALUES
-- 묵상 배지
('first_meditation', '첫 묵상', '첫 번째 묵상 나눔을 작성했습니다', '📝', 'meditation', 'meditation_count', 1, 1),
('meditation_10', '묵상 10회', '묵상 나눔 10회 달성', '📖', 'meditation', 'meditation_count', 10, 2),
('meditation_50', '묵상 50회', '묵상 나눔 50회 달성', '📚', 'meditation', 'meditation_count', 50, 3),
('meditation_100', '묵상 마스터', '묵상 나눔 100회 달성', '🎓', 'meditation', 'meditation_count', 100, 4),

-- 스트릭 배지
('streak_7', '7일 연속', '7일 연속 읽기 달성', '🔥', 'streak', 'streak_days', 7, 10),
('streak_30', '30일 연속', '30일 연속 읽기 달성 - 한 달 성공!', '💪', 'streak', 'streak_days', 30, 11),
('streak_100', '100일 연속', '100일 연속 읽기 달성 - 대단해요!', '🏆', 'streak', 'streak_days', 100, 12),
('streak_365', '1년 완주', '365일 연속 읽기 달성 - 축하합니다!', '👑', 'streak', 'streak_days', 365, 13),

-- 기도 배지
('first_prayer', '첫 기도', '첫 번째 기도제목을 나눴습니다', '🙏', 'prayer', 'prayer_count', 1, 20),
('prayer_supporter', '기도 서포터', '10번 함께 기도했습니다', '🤝', 'prayer', 'prayer_support_count', 10, 21),
('prayer_answered', '응답의 증인', '기도 응답을 받았습니다', '✨', 'prayer', 'prayer_answered_count', 1, 22),

-- 소통 배지
('first_reply', '첫 댓글', '첫 번째 댓글을 남겼습니다', '💬', 'social', 'reply_count', 1, 30),
('active_member', '활발한 멤버', '댓글 50회 달성', '🌟', 'social', 'reply_count', 50, 31)

ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 배지 자동 부여 함수
-- ============================================

-- 묵상 작성 시 배지 체크
CREATE OR REPLACE FUNCTION check_meditation_badges()
RETURNS TRIGGER AS $$
DECLARE
  meditation_count INTEGER;
  badge_record RECORD;
BEGIN
  -- 사용자의 총 묵상 수 계산
  SELECT COUNT(*) INTO meditation_count
  FROM comments
  WHERE user_id = NEW.user_id;

  -- 해당하는 배지 부여
  FOR badge_record IN
    SELECT id, requirement_value
    FROM badge_definitions
    WHERE category = 'meditation'
    AND requirement_type = 'meditation_count'
    AND requirement_value <= meditation_count
    AND is_active = true
  LOOP
    INSERT INTO user_badges (user_id, badge_id, group_id)
    VALUES (NEW.user_id, badge_record.id, NEW.group_id)
    ON CONFLICT (user_id, badge_id, group_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 댓글 작성 시 배지 체크
CREATE OR REPLACE FUNCTION check_reply_badges()
RETURNS TRIGGER AS $$
DECLARE
  reply_count INTEGER;
  badge_record RECORD;
BEGIN
  -- 사용자의 총 댓글 수 계산
  SELECT COUNT(*) INTO reply_count
  FROM comment_replies
  WHERE user_id = NEW.user_id;

  -- 해당하는 배지 부여
  FOR badge_record IN
    SELECT id, requirement_value
    FROM badge_definitions
    WHERE category = 'social'
    AND requirement_type = 'reply_count'
    AND requirement_value <= reply_count
    AND is_active = true
  LOOP
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id, group_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기도제목 작성 시 배지 체크
CREATE OR REPLACE FUNCTION check_prayer_badges()
RETURNS TRIGGER AS $$
DECLARE
  prayer_count INTEGER;
  badge_record RECORD;
BEGIN
  -- 사용자의 총 기도제목 수 계산
  SELECT COUNT(*) INTO prayer_count
  FROM prayer_requests
  WHERE user_id = NEW.user_id;

  -- 해당하는 배지 부여
  FOR badge_record IN
    SELECT id, requirement_value
    FROM badge_definitions
    WHERE category = 'prayer'
    AND requirement_type = 'prayer_count'
    AND requirement_value <= prayer_count
    AND is_active = true
  LOOP
    INSERT INTO user_badges (user_id, badge_id, group_id)
    VALUES (NEW.user_id, badge_record.id, NEW.group_id)
    ON CONFLICT (user_id, badge_id, group_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함께 기도 시 배지 체크
CREATE OR REPLACE FUNCTION check_prayer_support_badges()
RETURNS TRIGGER AS $$
DECLARE
  support_count INTEGER;
  badge_record RECORD;
BEGIN
  -- 사용자의 총 함께 기도 수 계산
  SELECT COUNT(*) INTO support_count
  FROM prayer_support
  WHERE user_id = NEW.user_id;

  -- 해당하는 배지 부여
  FOR badge_record IN
    SELECT id, requirement_value
    FROM badge_definitions
    WHERE category = 'prayer'
    AND requirement_type = 'prayer_support_count'
    AND requirement_value <= support_count
    AND is_active = true
  LOOP
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT (user_id, badge_id, group_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기도 응답 시 배지 체크
CREATE OR REPLACE FUNCTION check_prayer_answered_badges()
RETURNS TRIGGER AS $$
DECLARE
  answered_count INTEGER;
  badge_record RECORD;
BEGIN
  IF NEW.is_answered = true AND (OLD.is_answered IS NULL OR OLD.is_answered = false) THEN
    -- 사용자의 총 응답받은 기도 수 계산
    SELECT COUNT(*) INTO answered_count
    FROM prayer_requests
    WHERE user_id = NEW.user_id AND is_answered = true;

    -- 해당하는 배지 부여
    FOR badge_record IN
      SELECT id, requirement_value
      FROM badge_definitions
      WHERE category = 'prayer'
      AND requirement_type = 'prayer_answered_count'
      AND requirement_value <= answered_count
      AND is_active = true
    LOOP
      INSERT INTO user_badges (user_id, badge_id, group_id)
      VALUES (NEW.user_id, badge_record.id, NEW.group_id)
      ON CONFLICT (user_id, badge_id, group_id) DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_check_meditation_badges ON comments;
CREATE TRIGGER trigger_check_meditation_badges
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION check_meditation_badges();

DROP TRIGGER IF EXISTS trigger_check_reply_badges ON comment_replies;
CREATE TRIGGER trigger_check_reply_badges
  AFTER INSERT ON comment_replies
  FOR EACH ROW EXECUTE FUNCTION check_reply_badges();

DROP TRIGGER IF EXISTS trigger_check_prayer_badges ON prayer_requests;
CREATE TRIGGER trigger_check_prayer_badges
  AFTER INSERT ON prayer_requests
  FOR EACH ROW EXECUTE FUNCTION check_prayer_badges();

DROP TRIGGER IF EXISTS trigger_check_prayer_support_badges ON prayer_support;
CREATE TRIGGER trigger_check_prayer_support_badges
  AFTER INSERT ON prayer_support
  FOR EACH ROW EXECUTE FUNCTION check_prayer_support_badges();

DROP TRIGGER IF EXISTS trigger_check_prayer_answered_badges ON prayer_requests;
CREATE TRIGGER trigger_check_prayer_answered_badges
  AFTER UPDATE ON prayer_requests
  FOR EACH ROW EXECUTE FUNCTION check_prayer_answered_badges();

-- ============================================
-- 스트릭 배지 체크 함수 (daily_checks에서 호출)
-- ============================================

CREATE OR REPLACE FUNCTION check_streak_badges(p_user_id UUID, p_group_id UUID, p_streak INTEGER)
RETURNS VOID AS $$
DECLARE
  badge_record RECORD;
BEGIN
  -- 해당하는 스트릭 배지 부여
  FOR badge_record IN
    SELECT id, requirement_value
    FROM badge_definitions
    WHERE category = 'streak'
    AND requirement_type = 'streak_days'
    AND requirement_value <= p_streak
    AND is_active = true
  LOOP
    INSERT INTO user_badges (user_id, badge_id, group_id)
    VALUES (p_user_id, badge_record.id, p_group_id)
    ON CONFLICT (user_id, badge_id, group_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
