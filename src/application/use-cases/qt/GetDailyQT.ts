/**
 * GetDailyQT Use Case
 *
 * 특정 날짜의 QT를 조회하는 Use Case.
 */

import { QT } from '@/domain/entities/QT'
import { IQTRepository } from '@/domain/repositories/IQTRepository'

export interface GetDailyQTInput {
  date?: Date
  dayNumber?: number
}

export interface GetDailyQTOutput {
  qt: QT | null
  error: string | null
}

export class GetDailyQT {
  constructor(private readonly qtRepository: IQTRepository) {}

  async execute(input: GetDailyQTInput): Promise<GetDailyQTOutput> {
    try {
      let qt: QT | null = null

      if (input.date) {
        qt = await this.qtRepository.findByDate(input.date)
      } else if (input.dayNumber) {
        qt = await this.qtRepository.findByDayNumber(input.dayNumber)
      } else {
        // 날짜나 일차가 없으면 오늘의 QT 조회
        qt = await this.qtRepository.findToday()
      }

      return { qt, error: null }
    } catch (error) {
      return {
        qt: null,
        error: error instanceof Error ? error.message : 'QT 조회 중 오류가 발생했습니다',
      }
    }
  }
}
