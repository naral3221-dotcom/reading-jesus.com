-- =====================================================
-- church_admins에 password_changed_at 컬럼 추가
-- 마지막 비밀번호 변경 시간 기록
-- =====================================================

-- 컬럼 추가
ALTER TABLE church_admins
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

-- 코멘트
COMMENT ON COLUMN church_admins.password_changed_at IS '마지막 비밀번호 변경 시간';
