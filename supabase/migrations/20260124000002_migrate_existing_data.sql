-- ============================================
-- 기존 데이터를 통합 테이블로 마이그레이션
-- 주의: 이 스크립트는 한 번만 실행해야 합니다
-- ============================================

-- ============================================
-- 1. comments → unified_meditations
-- (그룹 묵상)
-- ============================================
INSERT INTO unified_meditations (
  user_id,
  guest_token,
  author_name,
  source_type,
  source_id,
  content_type,
  day_number,
  content,
  is_anonymous,
  is_pinned,
  likes_count,
  replies_count,
  created_at,
  updated_at,
  legacy_table,
  legacy_id
)
SELECT
  c.user_id,
  NULL,  -- guest_token (그룹은 로그인 필수)
  COALESCE(p.nickname, '사용자'),
  'group',
  c.group_id,
  'free',
  c.day_number,
  c.content,
  COALESCE(c.is_anonymous, false),
  COALESCE(c.is_pinned, false),
  COALESCE(c.likes_count, 0),
  COALESCE((SELECT COUNT(*) FROM comment_replies WHERE comment_id = c.id), 0),
  c.created_at,
  c.updated_at,
  'comments',
  c.id
FROM comments c
LEFT JOIN profiles p ON p.id = c.user_id
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. guest_comments → unified_meditations
-- (교회 묵상)
-- ============================================
INSERT INTO unified_meditations (
  user_id,
  guest_token,
  author_name,
  source_type,
  source_id,
  content_type,
  day_number,
  content,
  bible_range,
  is_anonymous,
  is_pinned,
  likes_count,
  replies_count,
  created_at,
  updated_at,
  legacy_table,
  legacy_id
)
SELECT
  gc.linked_user_id,
  gc.device_id,  -- guest_token으로 사용
  gc.guest_name,
  'church',
  gc.church_id,
  'free',
  gc.day_number,
  gc.content,
  gc.bible_range,
  COALESCE(gc.is_anonymous, false),
  false,  -- guest_comments에는 is_pinned가 없음
  COALESCE(gc.likes_count, 0),
  COALESCE(gc.replies_count, 0),
  gc.created_at,
  gc.updated_at,
  'guest_comments',
  gc.id
FROM guest_comments gc
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. church_qt_posts → unified_meditations
-- (교회 QT 나눔)
-- ============================================
INSERT INTO unified_meditations (
  user_id,
  guest_token,
  author_name,
  source_type,
  source_id,
  content_type,
  day_number,
  qt_date,
  my_sentence,
  meditation_answer,
  gratitude,
  my_prayer,
  day_review,
  is_anonymous,
  is_pinned,
  likes_count,
  replies_count,
  created_at,
  updated_at,
  legacy_table,
  legacy_id
)
SELECT
  qt.user_id,
  NULL,  -- QT는 게스트 토큰 없음
  qt.author_name,
  'church',
  qt.church_id,
  'qt',
  qt.day_number,
  qt.qt_date::DATE,
  qt.my_sentence,
  qt.meditation_answer,
  qt.gratitude,
  qt.my_prayer,
  qt.day_review,
  COALESCE(qt.is_anonymous, false),
  false,
  COALESCE(qt.likes_count, 0),
  COALESCE(qt.replies_count, 0),
  qt.created_at,
  qt.created_at,  -- updated_at이 없으면 created_at 사용
  'church_qt_posts',
  qt.id
FROM church_qt_posts qt
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. daily_checks → unified_reading_checks
-- (그룹 읽음 체크)
-- ============================================
INSERT INTO unified_reading_checks (
  user_id,
  source_type,
  source_id,
  day_number,
  checked_at,
  created_at,
  legacy_table,
  legacy_id
)
SELECT
  dc.user_id,
  'group',
  dc.group_id,
  dc.day_number,
  dc.checked_at,
  dc.checked_at,  -- created_at 컬럼이 없으므로 checked_at 사용
  'daily_checks',
  dc.id
FROM daily_checks dc
WHERE dc.is_read = true  -- is_read가 true인 것만 이전
ON CONFLICT (user_id, source_type, source_id, day_number) DO NOTHING;

-- ============================================
-- 5. church_reading_checks → unified_reading_checks
-- (교회 읽음 체크)
-- ============================================
INSERT INTO unified_reading_checks (
  user_id,
  source_type,
  source_id,
  day_number,
  checked_at,
  created_at,
  legacy_table,
  legacy_id
)
SELECT
  crc.user_id,
  'church',
  crc.church_id,
  crc.day_number,
  crc.checked_at,
  crc.created_at,
  'church_reading_checks',
  crc.id
FROM church_reading_checks crc
ON CONFLICT (user_id, source_type, source_id, day_number) DO NOTHING;

