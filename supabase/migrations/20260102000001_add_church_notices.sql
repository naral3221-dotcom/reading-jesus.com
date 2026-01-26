-- =============================================
-- 교회 공지사항 시스템
-- 관리자가 교회 메인 페이지에 공지사항 게시
-- =============================================

-- 1. 교회 공지사항 테이블
CREATE TABLE IF NOT EXISTS church_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,

  -- 내용
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- 설정
  is_pinned BOOLEAN DEFAULT false,        -- 상단 고정
  is_active BOOLEAN DEFAULT true,         -- 활성/비활성
  starts_at TIMESTAMPTZ,                  -- 게시 시작일 (null = 즉시)
  ends_at TIMESTAMPTZ,                    -- 게시 종료일 (null = 무기한)

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_church_notices_church ON church_notices(church_id);
CREATE INDEX IF NOT EXISTS idx_church_notices_active ON church_notices(church_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_church_notices_pinned ON church_notices(church_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_church_notices_created ON church_notices(created_at DESC);

-- 3. RLS 정책
ALTER TABLE church_notices ENABLE ROW LEVEL SECURITY;

-- 활성 공지사항은 누구나 읽기 가능 (공개 페이지)
CREATE POLICY "Anyone can view active notices" ON church_notices
  FOR SELECT USING (is_active = true);

-- 작성/수정/삭제는 앱에서 admin_token 검증
-- RLS는 open하게 설정 (비로그인 관리자 지원)
CREATE POLICY "Anyone can insert notices" ON church_notices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update notices" ON church_notices
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete notices" ON church_notices
  FOR DELETE USING (true);

-- 4. updated_at 자동 갱신 트리거
CREATE TRIGGER update_church_notices_updated_at
  BEFORE UPDATE ON church_notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
