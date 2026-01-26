/**
 * DeleteCommentReply Use Case
 *
 * 묵상 댓글의 답글을 삭제하는 Use Case.
 */

import { ICommentReplyRepository } from '@/domain/repositories/ICommentReplyRepository'

export interface DeleteCommentReplyInput {
  replyId: string
  userId: string
}

export interface DeleteCommentReplyOutput {
  success: boolean
  error: string | null
}

export class DeleteCommentReply {
  constructor(private readonly commentReplyRepository: ICommentReplyRepository) {}

  async execute(input: DeleteCommentReplyInput): Promise<DeleteCommentReplyOutput> {
    try {
      await this.commentReplyRepository.delete(input.replyId, input.userId)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '답글 삭제 중 오류가 발생했습니다',
      }
    }
  }
}
