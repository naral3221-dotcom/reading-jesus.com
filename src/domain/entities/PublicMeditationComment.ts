/**
 * PublicMeditationComment Entity
 *
 * 공개 묵상의 댓글 도메인 엔티티.
 */

export type MeditationType = 'group' | 'church' | 'personal'

export interface PublicMeditationCommentProps {
  id: string
  meditationId: string
  meditationType: MeditationType
  userId: string
  content: string
  isAnonymous: boolean
  parentId: string | null
  likesCount: number
  createdAt: Date
  updatedAt: Date
  // 조회 시 조인되는 필드
  authorNickname?: string
  authorAvatarUrl?: string | null
  isLiked?: boolean
  repliesCount?: number
}

export class PublicMeditationComment {
  private constructor(
    public readonly id: string,
    public readonly meditationId: string,
    public readonly meditationType: MeditationType,
    public readonly userId: string,
    public readonly content: string,
    public readonly isAnonymous: boolean,
    public readonly parentId: string | null,
    public readonly likesCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly authorNickname?: string,
    public readonly authorAvatarUrl?: string | null,
    public readonly isLiked?: boolean,
    public readonly repliesCount?: number
  ) {}

  /**
   * PublicMeditationComment 엔티티를 생성합니다.
   * @throws 내용이 비어있으면 에러
   */
  static create(props: PublicMeditationCommentProps): PublicMeditationComment {
    PublicMeditationComment.validateContent(props.content)
    PublicMeditationComment.validateMeditationType(props.meditationType)

    return new PublicMeditationComment(
      props.id,
      props.meditationId,
      props.meditationType,
      props.userId,
      props.content,
      props.isAnonymous,
      props.parentId,
      props.likesCount,
      props.createdAt,
      props.updatedAt,
      props.authorNickname,
      props.authorAvatarUrl,
      props.isLiked,
      props.repliesCount
    )
  }

  private static validateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('댓글 내용은 필수입니다')
    }
    if (content.length > 1000) {
      throw new Error('댓글은 1000자 이하여야 합니다')
    }
  }

  private static validateMeditationType(type: string): void {
    if (!['group', 'church', 'personal'].includes(type)) {
      throw new Error('유효하지 않은 묵상 타입입니다')
    }
  }

  /**
   * 댓글 내용을 수정합니다.
   */
  updateContent(newContent: string): PublicMeditationComment {
    PublicMeditationComment.validateContent(newContent)

    return new PublicMeditationComment(
      this.id,
      this.meditationId,
      this.meditationType,
      this.userId,
      newContent,
      this.isAnonymous,
      this.parentId,
      this.likesCount,
      this.createdAt,
      new Date(),
      this.authorNickname,
      this.authorAvatarUrl,
      this.isLiked,
      this.repliesCount
    )
  }

  /**
   * 답글인지 확인합니다.
   */
  isReply(): boolean {
    return this.parentId !== null
  }

  /**
   * 본인 댓글인지 확인합니다.
   */
  isOwnedBy(userId: string): boolean {
    return this.userId === userId
  }

  /**
   * 표시 이름을 반환합니다.
   */
  getDisplayName(): string {
    return this.isAnonymous ? '익명' : (this.authorNickname ?? '사용자')
  }

  /**
   * DTO 형태로 변환합니다.
   */
  toDTO(): PublicMeditationCommentProps {
    return {
      id: this.id,
      meditationId: this.meditationId,
      meditationType: this.meditationType,
      userId: this.userId,
      content: this.content,
      isAnonymous: this.isAnonymous,
      parentId: this.parentId,
      likesCount: this.likesCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      authorNickname: this.authorNickname,
      authorAvatarUrl: this.authorAvatarUrl,
      isLiked: this.isLiked,
      repliesCount: this.repliesCount,
    }
  }
}
