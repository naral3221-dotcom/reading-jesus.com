/**
 * UpdateGuestComment Use Case
 *
 * 게스트 댓글을 수정하는 Use Case.
 */

import { GuestComment, UpdateGuestCommentInput } from '@/domain/entities/ChurchGuestMeditation'
import { IGuestCommentRepository } from '@/domain/repositories/IChurchGuestMeditationRepository'

export interface UpdateGuestCommentUseCaseInput {
  id: string
  input: UpdateGuestCommentInput
}

export interface UpdateGuestCommentOutput {
  comment: GuestComment | null
  error: string | null
}

export class UpdateGuestComment {
  constructor(private readonly guestCommentRepository: IGuestCommentRepository) {}

  async execute(input: UpdateGuestCommentUseCaseInput): Promise<UpdateGuestCommentOutput> {
    try {
      const comment = await this.guestCommentRepository.update(input.id, input.input)

      return { comment, error: null }
    } catch (error) {
      return {
        comment: null,
        error: error instanceof Error ? error.message : '댓글 수정 중 오류가 발생했습니다',
      }
    }
  }
}
