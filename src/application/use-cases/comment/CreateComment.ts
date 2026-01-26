/**
 * CreateComment Use Case
 *
 * 댓글 생성
 */

import type { ICommentRepository } from '@/domain/repositories/ICommentRepository'
import type { CommentProps, CreateCommentInput } from '@/domain/entities/Comment'
import { Comment } from '@/domain/entities/Comment'

export interface CreateCommentOutput {
  comment: CommentProps | null
  error: string | null
}

export class CreateComment {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(input: CreateCommentInput): Promise<CreateCommentOutput> {
    try {
      // 도메인 검증
      Comment.create({
        id: 'temp',
        userId: input.userId,
        groupId: input.groupId,
        dayNumber: input.dayNumber,
        content: input.content,
        isAnonymous: input.isAnonymous ?? false,
        likesCount: 0,
        repliesCount: 0,
        isPinned: false,
        createdAt: new Date(),
        updatedAt: null,
      })

      const comment = await this.commentRepository.create(input)
      return { comment, error: null }
    } catch (error) {
      return {
        comment: null,
        error: error instanceof Error ? error.message : '댓글 생성 중 오류가 발생했습니다',
      }
    }
  }
}
