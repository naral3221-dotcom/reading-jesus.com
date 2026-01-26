/**
 * UnifiedReadingCheck Domain Entity
 *
 * 통합 읽음 체크 도메인 엔티티.
 * 그룹 읽음 체크(daily_checks)와 교회 읽음 체크(church_reading_checks)를 통합.
 */

import type { SourceType } from './UnifiedMeditation'

export type { SourceType }

/**
 * 통합 읽음 체크 속성
 */
export interface UnifiedReadingCheckProps {
  id: string
  userId: string
  sourceType: SourceType
  sourceId: string // group_id 또는 church_id
  dayNumber: number
  checkedAt: Date | null
  createdAt: Date
}

/**
 * 통합 읽음 체크 생성 입력
 */
export interface CreateUnifiedReadingCheckInput {
  userId: string
  sourceType: SourceType
  sourceId: string
  dayNumber: number
}

/**
 * 사용자의 모든 출처별 읽음 기록
 */
export interface UserReadingsBySource {
  sourceType: SourceType
  sourceId: string
  sourceName: string
  readings: UnifiedReadingCheckProps[]
  totalDays: number
  completedDays: number
  progressPercentage: number
}

/**
 * 읽음 스트릭 속성
 */
export interface UnifiedReadingStreakProps {
  currentStreak: number
  longestStreak: number
  totalReadDays: number
  lastReadDate: Date | null
}

/**
 * 읽음 진행률 속성
 */
export interface UnifiedReadingProgressProps {
  completedDays: number
  totalDays: number
  progressPercentage: number
  currentStreak: number
  longestStreak: number
}

/**
 * UnifiedReadingCheck 도메인 엔티티 클래스
 */
export class UnifiedReadingCheck {
  private constructor(private readonly props: UnifiedReadingCheckProps) {}

  /**
   * ReadingCheck 엔티티를 생성합니다.
   * @throws dayNumber가 유효하지 않으면 에러
   */
  static create(props: UnifiedReadingCheckProps): UnifiedReadingCheck {
    UnifiedReadingCheck.validate(props)
    return new UnifiedReadingCheck(props)
  }

  /**
   * DB 레코드에서 엔티티 복원
   */
  static fromPersistence(data: UnifiedReadingCheckProps): UnifiedReadingCheck {
    return new UnifiedReadingCheck(data)
  }

  private static validate(props: UnifiedReadingCheckProps): void {
    if (props.dayNumber < 1 || props.dayNumber > 365) {
      throw new Error('dayNumber는 1~365 사이여야 합니다.')
    }
    if (!props.sourceType || !props.sourceId) {
      throw new Error('sourceType과 sourceId는 필수입니다.')
    }
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get userId(): string {
    return this.props.userId
  }

  get sourceType(): SourceType {
    return this.props.sourceType
  }

  get sourceId(): string {
    return this.props.sourceId
  }

  get dayNumber(): number {
    return this.props.dayNumber
  }

  get checkedAt(): Date | null {
    return this.props.checkedAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  /**
   * 읽음 상태인지 확인 (레코드가 존재하면 읽음)
   */
  get isRead(): boolean {
    return true // 통합 테이블에서는 레코드 존재 = 읽음
  }

  /**
   * DTO로 변환합니다.
   */
  toDTO(): UnifiedReadingCheckProps {
    return { ...this.props }
  }
}

/**
 * 스트릭 계산 유틸리티
 */
export function calculateUnifiedStreak(
  checkedDays: number[],
  currentDay: number = 1
): UnifiedReadingStreakProps {
  if (checkedDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalReadDays: 0,
      lastReadDate: null,
    }
  }

  const sortedDays = [...checkedDays].sort((a, b) => b - a) // 내림차순
  const totalReadDays = sortedDays.length

  // 현재 스트릭 계산 (currentDay부터 역순으로)
  let currentStreak = 0
  let expectedDay = currentDay

  for (const day of sortedDays) {
    if (day === expectedDay) {
      currentStreak++
      expectedDay = day - 1
    } else if (day < expectedDay) {
      // 아직 오늘 안 읽었으면 어제부터 체크
      if (currentStreak === 0 && day === currentDay - 1) {
        currentStreak++
        expectedDay = day - 1
      } else {
        break
      }
    }
  }

  // 가장 긴 스트릭 계산
  let longestStreak = 0
  let tempStreak = 1
  const ascDays = [...checkedDays].sort((a, b) => a - b)

  for (let i = 1; i < ascDays.length; i++) {
    if (ascDays[i] === ascDays[i - 1] + 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  return {
    currentStreak,
    longestStreak,
    totalReadDays,
    lastReadDate: sortedDays.length > 0 ? new Date() : null,
  }
}

/**
 * 진행률 계산 유틸리티
 */
export function calculateUnifiedProgress(
  checkedDays: number[],
  totalDays: number = 365,
  currentDay: number = 1
): UnifiedReadingProgressProps {
  const streak = calculateUnifiedStreak(checkedDays, currentDay)
  const completedDays = checkedDays.length
  const progressPercentage = Math.round((completedDays / totalDays) * 100)

  return {
    completedDays,
    totalDays,
    progressPercentage,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
  }
}
