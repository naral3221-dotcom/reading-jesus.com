/**
 * GetChurchQTPostReplies Use Case
 *
 * QT 나눔의 답글 목록을 조회하는 Use Case.
 */

import { ChurchQTPostReply } from '@/domain/entities/ChurchQTPost'
import { IChurchQTPostRepository } from '@/domain/repositories/IChurchQTPostRepository'

export interface GetChurchQTPostRepliesInput {
  postId: string
}

export interface GetChurchQTPostRepliesOutput {
  replies: ChurchQTPostReply[]
  error: string | null
}

export class GetChurchQTPostReplies {
  constructor(private readonly churchQTPostRepository: IChurchQTPostRepository) {}

  async execute(input: GetChurchQTPostRepliesInput): Promise<GetChurchQTPostRepliesOutput> {
    try {
      const replies = await this.churchQTPostRepository.findReplies(input.postId)

      return { replies, error: null }
    } catch (error) {
      return {
        replies: [],
        error: error instanceof Error ? error.message : '답글 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}
