/**
 * GetComments Use Case
 *
 * 그룹/Day별 댓글 목록 조회
 */

import type { ICommentRepository, CommentSearchParams, CommentWithLikeStatus } from '@/domain/repositories/ICommentRepository'

export interface GetCommentsOutput {
  comments: CommentWithLikeStatus[]
  error: string | null
}

export class GetComments {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(params: CommentSearchParams): Promise<GetCommentsOutput> {
    try {
      const comments = await this.commentRepository.findByGroupAndDay(params)
      return { comments, error: null }
    } catch (error) {
      return {
        comments: [],
        error: error instanceof Error ? error.message : '댓글 조회 중 오류가 발생했습니다',
      }
    }
  }
}
