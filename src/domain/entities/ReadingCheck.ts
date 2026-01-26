/**
 * ReadingCheck Entity
 *
 * 읽음 체크 도메인 엔티티. 성경 읽기 완료 상태를 관리합니다.
 */

export interface ReadingCheckProps {
  id: string
  userId: string
  groupId: string | null       // 메인 앱 그룹용 (daily_checks)
  churchId: string | null      // 교회용 (church_reading_checks)
  dayNumber: number
  isRead: boolean
  checkedAt: Date | null
  createdAt: Date
}

export interface CreateReadingCheckInput {
  userId: string
  dayNumber: number
  groupId?: string | null
  churchId?: string | null
}

export interface ReadingStreakProps {
  currentStreak: number
  longestStreak: number
  totalReadDays: number
  lastReadDate: Date | null
}

export interface ReadingProgressProps {
  completedDays: number
  totalDays: number
  progressPercentage: number
  currentStreak: number
  longestStreak: number
}

export class ReadingCheck {
  private constructor(private readonly props: ReadingCheckProps) {}

  /**
   * ReadingCheck 엔티티를 생성합니다.
   * @throws dayNumber가 유효하지 않으면 에러
   */
  static create(props: ReadingCheckProps): ReadingCheck {
    ReadingCheck.validate(props)
    return new ReadingCheck(props)
  }

  private static validate(props: ReadingCheckProps): void {
    if (props.dayNumber < 1 || props.dayNumber > 365) {
      throw new Error('dayNumber는 1~365 사이여야 합니다.')
    }
    if (!props.groupId && !props.churchId) {
      throw new Error('groupId 또는 churchId 중 하나는 필수입니다.')
    }
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get userId(): string {
    return this.props.userId
  }

  get groupId(): string | null {
    return this.props.groupId
  }

  get churchId(): string | null {
    return this.props.churchId
  }

  get dayNumber(): number {
    return this.props.dayNumber
  }

  get isRead(): boolean {
    return this.props.isRead
  }

  get checkedAt(): Date | null {
    return this.props.checkedAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  // Business Logic

  /**
   * 읽음으로 표시합니다.
   */
  markAsRead(): ReadingCheck {
    if (this.props.isRead) {
      return this
    }
    return new ReadingCheck({
      ...this.props,
      isRead: true,
      checkedAt: new Date(),
    })
  }

  /**
   * 읽음 해제합니다.
   */
  unmarkAsRead(): ReadingCheck {
    if (!this.props.isRead) {
      return this
    }
    return new ReadingCheck({
      ...this.props,
      isRead: false,
      checkedAt: null,
    })
  }

  /**
   * 읽음 상태를 토글합니다.
   */
  toggleRead(): ReadingCheck {
    return this.props.isRead ? this.unmarkAsRead() : this.markAsRead()
  }

  /**
   * DTO로 변환합니다.
   */
  toDTO(): ReadingCheckProps {
    return { ...this.props }
  }
}

/**
 * 스트릭 계산 유틸리티
 */
export function calculateStreak(checkedDays: number[], today: number = new Date().getDate()): ReadingStreakProps {
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

  // 현재 스트릭 계산
  let currentStreak = 0
  let expectedDay = today

  for (const day of sortedDays) {
    if (day === expectedDay || day === expectedDay - 1) {
      currentStreak++
      expectedDay = day - 1
    } else {
      break
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
    lastReadDate: sortedDays.length > 0 ? new Date() : null, // 간소화
  }
}

/**
 * 진행률 계산 유틸리티
 */
export function calculateProgress(
  checkedDays: number[],
  totalDays: number = 365,
  today: number = 1
): ReadingProgressProps {
  const streak = calculateStreak(checkedDays, today)
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
