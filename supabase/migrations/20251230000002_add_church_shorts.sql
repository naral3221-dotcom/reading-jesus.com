-- 교회별 YouTube Shorts 관리 테이블
CREATE TABLE IF NOT EXISTS church_shorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  video_id TEXT NOT NULL, -- YouTube video ID 추출해서 저장
  title TEXT, -- 선택적 제목
  description TEXT, -- 선택적 설명
  thumbnail_url TEXT, -- 썸네일 URL (자동 생성 가능)
  display_order INT DEFAULT 0, -- 표시 순서
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_church_shorts_church_id ON church_shorts(church_id);
CREATE INDEX IF NOT EXISTS idx_church_shorts_active ON church_shorts(church_id, is_active, display_order);

-- RLS 정책
ALTER TABLE church_shorts ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 사용자가 활성화된 Shorts 조회 가능
CREATE POLICY "church_shorts_select" ON church_shorts
  FOR SELECT USING (true);

-- 생성: 모든 사용자 허용 (앱 레벨에서 admin_token으로 인증)
CREATE POLICY "church_shorts_insert" ON church_shorts
  FOR INSERT WITH CHECK (true);

-- 수정: 모든 사용자 허용 (앱 레벨에서 admin_token으로 인증)
CREATE POLICY "church_shorts_update" ON church_shorts
  FOR UPDATE USING (true);

-- 삭제: 모든 사용자 허용 (앱 레벨에서 admin_token으로 인증)
CREATE POLICY "church_shorts_delete" ON church_shorts
  FOR DELETE USING (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_church_shorts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_church_shorts_updated_at
  BEFORE UPDATE ON church_shorts
  FOR EACH ROW
  EXECUTE FUNCTION update_church_shorts_updated_at();
