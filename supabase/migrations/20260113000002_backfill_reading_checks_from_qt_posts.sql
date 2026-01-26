-- ============================================
-- 기존 QT 나눔 작성자 읽음 완료 소급 적용
-- 목적: church_qt_posts에 작성된 QT를 기반으로
--       church_reading_checks에 읽음 완료 기록 생성
-- ============================================

-- 기존 QT 나눔 데이터를 기반으로 읽음 완료 기록 일괄 삽입
-- user_id가 있고, qt_date가 2026년인 경우만 처리
INSERT INTO church_reading_checks (user_id, church_id, day_number, checked_at, created_at)
SELECT DISTINCT
  qp.user_id,
  qp.church_id,
  -- qt_date (YYYY-MM-DD)를 해당 연도의 day number로 변환
  -- 예: 2026-01-01 = 1, 2026-01-02 = 2, ...
  EXTRACT(DOY FROM qp.qt_date::DATE)::INTEGER AS day_number,
  qp.created_at AS checked_at,
  NOW() AS created_at
FROM church_qt_posts qp
WHERE qp.user_id IS NOT NULL
  AND qp.qt_date IS NOT NULL
  AND qp.qt_date ~ '^\d{4}-\d{2}-\d{2}$'  -- 유효한 날짜 형식인지 확인
  AND EXTRACT(YEAR FROM qp.qt_date::DATE) = 2026  -- 2026년 데이터만
  AND EXTRACT(DOY FROM qp.qt_date::DATE) BETWEEN 1 AND 365  -- 유효한 day_number 범위
ON CONFLICT (user_id, church_id, day_number) DO NOTHING;  -- 이미 체크된 경우 무시

-- 처리된 레코드 수 확인 (주석 해제하여 확인 가능)
-- SELECT COUNT(*) AS inserted_count FROM church_reading_checks WHERE created_at > NOW() - INTERVAL '1 minute';
