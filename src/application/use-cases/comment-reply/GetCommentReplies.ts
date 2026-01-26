/**
 * GetCommentReplies Use Case
 *
 * 묵상 댓글의 답글 목록을 조회하는 Use Case.
 */

import { CommentReplyProps } from '@/domain/entities/CommentReply'
import { ICommentReplyRepository } from '@/domain/repositories/ICommentReplyRepository'

export interface GetCommentRepliesInput {
  commentId: string
}

export interface GetCommentRepliesOutput {
  replies: CommentReplyProps[]
  error: string | null
}

export class GetCommentReplies {
  constructor(private readonly commentReplyRepository: ICommentReplyRepository) {}

  async execute(input: GetCommentRepliesInput): Promise<GetCommentRepliesOutput> {
    try {
      const replies = await this.commentReplyRepository.findByCommentId(input.commentId)

      return { replies, error: null }
    } catch (error) {
      return {
        replies: [],
        error: error instanceof Error ? error.message : '답글 조회 중 오류가 발생했습니다',
      }
    }
  }
}
