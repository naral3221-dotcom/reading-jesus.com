-- =============================================
-- 관리자 RLS 정책 수정
-- 관리자(superadmin, admin)가 모든 테이블을 관리할 수 있도록 수정
-- =============================================

-- ==================== GROUPS ====================
DROP POLICY IF EXISTS "groups_delete" ON groups;
DROP POLICY IF EXISTS "groups_delete_policy" ON groups;
DROP POLICY IF EXISTS "Owners can delete groups" ON groups;

CREATE POLICY "groups_delete" ON groups
  FOR DELETE USING (
    -- 그룹 소유자
    created_by = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- UPDATE 정책도 수정
DROP POLICY IF EXISTS "groups_update" ON groups;
DROP POLICY IF EXISTS "groups_update_policy" ON groups;
DROP POLICY IF EXISTS "Owners can update groups" ON groups;

CREATE POLICY "groups_update" ON groups
  FOR UPDATE USING (
    -- 그룹 소유자
    created_by = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- ==================== GROUP_MEMBERS ====================
DROP POLICY IF EXISTS "group_members_select" ON group_members;
DROP POLICY IF EXISTS "group_members_select_policy" ON group_members;
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Anyone can view group members" ON group_members;

CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (
    -- 관리자는 모든 그룹 멤버 조회 가능
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
    OR
    -- 공개 그룹의 멤버 조회 가능
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.is_public = true
    )
    OR
    -- 자신이 속한 그룹의 멤버 조회 가능
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_members_insert" ON group_members;
DROP POLICY IF EXISTS "group_members_insert_policy" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;

CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (
    -- 자기 자신 가입
    auth.uid() = user_id
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자/관리자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_id
      AND groups.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "group_members_update" ON group_members;
DROP POLICY IF EXISTS "group_members_update_policy" ON group_members;
DROP POLICY IF EXISTS "Group admins can update members" ON group_members;

CREATE POLICY "group_members_update" ON group_members
  FOR UPDATE USING (
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
    OR
    -- 그룹 관리자
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "group_members_delete" ON group_members;
DROP POLICY IF EXISTS "group_members_delete_policy" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;

CREATE POLICY "group_members_delete" ON group_members
  FOR DELETE USING (
    -- 자기 자신 탈퇴
    auth.uid() = user_id
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.created_by = auth.uid()
    )
    OR
    -- 그룹 관리자
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- ==================== COMMENTS ====================
DROP POLICY IF EXISTS "comments_delete" ON comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (
    -- 본인 댓글
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = comments.group_id
      AND groups.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comments_update" ON comments;
DROP POLICY IF EXISTS "comments_update_policy" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

CREATE POLICY "comments_update" ON comments
  FOR UPDATE USING (
    -- 본인 댓글
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
  );

-- ==================== PROFILES ====================
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (
    -- 본인 프로필
    id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('superadmin', 'admin')
    )
  );

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (
    -- 시스템 관리자만 삭제 가능
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('superadmin', 'admin')
    )
  );

-- ==================== CHURCHES ====================
DROP POLICY IF EXISTS "churches_delete" ON churches;
DROP POLICY IF EXISTS "churches_delete_policy" ON churches;

CREATE POLICY "churches_delete" ON churches
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

DROP POLICY IF EXISTS "churches_update" ON churches;

CREATE POLICY "churches_update" ON churches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- ==================== GUEST_COMMENTS ====================
DROP POLICY IF EXISTS "guest_comments_delete" ON guest_comments;
DROP POLICY IF EXISTS "guest_comments_delete_policy" ON guest_comments;

CREATE POLICY "guest_comments_delete" ON guest_comments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "guest_comments_update" ON guest_comments;
DROP POLICY IF EXISTS "guest_comments_update_policy" ON guest_comments;

CREATE POLICY "guest_comments_update" ON guest_comments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
  );

-- ==================== NOTIFICATIONS ====================
DROP POLICY IF EXISTS "notifications_delete" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE USING (
    -- 본인 알림
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- ==================== QT_POSTS ====================
DROP POLICY IF EXISTS "qt_posts_delete" ON qt_posts;
DROP POLICY IF EXISTS "qt_posts_delete_policy" ON qt_posts;

CREATE POLICY "qt_posts_delete" ON qt_posts
  FOR DELETE USING (
    -- 본인 게시글
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "qt_posts_update" ON qt_posts;
DROP POLICY IF EXISTS "qt_posts_update_policy" ON qt_posts;

CREATE POLICY "qt_posts_update" ON qt_posts
  FOR UPDATE USING (
    -- 본인 게시글
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
  );

-- ==================== REPORTS ====================
DROP POLICY IF EXISTS "reports_select" ON reports;
DROP POLICY IF EXISTS "reports_select_policy" ON reports;

CREATE POLICY "reports_select" ON reports
  FOR SELECT USING (
    -- 본인 신고
    reporter_id = auth.uid()
    OR
    -- 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "reports_update" ON reports;
DROP POLICY IF EXISTS "reports_update_policy" ON reports;

CREATE POLICY "reports_update" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "reports_delete" ON reports;
DROP POLICY IF EXISTS "reports_delete_policy" ON reports;

CREATE POLICY "reports_delete" ON reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- ==================== DAILY_CHECKS ====================
DROP POLICY IF EXISTS "daily_checks_delete" ON daily_checks;
DROP POLICY IF EXISTS "daily_checks_delete_policy" ON daily_checks;

CREATE POLICY "daily_checks_delete" ON daily_checks
  FOR DELETE USING (
    -- 본인 체크
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- ==================== GROUP_NOTICES ====================
DROP POLICY IF EXISTS "group_notices_delete" ON group_notices;
DROP POLICY IF EXISTS "group_notices_delete_policy" ON group_notices;

CREATE POLICY "group_notices_delete" ON group_notices
  FOR DELETE USING (
    -- 작성자
    author_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_notices.group_id
      AND groups.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_notices_update" ON group_notices;
DROP POLICY IF EXISTS "group_notices_update_policy" ON group_notices;

CREATE POLICY "group_notices_update" ON group_notices
  FOR UPDATE USING (
    -- 작성자
    author_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_notices.group_id
      AND groups.created_by = auth.uid()
    )
  );

-- ==================== MEMBER_RANKS ====================
DROP POLICY IF EXISTS "member_ranks_delete" ON member_ranks;
DROP POLICY IF EXISTS "member_ranks_delete_policy" ON member_ranks;

CREATE POLICY "member_ranks_delete" ON member_ranks
  FOR DELETE USING (
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = member_ranks.group_id
      AND groups.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "member_ranks_update" ON member_ranks;
DROP POLICY IF EXISTS "member_ranks_update_policy" ON member_ranks;

CREATE POLICY "member_ranks_update" ON member_ranks
  FOR UPDATE USING (
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = member_ranks.group_id
      AND groups.created_by = auth.uid()
    )
  );

-- ==================== COMMENT_REPLIES ====================
DROP POLICY IF EXISTS "comment_replies_delete" ON comment_replies;
DROP POLICY IF EXISTS "comment_replies_delete_policy" ON comment_replies;

CREATE POLICY "comment_replies_delete" ON comment_replies
  FOR DELETE USING (
    -- 본인 답글
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
  );

DROP POLICY IF EXISTS "comment_replies_update" ON comment_replies;
DROP POLICY IF EXISTS "comment_replies_update_policy" ON comment_replies;

CREATE POLICY "comment_replies_update" ON comment_replies
  FOR UPDATE USING (
    -- 본인 답글
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin', 'moderator')
    )
  );

-- ==================== COMMENT_LIKES ====================
DROP POLICY IF EXISTS "comment_likes_delete" ON comment_likes;
DROP POLICY IF EXISTS "comment_likes_delete_policy" ON comment_likes;

CREATE POLICY "comment_likes_delete" ON comment_likes
  FOR DELETE USING (
    -- 본인 좋아요
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- ==================== DRAFT_POSTS ====================
DROP POLICY IF EXISTS "draft_posts_delete" ON draft_posts;
DROP POLICY IF EXISTS "draft_posts_delete_policy" ON draft_posts;

CREATE POLICY "draft_posts_delete" ON draft_posts
  FOR DELETE USING (
    -- 본인 임시저장
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- ==================== GROUP_MEETINGS ====================
DROP POLICY IF EXISTS "group_meetings_delete" ON group_meetings;
DROP POLICY IF EXISTS "group_meetings_delete_policy" ON group_meetings;

CREATE POLICY "group_meetings_delete" ON group_meetings
  FOR DELETE USING (
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_meetings.group_id
      AND groups.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "group_meetings_update" ON group_meetings;
DROP POLICY IF EXISTS "group_meetings_update_policy" ON group_meetings;

CREATE POLICY "group_meetings_update" ON group_meetings
  FOR UPDATE USING (
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
    OR
    -- 그룹 소유자
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_meetings.group_id
      AND groups.created_by = auth.uid()
    )
  );

-- ==================== PERSONAL 테이블 ====================
DROP POLICY IF EXISTS "personal_daily_checks_delete" ON personal_daily_checks;

CREATE POLICY "personal_daily_checks_delete" ON personal_daily_checks
  FOR DELETE USING (
    -- 본인
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

DROP POLICY IF EXISTS "personal_reading_projects_delete" ON personal_reading_projects;

CREATE POLICY "personal_reading_projects_delete" ON personal_reading_projects
  FOR DELETE USING (
    -- 본인
    user_id = auth.uid()
    OR
    -- 시스템 관리자
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('superadmin', 'admin')
    )
  );

-- =============================================
-- 그룹 삭제 시 연관 데이터 자동 삭제 (CASCADE) 설정
-- 기존 FK를 CASCADE로 변경
-- =============================================

-- group_members: 그룹 삭제 시 멤버십 자동 삭제
ALTER TABLE group_members
  DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE group_members
  ADD CONSTRAINT group_members_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- comments: 그룹 삭제 시 댓글 자동 삭제
ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_group_id_fkey;
ALTER TABLE comments
  ADD CONSTRAINT comments_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- daily_checks: 그룹 삭제 시 체크 기록 자동 삭제
ALTER TABLE daily_checks
  DROP CONSTRAINT IF EXISTS daily_checks_group_id_fkey;
ALTER TABLE daily_checks
  ADD CONSTRAINT daily_checks_group_id_fkey
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- comment_replies: 댓글 삭제 시 답글 자동 삭제
ALTER TABLE comment_replies
  DROP CONSTRAINT IF EXISTS comment_replies_comment_id_fkey;
ALTER TABLE comment_replies
  ADD CONSTRAINT comment_replies_comment_id_fkey
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;

-- comment_likes: 댓글 삭제 시 좋아요 자동 삭제
ALTER TABLE comment_likes
  DROP CONSTRAINT IF EXISTS comment_likes_comment_id_fkey;
ALTER TABLE comment_likes
  ADD CONSTRAINT comment_likes_comment_id_fkey
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE;
