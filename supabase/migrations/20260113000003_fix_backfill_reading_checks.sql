-- ============================================
-- 기존 QT 나눔 → 읽음 완료 소급 적용 (수정된 버전)
--
-- 문제점: 이전 마이그레이션에서 EXTRACT(DOY FROM qt_date)를 사용했는데,
--         이는 1월 12일을 12일차로 계산함.
--         하지만 실제 통독 일정은 1월 12일이 1일차임.
--
-- 해결책: church_qt_posts.day_number 컬럼을 직접 사용
-- ============================================

-- 기존 잘못된 데이터 정리 (필요시)
-- DELETE FROM church_reading_checks WHERE day_number > 271;

-- 기존 QT 나눔 데이터를 기반으로 읽음 완료 기록 일괄 삽입
-- day_number 컬럼을 직접 사용
INSERT INTO church_reading_checks (user_id, church_id, day_number, checked_at, created_at)
SELECT DISTINCT
  qp.user_id,
  qp.church_id,
  qp.day_number,
  qp.created_at AS checked_at,
  NOW() AS created_at
FROM church_qt_posts qp
WHERE qp.user_id IS NOT NULL
  AND qp.day_number IS NOT NULL
  AND qp.day_number BETWEEN 1 AND 271  -- 유효한 통독 일정 범위
ON CONFLICT (user_id, church_id, day_number) DO NOTHING;  -- 이미 체크된 경우 무시

-- 처리된 레코드 수 확인 (주석 해제하여 확인 가능)
-- SELECT COUNT(*) AS total_checks FROM church_reading_checks;
