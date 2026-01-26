/**
 * TogglePublicMeditationLike Use Case
 * 공개 묵상 좋아요 토글
 */

import type { IPublicMeditationRepository } from '@/domain/repositories/IPublicMeditationRepository'

export class TogglePublicMeditationLike {
  constructor(private repository: IPublicMeditationRepository) {}

  async execute(meditationId: string, userId: string): Promise<boolean> {
    return this.repository.toggleLike(meditationId, userId)
  }
}
