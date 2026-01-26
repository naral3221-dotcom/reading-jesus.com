-- =====================================================
-- Supabase Security Advisor WARNING 수정
-- 1. Function Search Path Mutable (11개 함수)
-- 2. RLS Policy Always True (16개 정책)
-- =====================================================

-- =====================================================
-- PART 1: Function Search Path 보안 수정
-- 모든 함수에 SET search_path = public 추가
-- =====================================================

-- 1. update_church_shorts_updated_at
CREATE OR REPLACE FUNCTION update_church_shorts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- 2. update_group_join_requests_updated_at
CREATE OR REPLACE FUNCTION update_group_join_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- 3. update_church_admins_updated_at
CREATE OR REPLACE FUNCTION update_church_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- 4. update_church_admin_last_login
CREATE OR REPLACE FUNCTION update_church_admin_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.church_admins
  SET last_login_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 5. update_follow_counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 팔로워 증가 (팔로우 당한 사람)
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
    -- 팔로잉 증가 (팔로우 한 사람)
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 팔로워 감소
    UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
    -- 팔로잉 감소
    UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 6. update_public_meditation_likes_count
CREATE OR REPLACE FUNCTION update_public_meditation_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.public_meditations SET likes_count = likes_count + 1 WHERE id = NEW.meditation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.public_meditations SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.meditation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 7. update_public_meditation_replies_count
CREATE OR REPLACE FUNCTION update_public_meditation_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.public_meditations SET replies_count = replies_count + 1 WHERE id = NEW.meditation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.public_meditations SET replies_count = GREATEST(0, replies_count - 1) WHERE id = OLD.meditation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 8. update_public_meditation_updated_at
CREATE OR REPLACE FUNCTION update_public_meditation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- 9. update_comment_likes_count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.public_meditation_comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.public_meditation_comments
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- 10. approve_group_join_request
CREATE OR REPLACE FUNCTION approve_group_join_request(
  p_request_id UUID,
  p_admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_request public.group_join_requests%ROWTYPE;
BEGIN
  -- 신청 정보 조회
  SELECT * INTO v_request FROM public.group_join_requests WHERE id = p_request_id;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  -- 관리자 권한 확인
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_request.group_id
    AND user_id = p_admin_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 신청 상태 업데이트
  UPDATE public.group_join_requests
  SET status = 'approved',
      reviewed_by = p_admin_id,
      reviewed_at = NOW()
  WHERE id = p_request_id;

  -- 멤버로 추가
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_request.group_id, v_request.user_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- 11. reject_group_join_request
CREATE OR REPLACE FUNCTION reject_group_join_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_request public.group_join_requests%ROWTYPE;
BEGIN
  -- 신청 정보 조회
  SELECT * INTO v_request FROM public.group_join_requests WHERE id = p_request_id;

  IF v_request.id IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  -- 관리자 권한 확인
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_request.group_id
    AND user_id = p_admin_id
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 신청 상태 업데이트
  UPDATE public.group_join_requests
  SET status = 'rejected',
      rejected_reason = p_reason,
      reviewed_by = p_admin_id,
      reviewed_at = NOW()
  WHERE id = p_request_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- =====================================================
-- PART 2: RLS Policy Always True 수정
-- 과도하게 허용적인 RLS 정책을 적절히 제한
-- =====================================================

-- =====================================================
-- 2.1 audit_logs - INSERT 정책 수정
-- 기존: WITH CHECK (true) → 변경: 실제 사용자 로깅
-- =====================================================
DROP POLICY IF EXISTS "audit_logs_insert_auth" ON audit_logs;
CREATE POLICY "audit_logs_insert_auth" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    -- 자신의 행동만 로깅 가능 (또는 user_id가 null인 시스템 로그)
    user_id IS NULL OR user_id = auth.uid()
  );

-- =====================================================
-- 2.2 church_notices - INSERT/UPDATE/DELETE 정책 수정
-- 기존: 누구나 가능 → 변경: 교회 관리자만 가능
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert notices" ON church_notices;
DROP POLICY IF EXISTS "Anyone can update notices" ON church_notices;
DROP POLICY IF EXISTS "Anyone can delete notices" ON church_notices;

