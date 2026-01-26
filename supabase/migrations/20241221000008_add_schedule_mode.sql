-- =============================================
-- 그룹 일정 모드 추가
-- 'calendar': 실제 날짜 기반 (리딩지저스 2026 공식 일정)
-- 'day_count': 그룹 시작일 기준 D+1, D+2... 순차 진행
-- =============================================

-- 1. groups 테이블에 schedule_mode 컬럼 추가
ALTER TABLE groups ADD COLUMN IF NOT EXISTS schedule_mode VARCHAR(20) DEFAULT 'calendar';

-- 유효한 값만 허용하는 체크 제약조건 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'groups_schedule_mode_check'
  ) THEN
    ALTER TABLE groups ADD CONSTRAINT groups_schedule_mode_check
      CHECK (schedule_mode IN ('calendar', 'day_count'));
  END IF;
END $$;

-- 2. 기존 그룹은 기본값 'calendar'로 설정
UPDATE groups SET schedule_mode = 'calendar' WHERE schedule_mode IS NULL;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_groups_schedule_mode ON groups(schedule_mode);

-- 4. 코멘트 추가
COMMENT ON COLUMN groups.schedule_mode IS '일정 모드: calendar=실제 날짜 기반, day_count=그룹 시작일 기준 순차 진행';
