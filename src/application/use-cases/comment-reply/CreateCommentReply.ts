/**
 * CreateCommentReply Use Case
 *
 * 묵상 댓글에 답글을 생성하는 Use Case.
 */

import { CommentReply, CommentReplyProps, CreateCommentReplyInput } from '@/domain/entities/CommentReply'
import { ICommentReplyRepository } from '@/domain/repositories/ICommentReplyRepository'

export interface CreateCommentReplyOutput {
  reply: CommentReplyProps | null
  error: string | null
}

export class CreateCommentReply {
  constructor(private readonly commentReplyRepository: ICommentReplyRepository) {}

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
        profile: null,
      })

      const reply = await this.commentReplyRepository.create(input)

      return { reply, error: null }
    } catch (error) {
      return {
        reply: null,
        error: error instanceof Error ? error.message : '답글 생성 중 오류가 발생했습니다',
      }
    }
  }
}
