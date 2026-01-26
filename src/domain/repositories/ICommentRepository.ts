/**
 * Comment Repository Interface
 *
 * 그룹 묵상 댓글 저장소 인터페이스.
 */

import type {
  CommentProps,
  CreateCommentInput,
  UpdateCommentInput,
  CommentReplyProps,
  CreateCommentReplyInput,
} from '../entities/Comment'

/**
 * 댓글 검색 파라미터
 */
export interface CommentSearchParams {
  groupId: string
  dayNumber: number
  userId?: string // 좋아요 상태 확인용
  filter?: 'all' | 'mine' | 'pinned'
  limit?: number
  offset?: number
}

/**
 * 댓글 (좋아요 상태 포함)
 */
export interface CommentWithLikeStatus extends CommentProps {
  isLiked: boolean
}

/**
 * 댓글 저장소 인터페이스
 */
export interface ICommentRepository {
  /**
   * 그룹/Day별 댓글 조회
   */
  findByGroupAndDay(params: CommentSearchParams): Promise<CommentWithLikeStatus[]>

  /**
   * 댓글 ID로 조회
   */
  findById(id: string, userId?: string): Promise<CommentWithLikeStatus | null>

  /**
   * 사용자의 댓글 조회
   */
  findByUserId(userId: string, groupId?: string): Promise<CommentProps[]>

  /**
   * 댓글 생성
   */
  create(input: CreateCommentInput): Promise<CommentProps>

  /**
   * 댓글 수정
   */
  update(id: string, userId: string, input: UpdateCommentInput): Promise<CommentProps>

  /**
   * 댓글 삭제
   */
  delete(id: string, userId: string): Promise<void>

  /**
   * 좋아요 토글
   */
  toggleLike(commentId: string, userId: string): Promise<boolean>

  /**
   * 고정 토글
   */
  togglePin(commentId: string): Promise<boolean>

  /**
   * 댓글의 답글 조회
   */
  findReplies(commentId: string): Promise<CommentReplyProps[]>

  /**
   * 답글 생성
   */
  createReply(input: CreateCommentReplyInput): Promise<CommentReplyProps>

  /**
   * 답글 수정
   */
  updateReply(id: string, userId: string, content: string): Promise<CommentReplyProps>

  /**
   * 답글 삭제
   */
  deleteReply(id: string, userId: string): Promise<void>

  /**
   * 댓글 수 조회
   */
  getCount(groupId: string, dayNumber: number): Promise<number>

  /**
   * 사용자의 댓글 수 조회
   */
  getUserCommentCount(userId: string, groupId?: string): Promise<number>
}
