/**
 * ToggleReadingCheck Use Case
 *
 * 읽음 체크를 토글합니다.
 */

import { IReadingCheckRepository, ReadingCheckContext } from '@/domain/repositories/IReadingCheckRepository'

export interface ToggleReadingCheckInput {
  userId: string
  dayNumber: number
  context: ReadingCheckContext
}

export interface ToggleReadingCheckOutput {
  isRead: boolean
  error: string | null
}

export class ToggleReadingCheck {
  constructor(private readonly repository: IReadingCheckRepository) {}

  async execute(input: ToggleReadingCheckInput): Promise<ToggleReadingCheckOutput> {
    try {
      const isRead = await this.repository.toggle(
        input.userId,
        input.dayNumber,
        input.context
      )

      return { isRead, error: null }
    } catch (error) {
      return {
        isRead: false,
        error: error instanceof Error ? error.message : '읽음 체크 토글 중 오류가 발생했습니다',
      }
    }
  }
}
