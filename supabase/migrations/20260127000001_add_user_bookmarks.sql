-- =============================================
-- 사용자 북마크 테이블 생성
-- =============================================

-- 북마크 테이블
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meditation_id UUID NOT NULL,
  meditation_source TEXT NOT NULL CHECK (meditation_source IN ('unified', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, meditation_id, meditation_source)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_meditation ON user_bookmarks(meditation_id, meditation_source);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_created_at ON user_bookmarks(created_at DESC);

-- RLS 정책
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- 자신의 북마크만 조회 가능
CREATE POLICY "Users can view own bookmarks"
ON user_bookmarks FOR SELECT
USING (auth.uid() = user_id);

-- 자신의 북마크만 추가 가능
CREATE POLICY "Users can insert own bookmarks"
ON user_bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 자신의 북마크만 삭제 가능
CREATE POLICY "Users can delete own bookmarks"
ON user_bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- 코멘트
COMMENT ON TABLE user_bookmarks IS '사용자 북마크 저장';
COMMENT ON COLUMN user_bookmarks.meditation_id IS '북마크한 묵상 ID';
COMMENT ON COLUMN user_bookmarks.meditation_source IS '묵상 출처 (unified: 통합 묵상, public: 공개 묵상)';
