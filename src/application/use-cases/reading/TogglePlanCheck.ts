/**
 * TogglePlanCheck Use Case
 *
 * 플랜의 읽음 체크를 토글합니다.
 * 동일 플랜을 사용하는 모든 그룹에 동시 적용됩니다.
 */

import { IUserDailyReadingRepository } from '@/domain/repositories/IUserDailyReadingRepository'

export interface TogglePlanCheckInput {
  userId: string
  planId: string
  dayNumber: number
  groupIds: string[]
  isChecked: boolean // true: 체크하기, false: 체크 해제
}

export interface TogglePlanCheckOutput {
  success: boolean
  error: string | null
}

export class TogglePlanCheck {
  constructor(private readonly repository: IUserDailyReadingRepository) {}

  async execute(input: TogglePlanCheckInput): Promise<TogglePlanCheckOutput> {
    try {
      if (!input.userId) {
        return {
          success: false,
          error: '사용자 ID가 필요합니다.',
        }
      }

      if (input.groupIds.length === 0) {
        return {
          success: false,
          error: '적용할 그룹이 없습니다.',
        }
      }

      const success = await this.repository.togglePlanCheck(
        input.userId,
        input.planId,
        input.dayNumber,
        input.groupIds,
        input.isChecked
      )

      return {
        success,
        error: success ? null : '체크 처리에 실패했습니다.',
      }
    } catch (error) {
      console.error('TogglePlanCheck error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '체크 처리 중 오류가 발생했습니다.',
      }
    }
  }
}
