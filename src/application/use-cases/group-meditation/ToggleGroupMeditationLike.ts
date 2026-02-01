/**
 * ToggleCommentLike Use Case
 *
 * 댓글 좋아요 토글
 */

import type { ICommentRepository } from '@/domain/repositories/IGroupMeditationRepository'

export interface ToggleCommentLikeOutput {
  isLiked: boolean
  error: string | null
}

export class ToggleCommentLike {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(commentId: string, userId: string): Promise<ToggleCommentLikeOutput> {
    try {
      const isLiked = await this.commentRepository.toggleLike(commentId, userId)
      return { isLiked, error: null }
    } catch (error) {
      return {
        isLiked: false,
        error: error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다',
      }
    }
  }
}
