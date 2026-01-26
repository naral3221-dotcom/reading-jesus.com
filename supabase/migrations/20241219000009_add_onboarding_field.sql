-- Add onboarding completed field to profiles
-- 온보딩 완료 여부를 profiles 테이블에 저장

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(has_completed_onboarding) WHERE has_completed_onboarding = false;

-- 기존 사용자는 온보딩 완료로 간주 (기본값 true로 설정하려면 아래 주석 해제)
-- UPDATE profiles SET has_completed_onboarding = true WHERE created_at < NOW();
