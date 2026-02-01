/**
 * CreateGuestCommentReply Use Case
 *
 * 게스트 댓글에 답글을 추가하는 Use Case.
 */

import { GuestCommentReply, CreateGuestCommentReplyInput } from '@/domain/entities/ChurchGuestMeditation'
import { IGuestCommentRepository } from '@/domain/repositories/IChurchGuestMeditationRepository'

export interface CreateGuestCommentReplyOutput {
  reply: GuestCommentReply | null
  error: string | null
}

export class CreateGuestCommentReply {
  constructor(private readonly guestCommentRepository: IGuestCommentRepository) {}

  async execute(input: CreateGuestCommentReplyInput): Promise<CreateGuestCommentReplyOutput> {
    try {
      const reply = await this.guestCommentRepository.addReply(input)

      return { reply, error: null }
    } catch (error) {
      return {
        reply: null,
        error: error instanceof Error ? error.message : '답글 추가 중 오류가 발생했습니다',
      }
    }
  }
}
