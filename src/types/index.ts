// =============================================
// Reading Jesus - TypeScript Type Definitions
// =============================================

// Reading Plan (통독 일정)
export interface ReadingPlan {
  day: number;
  date: string;           // 실제 날짜 (YYYY-MM-DD)
  display_date: string;   // 표시용 날짜 (M/D)
  book: string;           // 성경책 이름
  range: string;          // 장 범위 (예: "1-4")
  reading: string;        // 읽기 표시 (예: "창 1-4")
  memory_verse: string | null;  // 암송 구절 (선택)
}

// User Profile (사용자 프로필)
export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
  // 교회 등록 정보 (1인 1교회)
  church_id?: string | null;
  church_joined_at?: string | null;
}

// Church (교회)
export interface Church {
  id: string;
  code: string;
  name: string;
  denomination: string | null;
  address: string | null;
  region_code: string | null;
  write_token: string | null;
  admin_token: string | null;
  is_active: boolean;
  allow_anonymous: boolean;
  schedule_year: number | null;
  schedule_start_date: string | null;
  created_at: string;
  updated_at: string;
}

// Profile with Church (프로필 + 교회 정보)
export interface ProfileWithChurch extends Profile {
  church?: Church | null;
}

// Bible Reading Range (성경 범위)
// 'reading_jesus': 리딩지저스 365일 기본 일정 사용
export type BibleRangeType = 'full' | 'old' | 'new' | 'custom' | 'reading_jesus';

export interface BibleRange {
  type: BibleRangeType;
  books?: string[]; // custom인 경우 선택된 책 이름들
}

// Schedule Mode (일정 모드)
export type ScheduleMode = 'calendar' | 'day_count';

// Group Join Type (그룹 가입 방식)
export type GroupJoinType = 'open' | 'approval';

// Group (교회/소그룹)
export interface Group {
  id: string;
  name: string;
  description: string | null;
  start_date: string; // YYYY-MM-DD format
  end_date: string | null; // YYYY-MM-DD format
  invite_code: string;
  created_by: string | null;
  created_at: string;
  // 그룹 설정 (Phase 3)
  reading_plan_type: '365' | '180' | '90' | 'custom';
  goal: string | null;
  rules: string | null;
  is_public: boolean;
  max_members: number;
  allow_anonymous: boolean;
  require_daily_reading: boolean;
  // 성경 범위 설정 (Phase 9)
  bible_range_type: BibleRangeType;
  bible_range_books: string[] | null; // custom인 경우 선택된 책들
  // 일정 모드 (Phase 15)
  schedule_mode: ScheduleMode; // calendar=실제 날짜 기반, day_count=그룹 시작일 기준
  // 교회 연동 (Phase 26)
  church_id?: string | null; // 소속 교회 ID (NULL이면 개인 그룹)
  is_church_official?: boolean; // 교회 공식 그룹 여부
  // 가입 방식 (Phase 27)
  join_type?: GroupJoinType; // open=공개가입, approval=승인제
  is_private?: boolean; // true=멤버만 게시글 열람, false=누구나 열람 가능
}

// Group Join Request Status (가입 신청 상태)
export type GroupJoinRequestStatus = 'pending' | 'approved' | 'rejected';

// Group Join Request (그룹 가입 신청)
export interface GroupJoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  status: GroupJoinRequestStatus;
  message: string | null;
  rejected_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Group Join Request with Profile (프로필 포함)
export interface GroupJoinRequestWithProfile extends GroupJoinRequest {
  profile?: Pick<Profile, 'nickname' | 'avatar_url'> | null;
}

// Group Member (그룹 멤버)
export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

