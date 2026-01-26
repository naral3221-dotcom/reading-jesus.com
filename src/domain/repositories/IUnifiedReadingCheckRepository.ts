/**
 * UnifiedReadingCheck Repository Interface
 *
 * 통합 읽음 체크 저장소 인터페이스.
 * 그룹 읽음 체크(daily_checks)와 교회 읽음 체크(church_reading_checks)를 통합 관리.
 */

import type {
  SourceType,
  UnifiedReadingCheckProps,
  CreateUnifiedReadingCheckInput,
  UnifiedReadingStreakProps,
  UnifiedReadingProgressProps,
  UserReadingsBySource,
} from '../entities/UnifiedReadingCheck'

/**
 * 통합 읽음 체크 검색 파라미터
 */
export interface UnifiedReadingCheckSearchParams {
  userId: string
  sourceType: SourceType
  sourceId: string
}

/**
 * 통합 읽음 체크 저장소 인터페이스
 */
export interface IUnifiedReadingCheckRepository {
  /**
   * 사용자의 특정 출처 읽음 기록 조회
   */
  findByUserAndSource(params: UnifiedReadingCheckSearchParams): Promise<UnifiedReadingCheckProps[]>

  /**
   * 체크된 day number 목록 조회
   */
  getCheckedDayNumbers(params: UnifiedReadingCheckSearchParams): Promise<number[]>

  /**
   * 특정 day의 읽음 상태 확인
   */
  isChecked(
    userId: string,
    sourceType: SourceType,
    sourceId: string,
    dayNumber: number
  ): Promise<boolean>

  /**
   * 읽음 토글 (체크/해제)
   */
  toggle(
    userId: string,
    sourceType: SourceType,
    sourceId: string,
    dayNumber: number
  ): Promise<boolean>

  /**
   * 읽음 체크 생성
   */
  create(input: CreateUnifiedReadingCheckInput): Promise<UnifiedReadingCheckProps>

  /**
   * 읽음 체크 삭제
   */
  delete(
    userId: string,
    sourceType: SourceType,
    sourceId: string,
    dayNumber: number
  ): Promise<void>

  /**
   * 진행률 조회
   */
  getProgress(
    params: UnifiedReadingCheckSearchParams,
    totalDays?: number,
    currentDay?: number
  ): Promise<UnifiedReadingProgressProps>

  /**
   * 스트릭 계산
   */
  calculateStreak(
    params: UnifiedReadingCheckSearchParams,
    currentDay?: number
  ): Promise<UnifiedReadingStreakProps>

  /**
   * 사용자의 모든 출처별 읽음 기록 조회 (mypage용)
   * 그룹, 교회 모두 포함
   */
  findAllByUser(userId: string): Promise<UserReadingsBySource[]>

  /**
   * 최근 N일간 읽음 기록 조회
   */
  getRecentReadings(
    params: UnifiedReadingCheckSearchParams,
    days: number
  ): Promise<UnifiedReadingCheckProps[]>

  /**
   * 총 읽은 일수 조회
   */
  getTotalReadDays(userId: string, sourceType?: SourceType | null): Promise<number>
}