-- ============================================
-- 6. comment_likes → unified_meditation_likes
-- (그룹 묵상 좋아요)
-- ============================================
INSERT INTO unified_meditation_likes (
  meditation_id,
  user_id,
  guest_token,
  created_at
)
SELECT
  um.id,
  cl.user_id,
  NULL,
  cl.created_at
FROM comment_likes cl
JOIN unified_meditations um
  ON um.legacy_id = cl.comment_id
  AND um.legacy_table = 'comments'
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. guest_comment_likes → unified_meditation_likes
-- (교회 묵상 좋아요 - 로그인 사용자)
-- ============================================
-- guest_comment_likes 테이블 구조 확인 필요
-- 현재 구조: comment_id, guest_id (또는 user_id)

-- 만약 user_id가 있는 경우
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_comment_likes' AND column_name = 'user_id'
  ) THEN
    INSERT INTO unified_meditation_likes (meditation_id, user_id, guest_token, created_at)
    SELECT
      um.id,
      gcl.user_id,
      NULL,
      gcl.created_at
    FROM guest_comment_likes gcl
    JOIN unified_meditations um
      ON um.legacy_id = gcl.comment_id
      AND um.legacy_table = 'guest_comments'
    WHERE gcl.user_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- guest_id로 좋아요한 경우 (게스트 좋아요)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guest_comment_likes' AND column_name = 'guest_id'
  ) THEN
    INSERT INTO unified_meditation_likes (meditation_id, user_id, guest_token, created_at)
    SELECT
      um.id,
      NULL,
      gcl.guest_id,
      gcl.created_at
    FROM guest_comment_likes gcl
    JOIN unified_meditations um
      ON um.legacy_id = gcl.comment_id
      AND um.legacy_table = 'guest_comments'
    WHERE gcl.guest_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 8. comment_replies → unified_meditation_replies
-- (그룹 묵상 답글)
-- ============================================
INSERT INTO unified_meditation_replies (
  meditation_id,
  user_id,
  guest_token,
  author_name,
  content,
  is_anonymous,
  created_at,
  updated_at,
  legacy_table,
  legacy_id
)
SELECT
  um.id,
  cr.user_id,
  NULL,
  COALESCE(p.nickname, '사용자'),
  cr.content,
  COALESCE(cr.is_anonymous, false),
  cr.created_at,
  cr.updated_at,
  'comment_replies',
  cr.id
FROM comment_replies cr
JOIN unified_meditations um
  ON um.legacy_id = cr.comment_id
  AND um.legacy_table = 'comments'
LEFT JOIN profiles p ON p.id = cr.user_id
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. guest_comment_replies → unified_meditation_replies
-- (교회 묵상 답글)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guest_comment_replies') THEN
    INSERT INTO unified_meditation_replies (
      meditation_id,
      user_id,
      guest_token,
      author_name,
      content,
      is_anonymous,
      created_at,
      legacy_table,
      legacy_id
    )
    SELECT
      um.id,
      gcr.user_id,
      gcr.device_id,
      gcr.guest_name,
      gcr.content,
      COALESCE(gcr.is_anonymous, false),
      gcr.created_at,
      'guest_comment_replies',
      gcr.id
    FROM guest_comment_replies gcr
    JOIN unified_meditations um
      ON um.legacy_id = gcr.comment_id
      AND um.legacy_table = 'guest_comments'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================
-- 10. 마이그레이션 검증 쿼리 (수동 실행용)
-- ============================================
-- 아래 쿼리들은 마이그레이션 후 데이터 검증용입니다.
-- 필요시 수동으로 실행하세요.

/*
-- 묵상 데이터 카운트 비교
SELECT 'comments' as source, COUNT(*) as count FROM comments
UNION ALL
SELECT 'guest_comments', COUNT(*) FROM guest_comments
UNION ALL
SELECT 'church_qt_posts', COUNT(*) FROM church_qt_posts
UNION ALL
SELECT 'unified_meditations', COUNT(*) FROM unified_meditations;

-- 읽음 체크 데이터 카운트 비교
SELECT 'daily_checks (is_read=true)', COUNT(*) FROM daily_checks WHERE is_read = true
UNION ALL
SELECT 'church_reading_checks', COUNT(*) FROM church_reading_checks
UNION ALL
SELECT 'unified_reading_checks', COUNT(*) FROM unified_reading_checks;

-- 좋아요 데이터 카운트 비교
SELECT 'comment_likes', COUNT(*) FROM comment_likes
UNION ALL
SELECT 'guest_comment_likes', COUNT(*) FROM guest_comment_likes
UNION ALL
SELECT 'unified_meditation_likes', COUNT(*) FROM unified_meditation_likes;

-- 답글 데이터 카운트 비교
SELECT 'comment_replies', COUNT(*) FROM comment_replies
UNION ALL
SELECT 'unified_meditation_replies', COUNT(*) FROM unified_meditation_replies;
*/
