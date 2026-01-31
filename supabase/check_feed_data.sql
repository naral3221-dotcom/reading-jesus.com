-- =====================================================
-- 피드 데이터 확인 쿼리
-- Supabase Studio에서 실행하여 데이터 확인
-- =====================================================

-- 1. 테이블별 데이터 개수 확인
SELECT 'public_meditations' as table_name, COUNT(*) as count
FROM public_meditations
UNION ALL
SELECT 'church_qt_posts', COUNT(*)
FROM church_qt_posts
UNION ALL
SELECT 'comments (public)', COUNT(*)
FROM comments
WHERE is_public = true;

-- 2. public_meditations 최근 데이터 확인 (최대 5개)
SELECT
  id,
  user_id,
  title,
  LEFT(content, 50) as content_preview,
  is_anonymous,
  likes_count,
  replies_count,
  created_at
FROM public_meditations
ORDER BY created_at DESC
LIMIT 5;

-- 3. church_qt_posts 최근 데이터 확인 (최대 5개)
SELECT
  id,
  user_id,
  church_id,
  author_name,
  qt_date,
  day_number,
  LEFT(COALESCE(meditation_answer, my_sentence, gratitude, ''), 50) as content_preview,
  is_anonymous,
  likes_count,
  replies_count,
  created_at
FROM church_qt_posts
ORDER BY created_at DESC
LIMIT 5;

-- 4. comments (public) 최근 데이터 확인 (최대 5개)
SELECT
  c.id,
  c.user_id,
  c.group_id,
  LEFT(c.content, 50) as content_preview,
  c.is_public,
  c.likes_count,
  c.replies_count,
  c.created_at,
  g.name as group_name
FROM comments c
LEFT JOIN groups g ON c.group_id = g.id
WHERE c.is_public = true
ORDER BY c.created_at DESC
LIMIT 5;

-- 5. RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('public_meditations', 'church_qt_posts', 'comments')
ORDER BY tablename, policyname;

-- 6. 전체 공개 피드 시뮬레이션 (최근 20개)
WITH combined_feed AS (
  -- public_meditations
  SELECT
    id,
    'public_meditation' as type,
    user_id,
    created_at,
    likes_count,
    replies_count
  FROM public_meditations

  UNION ALL

  -- church_qt_posts
  SELECT
    id,
    'church_qt' as type,
    user_id,
    created_at,
    likes_count,
    replies_count
  FROM church_qt_posts

  UNION ALL

  -- comments (public)
  SELECT
    id,
    'group_comment' as type,
    user_id,
    created_at,
    likes_count,
    replies_count
  FROM comments
  WHERE is_public = true
)
SELECT
  type,
  id,
  user_id,
  created_at,
  likes_count,
  replies_count
FROM combined_feed
ORDER BY created_at DESC
LIMIT 20;
