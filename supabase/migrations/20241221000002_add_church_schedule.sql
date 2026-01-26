-- =============================================
-- 교회 통독 일정 연결 기능 추가
-- 교회별로 어떤 년도의 리딩지저스 일정을 사용할지 설정
-- =============================================

-- 1. churches 테이블에 일정 관련 컬럼 추가
ALTER TABLE churches ADD COLUMN IF NOT EXISTS schedule_year INTEGER DEFAULT 2026;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS schedule_start_date DATE;

-- 기존 교회에 기본값 적용
UPDATE churches SET schedule_year = 2026 WHERE schedule_year IS NULL;

-- 영동중앙교회에 리딩지저스 2026 일정 적용 (코드로 찾아서 업데이트)
UPDATE churches
SET schedule_year = 2026,
    schedule_start_date = '2026-01-12'
WHERE code LIKE 'CB%' OR name LIKE '%영동중앙%';

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_churches_schedule_year ON churches(schedule_year);

-- 3. 테스트 데이터 삭제 (6일짜리 테스트 버전)
-- reading_schedules에서 2026년이 아닌 데이터 삭제
DELETE FROM reading_schedules WHERE year != 2026;

-- 4. 뷰 생성: 교회별 오늘의 읽기 일정
CREATE OR REPLACE VIEW church_today_reading AS
SELECT
  c.id AS church_id,
  c.code AS church_code,
  c.name AS church_name,
  c.schedule_year,
  rs.date AS reading_date,
  rs.reading,
  rs.memory_verse,
  rs.is_supplement_week,
  mt.theme AS monthly_theme
FROM churches c
LEFT JOIN reading_schedules rs ON rs.year = c.schedule_year AND rs.date = CURRENT_DATE
LEFT JOIN monthly_themes mt ON mt.year = c.schedule_year AND mt.month = EXTRACT(MONTH FROM CURRENT_DATE)
WHERE c.is_active = true;

-- 뷰 접근 권한
GRANT SELECT ON church_today_reading TO anon, authenticated;
