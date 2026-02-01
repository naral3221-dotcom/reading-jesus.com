/**
 * CreateCommentReply Use Case
 *
 * 댓글에 답글 작성
 */

import type { ICommentRepository } from '@/domain/repositories/IGroupMeditationRepository'
import type { CommentReplyProps, CreateCommentReplyInput } from '@/domain/entities/GroupMeditation'
import { CommentReply } from '@/domain/entities/GroupMeditation'

export interface CreateCommentReplyOutput {
  reply: CommentReplyProps | null
  error: string | null
}

export class CreateCommentReply {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(input: CreateCommentReplyInput): Promise<CreateCommentReplyOutput> {
    try {
      // 도메인 검증
      CommentReply.create({
        id: 'temp',
        commentId: input.commentId,
        userId: input.userId,
        content: input.content,
        isAnonymous: input.isAnonymous ?? false,
        createdAt: new Date(),
        updatedAt: null,
        mentionUserId: input.mentionUserId ?? null,
        mentionNickname: input.mentionNickname ?? null,
      })

      const reply = await this.commentRepository.createReply(input)
      return { reply, error: null }
    } catch (error) {
      return {
        reply: null,
        error: error instanceof Error ? error.message : '답글 작성 중 오류가 발생했습니다',
      }
    }
  }
}