// Group Notice (그룹 공지사항)
export interface GroupNotice {
  id: string;
  group_id: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// Group Notice with Author
export interface GroupNoticeWithAuthor extends GroupNotice {
  author?: Pick<Profile, 'nickname' | 'avatar_url'> | null;
}

// Daily Check (읽음 체크)
export interface DailyCheck {
  id: string;
  user_id: string;
  group_id: string;
  day_number: number;
  is_read: boolean;
  checked_at: string;
}

// Comment (묵상 나눔 댓글)
export interface Comment {
  id: string;
  user_id: string;
  group_id: string;
  day_number: number;
  content: string;
  is_anonymous?: boolean;
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
}

// Comment with Profile (댓글 + 작성자 정보)
export interface CommentWithProfile extends Comment {
  profile: Pick<Profile, 'nickname' | 'avatar_url'> | null;
}

// Comment Reply (댓글의 리플)
export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  parent_reply_id: string | null; // 대댓글인 경우 부모 답글 ID
  mentioned_user_id: string | null; // 멘션된 사용자 ID
  content: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

// Comment Reply with Profile (리플 + 작성자 정보)
export interface CommentReplyWithProfile extends CommentReply {
  profile: Pick<Profile, 'nickname' | 'avatar_url'> | null;
  mentioned_user?: Pick<Profile, 'nickname'> | null; // 멘션된 유저 정보
}

// Comment Like (댓글 좋아요)
export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

// Comment Attachment (댓글 첨부파일)
export interface CommentAttachment {
  id: string;
  comment_id: string;
  user_id: string;
  file_url: string;
  file_type: 'image' | 'pdf';
  file_name: string;
  file_size: number | null;
  created_at: string;
}

// Comment with Profile and Attachments
export interface CommentWithAttachments extends CommentWithProfile {
  attachments?: CommentAttachment[];
}

// Group with Member Info (그룹 + 내 멤버 정보)
export interface GroupWithMembership extends Group {
  membership?: GroupMember;
  member_count?: number;
}

// Today's Reading Info (오늘의 말씀 정보)
export interface TodayReading {
  dayIndex: number;
  plan: ReadingPlan;
  isRead: boolean;
}

// User Stats (사용자 통계)
export interface UserStats {
  totalDays: number;
  completedDays: number;
  progressPercentage: number;
  currentStreak: number;
}

// Personal Reading Project (나만의 리딩지저스 프로젝트)
export interface PersonalReadingProject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  reading_plan_type: '365' | '180' | '90' | 'custom';
  start_date: string;
  end_date: string | null;
  goal: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Personal Daily Check (개인 프로젝트 읽기 체크)
export interface PersonalDailyCheck {
  id: string;
  project_id: string;
  user_id: string;
  day_number: number;
  is_read: boolean;
  checked_at: string;
}

// Personal Project with Stats
export interface PersonalProjectWithStats extends PersonalReadingProject {
  completedDays: number;
  totalDays: number;
  progressPercentage: number;
  currentDay: number;
}

// Notification (알림)
export type NotificationType = 'like' | 'comment' | 'reply' | 'group_invite' | 'group_notice' | 'reminder';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  related_comment_id: string | null;
  related_group_id: string | null;
  actor_id: string | null;
  created_at: string;
}

// Notification with Actor Profile
export interface NotificationWithActor extends Notification {
  actor?: Pick<Profile, 'nickname' | 'avatar_url'> | null;
}

// Notification Settings (알림 설정)
export interface NotificationSettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  notification_time: string; // HH:MM:SS format
  custom_message: string;
  days_of_week: number[]; // 1=Monday, 7=Sunday
  created_at: string;
  updated_at: string;
}

// Member Rank Permissions (등급 권한)
export interface RankPermissions {
  can_read: boolean;          // 읽기 권한 (기본)
  can_comment: boolean;       // 묵상 작성 권한
  can_create_meeting: boolean; // 모임 생성 권한
  can_pin_comment: boolean;   // 묵상 고정 권한 (관리자급)
  can_manage_members: boolean; // 멤버 관리 권한 (관리자급)
}

