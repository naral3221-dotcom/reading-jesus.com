-- =============================================
-- 관리자 삭제 권한 정책 추가
-- 데이터베이스 관리 페이지에서 삭제가 안 되는 문제 해결
-- =============================================

-- 1. Groups 테이블 삭제 정책
-- 그룹 생성자 또는 시스템 관리자가 삭제 가능
DROP POLICY IF EXISTS "Groups can be deleted by creator or admin" ON groups;
CREATE POLICY "Groups can be deleted by creator or admin" ON groups
  FOR DELETE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 2. Group Members 테이블 삭제 정책
DROP POLICY IF EXISTS "Group members can be deleted by admin" ON group_members;
CREATE POLICY "Group members can be deleted by admin" ON group_members
  FOR DELETE USING (
    -- 본인이 탈퇴하거나
    user_id = auth.uid()
    -- 그룹 관리자가 삭제하거나
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
    -- 시스템 관리자가 삭제
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Comments 테이블 삭제 정책 (이미 있을 수 있음)
DROP POLICY IF EXISTS "Comments can be deleted by owner or admin" ON comments;
CREATE POLICY "Comments can be deleted by owner or admin" ON comments
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. Daily Checks 테이블 삭제 정책
DROP POLICY IF EXISTS "Daily checks can be deleted by owner or admin" ON daily_checks;
CREATE POLICY "Daily checks can be deleted by owner or admin" ON daily_checks
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 5. Comment Likes 테이블 삭제 정책
DROP POLICY IF EXISTS "Comment likes can be deleted by owner or admin" ON comment_likes;
CREATE POLICY "Comment likes can be deleted by owner or admin" ON comment_likes
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 6. Profiles 테이블 삭제 정책 (시스템 관리자만)
DROP POLICY IF EXISTS "Profiles can be deleted by admin" ON profiles;
CREATE POLICY "Profiles can be deleted by admin" ON profiles
  FOR DELETE USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- 7. Group Notices 테이블 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_notices') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Group notices can be deleted by admin" ON group_notices';
    EXECUTE 'CREATE POLICY "Group notices can be deleted by admin" ON group_notices
      FOR DELETE USING (
        author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )';
  END IF;
END $$;

-- 8. Group Meetings 테이블 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_meetings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Group meetings can be deleted by admin" ON group_meetings';
    EXECUTE 'CREATE POLICY "Group meetings can be deleted by admin" ON group_meetings
      FOR DELETE USING (
        host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )';
  END IF;
END $$;

-- 9. Member Ranks 테이블 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_ranks') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Member ranks can be deleted by admin" ON member_ranks';
    EXECUTE 'CREATE POLICY "Member ranks can be deleted by admin" ON member_ranks
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )';
  END IF;
END $$;

-- 10. QT Posts 테이블 (있는 경우) - author_id 사용
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qt_posts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "QT posts can be deleted by owner or admin" ON qt_posts';
    EXECUTE 'CREATE POLICY "QT posts can be deleted by owner or admin" ON qt_posts
      FOR DELETE USING (
        author_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )';
  END IF;
END $$;

-- 11. Draft Posts 테이블 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'draft_posts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Draft posts can be deleted by owner" ON draft_posts';
    EXECUTE 'CREATE POLICY "Draft posts can be deleted by owner" ON draft_posts
      FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )';
  END IF;
END $$;

-- 12. Notifications 테이블 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Notifications can be deleted by owner or admin" ON notifications';
    EXECUTE 'CREATE POLICY "Notifications can be deleted by owner or admin" ON notifications
      FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )';
  END IF;
END $$;

-- 13. Personal Reading Projects 테이블 (있는 경우) - user_id 사용
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personal_reading_projects') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Personal projects can be deleted by owner or admin" ON personal_reading_projects';
    EXECUTE 'CREATE POLICY "Personal projects can be deleted by owner or admin" ON personal_reading_projects
      FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )';
  END IF;
END $$;

-- 14. Comment Replies 테이블 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_replies') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Comment replies can be deleted by owner or admin" ON comment_replies';
    EXECUTE 'CREATE POLICY "Comment replies can be deleted by owner or admin" ON comment_replies
      FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )';
  END IF;
END $$;
