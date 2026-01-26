-- ============================================
-- 교회 등록 교인 읽음 체크 테이블
-- 목적: 등록 교인의 성경 읽기 기록을 클라우드에 저장
-- ============================================

-- 1. 교회 읽음 체크 테이블
CREATE TABLE IF NOT EXISTS church_reading_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 365),
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 같은 교회, 같은 day에 대해 한 번만 체크 가능
  UNIQUE(user_id, church_id, day_number)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_church_reading_user ON church_reading_checks(user_id, church_id);
CREATE INDEX IF NOT EXISTS idx_church_reading_day ON church_reading_checks(church_id, day_number);

-- RLS 활성화
ALTER TABLE church_reading_checks ENABLE ROW LEVEL SECURITY;

-- 정책: 본인 데이터만 조회 가능
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own church reading checks' AND tablename = 'church_reading_checks'
  ) THEN
    CREATE POLICY "Users can view own church reading checks"
      ON church_reading_checks FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 정책: 본인 데이터만 삽입 가능 (등록 교인 여부 확인)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own church reading checks' AND tablename = 'church_reading_checks'
  ) THEN
    CREATE POLICY "Users can insert own church reading checks"
      ON church_reading_checks FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.church_id = church_reading_checks.church_id
        )
      );
  END IF;
END $$;

-- 정책: 본인 데이터만 삭제 가능
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own church reading checks' AND tablename = 'church_reading_checks'
  ) THEN
    CREATE POLICY "Users can delete own church reading checks"
      ON church_reading_checks FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================
-- 헬퍼 함수: 읽음 체크 토글
-- ============================================
CREATE OR REPLACE FUNCTION toggle_church_reading_check(
  p_user_id UUID,
  p_church_id UUID,
  p_day_number INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- 이미 체크되어 있는지 확인
  SELECT EXISTS(
    SELECT 1 FROM church_reading_checks
    WHERE user_id = p_user_id
      AND church_id = p_church_id
      AND day_number = p_day_number
  ) INTO v_exists;

  IF v_exists THEN
    -- 체크 해제
    DELETE FROM church_reading_checks
    WHERE user_id = p_user_id
      AND church_id = p_church_id
      AND day_number = p_day_number;
    RETURN FALSE;
  ELSE
    -- 체크
    INSERT INTO church_reading_checks (user_id, church_id, day_number)
    VALUES (p_user_id, p_church_id, p_day_number);
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 헬퍼 함수: 사용자의 교회 읽음 기록 조회
-- ============================================
CREATE OR REPLACE FUNCTION get_church_reading_checks(
  p_user_id UUID,
  p_church_id UUID
) RETURNS TABLE (
  day_number INTEGER,
  checked_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    crc.day_number,
    crc.checked_at
  FROM church_reading_checks crc
  WHERE crc.user_id = p_user_id
    AND crc.church_id = p_church_id
  ORDER BY crc.day_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 헬퍼 함수: 스트릭 계산
-- ============================================
CREATE OR REPLACE FUNCTION calculate_church_streak(
  p_user_id UUID,
  p_church_id UUID,
  p_current_day INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_day INTEGER;
BEGIN
  -- 현재 Day부터 역순으로 연속 체크 계산
  FOR v_day IN REVERSE p_current_day..1 LOOP
    IF EXISTS (
      SELECT 1 FROM church_reading_checks
      WHERE user_id = p_user_id
        AND church_id = p_church_id
        AND day_number = v_day
    ) THEN
      v_streak := v_streak + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
