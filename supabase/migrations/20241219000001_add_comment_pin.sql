-- Add pinned feature to comments
-- 관리자가 중요한 묵상을 상단에 고정할 수 있는 기능

ALTER TABLE comments
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES auth.users(id);

-- 인덱스 추가 (고정된 댓글 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_comments_pinned ON comments(group_id, day_number, is_pinned DESC, created_at DESC);

-- RLS 정책: 관리자만 고정/해제 가능
-- comments 테이블의 기존 UPDATE 정책을 수정하거나 추가 정책 필요 없음 (본인 댓글 수정 가능하므로)
-- 단, 클라이언트 측에서 is_pinned 변경은 관리자만 하도록 제어
