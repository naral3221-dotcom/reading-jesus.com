/**
 * PersonalProject Repository Interface
 *
 * 개인 성경 읽기 프로젝트 저장소 인터페이스.
 */

import type {
  PersonalProjectProps,
  CreatePersonalProjectInput,
  UpdatePersonalProjectInput,
  PersonalProjectWithStats,
} from '../entities/PersonalProject'

/**
 * 개인 프로젝트 검색 파라미터
 */
export interface PersonalProjectSearchParams {
  userId: string
  activeOnly?: boolean
}

/**
 * 개인 프로젝트 저장소 인터페이스
 */
export interface IPersonalProjectRepository {
  /**
   * 사용자의 프로젝트 목록 조회
   */
  findByUserId(params: PersonalProjectSearchParams): Promise<PersonalProjectWithStats[]>

  /**
   * 프로젝트 ID로 조회
   */
  findById(id: string, userId: string): Promise<PersonalProjectWithStats | null>

  /**
   * 프로젝트 생성
   */
  create(input: CreatePersonalProjectInput): Promise<PersonalProjectProps>

  /**
   * 프로젝트 수정
   */
  update(id: string, userId: string, input: UpdatePersonalProjectInput): Promise<PersonalProjectProps>

  /**
   * 프로젝트 삭제
   */
  delete(id: string, userId: string): Promise<void>

  /**
   * 일일 체크 조회
   */
  getCheckedDays(projectId: string): Promise<number[]>

  /**
   * 일일 체크 토글
   */
  toggleDailyCheck(projectId: string, dayNumber: number): Promise<boolean>

  /**
   * 프로젝트 통계 계산
   */
  getStats(projectId: string): Promise<{
    completedDays: number
    totalDays: number
    progressPercentage: number
    currentDay: number
    currentStreak: number
  }>
}
