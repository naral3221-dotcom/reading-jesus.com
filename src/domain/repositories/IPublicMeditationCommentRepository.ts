/**
 * IPublicMeditationCommentRepository Interface
 *
 * 공개 묵상 댓글 저장소 인터페이스.
 * 인프라스트럭처 레이어에서 구현됩니다.
 */

import { PublicMeditationComment, MeditationType } from '@/domain/entities/PublicMeditationComment'

export interface CreateCommentInput {
  meditationId: string
  meditationType: MeditationType
  userId: string
  content: string
  isAnonymous?: boolean
  parentId?: string | null
}

export interface GetCommentsInput {
  meditationId: string
  meditationType: MeditationType
  currentUserId?: string
  parentId?: string | null  // null이면 최상위 댓글만
  limit?: number
  offset?: number
}

export interface GetCommentsOutput {
  data: PublicMeditationComment[]
  totalCount: number
  hasMore: boolean
}

export interface IPublicMeditationCommentRepository {
  /**
   * 댓글을 생성합니다.
   */
  create(input: CreateCommentInput): Promise<PublicMeditationComment>

  /**
   * 댓글 목록을 조회합니다.
   */
  getComments(input: GetCommentsInput): Promise<GetCommentsOutput>

  /**
   * 특정 댓글을 조회합니다.
   */
  findById(id: string, currentUserId?: string): Promise<PublicMeditationComment | null>

  /**
   * 댓글을 수정합니다.
   */
  update(id: string, content: string): Promise<PublicMeditationComment>

  /**
   * 댓글을 삭제합니다.
   */
  delete(id: string): Promise<boolean>

  /**
   * 댓글에 좋아요를 토글합니다.
   */
  toggleLike(commentId: string, userId: string): Promise<{ isLiked: boolean; likesCount: number }>

  /**
   * 특정 묵상의 댓글 수를 조회합니다.
   */
  getCommentsCount(meditationId: string, meditationType: MeditationType): Promise<number>
}