-- 교회 관리자(church_admins)만 공지 작성/수정/삭제 가능
CREATE POLICY "Church admins can insert notices" ON church_notices
  FOR INSERT WITH CHECK (
    -- 해당 교회의 관리자인지 확인
    EXISTS (
      SELECT 1 FROM church_admins
      WHERE church_admins.church_id = church_notices.church_id
      AND church_admins.id = auth.uid()
      AND church_admins.is_active = true
    )
    OR
    -- 시스템 관리자도 가능
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Church admins can update notices" ON church_notices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM church_admins
      WHERE church_admins.church_id = church_notices.church_id
      AND church_admins.id = auth.uid()
      AND church_admins.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Church admins can delete notices" ON church_notices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM church_admins
      WHERE church_admins.church_id = church_notices.church_id
      AND church_admins.id = auth.uid()
      AND church_admins.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- =====================================================
-- 2.3 church_qt_comments - INSERT 정책 수정
-- 기존: WITH CHECK (true) → 변경: 인증 사용자 또는 게스트
-- 참고: CONSOLIDATED_V1.sql의 "QT댓글 작성" 정책
-- =====================================================
DROP POLICY IF EXISTS "QT댓글 작성" ON church_qt_comments;
DROP POLICY IF EXISTS "church_qt_comments_insert" ON church_qt_comments;

CREATE POLICY "church_qt_comments_insert" ON church_qt_comments
  FOR INSERT WITH CHECK (
    -- 로그인 사용자: user_id 필수
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- 게스트: user_id 없고 guest_name 필수
    (user_id IS NULL AND guest_name IS NOT NULL AND char_length(trim(guest_name)) > 0)
  );

-- =====================================================
-- 2.4 church_qt_post_replies - INSERT 정책 수정
-- 기존: WITH CHECK (true) → 변경: 인증 사용자 또는 게스트
-- =====================================================
DROP POLICY IF EXISTS "church_qt_post_replies_insert" ON church_qt_post_replies;

CREATE POLICY "church_qt_post_replies_insert" ON church_qt_post_replies
  FOR INSERT WITH CHECK (
    -- 로그인 사용자: user_id 필수
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- 게스트: device_id 필수
    (user_id IS NULL AND device_id IS NOT NULL)
  );

-- =====================================================
-- 2.5 church_qt_posts - INSERT 정책 수정
-- 기존: WITH CHECK (true) → 변경: 인증 사용자 또는 게스트
-- =====================================================
DROP POLICY IF EXISTS "QT글 작성" ON church_qt_posts;
DROP POLICY IF EXISTS "church_qt_posts_insert" ON church_qt_posts;

CREATE POLICY "church_qt_posts_insert" ON church_qt_posts
  FOR INSERT WITH CHECK (
    -- 로그인 사용자: user_id 필수
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- 게스트: user_id 없고 author_name 필수
    (user_id IS NULL AND author_name IS NOT NULL AND char_length(trim(author_name)) > 0)
  );

-- =====================================================
-- 2.6 church_shorts - INSERT/UPDATE/DELETE 정책 수정
-- 기존: 누구나 가능 → 변경: 교회 관리자만 가능
-- =====================================================
DROP POLICY IF EXISTS "church_shorts_insert" ON church_shorts;
DROP POLICY IF EXISTS "church_shorts_update" ON church_shorts;
DROP POLICY IF EXISTS "church_shorts_delete" ON church_shorts;

CREATE POLICY "church_shorts_insert" ON church_shorts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM church_admins
      WHERE church_admins.church_id = church_shorts.church_id
      AND church_admins.id = auth.uid()
      AND church_admins.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "church_shorts_update" ON church_shorts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM church_admins
      WHERE church_admins.church_id = church_shorts.church_id
      AND church_admins.id = auth.uid()
      AND church_admins.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "church_shorts_delete" ON church_shorts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM church_admins
      WHERE church_admins.church_id = church_shorts.church_id
      AND church_admins.id = auth.uid()
      AND church_admins.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- =====================================================
-- 2.7 churches - INSERT/UPDATE/DELETE 정책 수정
-- 기존: 인증 사용자 누구나 → 변경: 관리자만 가능
-- =====================================================
DROP POLICY IF EXISTS "churches_insert" ON churches;
DROP POLICY IF EXISTS "churches_update" ON churches;
DROP POLICY IF EXISTS "churches_delete" ON churches;

-- 교회 생성: 시스템 관리자만 가능
CREATE POLICY "churches_insert" ON churches
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- 교회 수정: 시스템 관리자 또는 해당 교회 관리자
CREATE POLICY "churches_update" ON churches
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM church_admins
      WHERE church_admins.church_id = churches.id
      AND church_admins.id = auth.uid()
      AND church_admins.is_active = true
    )
  );

