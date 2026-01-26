/**
 * CreatePrayer Use Case
 *
 * 기도제목을 생성하는 Use Case.
 */

import { Prayer, PrayerProps, CreatePrayerInput } from '@/domain/entities/Prayer'
import { IPrayerRepository } from '@/domain/repositories/IPrayerRepository'

export interface CreatePrayerOutput {
  prayer: PrayerProps | null
  error: string | null
}

export class CreatePrayer {
  constructor(private readonly prayerRepository: IPrayerRepository) {}

  async execute(input: CreatePrayerInput): Promise<CreatePrayerOutput> {
    try {
      // 도메인 검증
      Prayer.create({
        id: 'temp',
        groupId: input.groupId,
        userId: input.userId,
        content: input.content,
        isAnonymous: input.isAnonymous ?? false,
        isAnswered: false,
        answeredAt: null,
        supportCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      })

      const prayer = await this.prayerRepository.create(input)

      return { prayer, error: null }
    } catch (error) {
      return {
        prayer: null,
        error: error instanceof Error ? error.message : '기도제목 생성 중 오류가 발생했습니다',
      }
    }
  }
}
