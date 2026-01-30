/**
 * UnifiedMeditation Domain Entity
 *
 * 통합 묵상 도메인 엔티티.
 * 그룹 묵상(comments), 교회 묵상(guest_comments), QT 나눔(church_qt_posts)을 통합.
 */

import type { ContentVisibility } from './PublicMeditation'

export type SourceType = 'group' | 'church'
export type ContentType = 'free' | 'qt'

/**
 * 통합 묵상 속성
 */
export interface UnifiedMeditationProps {
  id: string
  userId: string | null // 게스트 작성 시 null
  guestToken: string | null // 게스트 토큰 (device_id)
  authorName: string
  sourceType: SourceType
  sourceId: string // group_id 또는 church_id
  contentType: ContentType
  dayNumber: number | null
  content: string | null // 자유 묵상 내용
  bibleRange: string | null
  // QT 전용 필드
  qtDate: Date | null
  mySentence: string | null
  meditationAnswer: string | null
  gratitude: string | null
  myPrayer: string | null
  dayReview: string | null
  // 상태
  isAnonymous: boolean
  visibility: ContentVisibility
  isPinned: boolean
  likesCount: number
  repliesCount: number
  createdAt: Date
  updatedAt: Date | null
  // 조인 데이터
  profile?: {
    nickname: string
    avatarUrl: string | null
  } | null
  // 좋아요 상태
  isLiked?: boolean
  // 출처 정보 (조인 시)
  sourceName?: string // 그룹명 또는 교회명
}

/**
 * 통합 묵상 생성 입력
 */
export interface CreateUnifiedMeditationInput {
  userId?: string | null
  guestToken?: string | null
  authorName: string
  sourceType: SourceType
  sourceId: string
  contentType: ContentType
  dayNumber?: number | null
  content?: string | null
  bibleRange?: string | null
  // QT 전용
  qtDate?: Date | null
  mySentence?: string | null
  meditationAnswer?: string | null
  gratitude?: string | null
  myPrayer?: string | null
  dayReview?: string | null
  isAnonymous?: boolean
  visibility?: ContentVisibility
}

/**
 * 통합 묵상 수정 입력
 */
export interface UpdateUnifiedMeditationInput {
  content?: string | null
  bibleRange?: string | null
  // QT 전용
  mySentence?: string | null
  meditationAnswer?: string | null
  gratitude?: string | null
  myPrayer?: string | null
  dayReview?: string | null
  isAnonymous?: boolean
  visibility?: ContentVisibility
}

/**
 * 통합 묵상 답글 속성
 */
export interface UnifiedMeditationReplyProps {
  id: string
  meditationId: string
  userId: string | null
  guestToken: string | null
  authorName: string
  content: string
  isAnonymous: boolean
  mentionUserId: string | null
  mentionNickname: string | null
  createdAt: Date
  updatedAt: Date | null
  // 조인 데이터
  profile?: {
    nickname: string
    avatarUrl: string | null
  } | null
}

/**
 * 통합 묵상 답글 생성 입력
 */
export interface CreateUnifiedMeditationReplyInput {
  meditationId: string
  userId?: string | null
  guestToken?: string | null
  authorName: string
  content: string
  isAnonymous?: boolean
  mentionUserId?: string | null
  mentionNickname?: string | null
}

/**
 * UnifiedMeditation 도메인 엔티티 클래스
 */
export class UnifiedMeditation {
  private constructor(private readonly props: UnifiedMeditationProps) {}

  /**
   * 묵상 생성
   */
  static create(props: UnifiedMeditationProps): UnifiedMeditation {
    UnifiedMeditation.validate(props)
    return new UnifiedMeditation(props)
  }

  /**
   * DB 레코드에서 엔티티 복원
   */
  static fromPersistence(data: UnifiedMeditationProps): UnifiedMeditation {
    return new UnifiedMeditation(data)
  }

