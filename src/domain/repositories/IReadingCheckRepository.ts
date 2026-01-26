/**
 * ReadingCheck Repository Interface
 *
 * 읽음 체크 저장소 인터페이스 정의.
 */

import {
  ReadingCheckProps,
  CreateReadingCheckInput,
  ReadingStreakProps,
  ReadingProgressProps,
} from '@/domain/entities/ReadingCheck'

export interface ReadingCheckContext {
  groupId?: string | null
  churchId?: string | null
}

export interface ReadingCheckSearchParams extends ReadingCheckContext {
  userId: string
}

export interface IReadingCheckRepository {
  /**
   * 사용자의 읽음 체크 목록을 조회합니다.
   */
  findByUser(params: ReadingCheckSearchParams): Promise<ReadingCheckProps[]>

  /**
   * 특정 일자의 읽음 체크를 조회합니다.
   */
  findByUserAndDay(
    userId: string,
    dayNumber: number,
    context: ReadingCheckContext
  ): Promise<ReadingCheckProps | null>

  /**
   * 체크된 일자 번호 목록을 조회합니다.
   */
  getCheckedDayNumbers(params: ReadingCheckSearchParams): Promise<number[]>

  /**
   * 읽음 체크를 생성합니다.
   */
  create(input: CreateReadingCheckInput): Promise<ReadingCheckProps>

  /**
   * 읽음 체크를 삭제합니다.
   */
  delete(userId: string, dayNumber: number, context: ReadingCheckContext): Promise<void>

  /**
   * 읽음 체크를 토글합니다.
   * @returns 토글 후 읽음 상태
   */
  toggle(userId: string, dayNumber: number, context: ReadingCheckContext): Promise<boolean>

  /**
   * 스트릭을 계산합니다.
   */
  calculateStreak(params: ReadingCheckSearchParams): Promise<ReadingStreakProps>

  /**
   * 진행률 통계를 조회합니다.
   */
  getProgress(params: ReadingCheckSearchParams, totalDays?: number): Promise<ReadingProgressProps>

  /**
   * 월별 읽음 체크 통계를 조회합니다.
   */
  getMonthlyStats(
    userId: string,
    year: number,
    month: number,
    context: ReadingCheckContext
  ): Promise<{ day: number; checked: boolean }[]>

  /**
   * 사용자의 모든 그룹에 대한 읽기 데이터를 조회합니다.
   */
  findAllGroupReadings(
    userId: string,
    groupIds: string[]
  ): Promise<{
    groupId: string
    groupName: string
    readings: ReadingCheckProps[]
  }[]>
}
