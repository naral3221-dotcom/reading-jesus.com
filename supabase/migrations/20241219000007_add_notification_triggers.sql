-- Notification Triggers (알림 자동 생성)
-- 좋아요, 댓글, 리플 시 알림 자동 생성

-- 1. 좋아요 알림 트리거
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  comment_author_id UUID;
  comment_day INTEGER;
  actor_nickname TEXT;
BEGIN
  -- 댓글 작성자 ID와 day_number 가져오기
  SELECT user_id, day_number INTO comment_author_id, comment_day
  FROM comments
  WHERE id = NEW.comment_id;

  -- 자기 자신의 댓글에 좋아요하면 알림 안 보냄
  IF comment_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- 좋아요한 사람 닉네임 가져오기
  SELECT nickname INTO actor_nickname
  FROM profiles
  WHERE id = NEW.user_id;

  -- 알림 생성
  INSERT INTO notifications (user_id, type, title, message, link, related_comment_id, actor_id)
  VALUES (
    comment_author_id,
    'like',
    COALESCE(actor_nickname, '누군가') || '님이 회원님의 묵상에 좋아요를 눌렀습니다',
    NULL,
    '/community?day=' || comment_day,
    NEW.comment_id,
    NEW.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 좋아요 트리거 생성
DROP TRIGGER IF EXISTS on_comment_like ON comment_likes;
CREATE TRIGGER on_comment_like
  AFTER INSERT ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_like();

-- 2. 댓글 리플 알림 트리거
CREATE OR REPLACE FUNCTION notify_on_reply()
RETURNS TRIGGER AS $$
DECLARE
  comment_author_id UUID;
  comment_day INTEGER;
  actor_nickname TEXT;
BEGIN
  -- 원 댓글 작성자 ID와 day_number 가져오기
  SELECT c.user_id, c.day_number INTO comment_author_id, comment_day
  FROM comments c
  WHERE c.id = NEW.comment_id;

  -- 자기 자신의 댓글에 리플하면 알림 안 보냄
  IF comment_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- 리플 작성자 닉네임 가져오기
  SELECT nickname INTO actor_nickname
  FROM profiles
  WHERE id = NEW.user_id;

  -- 알림 생성
  INSERT INTO notifications (user_id, type, title, message, link, related_comment_id, actor_id)
  VALUES (
    comment_author_id,
    'reply',
    COALESCE(actor_nickname, '누군가') || '님이 회원님의 묵상에 댓글을 남겼습니다',
    LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
    '/community?day=' || comment_day,
    NEW.comment_id,
    NEW.user_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 리플 트리거 생성
DROP TRIGGER IF EXISTS on_comment_reply ON comment_replies;
CREATE TRIGGER on_comment_reply
  AFTER INSERT ON comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_reply();

-- 설명:
-- notify_on_like: 좋아요 시 원 댓글 작성자에게 알림
-- notify_on_reply: 리플 시 원 댓글 작성자에게 알림
-- SECURITY DEFINER: 트리거 함수가 생성자 권한으로 실행되어 RLS 우회
