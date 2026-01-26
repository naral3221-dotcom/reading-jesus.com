/**
 * DeleteChurchQTPost Use Case
 *
 * QT 나눔을 삭제하는 Use Case.
 */

import { IChurchQTPostRepository } from '@/domain/repositories/IChurchQTPostRepository'

export interface DeleteChurchQTPostInput {
  id: string
}

export interface DeleteChurchQTPostOutput {
  success: boolean
  error: string | null
}

export class DeleteChurchQTPost {
  constructor(private readonly churchQTPostRepository: IChurchQTPostRepository) {}

  async execute(input: DeleteChurchQTPostInput): Promise<DeleteChurchQTPostOutput> {
    try {
      await this.churchQTPostRepository.delete(input.id)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QT 나눔 삭제 중 오류가 발생했습니다',
      }
    }
  }
}
