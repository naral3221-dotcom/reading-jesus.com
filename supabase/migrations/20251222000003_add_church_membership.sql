-- =============================================
-- 교회 교인 등록 시스템
-- profiles 테이블에 church_id 추가 (1인 1교회)
-- =============================================

-- 1. profiles 테이블에 교회 등록 필드 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS church_joined_at TIMESTAMPTZ;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_church ON profiles(church_id);

-- 3. RLS 정책: 본인만 교회 등록/탈퇴 가능
-- 기존 UPDATE 정책을 확인하고 church_id 업데이트 허용

-- profiles 테이블의 UPDATE 정책 확인 및 수정
-- (기존 정책이 본인 데이터만 수정 가능하면 추가 작업 불필요)

-- 4. guest_comments 테이블에 등록 교인 연동 필드 추가
ALTER TABLE guest_comments ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE guest_comments ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ;

-- 인덱스 (등록 교인 작성글 조회용)
CREATE INDEX IF NOT EXISTS idx_guest_comments_linked_user ON guest_comments(linked_user_id);

-- 5. 등록 교인 수 조회용 뷰 (선택)
CREATE OR REPLACE VIEW church_member_stats AS
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
