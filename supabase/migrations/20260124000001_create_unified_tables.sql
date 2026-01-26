-- ============================================
-- 통합 묵상 & 읽음 체크 테이블 생성
-- 목적: 그룹/교회 데이터 통합으로 연동 지원
-- ============================================

-- ============================================
-- 1. unified_meditations (통합 묵상 테이블)
-- ============================================
CREATE TABLE IF NOT EXISTS unified_meditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 작성자 정보
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- 로그인 사용자 (게스트면 NULL)
  guest_token TEXT,                                            -- 게스트 토큰 (device_id)
  author_name TEXT NOT NULL,                                   -- 표시 이름

  -- 출처 정보
  source_type TEXT NOT NULL CHECK (source_type IN ('group', 'church')),
  source_id UUID NOT NULL,  -- group_id 또는 church_id

  -- 콘텐츠 타입
  content_type TEXT NOT NULL DEFAULT 'free' CHECK (content_type IN ('free', 'qt')),

  -- 공통 필드
  day_number INTEGER CHECK (day_number >= 1 AND day_number <= 365),
  content TEXT,              -- 자유 묵상 내용
  bible_range TEXT,          -- 성경 범위

  -- QT 전용 필드 (content_type = 'qt'일 때 사용)
  qt_date DATE,
  my_sentence TEXT,          -- 내 말로 한 문장
  meditation_answer TEXT,    -- 묵상 답변
  gratitude TEXT,            -- 감사와 적용
  my_prayer TEXT,            -- 나의 기도
  day_review TEXT,           -- 하루 점검

  -- 상태
  is_anonymous BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 마이그레이션 추적 (어느 테이블에서 왔는지)
  legacy_table TEXT,  -- 'comments', 'guest_comments', 'church_qt_posts'
  legacy_id UUID      -- 원본 레코드 ID
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_unified_meditations_source
  ON unified_meditations(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_unified_meditations_user
  ON unified_meditations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_unified_meditations_day
  ON unified_meditations(source_type, source_id, day_number);
CREATE INDEX IF NOT EXISTS idx_unified_meditations_created
  ON unified_meditations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_unified_meditations_content_type
  ON unified_meditations(source_type, source_id, content_type);
CREATE INDEX IF NOT EXISTS idx_unified_meditations_guest
  ON unified_meditations(guest_token) WHERE guest_token IS NOT NULL;

-- 코멘트
COMMENT ON TABLE unified_meditations IS '통합 묵상 테이블 (그룹 comments + 교회 guest_comments + church_qt_posts)';
COMMENT ON COLUMN unified_meditations.source_type IS '출처 타입: group 또는 church';
COMMENT ON COLUMN unified_meditations.source_id IS 'group_id 또는 church_id';
COMMENT ON COLUMN unified_meditations.content_type IS '콘텐츠 타입: free(자유묵상) 또는 qt(구조화된 QT)';

-- ============================================
-- 2. unified_reading_checks (통합 읽음 체크 테이블)
-- ============================================
CREATE TABLE IF NOT EXISTS unified_reading_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 (반드시 로그인 필요)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 출처 정보
  source_type TEXT NOT NULL CHECK (source_type IN ('group', 'church')),
  source_id UUID NOT NULL,  -- group_id 또는 church_id

  -- 체크 정보
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 365),
  checked_at TIMESTAMPTZ DEFAULT NOW(),

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 마이그레이션 추적
  legacy_table TEXT,  -- 'daily_checks' 또는 'church_reading_checks'
  legacy_id UUID,

  -- 유니크 제약 (같은 출처에서 같은 day는 한 번만)
  UNIQUE(user_id, source_type, source_id, day_number)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_unified_reading_checks_user
  ON unified_reading_checks(user_id, source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_unified_reading_checks_source
  ON unified_reading_checks(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_unified_reading_checks_day
  ON unified_reading_checks(source_type, source_id, day_number);

-- 코멘트
COMMENT ON TABLE unified_reading_checks IS '통합 읽음 체크 테이블 (그룹 daily_checks + 교회 church_reading_checks)';

-- ============================================
-- 3. unified_meditation_likes (통합 좋아요 테이블)
-- ============================================
CREATE TABLE IF NOT EXISTS unified_meditation_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meditation_id UUID NOT NULL REFERENCES unified_meditations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- 로그인 사용자
  guest_token TEXT,  -- 게스트 좋아요용
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 유니크 제약 (로그인 사용자)
  CONSTRAINT unique_user_like UNIQUE(meditation_id, user_id),
  -- 체크: user_id 또는 guest_token 중 하나는 있어야 함
  CONSTRAINT check_like_author CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL)
);

