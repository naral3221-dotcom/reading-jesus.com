-- =============================================
-- profiles 테이블에 email 컬럼 추가
-- 관리자 계정 관리를 위해 필요
-- =============================================

-- 1. profiles 테이블에 email 컬럼 추가 (없으면)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email VARCHAR(255);
  END IF;
END $$;

-- 2. 기존 사용자의 email 동기화 (auth.users에서 가져오기)
-- auth.users 테이블에서 이메일 가져오기
UPDATE profiles p
SET email = (
  SELECT u.email FROM auth.users u WHERE u.id = p.id
)
WHERE p.email IS NULL;

-- 3. email 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
