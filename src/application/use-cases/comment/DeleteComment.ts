/**
 * DeleteComment Use Case
 *
 * 댓글 삭제
 */

import type { ICommentRepository } from '@/domain/repositories/ICommentRepository'

export interface DeleteCommentOutput {
  success: boolean
  error: string | null
}

export class DeleteComment {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(id: string, userId: string): Promise<DeleteCommentOutput> {
    try {
      await this.commentRepository.delete(id, userId)
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다',
      }
    }
  }
}
