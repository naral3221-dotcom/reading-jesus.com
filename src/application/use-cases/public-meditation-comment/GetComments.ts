/**
 * GetComments Use Case
 *
 * 공개 묵상의 댓글 목록을 조회하는 Use Case.
 */

import { PublicMeditationComment, MeditationType } from '@/domain/entities/PublicMeditationComment'
import { IPublicMeditationCommentRepository } from '@/domain/repositories/IPublicMeditationCommentRepository'

export interface GetCommentsInput {
  meditationId: string
  meditationType: MeditationType
  currentUserId?: string
  parentId?: string | null
  limit?: number
  offset?: number
}

export interface GetCommentsOutput {
  comments: PublicMeditationComment[]
  totalCount: number
  hasMore: boolean
  error: string | null
}

export class GetComments {
  constructor(
    private readonly commentRepository: IPublicMeditationCommentRepository
  ) {}

  async execute(input: GetCommentsInput): Promise<GetCommentsOutput> {
    try {
      const result = await this.commentRepository.getComments({
        meditationId: input.meditationId,
        meditationType: input.meditationType,
        currentUserId: input.currentUserId,
        parentId: input.parentId,
        limit: input.limit ?? 20,
        offset: input.offset ?? 0,
      })

      return {
        comments: result.data,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        error: null,
      }
    } catch (error) {
      return {
        comments: [],
        totalCount: 0,
        hasMore: false,
        error: error instanceof Error ? error.message : '댓글 조회 중 오류가 발생했습니다',
      }
    }
  }
}
