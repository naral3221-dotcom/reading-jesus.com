/**
 * DeleteChurchQTPostReply Use Case
 *
 * QT 나눔의 답글을 삭제하는 Use Case.
 */

import { IChurchQTPostRepository } from '@/domain/repositories/IChurchQTPostRepository'

export interface DeleteChurchQTPostReplyInput {
  replyId: string
}

export interface DeleteChurchQTPostReplyOutput {
  success: boolean
  error: string | null
}

export class DeleteChurchQTPostReply {
  constructor(private readonly churchQTPostRepository: IChurchQTPostRepository) {}

  async execute(input: DeleteChurchQTPostReplyInput): Promise<DeleteChurchQTPostReplyOutput> {
    try {
      await this.churchQTPostRepository.deleteReply(input.replyId)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '답글 삭제 중 오류가 발생했습니다',
      }
    }
  }
}
