-- Personal Reading Projects (나만의 리딩지저스 프로젝트)
-- 개인이 설정하는 성경 읽기 프로젝트

CREATE TABLE IF NOT EXISTS personal_reading_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  reading_plan_type TEXT DEFAULT 'custom' CHECK (reading_plan_type IN ('365', '180', '90', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE,
  goal TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 개인 프로젝트 읽기 체크
CREATE TABLE IF NOT EXISTS personal_daily_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES personal_reading_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  is_read BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, day_number)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_personal_projects_user ON personal_reading_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_projects_active ON personal_reading_projects(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_personal_checks_project ON personal_daily_checks(project_id);

-- RLS 정책
ALTER TABLE personal_reading_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_daily_checks ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로젝트만 볼 수 있음
CREATE POLICY "Users can view own projects"
  ON personal_reading_projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own projects"
  ON personal_reading_projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON personal_reading_projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON personal_reading_projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 개인 체크 정책
CREATE POLICY "Users can view own checks"
  ON personal_daily_checks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own checks"
  ON personal_daily_checks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own checks"
  ON personal_daily_checks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own checks"
  ON personal_daily_checks FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
