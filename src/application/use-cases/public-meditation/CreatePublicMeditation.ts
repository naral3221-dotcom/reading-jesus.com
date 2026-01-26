/**
 * CreatePublicMeditation Use Case
 * 공개 묵상 생성
 */

import type { IPublicMeditationRepository, CreatePublicMeditationInput } from '@/domain/repositories/IPublicMeditationRepository'
import type { PublicMeditationProps } from '@/domain/entities/PublicMeditation'

export class CreatePublicMeditation {
  constructor(private repository: IPublicMeditationRepository) {}

  async execute(input: CreatePublicMeditationInput): Promise<PublicMeditationProps> {
    // 유효성 검사
    if (!input.content.trim()) {
      throw new Error('묵상 내용을 입력해주세요')
    }

    return this.repository.create(input)
  }
}
