-- ============================================
-- DB 상태 확인 쿼리
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================

-- 1. 모든 테이블 목록 확인
SELECT
  table_name,
  CASE
    WHEN table_name IN (
      'profiles', 'groups', 'group_members', 'daily_checks',
      'comments', 'comment_likes', 'comment_replies', 'comment_attachments',
      'group_notices', 'group_meetings', 'meeting_participants', 'member_ranks',
      'notifications', 'notification_settings',
      'churches', 'church_members', 'church_qt_posts', 'church_qt_comments', 'guest_comment_likes',
      'prayer_requests', 'prayer_support',
      'badge_definitions', 'user_badges',
      'personal_projects', 'project_daily_checks'
    ) THEN '✅ 필요'
    ELSE '❓ 기타'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY status DESC, table_name;

-- 2. 필수 테이블 존재 여부 체크
WITH required_tables AS (
  SELECT unnest(ARRAY[
    'profiles', 'groups', 'group_members', 'daily_checks',
    'comments', 'comment_likes', 'comment_replies', 'comment_attachments',
    'group_notices', 'group_meetings', 'meeting_participants', 'member_ranks',
    'notifications', 'notification_settings',
    'churches', 'church_members', 'church_qt_posts', 'church_qt_comments', 'guest_comment_likes',
    'prayer_requests', 'prayer_support',
    'badge_definitions', 'user_badges',
    'personal_projects', 'project_daily_checks'
  ]) as table_name
),
existing_tables AS (
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
)
SELECT
  r.table_name,
  CASE WHEN e.table_name IS NOT NULL THEN '✅ 존재' ELSE '❌ 없음' END as status
FROM required_tables r
LEFT JOIN existing_tables e ON r.table_name = e.table_name
ORDER BY status DESC, r.table_name;

-- 3. 각 테이블 row 수 확인
SELECT
  schemaname,
  relname as table_name,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 4. 배지 정의 확인 (badge_definitions 테이블이 있는 경우)
-- SELECT * FROM badge_definitions ORDER BY sort_order;

-- 5. RLS 정책 목록
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