// 권한 프리셋
export const RANK_PERMISSION_PRESETS: Record<string, { name: string; permissions: RankPermissions }> = {
  viewer: {
    name: '읽기만',
    permissions: {
      can_read: true,
      can_comment: false,
      can_create_meeting: false,
      can_pin_comment: false,
      can_manage_members: false,
    },
  },
  member: {
    name: '일반 멤버',
    permissions: {
      can_read: true,
      can_comment: true,
      can_create_meeting: false,
      can_pin_comment: false,
      can_manage_members: false,
    },
  },
  active: {
    name: '활동 멤버',
    permissions: {
      can_read: true,
      can_comment: true,
      can_create_meeting: true,
      can_pin_comment: false,
      can_manage_members: false,
    },
  },
  leader: {
    name: '리더',
    permissions: {
      can_read: true,
      can_comment: true,
      can_create_meeting: true,
      can_pin_comment: true,
      can_manage_members: false,
    },
  },
  admin: {
    name: '관리자',
    permissions: {
      can_read: true,
      can_comment: true,
      can_create_meeting: true,
      can_pin_comment: true,
      can_manage_members: true,
    },
  },
};

// Member Rank (멤버 등급)
export interface MemberRank {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  color: string;
  level: number;
  // 권한 필드 (Phase 11-7)
  permissions: RankPermissions;
  created_at: string;
  updated_at: string;
}

// Group Member with Rank
export interface GroupMemberWithRank extends GroupMember {
  rank?: MemberRank | null;
  profile?: Pick<Profile, 'nickname' | 'avatar_url'> | null;
}

// Bible (성경 본문)
export interface BibleVerse {
  book: string;        // 책 이름 (예: "창세기")
  chapter: number;     // 장
  verse: number;       // 절
  text: string;        // 본문 내용
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  name: string;        // 한글 이름
  abbr: string;        // 약어 (예: "창")
  testament: 'old' | 'new';
  chapters: number;    // 총 장 수
}

// QT Post (QT 게시글)
export interface QTPost {
  id: string;
  group_id: string;
  author_id: string;
  day_number: number;
  title: string;
  content: string;
  questions: string[];  // QT 질문들
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// QT Post with Author
export interface QTPostWithAuthor extends QTPost {
  author?: Pick<Profile, 'nickname' | 'avatar_url'> | null;
}

// Draft Post (임시저장 묵상)
export interface Draft {
  id: string;
  user_id: string;
  group_id: string;
  day_number: number;
  title?: string;
  content: string;
  is_rich_editor: boolean;
  created_at: string;
  updated_at: string;
  // localStorage 전용 필드
  synced?: boolean;
}

// =============================================
// Prayer Request (기도제목)
// =============================================

// 기도제목
export interface PrayerRequest {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  is_answered: boolean;
  answered_at: string | null;
  support_count: number;
  created_at: string;
  updated_at: string;
}

// 기도제목 + 프로필
export interface PrayerRequestWithProfile extends PrayerRequest {
  profile: Pick<Profile, 'nickname' | 'avatar_url'> | null;
  is_supported?: boolean; // 현재 사용자가 함께 기도 눌렀는지
}

// 함께 기도합니다
export interface PrayerSupport {
  id: string;
  prayer_id: string;
  user_id: string;
  created_at: string;
}

// =============================================
// QT Daily Content (QT 일일 묵상 컨텐츠)
// =============================================

// QT 성경 구절
export interface QTVerse {
  verse: number;
  content: string;
}

// QT 묵상 내용
export interface QTMeditation {
  oneWord: string | null;           // 핵심 단어 (예: "안식")
  oneWordSubtitle: string | null;   // 부제 (예: "예배의 리듬")
  meditationGuide: string | null;   // 묵상 길잡이
  jesusConnection: string | null;   // 예수님 연결 (복음 한 줄)
  meditationQuestions: string[];    // 묵상 질문 (1~2개)
  prayer: string | null;            // 예시 기도문
  copyVerse: string | null;         // 필사 구절
}

// QT 일일 컨텐츠
export interface QTDailyContent {
  month: number;
  year: number;
  day: number;
  dayOfWeek: string;              // "월요일", "화요일" 등
  date: string;                   // "2026-01-12" (YYYY-MM-DD)
  title: string | null;           // 제목 (예: "안식 (예배의 리듬)")
  bibleRange: string | null;      // 통독 범위 (예: "창 1-4장")
  verseReference: string | null;  // 본문 구절 참조 (예: "창세기 2장 1-3절")
  verses: QTVerse[];              // 성경 본문
  meditation: QTMeditation | null; // 묵상 내용
}

// =============================================
// Badge System (배지 시스템)
// =============================================

// 배지 카테고리
export type BadgeCategory = 'streak' | 'meditation' | 'prayer' | 'social';

// 배지 정의
export interface BadgeDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;  // 이모지
  category: BadgeCategory;
  requirement_type: string;
  requirement_value: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

// 사용자 배지
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  group_id: string | null;
  earned_at: string;
  is_notified: boolean;
}

