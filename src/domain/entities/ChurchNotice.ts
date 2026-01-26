/**
 * ChurchNotice Entity
 *
 * 교회 공지사항 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 * 외부 의존성 없이 순수 TypeScript로 구현됩니다.
 */

export interface ChurchNoticeProps {
  id: string
  churchId: string
  title: string
  content: string
  isPinned: boolean
  isActive: boolean
  startsAt: Date | null
  endsAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateChurchNoticeInput {
  churchId: string
  title: string
  content: string
  isPinned?: boolean
  isActive?: boolean
  startsAt?: Date | null
  endsAt?: Date | null
}

export class ChurchNotice {
  private constructor(
    public readonly id: string,
    public readonly churchId: string,
    public readonly title: string,
    public readonly content: string,
    public readonly isPinned: boolean,
    public readonly isActive: boolean,
    public readonly startsAt: Date | null,
    public readonly endsAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * ChurchNotice 엔티티를 생성합니다.
   * @throws 제목이나 내용이 유효하지 않으면 에러
   */
  static create(props: ChurchNoticeProps): ChurchNotice {
    ChurchNotice.validateTitle(props.title)
    ChurchNotice.validateContent(props.content)

    return new ChurchNotice(
      props.id,
      props.churchId,
      props.title,
      props.content,
      props.isPinned,
      props.isActive,
      props.startsAt,
      props.endsAt,
      props.createdAt,
      props.updatedAt
    )
  }

  private static validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('공지사항 제목은 필수입니다')
    }
    if (title.length > 200) {
      throw new Error('공지사항 제목은 200자 이내여야 합니다')
    }
  }

  private static validateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('공지사항 내용은 필수입니다')
    }
  }

  /**
   * 공지사항이 현재 표시 가능한지 확인합니다.
   * - isActive가 true
   * - startsAt이 null이거나 현재 시간 이전
   * - endsAt이 null이거나 현재 시간 이후
   */
  isVisible(now: Date = new Date()): boolean {
    if (!this.isActive) {
      return false
    }

    if (this.startsAt && now < this.startsAt) {
      return false
    }

    if (this.endsAt && now > this.endsAt) {
      return false
    }

    return true
  }

  /**
   * 고정 상태를 토글합니다.
   */
  togglePin(): ChurchNotice {
    return new ChurchNotice(
      this.id,
      this.churchId,
      this.title,
      this.content,
      !this.isPinned,
      this.isActive,
      this.startsAt,
      this.endsAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 활성 상태를 토글합니다.
   */
  toggleActive(): ChurchNotice {
    return new ChurchNotice(
      this.id,
      this.churchId,
      this.title,
      this.content,
      this.isPinned,
      !this.isActive,
      this.startsAt,
      this.endsAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 공지사항을 수정합니다.
   */
  update(params: {
    title?: string
    content?: string
    isPinned?: boolean
    isActive?: boolean
    startsAt?: Date | null
    endsAt?: Date | null
  }): ChurchNotice {
    const newTitle = params.title ?? this.title
    const newContent = params.content ?? this.content

    ChurchNotice.validateTitle(newTitle)
    ChurchNotice.validateContent(newContent)

    return new ChurchNotice(
      this.id,
      this.churchId,
      newTitle,
      newContent,
      params.isPinned ?? this.isPinned,
      params.isActive ?? this.isActive,
      params.startsAt !== undefined ? params.startsAt : this.startsAt,
      params.endsAt !== undefined ? params.endsAt : this.endsAt,
      this.createdAt,
      new Date()
    )
  }

  /**
   * DTO 형태로 변환합니다.
   */
  toDTO(): ChurchNoticeProps {
    return {
      id: this.id,
      churchId: this.churchId,
      title: this.title,
      content: this.content,
      isPinned: this.isPinned,
      isActive: this.isActive,
      startsAt: this.startsAt,
      endsAt: this.endsAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