-- 게스트 좋아요용 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_unified_meditation_likes_guest
  ON unified_meditation_likes(meditation_id, guest_token)
  WHERE guest_token IS NOT NULL AND user_id IS NULL;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_unified_meditation_likes_meditation
  ON unified_meditation_likes(meditation_id);

-- ============================================
-- 4. unified_meditation_replies (통합 답글 테이블)
-- ============================================
CREATE TABLE IF NOT EXISTS unified_meditation_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meditation_id UUID NOT NULL REFERENCES unified_meditations(id) ON DELETE CASCADE,

  -- 작성자
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_token TEXT,
  author_name TEXT NOT NULL,

  -- 내용
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,

  -- 멘션
  mention_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mention_nickname TEXT,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,

  -- 마이그레이션 추적
  legacy_table TEXT,  -- 'comment_replies', 'guest_comment_replies'
  legacy_id UUID
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_unified_meditation_replies_meditation
  ON unified_meditation_replies(meditation_id);
CREATE INDEX IF NOT EXISTS idx_unified_meditation_replies_created
  ON unified_meditation_replies(meditation_id, created_at);

-- ============================================
-- 5. RLS 정책
-- ============================================

-- unified_meditations RLS
ALTER TABLE unified_meditations ENABLE ROW LEVEL SECURITY;

-- 조회: 모든 사용자 가능
CREATE POLICY "unified_meditations_select" ON unified_meditations
  FOR SELECT USING (true);

-- 삽입: 인증된 사용자 또는 게스트(guest_token)
CREATE POLICY "unified_meditations_insert" ON unified_meditations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR (user_id IS NULL AND guest_token IS NOT NULL)
  );

-- 수정: 본인만 (로그인 사용자 또는 같은 guest_token)
CREATE POLICY "unified_meditations_update" ON unified_meditations
  FOR UPDATE USING (
    user_id = auth.uid()
    -- 게스트 수정은 애플리케이션 레벨에서 guest_token 검증
  );

-- 삭제: 본인 또는 관리자
CREATE POLICY "unified_meditations_delete" ON unified_meditations
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = unified_meditations.source_id
        AND user_id = auth.uid()
        AND role = 'admin'
        AND unified_meditations.source_type = 'group'
    )
    OR EXISTS (
      SELECT 1 FROM church_admins
      WHERE church_id = unified_meditations.source_id
        AND user_id = auth.uid()
        AND unified_meditations.source_type = 'church'
    )
  );

-- unified_reading_checks RLS
ALTER TABLE unified_reading_checks ENABLE ROW LEVEL SECURITY;

-- 조회: 본인만
CREATE POLICY "unified_reading_checks_select" ON unified_reading_checks
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 삽입: 본인만
CREATE POLICY "unified_reading_checks_insert" ON unified_reading_checks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 삭제: 본인만
CREATE POLICY "unified_reading_checks_delete" ON unified_reading_checks
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- unified_meditation_likes RLS
ALTER TABLE unified_meditation_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unified_meditation_likes_select" ON unified_meditation_likes
  FOR SELECT USING (true);

CREATE POLICY "unified_meditation_likes_insert" ON unified_meditation_likes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR (user_id IS NULL AND guest_token IS NOT NULL)
  );

