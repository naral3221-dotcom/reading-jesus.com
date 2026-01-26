/**
 * SystemAdmin Repository Interface
 *
 * 시스템 관리 저장소 인터페이스.
 */

import type {
  SystemStatsProps,
  ChurchListItemProps,
  GroupListItemProps,
  UserListItemProps,
  RegionCodeProps,
  CreateChurchInput,
  AdminSearchParams,
  PaginatedResult,
} from '../entities/SystemAdmin'

/**
 * 시스템 관리 저장소 인터페이스
 */
export interface ISystemAdminRepository {
  // ===== 통계 =====
  /**
   * 시스템 전체 통계 조회
   */
  getSystemStats(): Promise<SystemStatsProps>

  // ===== 교회 관리 =====
  /**
   * 교회 목록 조회 (페이지네이션)
   */
  getChurches(params: AdminSearchParams): Promise<PaginatedResult<ChurchListItemProps>>

  /**
   * 교회 생성
   */
  createChurch(input: CreateChurchInput): Promise<ChurchListItemProps>

  /**
   * 교회 삭제
   */
  deleteChurch(id: string): Promise<void>

  /**
   * 교회 활성화/비활성화 토글
   */
  toggleChurchActive(id: string): Promise<boolean>

  /**
   * 교회 토큰 재생성
   */
  regenerateChurchToken(id: string, tokenType: 'admin' | 'write'): Promise<string>

  /**
   * 지역 코드 목록 조회
   */
  getRegionCodes(): Promise<RegionCodeProps[]>

  // ===== 그룹 관리 =====
  /**
   * 그룹 목록 조회 (페이지네이션)
   */
  getGroups(params: AdminSearchParams): Promise<PaginatedResult<GroupListItemProps>>

  /**
   * 그룹 삭제
   */
  deleteGroup(id: string): Promise<void>

  /**
   * 그룹 활성화/비활성화 토글
   */
  toggleGroupActive(id: string): Promise<boolean>

  // ===== 사용자 관리 =====
  /**
   * 사용자 목록 조회 (페이지네이션)
   */
  getUsers(params: AdminSearchParams): Promise<PaginatedResult<UserListItemProps>>

  /**
   * 사용자 삭제 (주의: 연관 데이터도 함께 삭제)
   */
  deleteUser(id: string): Promise<void>

  // ===== 시스템 관리자 =====
  /**
   * 시스템 관리자 목록 조회
   */
  getSystemAdmins(): Promise<{ id: string; email: string; createdAt: Date }[]>

  /**
   * 시스템 관리자 추가
   */
  addSystemAdmin(email: string, password: string): Promise<void>

  /**
   * 시스템 관리자 삭제
   */
  removeSystemAdmin(id: string): Promise<void>
}
