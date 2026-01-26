/**
 * GetGroupNotices Use Case
 *
 * 그룹 공지사항 목록을 조회하는 Use Case.
 */

import { GroupNotice } from '@/domain/entities/GroupNotice'
import { IGroupNoticeRepository } from '@/domain/repositories/IGroupNoticeRepository'

export interface GetGroupNoticesInput {
  groupId: string
  limit?: number
  offset?: number
}

export interface GetGroupNoticesOutput {
  notices: GroupNotice[]
  error: string | null
}

export class GetGroupNotices {
  constructor(private readonly noticeRepository: IGroupNoticeRepository) {}

  async execute(input: GetGroupNoticesInput): Promise<GetGroupNoticesOutput> {
    try {
      const notices = await this.noticeRepository.findByGroupId({
        groupId: input.groupId,
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
