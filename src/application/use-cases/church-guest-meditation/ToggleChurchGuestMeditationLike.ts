/**
 * ToggleGuestCommentLike Use Case
 *
 * 게스트 댓글 좋아요를 토글하는 Use Case.
 */

import { IGuestCommentRepository } from '@/domain/repositories/IChurchGuestMeditationRepository'

export interface ToggleGuestCommentLikeInput {
  commentId: string
  userId: string
}

export interface ToggleGuestCommentLikeOutput {
  isLiked: boolean
  error: string | null
}

export class ToggleGuestCommentLike {
  constructor(private readonly guestCommentRepository: IGuestCommentRepository) {}

  async execute(input: ToggleGuestCommentLikeInput): Promise<ToggleGuestCommentLikeOutput> {
    try {
      const hasLiked = await this.guestCommentRepository.hasLiked(input.commentId, input.userId)

      if (hasLiked) {
        await this.guestCommentRepository.removeLike(input.commentId, input.userId)
        return { isLiked: false, error: null }
      } else {
        await this.guestCommentRepository.addLike(input.commentId, input.userId)
        return { isLiked: true, error: null }
      }
    } catch (error) {
      return {
        isLiked: false,
        error: error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다',
      }
    }
  }
}
