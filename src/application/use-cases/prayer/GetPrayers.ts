/**
 * GetPrayers Use Case
 *
 * 그룹의 기도제목 목록을 조회하는 Use Case.
 */

import { PrayerProps } from '@/domain/entities/Prayer'
import { IPrayerRepository, PrayerSearchParams } from '@/domain/repositories/IPrayerRepository'

export type GetPrayersInput = PrayerSearchParams

export interface GetPrayersOutput {
  prayers: PrayerProps[]
  error: string | null
}

export class GetPrayers {
  constructor(private readonly prayerRepository: IPrayerRepository) {}

  async execute(input: GetPrayersInput): Promise<GetPrayersOutput> {
    try {
      const prayers = await this.prayerRepository.findByGroupId(input)

      return { prayers, error: null }
    } catch (error) {
      return {
        prayers: [],
        error: error instanceof Error ? error.message : '기도제목 조회 중 오류가 발생했습니다',
      }
    }
  }
}
