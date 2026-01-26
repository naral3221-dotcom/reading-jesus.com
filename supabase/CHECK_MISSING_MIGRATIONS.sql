-- ============================================
-- 누락된 마이그레이션 체크 쿼리 (통합 버전)
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================
-- 모든 결과가 하나의 테이블로 출력됩니다.

WITH
-- 1. 테이블 체크
required_tables AS (
  SELECT * FROM (VALUES
    ('profiles', '기본'), ('groups', '기본'), ('group_members', '기본'), ('daily_checks', '기본'),
    ('comments', '기본'), ('comment_likes', '기본'),
    ('comment_replies', '20241218000005_add_comment_replies.sql'),
    ('comment_attachments', '20241218000004_add_comment_attachments.sql'),
    ('group_notices', '20241219000003_add_group_notices.sql'),
    ('group_meetings', '20241219000002_add_group_meetings.sql'),
    ('meeting_participants', '20241219000002_add_group_meetings.sql'),
    ('member_ranks', '20241219000005_add_member_ranks.sql'),
    ('notifications', '20241219000008_add_notifications.sql'),
    ('notification_settings', '20241219000006_add_notification_settings.sql'),
    ('personal_reading_projects', '20241219000010_add_personal_projects.sql'),
    ('personal_daily_checks', '20241219000010_add_personal_projects.sql'),
    ('churches', '20241221000003_add_churches.sql'),
    ('church_members', '20251222000003_add_church_membership.sql'),
    ('church_qt_posts', '20251224000001_add_church_qt_posts.sql'),
    ('church_qt_comments', '20251224000001_add_church_qt_posts.sql'),
    ('guest_comment_likes', '20251225000001_add_guest_comment_likes.sql'),
    ('prayer_requests', '20251227000002_add_prayer_requests.sql'),
    ('prayer_support', '20251227000002_add_prayer_requests.sql'),
    ('badge_definitions', '20251227000001_add_badge_system.sql'),
    ('user_badges', '20251227000001_add_badge_system.sql'),
    ('encouragements', '20251227000003_add_encouragements.sql')
  ) AS t(table_name, migration_file)
),
existing_tables AS (
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
),
missing_tables AS (
  SELECT '❌ 테이블 없음' as issue_type, r.table_name as missing_item, r.migration_file as required_migration
  FROM required_tables r
  LEFT JOIN existing_tables e ON r.table_name = e.table_name
  WHERE e.table_name IS NULL
),

-- 2. 컬럼 체크
required_columns AS (
  SELECT * FROM (VALUES
    ('profiles', 'has_completed_onboarding', '20241219000009_add_onboarding_field.sql'),
    ('profiles', 'email', '20241221000005_add_profile_email.sql'),
    ('groups', 'bible_range_type', '20241220000001_add_bible_range.sql'),
    ('groups', 'bible_range_books', '20241220000001_add_bible_range.sql'),
    ('groups', 'schedule_mode', '20241221000008_add_schedule_mode.sql'),
    ('groups', 'total_days', '20241221000008_add_schedule_mode.sql'),
    ('comments', 'is_anonymous', '20241218000001_add_anonymous_comment.sql'),
    ('comments', 'is_pinned', '20241219000001_add_comment_pin.sql'),
    ('group_meetings', 'purpose', '20241220000002_add_meeting_purpose.sql'),
    ('group_members', 'rank_id', '20241219000005_add_member_ranks.sql'),
    ('churches', 'admin_token', '20251222000002_add_church_admin_token.sql')
  ) AS t(table_name, column_name, migration_file)
),
existing_columns AS (
  SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'
),
missing_columns AS (
  SELECT '⚠️ 컬럼 없음' as issue_type, r.table_name || '.' || r.column_name as missing_item, r.migration_file as required_migration
  FROM required_columns r
  LEFT JOIN existing_columns e ON r.table_name = e.table_name AND r.column_name = e.column_name
  WHERE e.column_name IS NULL
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = r.table_name)
),

-- 3. 트리거 체크
required_triggers AS (
  SELECT * FROM (VALUES
    ('trigger_update_likes_count', 'comment_likes', '기본'),
    ('trigger_update_prayer_support_count', 'prayer_support', '20251227000002_add_prayer_requests.sql'),
    ('trigger_check_meditation_badges', 'comments', '20251227000001_add_badge_system.sql'),
    ('trigger_check_reply_badges', 'comment_replies', '20251227000001_add_badge_system.sql'),
    ('trigger_check_prayer_badges', 'prayer_requests', '20251227000001_add_badge_system.sql'),
    ('trigger_check_prayer_support_badges', 'prayer_support', '20251227000001_add_badge_system.sql'),
    ('trigger_check_prayer_answered_badges', 'prayer_requests', '20251227000001_add_badge_system.sql')
  ) AS t(trigger_name, table_name, migration_file)
),
existing_triggers AS (
  SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public'
),
missing_triggers AS (
  SELECT '🔧 트리거 없음' as issue_type, r.trigger_name as missing_item, r.migration_file as required_migration
  FROM required_triggers r
  LEFT JOIN existing_triggers e ON r.trigger_name = e.trigger_name
  WHERE e.trigger_name IS NULL
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = r.table_name)
),

-- 4. 함수 체크
required_functions AS (
  SELECT * FROM (VALUES
    ('update_likes_count', '기본'),
    ('update_prayer_support_count', '20251227000002_add_prayer_requests.sql'),
    ('check_meditation_badges', '20251227000001_add_badge_system.sql'),
    ('check_reply_badges', '20251227000001_add_badge_system.sql'),
    ('check_prayer_badges', '20251227000001_add_badge_system.sql'),
    ('check_prayer_support_badges', '20251227000001_add_badge_system.sql'),
    ('check_prayer_answered_badges', '20251227000001_add_badge_system.sql'),
    ('check_streak_badges', '20251227000001_add_badge_system.sql')
  ) AS t(function_name, migration_file)
),
existing_functions AS (
  SELECT routine_name as function_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
),
missing_functions AS (
  SELECT '⚙️ 함수 없음' as issue_type, r.function_name as missing_item, r.migration_file as required_migration
  FROM required_functions r
  LEFT JOIN existing_functions e ON r.function_name = e.function_name
  WHERE e.function_name IS NULL
),

-- 모든 결과 합치기
all_issues AS (
  SELECT * FROM missing_tables
  UNION ALL SELECT * FROM missing_columns
  UNION ALL SELECT * FROM missing_triggers
  UNION ALL SELECT * FROM missing_functions
)

-- 최종 결과 출력
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM all_issues) = 0 THEN '✅ 모든 마이그레이션 완료!'
    ELSE issue_type || ': ' || missing_item
  END as status,
  CASE
    WHEN (SELECT COUNT(*) FROM all_issues) = 0 THEN '-'
    ELSE required_migration
  END as required_migration
FROM all_issues

UNION ALL

SELECT
  '📋 총 ' || (SELECT COUNT(*) FROM all_issues) || '개 누락' as status,
  TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') as required_migration
WHERE (SELECT COUNT(*) FROM all_issues) > 0

UNION ALL

SELECT '✅ 모든 마이그레이션 완료!' as status, TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI') as required_migration
WHERE (SELECT COUNT(*) FROM all_issues) = 0;