CREATE POLICY "unified_meditation_likes_delete" ON unified_meditation_likes
  FOR DELETE USING (
    user_id = auth.uid()
    OR guest_token IS NOT NULL  -- 게스트 삭제는 앱에서 검증
  );

-- unified_meditation_replies RLS
ALTER TABLE unified_meditation_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unified_meditation_replies_select" ON unified_meditation_replies
  FOR SELECT USING (true);

CREATE POLICY "unified_meditation_replies_insert" ON unified_meditation_replies
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR (user_id IS NULL AND guest_token IS NOT NULL)
  );

CREATE POLICY "unified_meditation_replies_update" ON unified_meditation_replies
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "unified_meditation_replies_delete" ON unified_meditation_replies
  FOR DELETE USING (
    user_id = auth.uid()
    -- 게스트 삭제는 앱에서 검증
  );

-- ============================================
-- 6. 헬퍼 함수
-- ============================================

-- 읽음 체크 토글 함수
CREATE OR REPLACE FUNCTION toggle_unified_reading_check(
  p_user_id UUID,
  p_source_type TEXT,
  p_source_id UUID,
  p_day_number INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM unified_reading_checks
    WHERE user_id = p_user_id
      AND source_type = p_source_type
      AND source_id = p_source_id
      AND day_number = p_day_number
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM unified_reading_checks
    WHERE user_id = p_user_id
      AND source_type = p_source_type
      AND source_id = p_source_id
      AND day_number = p_day_number;
    RETURN FALSE;
  ELSE
    INSERT INTO unified_reading_checks (user_id, source_type, source_id, day_number)
    VALUES (p_user_id, p_source_type, p_source_id, p_day_number);
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 스트릭 계산 함수
CREATE OR REPLACE FUNCTION calculate_unified_streak(
  p_user_id UUID,
  p_source_type TEXT,
  p_source_id UUID,
  p_current_day INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_day INTEGER;
BEGIN
  FOR v_day IN REVERSE p_current_day..1 LOOP
    IF EXISTS (
      SELECT 1 FROM unified_reading_checks
      WHERE user_id = p_user_id
        AND source_type = p_source_type
        AND source_id = p_source_id
        AND day_number = v_day
    ) THEN
      v_streak := v_streak + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 좋아요 토글 함수
CREATE OR REPLACE FUNCTION toggle_unified_meditation_like(
  p_meditation_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_guest_token TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- 로그인 사용자 좋아요
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM unified_meditation_likes
      WHERE meditation_id = p_meditation_id AND user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
      DELETE FROM unified_meditation_likes
      WHERE meditation_id = p_meditation_id AND user_id = p_user_id;

      UPDATE unified_meditations
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = p_meditation_id;

      RETURN FALSE;
    ELSE
      INSERT INTO unified_meditation_likes (meditation_id, user_id)
      VALUES (p_meditation_id, p_user_id);

      UPDATE unified_meditations
      SET likes_count = likes_count + 1
      WHERE id = p_meditation_id;

      RETURN TRUE;
    END IF;

  -- 게스트 좋아요
  ELSIF p_guest_token IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM unified_meditation_likes
      WHERE meditation_id = p_meditation_id
        AND guest_token = p_guest_token
        AND user_id IS NULL
    ) INTO v_exists;

    IF v_exists THEN
      DELETE FROM unified_meditation_likes
      WHERE meditation_id = p_meditation_id
        AND guest_token = p_guest_token
        AND user_id IS NULL;

      UPDATE unified_meditations
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = p_meditation_id;

      RETURN FALSE;
    ELSE
      INSERT INTO unified_meditation_likes (meditation_id, guest_token)
      VALUES (p_meditation_id, p_guest_token);

      UPDATE unified_meditations
      SET likes_count = likes_count + 1
      WHERE id = p_meditation_id;

      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- updated_at 자동 갱신 트리거
CREATE TRIGGER update_unified_meditations_updated_at
  BEFORE UPDATE ON unified_meditations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unified_meditation_replies_updated_at
  BEFORE UPDATE ON unified_meditation_replies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
