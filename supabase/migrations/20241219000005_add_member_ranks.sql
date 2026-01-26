-- Member Rank System (멤버 등급 시스템)
-- 그룹별로 커스텀 등급을 정의하고 멤버에게 할당

-- 등급 정의 테이블 (그룹별)
CREATE TABLE IF NOT EXISTS member_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6', -- Tailwind blue-500
  level INTEGER DEFAULT 0, -- 등급 레벨 (높을수록 상위 등급)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, name)
);

-- group_members 테이블에 rank_id 추가
ALTER TABLE group_members
ADD COLUMN IF NOT EXISTS rank_id UUID REFERENCES member_ranks(id) ON DELETE SET NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_member_ranks_group ON member_ranks(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_rank ON group_members(rank_id);

-- RLS 정책
ALTER TABLE member_ranks ENABLE ROW LEVEL SECURITY;

-- 그룹 멤버는 등급을 볼 수 있음
CREATE POLICY "Group members can view ranks"
  ON member_ranks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = member_ranks.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- 그룹 관리자는 등급을 생성/수정/삭제할 수 있음
CREATE POLICY "Group admins can manage ranks"
  ON member_ranks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = member_ranks.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = member_ranks.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_member_ranks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_member_ranks_updated ON member_ranks;
CREATE TRIGGER on_member_ranks_updated
  BEFORE UPDATE ON member_ranks
  FOR EACH ROW
  EXECUTE FUNCTION update_member_ranks_updated_at();

-- 기본 등급 예시 (선택사항, 주석 처리)
-- INSERT INTO member_ranks (group_id, name, description, color, level) VALUES
-- ('그룹ID', '새싹', '새로 시작하는 멤버', '#22c55e', 1),
-- ('그룹ID', '열매', '꾸준히 참여하는 멤버', '#f59e0b', 2),
-- ('그룹ID', '나무', '모범적인 멤버', '#8b5cf6', 3);
