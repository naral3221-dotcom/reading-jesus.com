/**
 * CreateGroupNotice Use Case
 *
 * 그룹 공지사항을 생성하는 Use Case.
 */

import { GroupNotice, CreateGroupNoticeInput } from '@/domain/entities/GroupNotice'
import { IGroupNoticeRepository } from '@/domain/repositories/IGroupNoticeRepository'

export interface CreateGroupNoticeOutput {
  notice: GroupNotice | null
  error: string | null
}

export class CreateGroupNotice {
  constructor(private readonly noticeRepository: IGroupNoticeRepository) {}

  async execute(input: CreateGroupNoticeInput): Promise<CreateGroupNoticeOutput> {
    try {
      const notice = await this.noticeRepository.save(input)

      return { notice, error: null }
    } catch (error) {
      return {
        notice: null,
        error: error instanceof Error ? error.message : '공지사항 생성 중 오류가 발생했습니다',
      }
    }
  }
}
