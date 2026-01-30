/**
 * PublicMeditation Entity
 * 공개 묵상 도메인 엔티티 (자유/QT/메모 형식 지원)
 */

// 묵상 형식 타입
export type MeditationType = 'free' | 'qt' | 'memo'

// 공개 범위 타입
export type ContentVisibility = 'private' | 'group' | 'church' | 'public'

export interface PublicMeditationProps {
  id: string
  userId: string
  title: string | null
  content: string
  bibleReference: string | null
  isAnonymous: boolean
  visibility: ContentVisibility
  likesCount: number
  repliesCount: number
  createdAt: Date
  updatedAt: Date
  // 개인 프로젝트 연결 필드 (신규)
  projectId: string | null
  dayNumber: number | null
  meditationType: MeditationType
  // QT 형식 전용 필드 (신규)
  oneWord: string | null
  meditationQuestion: string | null
  meditationAnswer: string | null
  gratitude: string | null
  myPrayer: string | null
  dayReview: string | null
  // 조인 데이터
  profile?: {
    nickname: string
    avatarUrl: string | null
  } | null
  isLiked?: boolean
}

export interface PublicMeditationReplyProps {
  id: string
  meditationId: string
  userId: string
  content: string
  isAnonymous: boolean
  parentReplyId: string | null
  mentionUserId: string | null
  mentionNickname: string | null
  createdAt: Date
  updatedAt: Date
  // 조인 데이터
  profile?: {
    nickname: string
    avatarUrl: string | null
  } | null
}

export class PublicMeditation {
  private props: PublicMeditationProps

  constructor(props: PublicMeditationProps) {
    this.props = props
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get userId(): string {
    return this.props.userId
  }

  get title(): string | null {
    return this.props.title
  }

  get content(): string {
    return this.props.content
  }

  get bibleReference(): string | null {
    return this.props.bibleReference
  }

  get isAnonymous(): boolean {
    return this.props.isAnonymous
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

  get profile() {
    return this.props.profile
  }

  get isLiked(): boolean {
    return this.props.isLiked ?? false
  }

  get visibility(): ContentVisibility {
    return this.props.visibility
  }

  get displayName(): string {
    if (this.props.isAnonymous) {
      return '익명'
    }
    return this.props.profile?.nickname ?? '알 수 없는 사용자'
  }

  // 개인 프로젝트 관련 getters
  get projectId(): string | null {
    return this.props.projectId
  }

  get dayNumber(): number | null {
    return this.props.dayNumber
  }

  get meditationType(): MeditationType {
    return this.props.meditationType
  }

  // QT 형식 관련 getters
  get oneWord(): string | null {
    return this.props.oneWord
  }

  get meditationQuestion(): string | null {
    return this.props.meditationQuestion
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

  // 개인 프로젝트 묵상인지 확인
  get isPersonalProject(): boolean {
    return this.props.projectId !== null
  }

  // Methods
  canEdit(requesterId: string): boolean {
    return this.props.userId === requesterId
  }

  canDelete(requesterId: string): boolean {
    return this.props.userId === requesterId
  }

  // Factory method
  static create(props: Omit<PublicMeditationProps, 'id' | 'likesCount' | 'repliesCount' | 'createdAt' | 'updatedAt'>): PublicMeditationProps {
    return {
      ...props,
      id: '', // DB에서 생성
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      // 기본값 보장
      projectId: props.projectId ?? null,
      dayNumber: props.dayNumber ?? null,
      meditationType: props.meditationType ?? 'free',
      visibility: props.visibility ?? 'public',
      oneWord: props.oneWord ?? null,
      meditationQuestion: props.meditationQuestion ?? null,
      meditationAnswer: props.meditationAnswer ?? null,
      gratitude: props.gratitude ?? null,
      myPrayer: props.myPrayer ?? null,
      dayReview: props.dayReview ?? null,
    }
  }

  toProps(): PublicMeditationProps {
    return { ...this.props }
  }
}

export class PublicMeditationReply {
  private props: PublicMeditationReplyProps

  constructor(props: PublicMeditationReplyProps) {
    this.props = props
  }

  get id(): string {
    return this.props.id
  }

  get meditationId(): string {
    return this.props.meditationId
  }

  get userId(): string {
    return this.props.userId
  }

  get content(): string {
    return this.props.content
  }

  get isAnonymous(): boolean {
    return this.props.isAnonymous
  }

  get parentReplyId(): string | null {
    return this.props.parentReplyId
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

  get profile() {
    return this.props.profile
  }

  get displayName(): string {
    if (this.props.isAnonymous) {
      return '익명'
    }
    return this.props.profile?.nickname ?? '알 수 없는 사용자'
  }

  canEdit(requesterId: string): boolean {
    return this.props.userId === requesterId
  }

  canDelete(requesterId: string): boolean {
    return this.props.userId === requesterId
  }

  toProps(): PublicMeditationReplyProps {
    return { ...this.props }
  }
}
