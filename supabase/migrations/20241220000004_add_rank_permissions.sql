-- Member Rank Permissions (멤버 등급 권한 시스템)
-- Phase 11-7: 등급별 권한 체계 정립

-- permissions 컬럼 추가 (JSONB)
ALTER TABLE member_ranks
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "can_read": true,
  "can_comment": true,
  "can_create_meeting": false,
  "can_pin_comment": false,
  "can_manage_members": false
}'::jsonb;

-- 권한 검증을 위한 체크 제약 조건
-- (선택적) 필수 필드 존재 여부 체크
ALTER TABLE member_ranks
ADD CONSTRAINT check_permissions_format CHECK (
  permissions ? 'can_read' AND
  permissions ? 'can_comment' AND
  permissions ? 'can_create_meeting' AND
  permissions ? 'can_pin_comment' AND
  permissions ? 'can_manage_members'
);

-- 기존 등급에 기본 권한 설정 (level 기반)
-- Level 1-2: 읽기만 + 댓글
-- Level 3-4: + 모임 생성
-- Level 5+: + 고정 권한

UPDATE member_ranks
SET permissions = CASE
  WHEN level >= 5 THEN '{
    "can_read": true,
    "can_comment": true,
    "can_create_meeting": true,
    "can_pin_comment": true,
    "can_manage_members": false
  }'::jsonb
  WHEN level >= 3 THEN '{
    "can_read": true,
    "can_comment": true,
    "can_create_meeting": true,
    "can_pin_comment": false,
    "can_manage_members": false
  }'::jsonb
  ELSE '{
    "can_read": true,
    "can_comment": true,
    "can_create_meeting": false,
    "can_pin_comment": false,
    "can_manage_members": false
  }'::jsonb
END
WHERE permissions IS NULL OR permissions = '{}'::jsonb;
