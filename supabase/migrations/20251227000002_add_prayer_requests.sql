-- 기도제목 테이블
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  answered_at TIMESTAMPTZ,
  support_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 함께 기도합니다 테이블
CREATE TABLE IF NOT EXISTS prayer_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prayer_id, user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_prayer_requests_group ON prayer_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_user ON prayer_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_created ON prayer_requests(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_support_prayer ON prayer_support(prayer_id);
CREATE INDEX IF NOT EXISTS idx_prayer_support_user ON prayer_support(user_id);

-- RLS 정책
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_support ENABLE ROW LEVEL SECURITY;

-- 기도제목 조회: 그룹 멤버만
CREATE POLICY "그룹 멤버만 기도제목 조회" ON prayer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = prayer_requests.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- 기도제목 작성: 본인만
CREATE POLICY "본인만 기도제목 작성" ON prayer_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 기도제목 수정: 본인만
CREATE POLICY "본인 기도제목만 수정" ON prayer_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- 기도제목 삭제: 본인만
CREATE POLICY "본인 기도제목만 삭제" ON prayer_requests FOR DELETE
  USING (auth.uid() = user_id);

-- 함께 기도 조회: 그룹 멤버만
CREATE POLICY "그룹 멤버만 함께 기도 조회" ON prayer_support FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prayer_requests pr
      JOIN group_members gm ON gm.group_id = pr.group_id
      WHERE pr.id = prayer_support.prayer_id
      AND gm.user_id = auth.uid()
    )
  );

-- 함께 기도 추가: 본인만
CREATE POLICY "본인만 함께 기도 추가" ON prayer_support FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 함께 기도 삭제: 본인만
CREATE POLICY "본인만 함께 기도 삭제" ON prayer_support FOR DELETE
  USING (auth.uid() = user_id);

-- support_count 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_prayer_support_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE prayer_requests SET support_count = support_count + 1 WHERE id = NEW.prayer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE prayer_requests SET support_count = support_count - 1 WHERE id = OLD.prayer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prayer_support_count ON prayer_support;
CREATE TRIGGER trigger_update_prayer_support_count
  AFTER INSERT OR DELETE ON prayer_support
  FOR EACH ROW EXECUTE FUNCTION update_prayer_support_count();

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_prayer_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prayer_requests_updated_at ON prayer_requests;
CREATE TRIGGER trigger_prayer_requests_updated_at
  BEFORE UPDATE ON prayer_requests
  FOR EACH ROW EXECUTE FUNCTION update_prayer_requests_updated_at();
