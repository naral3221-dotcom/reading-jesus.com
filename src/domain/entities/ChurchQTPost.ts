/**
 * ChurchQTPost Entity
 *
 * 교회 QT 나눔 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 */

import type { ContentVisibility } from './PublicMeditation'

export interface ChurchQTPostProps {
  id: string
  churchId: string
  authorName: string
  qtDate: string
  dayNumber: number | null
  mySentence: string | null
  meditationAnswer: string | null // JSON 문자열 또는 단일 답변
  gratitude: string | null
  myPrayer: string | null
  dayReview: string | null
  userId: string | null
  isAnonymous: boolean
  visibility: ContentVisibility
  isPinned: boolean
  likesCount: number
  repliesCount: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateChurchQTPostInput {
  churchId: string
  authorName: string
  qtDate: string
  dayNumber?: number | null
  mySentence?: string | null
  meditationAnswer?: string | null
  gratitude?: string | null
  myPrayer?: string | null
  dayReview?: string | null
  userId?: string | null
  isAnonymous?: boolean
  visibility?: ContentVisibility
}

export interface UpdateChurchQTPostInput {
  authorName?: string
  mySentence?: string | null
  meditationAnswer?: string | null
  gratitude?: string | null
  myPrayer?: string | null
  dayReview?: string | null
  isAnonymous?: boolean
  visibility?: ContentVisibility
  qtDate?: string
  dayNumber?: number | null
}

// QT 답글
export interface ChurchQTPostReplyProps {
  id: string
  postId: string
  userId: string | null
  deviceId: string | null
  guestName: string
  content: string
  isAnonymous: boolean
  createdAt: Date
}

export interface CreateChurchQTPostReplyInput {
  postId: string
  userId?: string | null
  deviceId?: string | null
  guestName: string
  content: string
  isAnonymous?: boolean
}

// QT 좋아요
export interface ChurchQTPostLikeProps {
  id: string
  postId: string
  userId: string
  createdAt: Date
}

export class ChurchQTPost {
  private constructor(private readonly props: ChurchQTPostProps) {}

  /**
   * ChurchQTPost 엔티티를 생성합니다.
   * @throws 작성자 이름이 비어있거나 30자 초과시 에러
   */
  static create(props: ChurchQTPostProps): ChurchQTPost {
    ChurchQTPost.validate(props)
    return new ChurchQTPost(props)
  }

  private static validate(props: ChurchQTPostProps): void {
    if (!props.authorName || props.authorName.trim().length === 0) {
      throw new Error('작성자 이름은 필수입니다.')
    }
    if (props.authorName.length > 30) {
      throw new Error('작성자 이름은 30자를 초과할 수 없습니다.')
    }
    if (!props.qtDate) {
      throw new Error('QT 날짜는 필수입니다.')
    }
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get churchId(): string {
    return this.props.churchId
  }

  get authorName(): string {
    return this.props.authorName
  }

  get qtDate(): string {
    return this.props.qtDate
  }

  get dayNumber(): number | null {
    return this.props.dayNumber
  }

  get mySentence(): string | null {
    return this.props.mySentence
  }

  get meditationAnswer(): string | null {
    return this.props.meditationAnswer
  }

  get gratitude(): string | null {
    return this.props.gratitude
  }

  get myPrayer(): string | null {
    return this.props.myPrayer
  }

  get dayReview(): string | null {
    return this.props.dayReview
  }

  get userId(): string | null {
    return this.props.userId
  }

  get isAnonymous(): boolean {
    return this.props.isAnonymous
  }

  get visibility(): ContentVisibility {
    return this.props.visibility
  }

  get isPinned(): boolean {
    return this.props.isPinned
  }

  get likesCount(): number {
    return this.props.likesCount
  }

  get repliesCount(): number {
    return this.props.repliesCount
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Business Logic

  /**
   * 묵상 답변을 배열로 파싱합니다.
   */
  getMeditationAnswers(): string[] {
    if (!this.props.meditationAnswer) return []

    try {
      const parsed = JSON.parse(this.props.meditationAnswer)
      return Array.isArray(parsed) ? parsed : [this.props.meditationAnswer]
    } catch {
      // JSON이 아니면 단일 문자열로 처리
      return [this.props.meditationAnswer]
    }
  }

  /**
   * QT가 작성되었는지 확인합니다. (최소 하나의 내용이 있어야 함)
   */
  hasContent(): boolean {
    return !!(
      this.props.mySentence ||
      this.props.meditationAnswer ||
      this.props.gratitude ||
      this.props.myPrayer ||
      this.props.dayReview
    )
  }

  /**
   * 특정 사용자가 작성자인지 확인합니다.
   */
  isAuthor(userId: string | null): boolean {
    if (!userId || !this.props.userId) return false
    return this.props.userId === userId
  }

  /**
   * 표시할 이름을 반환합니다. (익명이면 '익명')
   */
  getDisplayName(): string {
    return this.props.isAnonymous ? '익명' : this.props.authorName
  }

  /**
   * 고정 상태를 토글합니다.
   */
  togglePin(): ChurchQTPost {
    return new ChurchQTPost({
      ...this.props,
      isPinned: !this.props.isPinned,
      updatedAt: new Date(),
    })
  }

  /**
   * 좋아요 수를 증가시킵니다.
   */
  incrementLikes(): ChurchQTPost {
    return new ChurchQTPost({
      ...this.props,
      likesCount: this.props.likesCount + 1,
    })
  }

  /**
   * 좋아요 수를 감소시킵니다.
   */
  decrementLikes(): ChurchQTPost {
    return new ChurchQTPost({
      ...this.props,
      likesCount: Math.max(0, this.props.likesCount - 1),
    })
  }

  /**
   * DTO로 변환합니다.
   */
  toDTO(): ChurchQTPostProps {
    return { ...this.props }
  }
}

export class ChurchQTPostReply {
  private constructor(private readonly props: ChurchQTPostReplyProps) {}

  static create(props: ChurchQTPostReplyProps): ChurchQTPostReply {
    ChurchQTPostReply.validate(props)
    return new ChurchQTPostReply(props)
  }

  private static validate(props: ChurchQTPostReplyProps): void {
    if (!props.guestName || props.guestName.trim().length === 0) {
      throw new Error('닉네임은 필수입니다.')
    }
    if (props.guestName.length > 30) {
      throw new Error('닉네임은 30자를 초과할 수 없습니다.')
    }
    if (!props.content || props.content.trim().length === 0) {
      throw new Error('답글 내용은 필수입니다.')
    }
    if (props.content.length > 1000) {
      throw new Error('답글 내용은 1000자를 초과할 수 없습니다.')
    }
  }

  get id(): string {
    return this.props.id
  }

  get postId(): string {
    return this.props.postId
  }

  get userId(): string | null {
    return this.props.userId
  }

  get deviceId(): string | null {
    return this.props.deviceId
  }

  get guestName(): string {
    return this.props.guestName
  }

  get content(): string {
    return this.props.content
  }

  get isAnonymous(): boolean {
    return this.props.isAnonymous
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  getDisplayName(): string {
    return this.props.isAnonymous ? '익명' : this.props.guestName
  }

  isAuthor(userId: string | null, deviceId: string | null): boolean {
    if (userId && this.props.userId) {
      return this.props.userId === userId
    }
    if (deviceId && this.props.deviceId) {
      return this.props.deviceId === deviceId
    }
    return false
  }

  toDTO(): ChurchQTPostReplyProps {
    return { ...this.props }
  }
}
