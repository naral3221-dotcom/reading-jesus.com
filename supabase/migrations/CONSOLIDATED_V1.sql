-- ============================================
-- 리딩지저스 통합 마이그레이션 v1.0
-- 생성일: 2024-12-27
-- ============================================
--
-- 이 파일은 모든 마이그레이션을 하나로 통합한 버전입니다.
-- 새 Supabase 프로젝트 또는 초기화 시 이 파일 하나만 실행하면 됩니다.
--
-- 섹션:
--   1. 기본 테이블 (profiles, groups, 등)
--   2. 그룹 기능 (멤버, 모임, 공지)
--   3. 묵상/댓글 시스템
--   4. 알림 시스템
--   5. 교회 시스템
--   6. 기도제목/배지 시스템
--   7. 스토리지 정책
--   8. 트리거 및 함수
-- ============================================

-- ============================================
-- 1. 기본 테이블
-- ============================================

-- profiles (사용자 프로필)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT,
  email TEXT,
  has_completed_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "프로필 조회" ON profiles;
CREATE POLICY "프로필 조회" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "본인 프로필 수정" ON profiles;
CREATE POLICY "본인 프로필 수정" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "본인 프로필 생성" ON profiles;
CREATE POLICY "본인 프로필 생성" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- groups (그룹)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  bible_range_type TEXT DEFAULT 'full' CHECK (bible_range_type IN ('full', 'old', 'new', 'custom')),
  bible_range_books TEXT[],
  schedule_mode TEXT DEFAULT 'day_count' CHECK (schedule_mode IN ('day_count', 'date_based')),
  total_days INTEGER DEFAULT 365,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "그룹 조회" ON groups;
CREATE POLICY "그룹 조회" ON groups FOR SELECT USING (true);
DROP POLICY IF EXISTS "그룹 생성" ON groups;
CREATE POLICY "그룹 생성" ON groups FOR INSERT WITH CHECK (auth.uid() = created_by);
DROP POLICY IF EXISTS "그룹 수정" ON groups;
CREATE POLICY "그룹 수정" ON groups FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "그룹 삭제" ON groups;
CREATE POLICY "그룹 삭제" ON groups FOR DELETE USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin')
);

-- member_ranks (멤버 등급)
CREATE TABLE IF NOT EXISTS member_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  color TEXT DEFAULT '#6B7280',
  icon TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE member_ranks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "등급 조회" ON member_ranks;
CREATE POLICY "등급 조회" ON member_ranks FOR SELECT USING (true);
DROP POLICY IF EXISTS "관리자만 등급 관리" ON member_ranks;
CREATE POLICY "관리자만 등급 관리" ON member_ranks FOR ALL USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = member_ranks.group_id AND user_id = auth.uid() AND role = 'admin')
);

-- group_members (그룹 멤버)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  rank_id UUID REFERENCES member_ranks(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "멤버 조회" ON group_members;
CREATE POLICY "멤버 조회" ON group_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "멤버 참여" ON group_members;
CREATE POLICY "멤버 참여" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "멤버 탈퇴" ON group_members;
CREATE POLICY "멤버 탈퇴" ON group_members FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);
DROP POLICY IF EXISTS "관리자 멤버 수정" ON group_members;
CREATE POLICY "관리자 멤버 수정" ON group_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);

-- daily_checks (일일 체크)
CREATE TABLE IF NOT EXISTS daily_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  is_read BOOLEAN DEFAULT true,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_id, day_number)
);

ALTER TABLE daily_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "본인 체크 조회" ON daily_checks;
CREATE POLICY "본인 체크 조회" ON daily_checks FOR SELECT USING (true);
DROP POLICY IF EXISTS "본인 체크 생성" ON daily_checks;
CREATE POLICY "본인 체크 생성" ON daily_checks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "본인 체크 삭제" ON daily_checks;
CREATE POLICY "본인 체크 삭제" ON daily_checks FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. 그룹 기능
-- ============================================

-- group_notices (그룹 공지)
CREATE TABLE IF NOT EXISTS group_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE group_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "공지 조회" ON group_notices;
CREATE POLICY "공지 조회" ON group_notices FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_notices.group_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "관리자 공지 관리" ON group_notices;
CREATE POLICY "관리자 공지 관리" ON group_notices FOR ALL USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_notices.group_id AND user_id = auth.uid() AND role = 'admin')
);

