-- 답글 테이블 RLS 정책 수정
-- 익명 사용자도 답글을 작성할 수 있도록 정책 변경

-- 기존 정책 삭제 (모든 가능한 정책명)
DROP POLICY IF EXISTS "guest_comment_replies_insert_auth" ON guest_comment_replies;
DROP POLICY IF EXISTS "guest_comment_replies_insert_anon" ON guest_comment_replies;
DROP POLICY IF EXISTS "guest_comment_replies_insert" ON guest_comment_replies;

-- 새로운 통합 정책: 누구나 답글 작성 가능
CREATE POLICY "guest_comment_replies_insert" ON guest_comment_replies
  FOR INSERT WITH CHECK (true);

-- church_qt_post_replies도 동일하게 수정
DROP POLICY IF EXISTS "church_qt_post_replies_insert_auth" ON church_qt_post_replies;
DROP POLICY IF EXISTS "church_qt_post_replies_insert_anon" ON church_qt_post_replies;
DROP POLICY IF EXISTS "church_qt_post_replies_insert" ON church_qt_post_replies;

-- 새로운 통합 정책: 누구나 답글 작성 가능
CREATE POLICY "church_qt_post_replies_insert" ON church_qt_post_replies
  FOR INSERT WITH CHECK (true);
