/**
 * DeleteCommentReply Use Case
 *
 * 댓글 답글 삭제
 */

import type { ICommentRepository } from '@/domain/repositories/ICommentRepository'

export interface DeleteCommentReplyOutput {
  success: boolean
  error: string | null
}

export class DeleteCommentReply {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(id: string, userId: string): Promise<DeleteCommentReplyOutput> {
    try {
      await this.commentRepository.deleteReply(id, userId)
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '답글 삭제 중 오류가 발생했습니다',
      }
    }
  }
}
