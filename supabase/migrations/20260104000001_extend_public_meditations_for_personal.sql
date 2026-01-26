-- =============================================================================
-- Migration: Extend Public Meditations for Personal Projects
-- Description: 개인 프로젝트의 QT/묵상 작성 기능을 위한 필드 확장
-- =============================================================================

-- 1. 개인 프로젝트 연결 필드
ALTER TABLE public_meditations ADD COLUMN IF NOT EXISTS
  project_id UUID REFERENCES personal_reading_projects(id) ON DELETE SET NULL;

-- 2. Day 번호 필드
ALTER TABLE public_meditations ADD COLUMN IF NOT EXISTS day_number INTEGER;

-- 3. 묵상 형식 필드 (free: 자유형식, qt: QT형식, memo: 간단메모)
ALTER TABLE public_meditations ADD COLUMN IF NOT EXISTS
  meditation_type TEXT DEFAULT 'free' CHECK (meditation_type IN ('free', 'qt', 'memo'));

-- 4. QT 형식 전용 필드들
ALTER TABLE public_meditations ADD COLUMN IF NOT EXISTS one_word TEXT;           -- 한 문장 요약
ALTER TABLE public_meditations ADD COLUMN IF NOT EXISTS meditation_question TEXT; -- 묵상 질문
ALTER TABLE public_meditations ADD COLUMN IF NOT EXISTS meditation_answer TEXT;   -- 묵상 답변
ALTER TABLE public_meditations ADD COLUMN IF NOT EXISTS gratitude TEXT;           -- 감사
ALTER TABLE public_meditations ADD COLUMN IF NOT EXISTS my_prayer TEXT;           -- 기도
ALTER TABLE public_meditations ADD COLUMN IF NOT EXISTS day_review TEXT;          -- 하루 점검

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_public_meditations_project
  ON public_meditations(project_id) WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_meditations_project_day
  ON public_meditations(project_id, day_number) WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_public_meditations_type
  ON public_meditations(meditation_type);

-- 6. 개인 프로젝트 묵상 조회를 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_public_meditations_user_project
  ON public_meditations(user_id, project_id, created_at DESC)
  WHERE project_id IS NOT NULL;

-- 7. 코멘트 추가
COMMENT ON COLUMN public_meditations.project_id IS '연결된 개인 프로젝트 ID (없으면 일반 공개 묵상)';
COMMENT ON COLUMN public_meditations.day_number IS '통독 일차 (1-365)';
COMMENT ON COLUMN public_meditations.meditation_type IS '묵상 형식: free(자유), qt(QT형식), memo(간단메모)';
COMMENT ON COLUMN public_meditations.one_word IS 'QT: 한 문장 요약';
COMMENT ON COLUMN public_meditations.meditation_question IS 'QT: 묵상 질문';
COMMENT ON COLUMN public_meditations.meditation_answer IS 'QT: 묵상 답변';
COMMENT ON COLUMN public_meditations.gratitude IS 'QT: 감사';
COMMENT ON COLUMN public_meditations.my_prayer IS 'QT: 기도';
COMMENT ON COLUMN public_meditations.day_review IS 'QT: 하루 점검';
