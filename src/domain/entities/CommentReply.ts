/**
 * CommentReply Entity
 *
 * 묵상 댓글의 답글 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 */

import type { Profile } from '@/types'

export interface CommentReplyProps {
  id: string
  commentId: string
  userId: string
  content: string
  isAnonymous: boolean
  createdAt: Date
  profile: Pick<Profile, 'nickname' | 'avatar_url'> | null
}

export interface CreateCommentReplyInput {
  commentId: string
  userId: string
  content: string
  isAnonymous?: boolean
}

export class CommentReply {
  private constructor(private readonly props: CommentReplyProps) {}

  /**
   * CommentReply 엔티티를 생성합니다.
   * @throws 내용이 비어있거나 1000자 초과시 에러
   */
  static create(props: CommentReplyProps): CommentReply {
    CommentReply.validate(props)
    return new CommentReply(props)
  }

  private static validate(props: CommentReplyProps): void {
    if (!props.content || props.content.trim().length === 0) {
      throw new Error('답글 내용은 필수입니다.')
    }
    if (props.content.length > 1000) {
      throw new Error('답글 내용은 1000자를 초과할 수 없습니다.')
    }
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

  get profile(): Pick<Profile, 'nickname' | 'avatar_url'> | null {
    return this.props.profile
  }

  // Business Logic

  /**
   * 표시할 이름을 반환합니다. (익명이면 '익명')
   */
  getDisplayName(): string {
    if (this.props.isAnonymous) return '익명'
    return this.props.profile?.nickname || '알 수 없음'
  }

  /**
   * 특정 사용자가 작성자인지 확인합니다.
   */
  isAuthor(userId: string | null): boolean {
    if (!userId) return false
    return this.props.userId === userId
  }

  /**
   * DTO로 변환합니다.
   */
  toDTO(): CommentReplyProps {
    return { ...this.props }
  }
}
