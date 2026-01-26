-- Function Search Path Mutable 경고 수정
-- 모든 함수에 search_path를 명시적으로 설정하여 보안 강화
-- 존재하지 않는 함수는 자동으로 무시

DO $$
DECLARE
  func_list TEXT[] := ARRAY[
    -- 파라미터 없는 트리거 함수들
    'update_comment_replies_count()',
    'notify_on_meeting_created()',
    'update_member_ranks_updated_at()',
    'update_notification_settings_updated_at()',
    'notify_on_like()',
    'notify_on_reply()',
    'notify_on_group_notice()',
    'update_qt_posts_updated_at()',
    'update_updated_at_column()',
    'update_guest_comment_likes_count()',
    'check_meditation_badges()',
    'check_reply_badges()',
    'check_prayer_badges()',
    'check_prayer_support_badges()',
    'check_prayer_answered_badges()',
    'update_prayer_support_count()',
    'update_prayer_requests_updated_at()',
    'create_encouragement_notification()',
    'update_reading_plans_updated_at()',
    'update_likes_count()',
    'handle_new_user()',
    'notify_on_comment_like()',
    'notify_on_comment_reply()',
    -- 파라미터 있는 함수들
    'generate_church_code(character varying)',
    'generate_write_token(character varying)',
    'generate_admin_token(character varying)',
    'check_streak_badges(uuid, uuid, integer)',
    'check_plan_for_all_groups(uuid, uuid, integer)',
    'get_user_daily_readings(uuid, date)',
    'toggle_church_reading_check(uuid, uuid, integer)',
    'get_church_reading_checks(uuid, uuid)',
    'calculate_church_streak(uuid, uuid, integer)',
    'log_audit_event(character varying, character varying, uuid, jsonb, uuid)'
  ];
  func_name TEXT;
BEGIN
  FOREACH func_name IN ARRAY func_list
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%s SET search_path = public', func_name);
      RAISE NOTICE 'Updated search_path for: %', func_name;
    EXCEPTION
      WHEN undefined_function THEN
        RAISE NOTICE 'Function not found (skipping): %', func_name;
      WHEN OTHERS THEN
        RAISE NOTICE 'Error updating %: %', func_name, SQLERRM;
    END;
  END LOOP;
END $$;