-- group_meetings (그룹 모임)
CREATE TABLE IF NOT EXISTS group_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  meeting_type TEXT DEFAULT 'offline' CHECK (meeting_type IN ('online', 'offline')),
  location TEXT,
  meeting_link TEXT,
  purpose TEXT CHECK (purpose IN ('worship', 'bible_study', 'prayer', 'fellowship', 'mission', 'other')),
  max_participants INTEGER,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE group_meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "모임 조회" ON group_meetings;
CREATE POLICY "모임 조회" ON group_meetings FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_meetings.group_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "모임 생성" ON group_meetings;
CREATE POLICY "모임 생성" ON group_meetings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = group_meetings.group_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "모임 수정" ON group_meetings;
CREATE POLICY "모임 수정" ON group_meetings FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "모임 삭제" ON group_meetings;
CREATE POLICY "모임 삭제" ON group_meetings FOR DELETE USING (auth.uid() = created_by);

-- meeting_participants (모임 참가자)
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, user_id)
);

ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "참가자 조회" ON meeting_participants;
CREATE POLICY "참가자 조회" ON meeting_participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "참가 신청" ON meeting_participants;
CREATE POLICY "참가 신청" ON meeting_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "참가 취소" ON meeting_participants;
CREATE POLICY "참가 취소" ON meeting_participants FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. 묵상/댓글 시스템
-- ============================================

-- comments (묵상)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "댓글 조회" ON comments;
CREATE POLICY "댓글 조회" ON comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "댓글 작성" ON comments;
CREATE POLICY "댓글 작성" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "본인 댓글 수정" ON comments;
CREATE POLICY "본인 댓글 수정" ON comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "댓글 삭제" ON comments;
CREATE POLICY "댓글 삭제" ON comments FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM group_members WHERE group_id = comments.group_id AND user_id = auth.uid() AND role = 'admin')
);

-- comment_likes (좋아요)
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "좋아요 조회" ON comment_likes;
CREATE POLICY "좋아요 조회" ON comment_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "좋아요 생성" ON comment_likes;
CREATE POLICY "좋아요 생성" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "좋아요 삭제" ON comment_likes;
CREATE POLICY "좋아요 삭제" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- comment_replies (댓글 답글)
CREATE TABLE IF NOT EXISTS comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "답글 조회" ON comment_replies;
CREATE POLICY "답글 조회" ON comment_replies FOR SELECT USING (true);
DROP POLICY IF EXISTS "답글 작성" ON comment_replies;
CREATE POLICY "답글 작성" ON comment_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "본인 답글 삭제" ON comment_replies;
CREATE POLICY "본인 답글 삭제" ON comment_replies FOR DELETE USING (auth.uid() = user_id);

-- comment_attachments (첨부파일)
CREATE TABLE IF NOT EXISTS comment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comment_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "첨부파일 조회" ON comment_attachments;
CREATE POLICY "첨부파일 조회" ON comment_attachments FOR SELECT USING (true);
DROP POLICY IF EXISTS "첨부파일 생성" ON comment_attachments;
CREATE POLICY "첨부파일 생성" ON comment_attachments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM comments WHERE id = comment_attachments.comment_id AND user_id = auth.uid())
);

-- ============================================
-- 4. 알림 시스템
-- ============================================

-- notifications (알림)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "본인 알림 조회" ON notifications;
CREATE POLICY "본인 알림 조회" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "본인 알림 수정" ON notifications;
CREATE POLICY "본인 알림 수정" ON notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "본인 알림 삭제" ON notifications;
CREATE POLICY "본인 알림 삭제" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- notification_settings (알림 설정)
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  notify_time TIME DEFAULT '07:00',
  notify_days TEXT[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  custom_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "본인 알림설정 조회" ON notification_settings;
CREATE POLICY "본인 알림설정 조회" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "본인 알림설정 생성" ON notification_settings;
CREATE POLICY "본인 알림설정 생성" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "본인 알림설정 수정" ON notification_settings;
CREATE POLICY "본인 알림설정 수정" ON notification_settings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 5. 교회 시스템
-- ============================================

-- churches (교회)
CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  admin_token TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 16),
  address TEXT,
  phone TEXT,
  description TEXT,
  logo_url TEXT,
  theme_color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "교회 조회" ON churches;
