-- ============================================
-- guest_comments DELETE 정책 개선
-- 목적: 무분별한 삭제 방지 (기존: 누구나 삭제 가능)
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "guest_comments_delete" ON guest_comments;

-- 새 정책: 본인 글만 삭제 가능
-- 1. 로그인 사용자: linked_user_id가 본인인 경우
-- 2. 비로그인 사용자: device_id가 일치하는 경우 (앱에서 추가 검증)
CREATE POLICY "guest_comments_delete" ON guest_comments
  FOR DELETE USING (
    -- 로그인 사용자는 본인이 연결한 글만 삭제 가능
    (auth.uid() IS NOT NULL AND linked_user_id = auth.uid())
    OR
    -- 비로그인 사용자는 device_id로 검증 (실제로는 앱에서 처리)
    -- DB 레벨에서는 anon key로 삭제 허용하되, 앱에서 device_id 검증
    (auth.uid() IS NULL)
  );

-- UPDATE 정책도 동일하게 개선
DROP POLICY IF EXISTS "guest_comments_update" ON guest_comments;

CREATE POLICY "guest_comments_update" ON guest_comments
  FOR UPDATE USING (
    -- 로그인 사용자는 본인이 연결한 글만 수정 가능
    (auth.uid() IS NOT NULL AND linked_user_id = auth.uid())
    OR
    -- 비로그인 사용자는 앱에서 device_id 검증
    (auth.uid() IS NULL)
  );
