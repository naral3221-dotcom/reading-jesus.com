-- 모임 목적 필드 추가
-- Phase 9: 찬양, 성경공부, 기도, 친교, 선교/봉사, 기타

ALTER TABLE group_meetings
ADD COLUMN IF NOT EXISTS purpose TEXT DEFAULT NULL;

-- 체크 제약 조건 추가
ALTER TABLE group_meetings
ADD CONSTRAINT meeting_purpose_check
CHECK (purpose IS NULL OR purpose IN ('worship', 'bible_study', 'prayer', 'fellowship', 'mission', 'other'));

COMMENT ON COLUMN group_meetings.purpose IS '모임 목적: worship(찬양), bible_study(성경공부), prayer(기도), fellowship(친교), mission(선교/봉사), other(기타)';