CREATE POLICY "교회 조회" ON churches FOR SELECT USING (true);
DROP POLICY IF EXISTS "교회 생성" ON churches;
CREATE POLICY "교회 생성" ON churches FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "교회 수정" ON churches;
CREATE POLICY "교회 수정" ON churches FOR UPDATE USING (true);

-- church_members (교회 교인)
CREATE TABLE IF NOT EXISTS church_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, user_id)
);

ALTER TABLE church_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "교인 조회" ON church_members;
CREATE POLICY "교인 조회" ON church_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "교인 참여" ON church_members;
CREATE POLICY "교인 참여" ON church_members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "교인 탈퇴" ON church_members;
CREATE POLICY "교인 탈퇴" ON church_members FOR DELETE USING (auth.uid() = user_id);

-- church_qt_posts (교회 QT 게시물)
CREATE TABLE IF NOT EXISTS church_qt_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE church_qt_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "QT글 조회" ON church_qt_posts;
CREATE POLICY "QT글 조회" ON church_qt_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "QT글 작성" ON church_qt_posts;
CREATE POLICY "QT글 작성" ON church_qt_posts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "QT글 삭제" ON church_qt_posts;
CREATE POLICY "QT글 삭제" ON church_qt_posts FOR DELETE USING (auth.uid() = user_id);

-- church_qt_comments (교회 QT 댓글)
CREATE TABLE IF NOT EXISTS church_qt_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES church_qt_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  guest_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE church_qt_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "QT댓글 조회" ON church_qt_comments;
CREATE POLICY "QT댓글 조회" ON church_qt_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "QT댓글 작성" ON church_qt_comments;
CREATE POLICY "QT댓글 작성" ON church_qt_comments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "QT댓글 삭제" ON church_qt_comments;
CREATE POLICY "QT댓글 삭제" ON church_qt_comments FOR DELETE USING (auth.uid() = user_id);

-- guest_comment_likes (게스트 좋아요)
CREATE TABLE IF NOT EXISTS guest_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES church_qt_comments(id) ON DELETE CASCADE,
  guest_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, guest_id)
);

ALTER TABLE guest_comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "게스트좋아요 조회" ON guest_comment_likes;
CREATE POLICY "게스트좋아요 조회" ON guest_comment_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "게스트좋아요 생성" ON guest_comment_likes;
CREATE POLICY "게스트좋아요 생성" ON guest_comment_likes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "게스트좋아요 삭제" ON guest_comment_likes;
CREATE POLICY "게스트좋아요 삭제" ON guest_comment_likes FOR DELETE USING (true);

-- ============================================
-- 6. 기도제목/배지 시스템
-- ============================================

-- prayer_requests (기도제목)
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  answered_at TIMESTAMPTZ,
  support_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "기도제목 조회" ON prayer_requests;
CREATE POLICY "기도제목 조회" ON prayer_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = prayer_requests.group_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "기도제목 작성" ON prayer_requests;
CREATE POLICY "기도제목 작성" ON prayer_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "기도제목 수정" ON prayer_requests;
CREATE POLICY "기도제목 수정" ON prayer_requests FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "기도제목 삭제" ON prayer_requests;
CREATE POLICY "기도제목 삭제" ON prayer_requests FOR DELETE USING (auth.uid() = user_id);

-- prayer_support (함께 기도)
CREATE TABLE IF NOT EXISTS prayer_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prayer_id, user_id)
);

ALTER TABLE prayer_support ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "함께기도 조회" ON prayer_support;
CREATE POLICY "함께기도 조회" ON prayer_support FOR SELECT USING (true);
DROP POLICY IF EXISTS "함께기도 생성" ON prayer_support;
CREATE POLICY "함께기도 생성" ON prayer_support FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "함께기도 삭제" ON prayer_support;
CREATE POLICY "함께기도 삭제" ON prayer_support FOR DELETE USING (auth.uid() = user_id);

-- badge_definitions (배지 정의)
CREATE TABLE IF NOT EXISTS badge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) NOT NULL,
  category VARCHAR(50) NOT NULL,
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "배지정의 조회" ON badge_definitions;
CREATE POLICY "배지정의 조회" ON badge_definitions FOR SELECT USING (true);

