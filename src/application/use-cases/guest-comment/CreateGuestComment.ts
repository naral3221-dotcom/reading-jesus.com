/**
 * CreateGuestComment Use Case
 *
 * 새 게스트 댓글을 생성하는 Use Case.
 */

import { GuestComment, CreateGuestCommentInput } from '@/domain/entities/GuestComment'
import { IGuestCommentRepository } from '@/domain/repositories/IGuestCommentRepository'

export interface CreateGuestCommentOutput {
  comment: GuestComment | null
  error: string | null
}

export class CreateGuestComment {
  constructor(private readonly guestCommentRepository: IGuestCommentRepository) {}

  async execute(input: CreateGuestCommentInput): Promise<CreateGuestCommentOutput> {
    try {
      const comment = await this.guestCommentRepository.save(input)

      return { comment, error: null }
    } catch (error) {
      return {
        comment: null,
        error: error instanceof Error ? error.message : '댓글 생성 중 오류가 발생했습니다',
      }
    }
  }
}
