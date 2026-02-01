/**
 * ToggleCommentPin Use Case
 *
 * 댓글 고정 토글
 */

import type { ICommentRepository } from '@/domain/repositories/IGroupMeditationRepository'

export interface ToggleCommentPinOutput {
  isPinned: boolean
  error: string | null
}

export class ToggleCommentPin {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(commentId: string): Promise<ToggleCommentPinOutput> {
    try {
      const isPinned = await this.commentRepository.togglePin(commentId)
      return { isPinned, error: null }
    } catch (error) {
      return {
        isPinned: false,
        error: error instanceof Error ? error.message : '고정 처리 중 오류가 발생했습니다',
      }
    }
  }
}
