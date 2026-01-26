/**
 * UpdateComment Use Case
 *
 * 댓글 수정
 */

import type { ICommentRepository } from '@/domain/repositories/ICommentRepository'
import type { CommentProps, UpdateCommentInput } from '@/domain/entities/Comment'

export interface UpdateCommentOutput {
  comment: CommentProps | null
  error: string | null
}

export class UpdateComment {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(id: string, userId: string, input: UpdateCommentInput): Promise<UpdateCommentOutput> {
    try {
      // 내용 검증
      if (!input.content || input.content.trim().length === 0) {
        return { comment: null, error: '댓글 내용을 입력해주세요' }
      }

      if (input.content.length > 5000) {
        return { comment: null, error: '댓글은 5000자 이내로 작성해주세요' }
      }

      const comment = await this.commentRepository.update(id, userId, input)
      return { comment, error: null }
    } catch (error) {
      return {
        comment: null,
        error: error instanceof Error ? error.message : '댓글 수정 중 오류가 발생했습니다',
      }
    }
  }
}
