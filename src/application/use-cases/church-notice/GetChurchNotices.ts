/**
 * GetChurchNotices Use Case
 *
 * 교회 공지사항 목록을 조회하는 Use Case.
 */

import { ChurchNotice } from '@/domain/entities/ChurchNotice'
import { IChurchNoticeRepository } from '@/domain/repositories/IChurchNoticeRepository'

export interface GetChurchNoticesInput {
  churchId: string
  activeOnly?: boolean
  limit?: number
  offset?: number
}

export interface GetChurchNoticesOutput {
  notices: ChurchNotice[]
  error: string | null
}

export class GetChurchNotices {
  constructor(private readonly noticeRepository: IChurchNoticeRepository) {}

  async execute(input: GetChurchNoticesInput): Promise<GetChurchNoticesOutput> {
    try {
      const notices = await this.noticeRepository.findByChurchId({
        churchId: input.churchId,
        activeOnly: input.activeOnly,
        limit: input.limit,
        offset: input.offset,
      })

      return { notices, error: null }
    } catch (error) {
      return {
        notices: [],
        error: error instanceof Error ? error.message : '공지사항 조회 중 오류가 발생했습니다',
      }
    }
  }
}