-- 교회 삭제: 시스템 관리자만 가능
CREATE POLICY "churches_delete" ON churches
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- =====================================================
-- 2.8 guest_comment_replies - INSERT 정책 수정
-- 기존: WITH CHECK (true) → 변경: 식별자 필수
-- =====================================================
DROP POLICY IF EXISTS "guest_comment_replies_insert" ON guest_comment_replies;

CREATE POLICY "guest_comment_replies_insert" ON guest_comment_replies
  FOR INSERT WITH CHECK (
    -- 로그인 사용자: user_id 필수
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- 게스트: device_id 필수
    (user_id IS NULL AND device_id IS NOT NULL)
  );

-- =====================================================
-- 2.9 guest_comments - INSERT 정책 수정
-- 기존: WITH CHECK (true) → 변경: 교회의 token 검증은 앱에서 하지만
-- 최소한 guest_name과 content 필수
-- =====================================================
DROP POLICY IF EXISTS "guest_comments_insert" ON guest_comments;

CREATE POLICY "guest_comments_insert" ON guest_comments
  FOR INSERT WITH CHECK (
    -- guest_name과 content는 필수
    guest_name IS NOT NULL
    AND char_length(trim(guest_name)) > 0
    AND content IS NOT NULL
    AND char_length(trim(content)) > 0
  );

-- =====================================================
-- 2.10 notifications - INSERT 정책 수정
-- 기존: WITH CHECK (true) → 변경: 자신에게만 또는 시스템
-- =====================================================
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    -- 자신에게 보내는 알림이거나 시스템 관리자
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
  );

-- =====================================================
-- 코멘트 추가
-- =====================================================
COMMENT ON FUNCTION update_church_shorts_updated_at() IS 'church_shorts 테이블 updated_at 자동 갱신 (search_path 고정)';
COMMENT ON FUNCTION update_group_join_requests_updated_at() IS 'group_join_requests 테이블 updated_at 자동 갱신 (search_path 고정)';
COMMENT ON FUNCTION update_church_admins_updated_at() IS 'church_admins 테이블 updated_at 자동 갱신 (search_path 고정)';
COMMENT ON FUNCTION update_church_admin_last_login() IS '교회 관리자 마지막 로그인 시간 업데이트 (search_path 고정)';
COMMENT ON FUNCTION update_follow_counts() IS '팔로우/팔로잉 카운트 업데이트 (search_path 고정)';
COMMENT ON FUNCTION update_public_meditation_likes_count() IS '공개 묵상 좋아요 카운트 업데이트 (search_path 고정)';
COMMENT ON FUNCTION update_public_meditation_replies_count() IS '공개 묵상 댓글 카운트 업데이트 (search_path 고정)';
COMMENT ON FUNCTION update_public_meditation_updated_at() IS '공개 묵상 updated_at 자동 갱신 (search_path 고정)';
COMMENT ON FUNCTION update_comment_likes_count() IS '댓글 좋아요 카운트 업데이트 (search_path 고정)';
COMMENT ON FUNCTION approve_group_join_request(UUID, UUID) IS '그룹 가입 신청 승인 (search_path 고정)';
COMMENT ON FUNCTION reject_group_join_request(UUID, UUID, TEXT) IS '그룹 가입 신청 거절 (search_path 고정)';
