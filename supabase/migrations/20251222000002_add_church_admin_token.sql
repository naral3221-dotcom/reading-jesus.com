-- =============================================
-- 교회 관리자 토큰 추가
-- 교회별 관리자 페이지 접근용
-- =============================================

-- 1. admin_token 컬럼 추가
ALTER TABLE churches ADD COLUMN IF NOT EXISTS admin_token VARCHAR(50);

-- 2. 관리자 토큰 생성 함수
CREATE OR REPLACE FUNCTION generate_admin_token(p_church_code VARCHAR(10))
RETURNS VARCHAR(50) AS $$
DECLARE
  random_part VARCHAR(20);
BEGIN
  -- 랜덤 문자열 생성 (더 긴 토큰)
  random_part := LOWER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 16));
  RETURN 'admin-' || LOWER(p_church_code) || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- 3. 기존 교회들에 admin_token 생성
UPDATE churches
SET admin_token = generate_admin_token(code)
WHERE admin_token IS NULL;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_churches_admin_token ON churches(admin_token);

-- 5. guest_comments에 schedule_date 컬럼 추가 (날짜별 통계용)
ALTER TABLE guest_comments ADD COLUMN IF NOT EXISTS schedule_date DATE;

-- 6. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_guest_comments_schedule_date ON guest_comments(church_id, schedule_date);
