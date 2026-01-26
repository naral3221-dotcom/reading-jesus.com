-- =============================================
-- 그룹 댓글 RLS 정책 수정
-- 그룹 댓글(group_id가 있는 댓글)은 해당 그룹 멤버만 조회 가능하도록 변경
-- =============================================

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "Anyone can view public or own or group comments" ON comments;
DROP POLICY IF EXISTS "댓글 조회" ON comments;

-- 새 SELECT 정책 생성
-- 그룹 댓글은 is_public과 상관없이 그룹 멤버만 조회 가능
CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (
    -- 1. 그룹 댓글인 경우: 그룹 멤버만 조회 가능
    (
      group_id IS NOT NULL
      AND is_group_member(group_id, auth.uid())
    )
    OR
    -- 2. 그룹 댓글이 아닌 경우 (개인 묵상, 공개 묵상 등)
    (
      group_id IS NULL
      AND (
        -- 공개 댓글은 누구나 조회 가능
        is_public = true
        OR
        -- 본인 댓글
        user_id = auth.uid()
        OR
        -- 비회원도 공개 댓글 조회 가능 (QT 페이지 등)
        auth.uid() IS NULL
      )
    )
    OR
    -- 3. 본인 댓글은 항상 볼 수 있음 (어디에 작성했든)
    user_id = auth.uid()
  );

-- 안내: 이 마이그레이션은 Supabase 대시보드에서 직접 실행하거나
-- supabase db push 명령으로 적용할 수 있습니다.
