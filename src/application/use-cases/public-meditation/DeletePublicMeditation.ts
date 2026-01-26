/**
 * DeletePublicMeditation Use Case
 * 공개 묵상 삭제
 */

import type { IPublicMeditationRepository } from '@/domain/repositories/IPublicMeditationRepository'

export class DeletePublicMeditation {
  constructor(private repository: IPublicMeditationRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    return this.repository.delete(id, userId)
  }
}