  private static validate(props: UnifiedMeditationProps): void {
    // 자유 묵상인 경우 content 필수
    if (props.contentType === 'free') {
      if (!props.content || props.content.trim().length === 0) {
        throw new Error('묵상 내용을 입력해주세요')
      }
      if (props.content.length > 5000) {
        throw new Error('묵상은 5000자 이내로 작성해주세요')
      }
    }

    // QT인 경우 최소 하나의 필드는 있어야 함
    if (props.contentType === 'qt') {
      const hasContent =
        props.mySentence ||
        props.meditationAnswer ||
        props.gratitude ||
        props.myPrayer ||
        props.dayReview
      if (!hasContent) {
        throw new Error('QT 내용을 하나 이상 입력해주세요')
      }
    }

    // 작성자 정보 확인
    if (!props.userId && !props.guestToken) {
      throw new Error('작성자 정보가 필요합니다')
    }

    // dayNumber 유효성
    if (props.dayNumber !== null && (props.dayNumber < 1 || props.dayNumber > 365)) {
      throw new Error('dayNumber는 1~365 사이여야 합니다')
    }
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get userId(): string | null {
    return this.props.userId
  }

  get guestToken(): string | null {
    return this.props.guestToken
  }

  get authorName(): string {
    return this.props.authorName
  }

  get sourceType(): SourceType {
    return this.props.sourceType
  }

  get sourceId(): string {
    return this.props.sourceId
  }

  get contentType(): ContentType {
    return this.props.contentType
  }

  get dayNumber(): number | null {
    return this.props.dayNumber
  }

  get content(): string | null {
    return this.props.content
  }

  get bibleRange(): string | null {
    return this.props.bibleRange
  }

  get qtDate(): Date | null {
    return this.props.qtDate
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

  get updatedAt(): Date | null {
    return this.props.updatedAt
  }

  get profile(): UnifiedMeditationProps['profile'] {
    return this.props.profile
  }

  get isLiked(): boolean {
    return this.props.isLiked ?? false
  }

  get sourceName(): string | undefined {
    return this.props.sourceName
  }

  /**
   * 표시할 닉네임 (익명 처리 포함)
   */
  get displayName(): string {
    if (this.props.isAnonymous) {
      return '익명'
    }
    return this.props.profile?.nickname ?? this.props.authorName ?? '알 수 없음'
  }

  /**
   * 아바타 URL (익명일 경우 null)
   */
  get displayAvatarUrl(): string | null {
    if (this.props.isAnonymous) {
      return null
    }
    return this.props.profile?.avatarUrl ?? null
  }

  /**
   * 출처 표시 텍스트
   */
  get sourceLabel(): string {
    if (this.props.sourceName) {
      return this.props.sourceName
    }
    return this.props.sourceType === 'group' ? '그룹' : '교회'
  }

  /**
   * QT인지 확인
   */
  get isQT(): boolean {
    return this.props.contentType === 'qt'
  }

  /**
   * 로그인 사용자의 작성인지 확인
   */
  isAuthor(userId: string | null, guestToken: string | null): boolean {
    if (userId && this.props.userId === userId) {
      return true
    }
    if (guestToken && this.props.guestToken === guestToken && !this.props.userId) {
      return true
    }
    return false
  }

  /**
   * 수정 가능 여부 확인
   */
  canEdit(userId: string | null, guestToken: string | null): boolean {
    return this.isAuthor(userId, guestToken)
  }

  /**
   * 삭제 가능 여부 확인
   */
  canDelete(userId: string | null, guestToken: string | null, isAdmin: boolean): boolean {
    return this.isAuthor(userId, guestToken) || isAdmin
  }

  /**
   * 고정 가능 여부 확인 (관리자만)
   */
  canPin(isAdmin: boolean): boolean {
    return isAdmin
  }

  /**
   * DTO로 변환 (API 응답용)
   */
  toDTO(): UnifiedMeditationProps {
    return { ...this.props }
  }
}

/**
 * UnifiedMeditationReply 도메인 엔티티 클래스
 */
export class UnifiedMeditationReply {
  private constructor(private readonly props: UnifiedMeditationReplyProps) {}

  /**
   * 답글 생성
   */
  static create(props: UnifiedMeditationReplyProps): UnifiedMeditationReply {
    UnifiedMeditationReply.validate(props)
    return new UnifiedMeditationReply(props)
  }

  /**
   * DB 레코드에서 엔티티 복원
   */
  static fromPersistence(data: UnifiedMeditationReplyProps): UnifiedMeditationReply {
    return new UnifiedMeditationReply(data)
  }

  private static validate(props: UnifiedMeditationReplyProps): void {
    if (!props.content || props.content.trim().length === 0) {
      throw new Error('답글 내용을 입력해주세요')
    }
    if (props.content.length > 1000) {
      throw new Error('답글은 1000자 이내로 작성해주세요')
    }
    if (!props.userId && !props.guestToken) {
      throw new Error('작성자 정보가 필요합니다')
    }
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get meditationId(): string {
    return this.props.meditationId
  }

  get userId(): string | null {
    return this.props.userId
  }

  get guestToken(): string | null {
    return this.props.guestToken
  }

  get authorName(): string {
    return this.props.authorName
  }

  get content(): string {
    return this.props.content
  }

  get isAnonymous(): boolean {
    return this.props.isAnonymous
  }

  get mentionUserId(): string | null {
    return this.props.mentionUserId
  }

  get mentionNickname(): string | null {
    return this.props.mentionNickname
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt
  }

  get profile(): UnifiedMeditationReplyProps['profile'] {
    return this.props.profile
  }

  /**
   * 표시할 닉네임 (익명 처리 포함)
   */
  get displayName(): string {
    if (this.props.isAnonymous) {
      return '익명'
    }
    return this.props.profile?.nickname ?? this.props.authorName ?? '알 수 없음'
  }

  /**
   * 로그인 사용자의 작성인지 확인
   */
  isAuthor(userId: string | null, guestToken: string | null): boolean {
    if (userId && this.props.userId === userId) {
      return true
    }
    if (guestToken && this.props.guestToken === guestToken && !this.props.userId) {
      return true
    }
    return false
  }

  /**
   * 수정 가능 여부 확인
   */
  canEdit(userId: string | null, guestToken: string | null): boolean {
    return this.isAuthor(userId, guestToken)
  }

  /**
   * 삭제 가능 여부 확인
   */
  canDelete(userId: string | null, guestToken: string | null, isAdmin: boolean): boolean {
    return this.isAuthor(userId, guestToken) || isAdmin
  }

  /**
   * DTO로 변환
   */
  toDTO(): UnifiedMeditationReplyProps {
    return { ...this.props }
  }
}
