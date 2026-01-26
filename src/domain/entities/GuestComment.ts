/**
 * GuestComment Entity
 *
 * 교회 게스트 댓글(짧은 묵상) 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 */

export interface GuestCommentProps {
  id: string
  churchId: string
  guestToken: string | null
  guestName: string
  content: string
  bibleRange: string | null
  dayNumber: number | null
  linkedUserId: string | null
  isAnonymous: boolean
  isPinned: boolean
  likesCount: number
  repliesCount: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateGuestCommentInput {
  churchId: string
  guestToken?: string | null
  guestName: string
  content: string
  bibleRange?: string | null
  dayNumber?: number | null
  linkedUserId?: string | null
  isAnonymous?: boolean
}

export interface UpdateGuestCommentInput {
  guestName?: string
  content?: string
  bibleRange?: string | null
  isAnonymous?: boolean
}

// 댓글 답글
export interface GuestCommentReplyProps {
  id: string
  commentId: string
  userId: string | null
  deviceId: string | null
  guestName: string
  content: string
  isAnonymous: boolean
  createdAt: Date
}

export interface CreateGuestCommentReplyInput {
  commentId: string
  userId?: string | null
  deviceId?: string | null
  guestName: string
  content: string
  isAnonymous?: boolean
}

// 댓글 좋아요
export interface GuestCommentLikeProps {
  id: string
  commentId: string
  userId: string
  createdAt: Date
}

export class GuestComment {
  private constructor(private readonly props: GuestCommentProps) {}

  /**
   * GuestComment 엔티티를 생성합니다.
   * @throws 닉네임이 비어있거나 30자 초과시 에러
   * @throws 내용이 비어있거나 3000자 초과시 에러
   */
  static create(props: GuestCommentProps): GuestComment {
    GuestComment.validate(props)
    return new GuestComment(props)
  }

  private static validate(props: GuestCommentProps): void {
    if (!props.guestName || props.guestName.trim().length === 0) {
      throw new Error('닉네임은 필수입니다.')
    }
    if (props.guestName.length > 30) {
      throw new Error('닉네임은 30자를 초과할 수 없습니다.')
    }
    if (!props.content || props.content.trim().length === 0) {
      throw new Error('내용은 필수입니다.')
    }
    if (props.content.length > 3000) {
      throw new Error('내용은 3000자를 초과할 수 없습니다.')
    }
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get churchId(): string {
    return this.props.churchId
  }

  get guestToken(): string | null {
    return this.props.guestToken
  }

  get guestName(): string {
    return this.props.guestName
  }

  get content(): string {
    return this.props.content
  }

  get bibleRange(): string | null {
    return this.props.bibleRange
  }

  get dayNumber(): number | null {
    return this.props.dayNumber
  }

  get linkedUserId(): string | null {
    return this.props.linkedUserId
  }

  get isAnonymous(): boolean {
    return this.props.isAnonymous
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
   * 댓글을 수정합니다.
   */
  update(input: UpdateGuestCommentInput): GuestComment {
    const newProps = {
      ...this.props,
      guestName: input.guestName !== undefined ? input.guestName : this.props.guestName,
      content: input.content !== undefined ? input.content : this.props.content,
      bibleRange: input.bibleRange !== undefined ? input.bibleRange : this.props.bibleRange,
      isAnonymous: input.isAnonymous !== undefined ? input.isAnonymous : this.props.isAnonymous,
      updatedAt: new Date(),
    }
    GuestComment.validate(newProps)
    return new GuestComment(newProps)
  }

  /**
   * 고정 상태를 토글합니다.
   */
  togglePin(): GuestComment {
    return new GuestComment({
      ...this.props,
      isPinned: !this.props.isPinned,
      updatedAt: new Date(),
    })
  }

  /**
   * 좋아요 수를 증가시킵니다.
   */
  incrementLikes(): GuestComment {
    return new GuestComment({
      ...this.props,
      likesCount: this.props.likesCount + 1,
    })
  }

  /**
   * 좋아요 수를 감소시킵니다.
   */
  decrementLikes(): GuestComment {
    return new GuestComment({
      ...this.props,
      likesCount: Math.max(0, this.props.likesCount - 1),
    })
  }

  /**
   * 답글 수를 증가시킵니다.
   */
  incrementReplies(): GuestComment {
    return new GuestComment({
      ...this.props,
      repliesCount: this.props.repliesCount + 1,
    })
  }

  /**
   * 답글 수를 감소시킵니다.
   */
  decrementReplies(): GuestComment {
    return new GuestComment({
      ...this.props,
      repliesCount: Math.max(0, this.props.repliesCount - 1),
    })
  }

  /**
   * 특정 사용자가 작성자인지 확인합니다.
   */
  isAuthor(userId: string | null, guestToken: string | null): boolean {
    if (userId && this.props.linkedUserId) {
      return this.props.linkedUserId === userId
    }
    if (guestToken && this.props.guestToken) {
      return this.props.guestToken === guestToken
    }
    return false
  }

  /**
   * 표시할 이름을 반환합니다. (익명이면 '익명')
   */
  getDisplayName(): string {
    return this.props.isAnonymous ? '익명' : this.props.guestName
  }

  /**
   * DTO로 변환합니다.
   */
  toDTO(): GuestCommentProps {
    return { ...this.props }
  }
}

export class GuestCommentReply {
  private constructor(private readonly props: GuestCommentReplyProps) {}

  static create(props: GuestCommentReplyProps): GuestCommentReply {
    GuestCommentReply.validate(props)
    return new GuestCommentReply(props)
  }

  private static validate(props: GuestCommentReplyProps): void {
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

  get commentId(): string {
    return this.props.commentId
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

  toDTO(): GuestCommentReplyProps {
    return { ...this.props }
  }
}
