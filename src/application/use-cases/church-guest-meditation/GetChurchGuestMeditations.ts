/**
 * GetGuestComments Use Case
 *
 * 교회의 게스트 댓글 목록을 조회하는 Use Case.
 */

import { GuestComment } from '@/domain/entities/ChurchGuestMeditation'
import { IGuestCommentRepository } from '@/domain/repositories/IChurchGuestMeditationRepository'

export interface GetGuestCommentsInput {
  churchId: string
  dayNumber?: number | null
  limit?: number
  offset?: number
  userId?: string | null // 좋아요 상태 확인용
}

export interface GetGuestCommentsOutput {
  comments: Array<{
    comment: GuestComment
    isLiked: boolean
  }>
  error: string | null
}

export class GetGuestComments {
  constructor(private readonly guestCommentRepository: IGuestCommentRepository) {}

  async execute(input: GetGuestCommentsInput): Promise<GetGuestCommentsOutput> {
    try {
      const comments = await this.guestCommentRepository.findByChurchId({
        churchId: input.churchId,
        dayNumber: input.dayNumber,
        limit: input.limit,
        offset: input.offset,
      })

      // 사용자의 좋아요 상태 확인
      let likedIds: string[] = []
      if (input.userId) {
        likedIds = await this.guestCommentRepository.getLikedCommentIds(
          comments.map((c) => c.id),
          input.userId
        )
      }

      return {
        comments: comments.map((comment) => ({
          comment,
          isLiked: likedIds.includes(comment.id),
        })),
        error: null,
      }
    } catch (error) {
      return {
        comments: [],
        error: error instanceof Error ? error.message : '댓글 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}
