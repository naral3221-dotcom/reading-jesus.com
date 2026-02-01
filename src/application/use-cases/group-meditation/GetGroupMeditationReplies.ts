/**
 * GetCommentReplies Use Case
 *
 * 댓글의 답글 목록 조회
 */

import type { ICommentRepository } from '@/domain/repositories/IGroupMeditationRepository'
import type { CommentReplyProps } from '@/domain/entities/GroupMeditation'

export interface GetCommentRepliesOutput {
  replies: CommentReplyProps[]
  error: string | null
}

export class GetCommentReplies {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(commentId: string): Promise<GetCommentRepliesOutput> {
    try {
      const replies = await this.commentRepository.findReplies(commentId)
      return { replies, error: null }
    } catch (error) {
      return {
        replies: [],
        error: error instanceof Error ? error.message : '답글 조회 중 오류가 발생했습니다',
      }
    }
  }
}
