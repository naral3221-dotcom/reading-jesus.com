-- ============================================
-- 읽기 플랜 시스템
-- 리딩지저스 및 커스텀 플랜 지원
-- ============================================

-- 1. reading_plans 테이블 생성
CREATE TABLE IF NOT EXISTS reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 기본 정보
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('reading_jesus', 'custom')),

  -- 커스텀 플랜 설정
  bible_scope TEXT CHECK (bible_scope IN ('full', 'old', 'new', 'custom')),
  selected_books TEXT[],           -- 직접 선택 시 책 목록
  reading_days INTEGER[],          -- [1,2,3,4,5] = 월~금 (0=일, 1=월, ..., 6=토)
  chapters_per_day INTEGER,        -- 하루에 읽을 장 수

  -- 계산된 값
  total_chapters INTEGER,          -- 총 장 수
  total_reading_days INTEGER,      -- 실제 읽기 일수
  total_calendar_days INTEGER,     -- 달력 기준 총 일수
  start_date DATE NOT NULL,
  end_date DATE,

  -- 메타데이터
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reading_plans_type ON reading_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_reading_plans_start_date ON reading_plans(start_date);

-- RLS 활성화
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;

-- RLS 정책
DROP POLICY IF EXISTS "reading_plans_select" ON reading_plans;
DROP POLICY IF EXISTS "reading_plans_insert" ON reading_plans;
DROP POLICY IF EXISTS "reading_plans_update" ON reading_plans;

-- 모든 사용자가 플랜 조회 가능 (공개 플랜)
CREATE POLICY "reading_plans_select" ON reading_plans FOR SELECT
  USING (true);

-- 인증된 사용자만 플랜 생성 가능
CREATE POLICY "reading_plans_insert" ON reading_plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 생성자만 플랜 수정 가능
CREATE POLICY "reading_plans_update" ON reading_plans FOR UPDATE
  USING (auth.uid() = created_by);


