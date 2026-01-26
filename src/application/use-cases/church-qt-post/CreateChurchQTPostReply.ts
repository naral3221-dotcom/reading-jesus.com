/**
 * CreateChurchQTPostReply Use Case
 *
 * QT 나눔에 답글을 추가하는 Use Case.
 */

import { ChurchQTPostReply, CreateChurchQTPostReplyInput } from '@/domain/entities/ChurchQTPost'
import { IChurchQTPostRepository } from '@/domain/repositories/IChurchQTPostRepository'

export interface CreateChurchQTPostReplyOutput {
  reply: ChurchQTPostReply | null
  error: string | null
}

export class CreateChurchQTPostReply {
  constructor(private readonly churchQTPostRepository: IChurchQTPostRepository) {}

  async execute(input: CreateChurchQTPostReplyInput): Promise<CreateChurchQTPostReplyOutput> {
    try {
      const reply = await this.churchQTPostRepository.addReply(input)

      return { reply, error: null }
    } catch (error) {
      return {
        reply: null,
        error: error instanceof Error ? error.message : '답글 추가 중 오류가 발생했습니다',
      }
    }
  }
}
