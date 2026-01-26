/**
 * ToggleCommentLike Use Case
 *
 * 공개 묵상 댓글의 좋아요를 토글하는 Use Case.
 */

import { IPublicMeditationCommentRepository } from '@/domain/repositories/IPublicMeditationCommentRepository'

export interface ToggleCommentLikeInput {
  commentId: string
  userId: string
}

export interface ToggleCommentLikeOutput {
  isLiked: boolean
  likesCount: number
  error: string | null
}

export class ToggleCommentLike {
  constructor(
    private readonly commentRepository: IPublicMeditationCommentRepository
  ) {}

  async execute(input: ToggleCommentLikeInput): Promise<ToggleCommentLikeOutput> {
    try {
      const result = await this.commentRepository.toggleLike(
        input.commentId,
        input.userId
      )

      return {
        isLiked: result.isLiked,
        likesCount: result.likesCount,
        error: null,
      }
    } catch (error) {
      return {
        isLiked: false,
        likesCount: 0,
        error: error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다',
      }
    }
  }
}