-- 2. plan_schedules 테이블 생성 (각 플랜의 일별 읽기 일정)
CREATE TABLE IF NOT EXISTS plan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,

  day_number INTEGER NOT NULL,      -- Day 1, Day 2, ...
  reading_date DATE,                -- 실제 날짜 (휴식일 고려)
  book_name TEXT NOT NULL,          -- 성경책 이름
  start_chapter INTEGER NOT NULL,
  end_chapter INTEGER NOT NULL,
  chapter_count INTEGER NOT NULL,

  -- QT 가이드 (리딩지저스용)
  qt_guide_id UUID,                 -- 연결된 QT 가이드 ID (있는 경우)

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plan_id, day_number)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_plan_schedules_plan ON plan_schedules(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_schedules_date ON plan_schedules(reading_date);
CREATE INDEX IF NOT EXISTS idx_plan_schedules_day ON plan_schedules(day_number);

-- RLS 활성화
ALTER TABLE plan_schedules ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (읽기만 허용, 삽입은 플랜 생성 시 자동)
DROP POLICY IF EXISTS "plan_schedules_select" ON plan_schedules;
CREATE POLICY "plan_schedules_select" ON plan_schedules FOR SELECT
  USING (true);


-- 3. groups 테이블 수정 (department, plan_id 추가)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES reading_plans(id) ON DELETE SET NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_groups_plan ON groups(plan_id);


-- 4. daily_checks 테이블 수정 (plan_id 추가)
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES reading_plans(id) ON DELETE SET NULL;


-- 5. 같은 플랜이면 한 번 체크로 여러 그룹에 기록하는 함수
CREATE OR REPLACE FUNCTION check_plan_for_all_groups(
  p_user_id UUID,
  p_plan_id UUID,
  p_day_number INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- 해당 플랜을 사용하는 모든 그룹에 체크 기록
  INSERT INTO daily_checks (user_id, group_id, day_number, plan_id)
  SELECT
    p_user_id,
    g.id,
    p_day_number,
    p_plan_id
  FROM groups g
  JOIN group_members gm ON gm.group_id = g.id
  WHERE gm.user_id = p_user_id
    AND g.plan_id = p_plan_id
  ON CONFLICT (user_id, group_id, day_number) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. 사용자의 모든 플랜과 오늘의 읽기 상태를 조회하는 함수
CREATE OR REPLACE FUNCTION get_user_daily_readings(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  plan_id UUID,
  plan_name TEXT,
  plan_type TEXT,
  day_number INTEGER,
  book_name TEXT,
  start_chapter INTEGER,
  end_chapter INTEGER,
  chapter_count INTEGER,
  applied_groups JSONB,
  is_checked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_groups AS (
    -- 사용자가 속한 모든 그룹
    SELECT g.id as group_id, g.name as group_name, g.plan_id, g.church_id
    FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE gm.user_id = p_user_id
      AND g.plan_id IS NOT NULL
  ),
  plan_days AS (
    -- 각 플랜의 오늘 day_number 계산
    SELECT
      rp.id as plan_id,
      rp.name as plan_name,
      rp.plan_type,
      (p_date - rp.start_date + 1) as day_number
    FROM reading_plans rp
    WHERE rp.id IN (SELECT plan_id FROM user_groups)
      AND p_date >= rp.start_date
      AND (rp.end_date IS NULL OR p_date <= rp.end_date)
  ),
  schedules AS (
    -- 오늘의 읽기 일정
    SELECT
      pd.plan_id,
      pd.plan_name,
      pd.plan_type,
      pd.day_number,
      ps.book_name,
      ps.start_chapter,
      ps.end_chapter,
      ps.chapter_count
    FROM plan_days pd
    JOIN plan_schedules ps ON ps.plan_id = pd.plan_id AND ps.day_number = pd.day_number
  )
  SELECT
    s.plan_id,
    s.plan_name,
    s.plan_type,
    s.day_number::INTEGER,
    s.book_name,
    s.start_chapter,
    s.end_chapter,
    s.chapter_count,
    -- 적용되는 그룹 목록
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', ug.group_id,
        'name', ug.group_name,
        'type', CASE WHEN ug.church_id IS NOT NULL THEN 'church' ELSE 'group' END
      ))
      FROM user_groups ug
      WHERE ug.plan_id = s.plan_id
    ) as applied_groups,
    -- 체크 여부 (해당 플랜의 그룹 중 하나라도 체크했으면 true)
    EXISTS (
      SELECT 1
      FROM daily_checks dc
      JOIN user_groups ug ON ug.group_id = dc.group_id
      WHERE dc.user_id = p_user_id
        AND ug.plan_id = s.plan_id
        AND dc.day_number = s.day_number
    ) as is_checked
  FROM schedules s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. 리딩지저스 2026 기본 플랜 생성 (예시)
-- 실제 데이터는 별도로 삽입
INSERT INTO reading_plans (
  id,
  name,
  plan_type,
  bible_scope,
  reading_days,
  chapters_per_day,
  total_chapters,
  total_reading_days,
  total_calendar_days,
  start_date,
  end_date
) VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  '리딩지저스 2026',
  'reading_jesus',
  'full',
  ARRAY[1,2,3,4,5,6],  -- 월~토 (일요일 휴식)
  4,                    -- 하루 평균 약 4장
  1189,                 -- 성경 전체 장 수
  313,                  -- 실제 읽기 일수 (일요일 제외)
  365,                  -- 1년
  '2026-01-12'::DATE,
  '2027-01-11'::DATE
) ON CONFLICT DO NOTHING;


-- 8. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_reading_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reading_plans_updated_at ON reading_plans;
CREATE TRIGGER trigger_reading_plans_updated_at
  BEFORE UPDATE ON reading_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_reading_plans_updated_at();


-- 주석
COMMENT ON TABLE reading_plans IS '읽기 플랜 테이블. 리딩지저스 또는 커스텀 플랜 저장';
COMMENT ON TABLE plan_schedules IS '플랜 일정 테이블. 각 Day의 읽기 분량 저장';
COMMENT ON FUNCTION check_plan_for_all_groups IS '같은 플랜을 사용하는 모든 그룹에 일괄 체크';
COMMENT ON FUNCTION get_user_daily_readings IS '사용자의 오늘 읽기 일정을 플랜별로 그룹핑하여 반환';
