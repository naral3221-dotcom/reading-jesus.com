/**
 * GetMonthlyQT Use Case
 *
 * 월별 QT 목록을 조회하는 Use Case.
 */

import { QT } from '@/domain/entities/QT'
import { IQTRepository } from '@/domain/repositories/IQTRepository'

export interface GetMonthlyQTInput {
  year: number
  month: number
}

export interface GetMonthlyQTOutput {
  qtList: QT[]
  error: string | null
}

export class GetMonthlyQT {
  constructor(private readonly qtRepository: IQTRepository) {}

  async execute(input: GetMonthlyQTInput): Promise<GetMonthlyQTOutput> {
    try {
      const qtList = await this.qtRepository.findByMonth(input.year, input.month)

      return { qtList, error: null }
    } catch (error) {
      return {
        qtList: [],
        error: error instanceof Error ? error.message : 'QT 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}
