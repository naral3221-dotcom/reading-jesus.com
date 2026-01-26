/**
 * UserDailyReading Entity
 *
 * 사용자의 일일 읽기 정보를 나타내는 도메인 엔티티입니다.
 * 다중 플랜을 지원하며, 각 플랜별 오늘의 읽기 범위와 체크 상태를 관리합니다.
 */

export type ReadingPlanType = 'reading_jesus' | 'custom'

export interface AppliedGroup {
  id: string
  name: string
  type: 'church' | 'group'
}

export interface UserDailyReadingProps {
  planId: string
  planName: string
  planType: ReadingPlanType
  dayNumber: number
  bookName: string
  startChapter: number
  endChapter: number
  chapterCount: number
  appliedGroups: AppliedGroup[]
  isChecked: boolean
}

export class UserDailyReading {
  private constructor(private readonly props: UserDailyReadingProps) {}

  static create(props: UserDailyReadingProps): UserDailyReading {
    return new UserDailyReading(props)
  }

  // Getters
  get planId(): string {
    return this.props.planId
  }

  get planName(): string {
    return this.props.planName
  }

  get planType(): ReadingPlanType {
    return this.props.planType
  }

  get dayNumber(): number {
    return this.props.dayNumber
  }

  get bookName(): string {
    return this.props.bookName
  }

  get startChapter(): number {
    return this.props.startChapter
  }

  get endChapter(): number {
    return this.props.endChapter
  }

  get chapterCount(): number {
    return this.props.chapterCount
  }

  get appliedGroups(): AppliedGroup[] {
    return this.props.appliedGroups
  }

  get isChecked(): boolean {
    return this.props.isChecked
  }

  // 읽기 범위 문자열 (예: "창세기 1-4장")
  get readingRange(): string {
    if (this.startChapter === this.endChapter) {
      return `${this.bookName} ${this.startChapter}장`
    }
    return `${this.bookName} ${this.startChapter}-${this.endChapter}장`
  }

  // 체크 상태 업데이트된 새 인스턴스 반환
  withChecked(isChecked: boolean): UserDailyReading {
    return UserDailyReading.create({
      ...this.props,
      isChecked,
    })
  }

  // DTO로 변환 (API 응답 형태)
  toDTO() {
    return {
      plan_id: this.planId,
      plan_name: this.planName,
      plan_type: this.planType,
      day_number: this.dayNumber,
      book_name: this.bookName,
      start_chapter: this.startChapter,
      end_chapter: this.endChapter,
      chapter_count: this.chapterCount,
      applied_groups: this.appliedGroups,
      is_checked: this.isChecked,
    }
  }

  // DTO에서 엔티티 생성
  static fromDTO(dto: {
    plan_id: string
    plan_name: string
    plan_type: string
    day_number: number
    book_name: string
    start_chapter: number
    end_chapter: number
    chapter_count: number
    applied_groups: AppliedGroup[]
    is_checked: boolean
  }): UserDailyReading {
    return UserDailyReading.create({
      planId: dto.plan_id,
      planName: dto.plan_name,
      planType: dto.plan_type as ReadingPlanType,
      dayNumber: dto.day_number,
      bookName: dto.book_name,
      startChapter: dto.start_chapter,
      endChapter: dto.end_chapter,
      chapterCount: dto.chapter_count,
      appliedGroups: dto.applied_groups,
      isChecked: dto.is_checked,
    })
  }
}
