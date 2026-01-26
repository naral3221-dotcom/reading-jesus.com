/**
 * GetPublicMeditations Use Case
 * 공개 묵상 목록 조회
 */

import type { IPublicMeditationRepository, GetPublicMeditationsOptions } from '@/domain/repositories/IPublicMeditationRepository'
import type { PublicMeditationProps } from '@/domain/entities/PublicMeditation'

export class GetPublicMeditations {
  constructor(private repository: IPublicMeditationRepository) {}

  async execute(options: GetPublicMeditationsOptions): Promise<PublicMeditationProps[]> {
    return this.repository.findAll(options)
  }
}