// 사용자 배지 + 배지 정의
export interface UserBadgeWithDefinition extends UserBadge {
  badge: BadgeDefinition;
}

// 새로 획득한 배지 (알림용)
export interface NewBadgeNotification {
  badge: BadgeDefinition;
  earnedAt: string;
}

// =============================================
// 격려 메시지 (Encouragement)
// =============================================

// 격려 메시지
export interface Encouragement {
  id: string;
  group_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// 격려 메시지 + 프로필
export interface EncouragementWithProfile extends Encouragement {
  sender?: Pick<Profile, 'nickname' | 'avatar_url'> | null;
  receiver?: Pick<Profile, 'nickname' | 'avatar_url'> | null;
}

// 격려 메시지 기본 템플릿
export const ENCOURAGEMENT_TEMPLATES = [
  { emoji: '💪', text: '함께 말씀 읽어요!' },
  { emoji: '🔥', text: '오늘도 화이팅!' },
  { emoji: '🙏', text: '기도하고 있어요' },
  { emoji: '❤️', text: '함께해서 좋아요' },
  { emoji: '✨', text: '다시 시작해봐요!' },
  { emoji: '🌟', text: '응원합니다!' },
  { emoji: '📖', text: '말씀 안에서 힘을 얻어요' },
  { emoji: '🤗', text: '사랑합니다!' },
];

// =============================================
// Reading Plan System (읽기 플랜 시스템)
// =============================================

// 플랜 타입
export type ReadingPlanType = 'reading_jesus' | 'custom';

// 성경 범위
export type BibleScope = 'full' | 'old' | 'new' | 'custom';

// 읽기 플랜 (DB: reading_plans)
export interface ReadingPlanConfig {
  id: string;
  name: string;
  plan_type: ReadingPlanType;

  // 커스텀 플랜 설정
  bible_scope?: BibleScope | null;
  selected_books?: string[] | null;   // 직접 선택 시 책 목록
  reading_days?: number[] | null;     // [1,2,3,4,5] = 월~금
  chapters_per_day?: number | null;   // 하루에 읽을 장 수

  // 계산된 값
  total_chapters?: number | null;
  total_reading_days?: number | null;
  total_calendar_days?: number | null;
  start_date: string;
  end_date?: string | null;

