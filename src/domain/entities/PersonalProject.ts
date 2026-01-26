/**
 * PersonalProject Domain Entity
 *
 * 개인 성경 읽기 프로젝트 도메인 엔티티.
 */

/**
 * 읽기 플랜 유형
 */
export type PersonalReadingPlanType = '365' | '180' | '90'

/**
 * 개인 프로젝트 속성
 */
export interface PersonalProjectProps {
  id: string
  userId: string
  name: string
  readingPlanType: PersonalReadingPlanType
  startDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date | null
}

/**
 * 개인 프로젝트 생성 입력
 */
export interface CreatePersonalProjectInput {
  userId: string
  name: string
  readingPlanType: PersonalReadingPlanType
  startDate: Date
}

/**
 * 개인 프로젝트 업데이트 입력
 */
export interface UpdatePersonalProjectInput {
  name?: string
  isActive?: boolean
}

/**
 * 개인 프로젝트 체크 속성
 */
export interface PersonalDailyCheckProps {
  id: string
  projectId: string
  dayNumber: number
  isRead: boolean
  checkedAt: Date | null
  createdAt: Date
}

/**
 * 개인 프로젝트 체크 생성 입력
 */
export interface CreatePersonalDailyCheckInput {
  projectId: string
  dayNumber: number
}

/**
 * 개인 프로젝트 + 통계
 */
export interface PersonalProjectWithStats extends PersonalProjectProps {
  completedDays: number
  totalDays: number
  progressPercentage: number
  currentDay: number
  currentStreak: number
}

/**
 * 플랜 유형별 총 일수 반환
 */
export function getPlanTotalDays(planType: PersonalReadingPlanType): number {
  switch (planType) {
    case '365':
      return 365
    case '180':
      return 180
    case '90':
      return 90
    default:
      return 365
  }
}

/**
 * 현재 Day 계산
 */
export function calculateCurrentDay(startDate: Date, planType: PersonalReadingPlanType): number {
  const totalDays = getPlanTotalDays(planType)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const diffTime = today.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

  return Math.max(1, Math.min(diffDays, totalDays))
}

/**
 * 스트릭 계산
 */
export function calculatePersonalStreak(checkedDays: number[], currentDay: number): number {
  if (checkedDays.length === 0) return 0

  const sortedDays = [...checkedDays].sort((a, b) => b - a)
  let streak = 0

  // 오늘 또는 어제부터 연속 체크 확인
  for (let day = currentDay; day >= 1; day--) {
    if (sortedDays.includes(day)) {
      streak++
    } else if (streak > 0) {
      break
    }
  }

  return streak
}

/**
 * PersonalProject 도메인 엔티티 클래스
 */
export class PersonalProject {
  private constructor(private readonly props: PersonalProjectProps) {}

  /**
   * 프로젝트 생성
   */
  static create(props: PersonalProjectProps): PersonalProject {
    // 이름 검증
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('프로젝트 이름을 입력해주세요')
    }

    if (props.name.length > 50) {
      throw new Error('프로젝트 이름은 50자 이내로 입력해주세요')
    }

    return new PersonalProject(props)
  }

  /**
   * DB 레코드에서 엔티티 복원
   */
  static fromPersistence(data: PersonalProjectProps): PersonalProject {
    return new PersonalProject(data)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get userId(): string {
    return this.props.userId
  }

  get name(): string {
    return this.props.name
  }

  get readingPlanType(): PersonalReadingPlanType {
    return this.props.readingPlanType
  }

  get startDate(): Date {
    return this.props.startDate
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt
  }

  /**
   * 총 일수
   */
  get totalDays(): number {
    return getPlanTotalDays(this.props.readingPlanType)
  }

  /**
   * 현재 Day
   */
  get currentDay(): number {
    return calculateCurrentDay(this.props.startDate, this.props.readingPlanType)
  }

  /**
   * 수정 가능 여부 확인
   */
  canEdit(requesterId: string): boolean {
    return this.props.userId === requesterId
  }

  /**
   * 삭제 가능 여부 확인
   */
  canDelete(requesterId: string): boolean {
    return this.props.userId === requesterId
  }

  /**
   * DTO로 변환
   */
  toDTO(): PersonalProjectProps {
    return { ...this.props }
  }
}
