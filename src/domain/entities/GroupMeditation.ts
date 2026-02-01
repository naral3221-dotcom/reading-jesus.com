/**
 * Comment Domain Entity
 *
 * 그룹 묵상 댓글 도메인 엔티티.
 * 교회 게스트 댓글(GuestComment)과 별개.
 */

import type { ContentVisibility } from './PublicMeditation'

/**
 * 댓글 속성
 */
export interface CommentProps {
  id: string
  userId: string
  groupId: string
  dayNumber: number
  content: string
  isAnonymous: boolean
  visibility: ContentVisibility
  likesCount: number
  repliesCount: number
  isPinned: boolean
  createdAt: Date
  updatedAt: Date | null
  // 프로필 정보 (조인 시)
  profile?: {
    nickname: string
    avatarUrl: string | null
  } | null
  // 좋아요 상태 (조회 시)
  isLiked?: boolean
  // 첨부파일
  attachments?: CommentAttachmentProps[]
  // 작성자 등급
  authorRank?: MemberRankProps | null
}

/**
 * 댓글 첨부파일 속성
 */
export interface CommentAttachmentProps {
  id: string
  commentId: string
  fileUrl: string
  fileType: 'image' | 'pdf'
  fileName: string
  fileSize: number
  createdAt: Date
}

/**
 * 멤버 등급 속성
 */
export interface MemberRankProps {
  id: string
  name: string
  color: string
  permissions: {
    can_read: boolean
    can_comment: boolean
    can_create_meeting: boolean
    can_pin_comment: boolean
    can_manage_members: boolean
  }
}

/**
 * 댓글 생성 입력
 */
export interface CreateCommentInput {
  userId: string
  groupId: string
  dayNumber: number
  content: string
  bibleRange?: string
  isAnonymous?: boolean
  visibility?: ContentVisibility
}

/**
 * 댓글 업데이트 입력
 */
export interface UpdateCommentInput {
  content?: string
  visibility?: ContentVisibility
}

/**
 * 댓글 답글 속성
 */
export interface CommentReplyProps {
  id: string
  commentId: string
  userId: string
  content: string
  isAnonymous: boolean
  createdAt: Date
  updatedAt: Date | null
  // 멘션 대상
  mentionUserId?: string | null
  mentionNickname?: string | null
  // 프로필 정보 (조인 시)
  profile?: {
    nickname: string
    avatarUrl: string | null
  } | null
}

/**
 * 댓글 답글 생성 입력
 */
export interface CreateCommentReplyInput {
  commentId: string
  userId: string
  content: string
  isAnonymous?: boolean
  mentionUserId?: string | null
  mentionNickname?: string | null
}

/**
 * Comment 도메인 엔티티 클래스
 */
export class Comment {
  private constructor(private readonly props: CommentProps) {}

  /**
   * 댓글 생성
   */
  static create(props: CommentProps): Comment {
    // 내용 검증
    if (!props.content || props.content.trim().length === 0) {
      throw new Error('댓글 내용을 입력해주세요')
    }

    if (props.content.length > 5000) {
      throw new Error('댓글은 5000자 이내로 작성해주세요')
    }

    return new Comment(props)
  }

