-- Add group settings columns for Phase 3
-- 그룹 프로젝트 설정, 목표, 규칙 등을 위한 컬럼 추가

-- 그룹 테이블에 설정 필드 추가
ALTER TABLE groups ADD COLUMN IF NOT EXISTS reading_plan_type TEXT DEFAULT '365' CHECK (reading_plan_type IN ('365', '180', '90', 'custom'));
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 100;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS allow_anonymous BOOLEAN DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS require_daily_reading BOOLEAN DEFAULT false;

-- 설명:
-- reading_plan_type: 읽기 플랜 유형 (365일/180일/90일/커스텀)
-- end_date: 종료 예정일
-- goal: 그룹 목표
-- rules: 그룹 규칙
-- is_public: 공개 여부 (초대 코드 없이 검색/가입 가능)
-- max_members: 최대 멤버 수
-- allow_anonymous: 익명 댓글 허용 여부
-- require_daily_reading: 매일 읽기 필수 여부 (리마인더용)

COMMENT ON COLUMN groups.reading_plan_type IS '읽기 플랜 유형: 365일/180일/90일/커스텀';
COMMENT ON COLUMN groups.goal IS '그룹 목표 설명';
COMMENT ON COLUMN groups.rules IS '그룹 규칙 (줄바꿈으로 구분)';