-- user_badges (사용자 배지)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  is_notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, badge_id, group_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "본인배지 조회" ON user_badges;
CREATE POLICY "본인배지 조회" ON user_badges FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "그룹멤버배지 조회" ON user_badges;
CREATE POLICY "그룹멤버배지 조회" ON user_badges FOR SELECT USING (
  group_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM group_members WHERE group_id = user_badges.group_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "배지알림 업데이트" ON user_badges;
CREATE POLICY "배지알림 업데이트" ON user_badges FOR UPDATE USING (auth.uid() = user_id);

-- 기본 배지 데이터
INSERT INTO badge_definitions (code, name, description, icon, category, requirement_type, requirement_value, sort_order) VALUES
('first_meditation', '첫 묵상', '첫 번째 묵상 나눔을 작성했습니다', '📝', 'meditation', 'meditation_count', 1, 1),
('meditation_10', '묵상 10회', '묵상 나눔 10회 달성', '📖', 'meditation', 'meditation_count', 10, 2),
('meditation_50', '묵상 50회', '묵상 나눔 50회 달성', '📚', 'meditation', 'meditation_count', 50, 3),
('meditation_100', '묵상 마스터', '묵상 나눔 100회 달성', '🎓', 'meditation', 'meditation_count', 100, 4),
('streak_7', '7일 연속', '7일 연속 읽기 달성', '🔥', 'streak', 'streak_days', 7, 10),
('streak_30', '30일 연속', '30일 연속 읽기 달성', '💪', 'streak', 'streak_days', 30, 11),
('streak_100', '100일 연속', '100일 연속 읽기 달성', '🏆', 'streak', 'streak_days', 100, 12),
('streak_365', '1년 완주', '365일 연속 읽기 달성', '👑', 'streak', 'streak_days', 365, 13),
('first_prayer', '첫 기도', '첫 번째 기도제목을 나눴습니다', '🙏', 'prayer', 'prayer_count', 1, 20),
('prayer_supporter', '기도 서포터', '10번 함께 기도했습니다', '🤝', 'prayer', 'prayer_support_count', 10, 21),
('prayer_answered', '응답의 증인', '기도 응답을 받았습니다', '✨', 'prayer', 'prayer_answered_count', 1, 22),
('first_reply', '첫 댓글', '첫 번째 댓글을 남겼습니다', '💬', 'social', 'reply_count', 1, 30),
('active_member', '활발한 멤버', '댓글 50회 달성', '🌟', 'social', 'reply_count', 50, 31)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 7. 개인 프로젝트
-- ============================================

CREATE TABLE IF NOT EXISTS personal_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_days INTEGER DEFAULT 365,
  bible_range_type TEXT DEFAULT 'full',
  bible_range_books TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE personal_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "본인 프로젝트 조회" ON personal_projects;
CREATE POLICY "본인 프로젝트 조회" ON personal_projects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "본인 프로젝트 생성" ON personal_projects;
CREATE POLICY "본인 프로젝트 생성" ON personal_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "본인 프로젝트 수정" ON personal_projects;
CREATE POLICY "본인 프로젝트 수정" ON personal_projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "본인 프로젝트 삭제" ON personal_projects;
CREATE POLICY "본인 프로젝트 삭제" ON personal_projects FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS project_daily_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES personal_projects(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  is_read BOOLEAN DEFAULT true,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, day_number)
);

