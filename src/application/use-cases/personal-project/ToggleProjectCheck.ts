/**
 * ToggleProjectCheck Use Case
 *
 * 개인 프로젝트 읽기 체크 토글
 */

import type { IPersonalProjectRepository } from '@/domain/repositories/IPersonalProjectRepository'

export interface ToggleProjectCheckOutput {
  isChecked: boolean
  error: string | null
}

export class ToggleProjectCheck {
  constructor(private readonly projectRepository: IPersonalProjectRepository) {}

  async execute(projectId: string, dayNumber: number): Promise<ToggleProjectCheckOutput> {
    try {
      // dayNumber 유효성 검증
      if (dayNumber < 1 || dayNumber > 365) {
        return { isChecked: false, error: '유효하지 않은 일차입니다' }
      }

      const isChecked = await this.projectRepository.toggleDailyCheck(projectId, dayNumber)
      return { isChecked, error: null }
    } catch (error) {
      return {
        isChecked: false,
        error: error instanceof Error ? error.message : '읽기 체크 중 오류가 발생했습니다',
      }
    }
  }
}
