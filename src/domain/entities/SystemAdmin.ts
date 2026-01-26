/**
 * SystemAdmin Domain Entity
 *
 * 시스템 관리 도메인 엔티티 정의.
 */

/**
 * 시스템 통계
 */
export interface SystemStatsProps {
  totalChurches: number
  activeChurches: number
  totalGroups: number
  activeGroups: number
  totalUsers: number
  activeUsersLast30Days: number
  totalComments: number
  totalPrayers: number
}

/**
 * 교회 목록 항목 (관리용)
 */
export interface ChurchListItemProps {
  id: string
  code: string
  name: string
  denomination: string | null
  regionCode: string
  address: string | null
  pastorName: string | null
  contactPerson: string | null
  contactPhone: string | null
  writeToken: string | null
  adminToken: string | null
  isActive: boolean
  createdAt: Date
  memberCount?: number
  adminCount?: number
}

/**
 * 교회 생성 입력
 */
export interface CreateChurchInput {
  name: string
  denomination?: string
  regionCode: string
  address?: string
  pastorName?: string
  contactPerson?: string
  contactPhone?: string
  adminEmail?: string
  adminPassword?: string
  adminNickname?: string
}

/**
 * 그룹 목록 항목 (관리용)
 */
export interface GroupListItemProps {
  id: string
  name: string
  description: string | null
  inviteCode: string
  creatorId: string
  isActive: boolean
  createdAt: Date
  memberCount: number
  creatorNickname?: string
}

/**
 * 사용자 목록 항목 (관리용)
 */
export interface UserListItemProps {
  id: string
  email: string
  nickname: string
  avatarUrl: string | null
  hasCompletedOnboarding: boolean
  churchId: string | null
  churchName?: string
  createdAt: Date
  lastActiveAt: Date | null
  groupCount?: number
  commentCount?: number
}

/**
 * 지역 코드
 */
export interface RegionCodeProps {
  code: string
  name: string
}

/**
 * 검색 파라미터
 */
export interface AdminSearchParams {
  query?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  isActive?: boolean
}

/**
 * 페이지네이션 결과
 */
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
