/**
 * DeleteComment Use Case
 *
 * 공개 묵상의 댓글을 삭제하는 Use Case.
 */

import { IPublicMeditationCommentRepository } from '@/domain/repositories/IPublicMeditationCommentRepository'

export interface DeleteCommentInput {
  commentId: string
  userId: string
}

export interface DeleteCommentOutput {
  success: boolean
  error: string | null
}

export class DeleteComment {
  constructor(
    private readonly commentRepository: IPublicMeditationCommentRepository
  ) {}

  async execute(input: DeleteCommentInput): Promise<DeleteCommentOutput> {
    try {
      // 댓글 존재 및 권한 확인
      const comment = await this.commentRepository.findById(input.commentId)

      if (!comment) {
        return { success: false, error: '댓글을 찾을 수 없습니다' }
      }

      if (comment.userId !== input.userId) {
        return { success: false, error: '삭제 권한이 없습니다' }
      }

      await this.commentRepository.delete(input.commentId)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다',
      }
    }
  }
}