ALTER TABLE project_daily_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "본인 체크 조회" ON project_daily_checks;
CREATE POLICY "본인 체크 조회" ON project_daily_checks FOR SELECT USING (
  EXISTS (SELECT 1 FROM personal_projects WHERE id = project_daily_checks.project_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "본인 체크 생성" ON project_daily_checks;
CREATE POLICY "본인 체크 생성" ON project_daily_checks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM personal_projects WHERE id = project_daily_checks.project_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "본인 체크 삭제" ON project_daily_checks;
CREATE POLICY "본인 체크 삭제" ON project_daily_checks FOR DELETE USING (
  EXISTS (SELECT 1 FROM personal_projects WHERE id = project_daily_checks.project_id AND user_id = auth.uid())
);

-- ============================================
-- 8. 인덱스
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checks_user_group ON daily_checks(user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_comments_group_day ON comments(group_id, day_number);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_church_qt_posts_church ON church_qt_posts(church_id);
CREATE INDEX IF NOT EXISTS idx_church_qt_posts_date ON church_qt_posts(church_id, date);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_group ON prayer_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_not_notified ON user_badges(user_id, is_notified) WHERE is_notified = false;

-- ============================================
-- 9. 트리거 함수
-- ============================================

-- 좋아요 카운트 업데이트
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_likes_count ON comment_likes;
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- 기도 지지 카운트 업데이트
CREATE OR REPLACE FUNCTION update_prayer_support_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE prayer_requests SET support_count = support_count + 1 WHERE id = NEW.prayer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE prayer_requests SET support_count = support_count - 1 WHERE id = OLD.prayer_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_prayer_support_count ON prayer_support;
CREATE TRIGGER trigger_update_prayer_support_count
  AFTER INSERT OR DELETE ON prayer_support
  FOR EACH ROW EXECUTE FUNCTION update_prayer_support_count();

-- 배지 자동 부여: 묵상
CREATE OR REPLACE FUNCTION check_meditation_badges()
RETURNS TRIGGER AS $$
DECLARE
  meditation_count INTEGER;
  badge_record RECORD;
BEGIN
  SELECT COUNT(*) INTO meditation_count FROM comments WHERE user_id = NEW.user_id;
  FOR badge_record IN
    SELECT id FROM badge_definitions
    WHERE category = 'meditation' AND requirement_type = 'meditation_count'
    AND requirement_value <= meditation_count AND is_active = true
  LOOP
    INSERT INTO user_badges (user_id, badge_id, group_id)
    VALUES (NEW.user_id, badge_record.id, NEW.group_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_meditation_badges ON comments;
CREATE TRIGGER trigger_check_meditation_badges
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION check_meditation_badges();

-- 배지 자동 부여: 댓글
CREATE OR REPLACE FUNCTION check_reply_badges()
RETURNS TRIGGER AS $$
DECLARE
  reply_count INTEGER;
  badge_record RECORD;
BEGIN
  SELECT COUNT(*) INTO reply_count FROM comment_replies WHERE user_id = NEW.user_id;
  FOR badge_record IN
    SELECT id FROM badge_definitions
    WHERE category = 'social' AND requirement_type = 'reply_count'
    AND requirement_value <= reply_count AND is_active = true
  LOOP
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (NEW.user_id, badge_record.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_reply_badges ON comment_replies;
CREATE TRIGGER trigger_check_reply_badges
  AFTER INSERT ON comment_replies
  FOR EACH ROW EXECUTE FUNCTION check_reply_badges();

-- 배지 자동 부여: 기도
CREATE OR REPLACE FUNCTION check_prayer_badges()
RETURNS TRIGGER AS $$
DECLARE
  prayer_count INTEGER;
  badge_record RECORD;
BEGIN
  SELECT COUNT(*) INTO prayer_count FROM prayer_requests WHERE user_id = NEW.user_id;
  FOR badge_record IN
    SELECT id FROM badge_definitions
    WHERE category = 'prayer' AND requirement_type = 'prayer_count'
    AND requirement_value <= prayer_count AND is_active = true
  LOOP
    INSERT INTO user_badges (user_id, badge_id, group_id)
    VALUES (NEW.user_id, badge_record.id, NEW.group_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_prayer_badges ON prayer_requests;
CREATE TRIGGER trigger_check_prayer_badges
  AFTER INSERT ON prayer_requests
  FOR EACH ROW EXECUTE FUNCTION check_prayer_badges();

-- 스트릭 배지 체크 함수
CREATE OR REPLACE FUNCTION check_streak_badges(p_user_id UUID, p_group_id UUID, p_streak INTEGER)
RETURNS VOID AS $$
DECLARE
  badge_record RECORD;
BEGIN
  FOR badge_record IN
    SELECT id FROM badge_definitions
    WHERE category = 'streak' AND requirement_type = 'streak_days'
    AND requirement_value <= p_streak AND is_active = true
  LOOP
    INSERT INTO user_badges (user_id, badge_id, group_id)
    VALUES (p_user_id, badge_record.id, p_group_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 완료
-- ============================================

-- 이 파일 실행 완료 시점을 기록
-- SELECT NOW() as migration_completed;
