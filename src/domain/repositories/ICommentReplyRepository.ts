/**
 * CommentReply Repository Interface
 *
 * 묵상 댓글 답글 저장소 인터페이스 정의.
 */

import { CommentReplyProps, CreateCommentReplyInput } from '@/domain/entities/CommentReply'

export interface ICommentReplyRepository {
  /**
   * 특정 댓글의 답글 목록을 조회합니다.
   */
  findByCommentId(commentId: string): Promise<CommentReplyProps[]>

  /**
   * 새 답글을 생성합니다.
   */
  create(input: CreateCommentReplyInput): Promise<CommentReplyProps>

  /**
   * 답글을 삭제합니다.
   */
  delete(replyId: string, userId: string): Promise<void>
}
