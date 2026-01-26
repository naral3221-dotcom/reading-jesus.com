/**
 * UpdateChurchQTPost Use Case
 *
 * QT 나눔을 수정하는 Use Case.
 */

import { ChurchQTPost, UpdateChurchQTPostInput } from '@/domain/entities/ChurchQTPost'
import { IChurchQTPostRepository } from '@/domain/repositories/IChurchQTPostRepository'

export interface UpdateChurchQTPostUseCaseInput {
  id: string
  input: UpdateChurchQTPostInput
}

export interface UpdateChurchQTPostOutput {
  post: ChurchQTPost | null
  error: string | null
}

export class UpdateChurchQTPost {
  constructor(private readonly churchQTPostRepository: IChurchQTPostRepository) {}

  async execute(input: UpdateChurchQTPostUseCaseInput): Promise<UpdateChurchQTPostOutput> {
    try {
      const post = await this.churchQTPostRepository.update(input.id, input.input)

      return { post, error: null }
    } catch (error) {
      return {
        post: null,
        error: error instanceof Error ? error.message : 'QT 나눔 수정 중 오류가 발생했습니다',
      }
    }
  }
}
