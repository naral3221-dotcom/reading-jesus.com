/**
 * GetGuestCommentReplies Use Case
 *
 * 게스트 댓글의 답글 목록을 조회하는 Use Case.
 */

import { GuestCommentReply } from '@/domain/entities/GuestComment'
import { IGuestCommentRepository } from '@/domain/repositories/IGuestCommentRepository'

export interface GetGuestCommentRepliesInput {
  commentId: string
}

export interface GetGuestCommentRepliesOutput {
  replies: GuestCommentReply[]
  error: string | null
}

export class GetGuestCommentReplies {
  constructor(private readonly guestCommentRepository: IGuestCommentRepository) {}

  async execute(input: GetGuestCommentRepliesInput): Promise<GetGuestCommentRepliesOutput> {
    try {
      const replies = await this.guestCommentRepository.findReplies(input.commentId)

      return { replies, error: null }
    } catch (error) {
      return {
        replies: [],
        error: error instanceof Error ? error.message : '답글 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}
