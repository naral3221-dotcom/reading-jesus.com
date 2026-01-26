-- 교회-그룹 통합 시스템 마이그레이션
-- 그룹에 교회 연결 기능 추가

-- 1. groups 테이블에 church_id 컬럼 추가
ALTER TABLE groups ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id) ON DELETE SET NULL;

-- 2. 교회 공식 그룹 여부 플래그 추가
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_church_official BOOLEAN DEFAULT false;

-- 3. church_id 인덱스 생성 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_groups_church_id ON groups(church_id);

-- 4. 코멘트 추가
COMMENT ON COLUMN groups.church_id IS '소속 교회 ID (NULL이면 개인 그룹)';
COMMENT ON COLUMN groups.is_church_official IS '교회 공식 그룹 여부';

-- 참고: 교회 관리자 권한은 토큰 기반(admin_token)으로 인증하므로
-- RLS 정책으로는 구현하지 않고, 클라이언트 측에서 토큰 검증 후 처리합니다.