  /**
   * DB 레코드에서 엔티티 복원
   */
  static fromPersistence(data: CommentProps): Comment {
    return new Comment(data)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get userId(): string {
    return this.props.userId
  }

  get groupId(): string {
    return this.props.groupId
  }

  get dayNumber(): number {
    return this.props.dayNumber
  }

  get content(): string {
    return this.props.content
  }

  get isAnonymous(): boolean {
    return this.props.isAnonymous
  }

  get visibility(): ContentVisibility {
    return this.props.visibility
  }

  get likesCount(): number {
    return this.props.likesCount
  }

  get repliesCount(): number {
    return this.props.repliesCount
  }

  get isPinned(): boolean {
    return this.props.isPinned
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt
  }

  get profile(): CommentProps['profile'] {
    return this.props.profile
  }

  get isLiked(): boolean {
    return this.props.isLiked ?? false
  }

  get attachments(): CommentAttachmentProps[] {
    return this.props.attachments ?? []
  }

  get authorRank(): MemberRankProps | null {
    return this.props.authorRank ?? null
  }

  /**
   * 표시할 닉네임 (익명 처리 포함)
   */
  get displayName(): string {
    if (this.props.isAnonymous) {
      return '익명'
    }
    return this.props.profile?.nickname ?? '알 수 없음'
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
   * 수정 가능 여부 확인
   */
  canEdit(requesterId: string): boolean {
    return this.props.userId === requesterId
  }

  /**
   * 삭제 가능 여부 확인
   */
  canDelete(requesterId: string, isAdmin: boolean): boolean {
    return this.props.userId === requesterId || isAdmin
  }

  /**
   * 고정 가능 여부 확인
   */
  canPin(permissions: { can_pin_comment: boolean }): boolean {
    return permissions.can_pin_comment
  }

  /**
   * DTO로 변환 (API 응답용)
   */
  toDTO(): CommentProps {
    return { ...this.props }
  }
}

/**
 * CommentReply 도메인 엔티티 클래스
 */
export class CommentReply {
  private constructor(private readonly props: CommentReplyProps) {}

  /**
   * 답글 생성
   */
  static create(props: CommentReplyProps): CommentReply {
    // 내용 검증
    if (!props.content || props.content.trim().length === 0) {
      throw new Error('답글 내용을 입력해주세요')
    }

    if (props.content.length > 1000) {
      throw new Error('답글은 1000자 이내로 작성해주세요')
    }

    return new CommentReply(props)
  }

  /**
   * DB 레코드에서 엔티티 복원
   */
  static fromPersistence(data: CommentReplyProps): CommentReply {
    return new CommentReply(data)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get commentId(): string {
    return this.props.commentId
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

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt
  }

  get mentionUserId(): string | null {
    return this.props.mentionUserId ?? null
  }

  get mentionNickname(): string | null {
    return this.props.mentionNickname ?? null
  }

  get profile(): CommentReplyProps['profile'] {
    return this.props.profile
  }

  /**
   * 표시할 닉네임 (익명 처리 포함)
   */
  get displayName(): string {
    if (this.props.isAnonymous) {
      return '익명'
    }
    return this.props.profile?.nickname ?? '알 수 없음'
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
  canDelete(requesterId: string, isAdmin: boolean): boolean {
    return this.props.userId === requesterId || isAdmin
  }

  /**
   * DTO로 변환
   */
  toDTO(): CommentReplyProps {
    return { ...this.props }
  }
}

// ===== 새 명명 체계 별칭 =====
// GroupMeditation으로 점진적 마이그레이션 지원

/** GroupMeditationProps = CommentProps */
export type GroupMeditationProps = CommentProps

/** GroupMeditationAttachmentProps = CommentAttachmentProps */
export type GroupMeditationAttachmentProps = CommentAttachmentProps

/** CreateGroupMeditationInput = CreateCommentInput */
export type CreateGroupMeditationInput = CreateCommentInput

/** UpdateGroupMeditationInput = UpdateCommentInput */
export type UpdateGroupMeditationInput = UpdateCommentInput

/** GroupMeditationReplyProps = CommentReplyProps */
export type GroupMeditationReplyProps = CommentReplyProps

/** CreateGroupMeditationReplyInput = CreateCommentReplyInput */
export type CreateGroupMeditationReplyInput = CreateCommentReplyInput

/** GroupMeditation = Comment */
export const GroupMeditation = Comment
export type GroupMeditation = Comment

/** GroupMeditationReply = CommentReply */
export const GroupMeditationReply = CommentReply
export type GroupMeditationReply = CommentReply
