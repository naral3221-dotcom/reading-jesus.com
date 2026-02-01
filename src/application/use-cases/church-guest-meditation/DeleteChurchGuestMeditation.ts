/**
 * DeleteGuestComment Use Case
 *
 * 게스트 댓글을 삭제하는 Use Case.
 */

import { IGuestCommentRepository } from '@/domain/repositories/IChurchGuestMeditationRepository'

export interface DeleteGuestCommentInput {
  id: string
}

export interface DeleteGuestCommentOutput {
  success: boolean
  error: string | null
}

export class DeleteGuestComment {
  constructor(private readonly guestCommentRepository: IGuestCommentRepository) {}

  async execute(input: DeleteGuestCommentInput): Promise<DeleteGuestCommentOutput> {
    try {
      await this.guestCommentRepository.delete(input.id)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '댓글 삭제 중 오류가 발생했습니다',
      }
    }
  }
}
