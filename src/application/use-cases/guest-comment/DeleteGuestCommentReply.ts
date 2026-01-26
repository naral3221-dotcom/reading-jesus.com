/**
 * DeleteGuestCommentReply Use Case
 *
 * 게스트 댓글의 답글을 삭제하는 Use Case.
 */

import { IGuestCommentRepository } from '@/domain/repositories/IGuestCommentRepository'

export interface DeleteGuestCommentReplyInput {
  replyId: string
}

export interface DeleteGuestCommentReplyOutput {
  success: boolean
  error: string | null
}

export class DeleteGuestCommentReply {
  constructor(private readonly guestCommentRepository: IGuestCommentRepository) {}

  async execute(input: DeleteGuestCommentReplyInput): Promise<DeleteGuestCommentReplyOutput> {
    try {
      await this.guestCommentRepository.deleteReply(input.replyId)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '답글 삭제 중 오류가 발생했습니다',
      }
    }
  }
}
