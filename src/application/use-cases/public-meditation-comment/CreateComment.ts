/**
 * CreateComment Use Case
 *
 * 공개 묵상에 댓글을 생성하는 Use Case.
 */

import { PublicMeditationComment, MeditationType } from '@/domain/entities/PublicMeditationComment'
import { IPublicMeditationCommentRepository } from '@/domain/repositories/IPublicMeditationCommentRepository'

export interface CreateCommentInput {
  meditationId: string
  meditationType: MeditationType
  userId: string
  content: string
  isAnonymous?: boolean
  parentId?: string | null
}

export interface CreateCommentOutput {
  comment: PublicMeditationComment | null
  error: string | null
}

export class CreateComment {
  constructor(
    private readonly commentRepository: IPublicMeditationCommentRepository
  ) {}

  async execute(input: CreateCommentInput): Promise<CreateCommentOutput> {
    try {
      // 입력값 검증
      if (!input.content || input.content.trim().length === 0) {
        return { comment: null, error: '댓글 내용을 입력해주세요' }
      }

      if (input.content.length > 1000) {
        return { comment: null, error: '댓글은 1000자 이하로 입력해주세요' }
      }

      const comment = await this.commentRepository.create({
        meditationId: input.meditationId,
        meditationType: input.meditationType,
        userId: input.userId,
        content: input.content.trim(),
        isAnonymous: input.isAnonymous ?? false,
        parentId: input.parentId ?? null,
      })

      return { comment, error: null }
    } catch (error) {
      return {
        comment: null,
        error: error instanceof Error ? error.message : '댓글 작성 중 오류가 발생했습니다',
      }
    }
  }
}
