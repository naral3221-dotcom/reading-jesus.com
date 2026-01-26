/**
 * React Query 캐시 시간 상수
 * 데이터 특성에 따라 적절한 staleTime/gcTime을 설정
 */

export const CACHE_TIMES = {
  // ========================================
  // 정적 데이터 (거의 변경 없음)
  // ========================================

  /** QT 컨텐츠 - 하루 단위로 변경됨 */
  QT_CONTENT: 1000 * 60 * 60, // 1시간

  /** 성경 데이터 - 변경 없음 */
  BIBLE_DATA: 1000 * 60 * 60 * 24, // 24시간

  /** 읽기 플랜 - 연간 변경 */
  READING_PLAN: 1000 * 60 * 60, // 1시간

  // ========================================
  // 준정적 데이터 (가끔 변경)
  // ========================================

  /** 사용자 프로필 */
  USER_PROFILE: 1000 * 60 * 5, // 5분

  /** 그룹 정보 */
  GROUP_INFO: 1000 * 60 * 5, // 5분

  /** 교회 정보 */
  CHURCH_INFO: 1000 * 60 * 5, // 5분

  /** 그룹/교회 멤버 목록 */
  MEMBERS_LIST: 1000 * 60 * 3, // 3분

  // ========================================
  // 동적 데이터 (자주 변경)
  // ========================================

  /** 댓글/묵상 나눔 */
  COMMENTS: 1000 * 60, // 1분

  /** 피드 데이터 */
  FEED: 1000 * 60, // 1분

  /** 알림 */
  NOTIFICATIONS: 1000 * 30, // 30초

  /** 실시간 업데이트가 필요한 데이터 */
  REALTIME: 1000 * 15, // 15초
} as const;

/**
 * Garbage Collection 시간 (캐시 유지 시간)
 * staleTime 이후에도 캐시에 데이터 유지
 */
export const GC_TIMES = {
  /** 기본 GC 시간 */
  DEFAULT: 1000 * 60 * 5, // 5분

  /** 정적 데이터용 - 더 오래 유지 */
  STATIC: 1000 * 60 * 30, // 30분

  /** 동적 데이터용 - 짧게 유지 */
  DYNAMIC: 1000 * 60 * 2, // 2분
} as const;

/**
 * Query Key 팩토리
 * 일관된 키 구조로 캐시 관리 용이
 */
export const queryKeys = {
  // QT 관련
  qt: {
    all: ['qt'] as const,
    today: () => [...queryKeys.qt.all, 'today'] as const,
    day: (dayNumber: number) => [...queryKeys.qt.all, 'day', dayNumber] as const,
    month: (year: number, month: number) => [...queryKeys.qt.all, 'month', year, month] as const,
  },

  // 사용자 관련
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
    profile: (userId: string) => [...queryKeys.user.all, 'profile', userId] as const,
  },

  // 그룹 관련
  group: {
    all: ['group'] as const,
    byId: (id: string) => [...queryKeys.group.all, 'byId', id] as const,
    byUser: (userId: string) => [...queryKeys.group.all, 'byUser', userId] as const,
    members: (groupId: string) => [...queryKeys.group.all, 'members', groupId] as const,
  },

  // 교회 관련
  church: {
    all: ['church'] as const,
    byId: (id: string) => [...queryKeys.church.all, 'byId', id] as const,
    byCode: (code: string) => [...queryKeys.church.all, 'byCode', code] as const,
    members: (churchId: string) => [...queryKeys.church.all, 'members', churchId] as const,
    search: (query: string) => [...queryKeys.church.all, 'search', query] as const,
  },

  // 피드 관련
  feed: {
    all: ['feed'] as const,
    public: (filters?: object) => [...queryKeys.feed.all, 'public', filters] as const,
    church: (churchId: string) => [...queryKeys.feed.all, 'church', churchId] as const,
  },

  // 알림 관련
  notifications: {
    all: ['notifications'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
