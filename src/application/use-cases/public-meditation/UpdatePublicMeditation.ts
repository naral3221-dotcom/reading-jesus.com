/**
 * UpdatePublicMeditation Use Case
 * 공개 묵상 수정
 */

import type { IPublicMeditationRepository, UpdatePublicMeditationInput } from '@/domain/repositories/IPublicMeditationRepository'
import type { PublicMeditationProps } from '@/domain/entities/PublicMeditation'

export class UpdatePublicMeditation {
  constructor(private repository: IPublicMeditationRepository) {}

  async execute(id: string, userId: string, input: UpdatePublicMeditationInput): Promise<PublicMeditationProps> {
    // 유효성 검사
    if (input.content !== undefined && !input.content.trim()) {
      throw new Error('묵상 내용을 입력해주세요')
    }

    return this.repository.update(id, userId, input)
  }
}