  // 메타데이터
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

// 플랜 일정 (DB: plan_schedules)
export interface PlanSchedule {
  id: string;
  plan_id: string;
  day_number: number;
  reading_date?: string | null;
  book_name: string;
  start_chapter: number;
  end_chapter: number;
  chapter_count: number;
  qt_guide_id?: string | null;
  created_at: string;
}

// 사용자 일일 읽기 정보 (다중 플랜 지원)
export interface UserDailyReading {
  plan_id: string;
  plan_name: string;
  plan_type: ReadingPlanType;
  day_number: number;
  book_name: string;
  start_chapter: number;
  end_chapter: number;
  chapter_count: number;
  applied_groups: {
    id: string;
    name: string;
    type: 'church' | 'group';
  }[];
  is_checked: boolean;
}

// 그룹 + 플랜 정보
export interface GroupWithPlan extends Group {
  plan?: ReadingPlanConfig | null;
}

// 리딩지저스 기본 플랜 ID (상수)
export const READING_JESUS_2026_PLAN_ID = '00000000-0000-0000-0000-000000000001';

// 요일 상수
export const WEEKDAYS = [
  { value: 0, label: '일', short: '일' },
  { value: 1, label: '월', short: '월' },
  { value: 2, label: '화', short: '화' },
  { value: 3, label: '수', short: '수' },
  { value: 4, label: '목', short: '목' },
  { value: 5, label: '금', short: '금' },
  { value: 6, label: '토', short: '토' },
];

// 성경책 정보 (플랜 생성용)
export const BIBLE_BOOKS_INFO = {
  old: [
    { name: '창세기', chapters: 50 },
    { name: '출애굽기', chapters: 40 },
    { name: '레위기', chapters: 27 },
    { name: '민수기', chapters: 36 },
    { name: '신명기', chapters: 34 },
    { name: '여호수아', chapters: 24 },
    { name: '사사기', chapters: 21 },
    { name: '룻기', chapters: 4 },
    { name: '사무엘상', chapters: 31 },
    { name: '사무엘하', chapters: 24 },
    { name: '열왕기상', chapters: 22 },
    { name: '열왕기하', chapters: 25 },
    { name: '역대상', chapters: 29 },
    { name: '역대하', chapters: 36 },
    { name: '에스라', chapters: 10 },
    { name: '느헤미야', chapters: 13 },
    { name: '에스더', chapters: 10 },
    { name: '욥기', chapters: 42 },
    { name: '시편', chapters: 150 },
    { name: '잠언', chapters: 31 },
    { name: '전도서', chapters: 12 },
    { name: '아가', chapters: 8 },
    { name: '이사야', chapters: 66 },
    { name: '예레미야', chapters: 52 },
    { name: '예레미야애가', chapters: 5 },
    { name: '에스겔', chapters: 48 },
    { name: '다니엘', chapters: 12 },
    { name: '호세아', chapters: 14 },
    { name: '요엘', chapters: 3 },
    { name: '아모스', chapters: 9 },
    { name: '오바댜', chapters: 1 },
    { name: '요나', chapters: 4 },
    { name: '미가', chapters: 7 },
    { name: '나훔', chapters: 3 },
    { name: '하박국', chapters: 3 },
    { name: '스바냐', chapters: 3 },
    { name: '학개', chapters: 2 },
    { name: '스가랴', chapters: 14 },
    { name: '말라기', chapters: 4 },
  ],
  new: [
    { name: '마태복음', chapters: 28 },
    { name: '마가복음', chapters: 16 },
    { name: '누가복음', chapters: 24 },
    { name: '요한복음', chapters: 21 },
    { name: '사도행전', chapters: 28 },
    { name: '로마서', chapters: 16 },
    { name: '고린도전서', chapters: 16 },
    { name: '고린도후서', chapters: 13 },
    { name: '갈라디아서', chapters: 6 },
    { name: '에베소서', chapters: 6 },
    { name: '빌립보서', chapters: 4 },
    { name: '골로새서', chapters: 4 },
    { name: '데살로니가전서', chapters: 5 },
    { name: '데살로니가후서', chapters: 3 },
    { name: '디모데전서', chapters: 6 },
    { name: '디모데후서', chapters: 4 },
    { name: '디도서', chapters: 3 },
    { name: '빌레몬서', chapters: 1 },
    { name: '히브리서', chapters: 13 },
    { name: '야고보서', chapters: 5 },
    { name: '베드로전서', chapters: 5 },
    { name: '베드로후서', chapters: 3 },
    { name: '요한일서', chapters: 5 },
    { name: '요한이서', chapters: 1 },
    { name: '요한삼서', chapters: 1 },
    { name: '유다서', chapters: 1 },
    { name: '요한계시록', chapters: 22 },
  ],
};

// 전체 성경 장 수
export const TOTAL_BIBLE_CHAPTERS = {
  full: 1189,
  old: 929,
  new: 260,
};

// =============================================
// Public Feed (전체 공개 피드)
// =============================================

// 공개 피드 아이템 (교회 정보 포함)
export interface PublicFeedItem {
  id: string;
  type: 'meditation' | 'qt';
  authorId?: string | null;  // 작성자 ID (프로필 링크용)
  authorName: string;
  authorAvatarUrl?: string | null;  // 작성자 아바타
  isAnonymous: boolean;
  createdAt: string;
  // 교회 정보
  churchId: string;
  churchCode: string;
  churchName: string;
  // 묵상 콘텐츠
  content?: string;
  // QT 콘텐츠
  mySentence?: string | null;
  meditationAnswer?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
  qtDate?: string | null;
  // 메타데이터
  dayNumber?: number | null;
  bibleRange?: string | null;
  // 인터랙션
  likesCount: number;
  repliesCount: number;
}

// 공개 피드 필터 옵션
export interface PublicFeedFilters {
  churchId?: string;
  type?: 'all' | 'qt' | 'meditation';
  period?: 'today' | 'week' | 'all';
}

// 공개 피드 응답
export interface PublicFeedResponse {
  items: PublicFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// =============================================
// Unified MyPage (마이페이지 통합)
// =============================================

// 교회 컨텍스트 (교회 마이페이지 접근 시)
export interface ChurchContext {
  churchCode: string;
  church: Church;
}

// 마이페이지 통계
export interface MyPageStats {
  completedDays: number;
  totalDays: number;
  progressPercentage: number;
  currentStreak: number;
  commentCount?: number; // 교회 컨텍스트에서만 사용
}

// =============================================
// Integrated Stats (통합 통계 시스템)
// =============================================

// 활동 소스 타입
export type ActivitySourceType = 'church' | 'group' | 'personal';

// 개별 활동 통계
export interface ActivityStats {
  sourceType: ActivitySourceType;
  sourceId: string;
  sourceName: string;          // 교회 이름, 그룹 이름, 프로젝트 이름
  completedDays: number;
  totalDays: number;
  progressPercentage: number;
  currentStreak: number;
}

// 통합 통계 (메인 마이페이지용)
export interface IntegratedStats {
  // 전체 통합
  totalCompletedDays: number;
  totalStreak: number;           // 전체 기준 연속일 (가장 긴 것 또는 합산)
  // 활동별 상세
  activities: ActivityStats[];
  // 메타
  hasChurchActivity: boolean;
  hasGroupActivity: boolean;
  hasPersonalActivity: boolean;
}

// 마이페이지 사용자 정보
export interface MyPageUser {
  id: string;
  nickname: string;
  avatar: string | null;
  isAnonymous: boolean;
  // 메인 컨텍스트
  group?: string | null;
  groupCount?: number;
}

// 마이페이지 컨텍스트 타입
export type MyPageContextType = 'main' | 'church';

// 프로필 그리드 피드 아이템
export interface GridFeedItem {
  id: string;
  type: 'meditation' | 'qt';
  source: 'church' | 'group' | 'personal';
  sourceId?: string;
  sourceName?: string;
  thumbnailUrl?: string | null;
  textPreview: string;
  likesCount: number;
  repliesCount: number;
  dayNumber?: number | null;
  bibleRange?: string | null;
  qtDate?: string | null;
  createdAt: string;
  // 상세 보기용 전체 데이터
  fullData?: {
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string | null;
    isAnonymous: boolean;
    content?: string;
    mySentence?: string | null;
    meditationAnswer?: string | null;
    gratitude?: string | null;
    myPrayer?: string | null;
    dayReview?: string | null;
    churchCode?: string;
    churchName?: string;
  };
}

// =============================================
// Church Admin (교회 관리자)
// =============================================

// 교회 관리자 역할
export type ChurchAdminRole = 'church_admin' | 'church_moderator';

// 교회 관리자
export interface ChurchAdmin {
  id: string;
  church_id: string;
  email: string;
  nickname: string | null;
  role: ChurchAdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

// 교회 관리자 + 교회 정보
export interface ChurchAdminWithChurch extends ChurchAdmin {
  church?: Church | null;
}

// 교회 관리자 생성 시 필요한 정보
export interface CreateChurchAdminInput {
  church_id: string;
  email: string;
  password: string;
  nickname?: string;
  role?: ChurchAdminRole;
}

// 교회 관리자 인증 상태
export interface ChurchAdminAuthState {
  isAuthenticated: boolean;
  authMethod: 'login' | 'token' | null;
  admin: ChurchAdmin | null;
  church: Church | null;
}
