-- Security Definer View 에러 수정
-- 뷰를 SECURITY INVOKER로 재생성하여 RLS 정책이 올바르게 적용되도록 함

-- 1. church_today_reading 뷰 재생성
DROP VIEW IF EXISTS church_today_reading;

CREATE VIEW church_today_reading
WITH (security_invoker = true)
AS
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

-- 2. church_member_stats 뷰 재생성
DROP VIEW IF EXISTS church_member_stats;

CREATE VIEW church_member_stats
WITH (security_invoker = true)
AS
SELECT
  c.id as church_id,
  c.code as church_code,
  c.name as church_name,
  COUNT(p.id) as member_count,
  COUNT(CASE WHEN p.church_joined_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_members_week
FROM churches c
LEFT JOIN profiles p ON p.church_id = c.id
WHERE c.is_active = true
GROUP BY c.id, c.code, c.name;

-- 뷰 접근 권한
GRANT SELECT ON church_member_stats TO anon, authenticated;

-- 코멘트 추가
COMMENT ON VIEW church_today_reading IS '교회별 오늘의 읽기 일정 (SECURITY INVOKER)';
COMMENT ON VIEW church_member_stats IS '교회별 등록 교인 통계 (SECURITY INVOKER)';
