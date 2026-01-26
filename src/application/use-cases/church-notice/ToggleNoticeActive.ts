/**
 * ToggleNoticeActive Use Case
 *
 * 교회 공지사항의 활성 상태를 토글하는 Use Case.
 */

import { ChurchNotice } from '@/domain/entities/ChurchNotice'
import { IChurchNoticeRepository } from '@/domain/repositories/IChurchNoticeRepository'

export interface ToggleNoticeActiveInput {
  id: string
}

export interface ToggleNoticeActiveOutput {
  notice: ChurchNotice | null
  error: string | null
}

export class ToggleNoticeActive {
  constructor(private readonly noticeRepository: IChurchNoticeRepository) {}

  async execute(input: ToggleNoticeActiveInput): Promise<ToggleNoticeActiveOutput> {
    try {
      const notice = await this.noticeRepository.toggleActive(input.id)

      return { notice, error: null }
    } catch (error) {
      return {
        notice: null,
        error: error instanceof Error ? error.message : '활성 상태 변경 중 오류가 발생했습니다',
      }
    }
  }
}
