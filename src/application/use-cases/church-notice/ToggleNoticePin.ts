/**
 * ToggleNoticePin Use Case
 *
 * 교회 공지사항의 고정 상태를 토글하는 Use Case.
 */

import { ChurchNotice } from '@/domain/entities/ChurchNotice'
import { IChurchNoticeRepository } from '@/domain/repositories/IChurchNoticeRepository'

export interface ToggleNoticePinInput {
  id: string
}

export interface ToggleNoticePinOutput {
  notice: ChurchNotice | null
  error: string | null
}

export class ToggleNoticePin {
  constructor(private readonly noticeRepository: IChurchNoticeRepository) {}

  async execute(input: ToggleNoticePinInput): Promise<ToggleNoticePinOutput> {
    try {
      const notice = await this.noticeRepository.togglePin(input.id)

      return { notice, error: null }
    } catch (error) {
      return {
        notice: null,
        error: error instanceof Error ? error.message : '고정 상태 변경 중 오류가 발생했습니다',
      }
    }
  }
}
