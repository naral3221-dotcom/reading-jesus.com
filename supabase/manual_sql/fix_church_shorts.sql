-- 기존 잘못된 정책 삭제 (있으면)
DROP POLICY IF EXISTS "church_shorts_select_active" ON church_shorts;
DROP POLICY IF EXISTS "church_shorts_insert_admin" ON church_shorts;
DROP POLICY IF EXISTS "church_shorts_update_admin" ON church_shorts;
DROP POLICY IF EXISTS "church_shorts_delete_admin" ON church_shorts;
DROP POLICY IF EXISTS "church_shorts_select" ON church_shorts;
DROP POLICY IF EXISTS "church_shorts_insert" ON church_shorts;
DROP POLICY IF EXISTS "church_shorts_update" ON church_shorts;
DROP POLICY IF EXISTS "church_shorts_delete" ON church_shorts;

-- 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS church_shorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_church_shorts_church_id ON church_shorts(church_id);
CREATE INDEX IF NOT EXISTS idx_church_shorts_active ON church_shorts(church_id, is_active, display_order);

-- RLS 활성화
ALTER TABLE church_shorts ENABLE ROW LEVEL SECURITY;

-- 새 RLS 정책 생성
CREATE POLICY "church_shorts_select" ON church_shorts
  FOR SELECT USING (true);

CREATE POLICY "church_shorts_insert" ON church_shorts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "church_shorts_update" ON church_shorts
  FOR UPDATE USING (true);

CREATE POLICY "church_shorts_delete" ON church_shorts
  FOR DELETE USING (true);

-- 트리거 함수 생성/갱신
CREATE OR REPLACE FUNCTION update_church_shorts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (있으면 무시)
DROP TRIGGER IF EXISTS trigger_church_shorts_updated_at ON church_shorts;
CREATE TRIGGER trigger_church_shorts_updated_at
  BEFORE UPDATE ON church_shorts
  FOR EACH ROW
  EXECUTE FUNCTION update_church_shorts_updated_at();
