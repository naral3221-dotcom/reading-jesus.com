/**
 * GetActiveChurchNotices Use Case
 *
 * 활성화된 교회 공지사항만 조회하는 Use Case. (메인 페이지 배너용)
 */

import { ChurchNotice } from '@/domain/entities/ChurchNotice'
import { IChurchNoticeRepository } from '@/domain/repositories/IChurchNoticeRepository'

export interface GetActiveChurchNoticesInput {
  churchId: string
}

export interface GetActiveChurchNoticesOutput {
  notices: ChurchNotice[]
  error: string | null
}

export class GetActiveChurchNotices {
  constructor(private readonly noticeRepository: IChurchNoticeRepository) {}

  async execute(input: GetActiveChurchNoticesInput): Promise<GetActiveChurchNoticesOutput> {
    try {
      const notices = await this.noticeRepository.findActiveByChurchId(input.churchId)

      return { notices, error: null }
    } catch (error) {
      return {
        notices: [],
        error: error instanceof Error ? error.message : '공지사항 조회 중 오류가 발생했습니다',
      }
    }
  }
}
