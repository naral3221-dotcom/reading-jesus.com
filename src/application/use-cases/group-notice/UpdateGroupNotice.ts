/**
 * UpdateGroupNotice Use Case
 *
 * 그룹 공지사항을 수정하는 Use Case.
 */

import { GroupNotice } from '@/domain/entities/GroupNotice'
import { IGroupNoticeRepository } from '@/domain/repositories/IGroupNoticeRepository'

export interface UpdateGroupNoticeInput {
  id: string
  title?: string
  content?: string
  isPinned?: boolean
}

export interface UpdateGroupNoticeOutput {
  notice: GroupNotice | null
  error: string | null
}

export class UpdateGroupNotice {
  constructor(private readonly noticeRepository: IGroupNoticeRepository) {}

  async execute(input: UpdateGroupNoticeInput): Promise<UpdateGroupNoticeOutput> {
    try {
      // 기존 공지 조회
      const existingNotice = await this.noticeRepository.findById(input.id)
      if (!existingNotice) {
        return {
          notice: null,
          error: '공지사항을 찾을 수 없습니다',
        }
      }

      // 도메인 엔티티의 update 메서드를 통해 수정
      const updatedNotice = existingNotice.update({
        title: input.title,
        content: input.content,
        isPinned: input.isPinned,
      })

      // 저장
      const savedNotice = await this.noticeRepository.save(updatedNotice)

      return { notice: savedNotice, error: null }
    } catch (error) {
      return {
        notice: null,
        error: error instanceof Error ? error.message : '공지사항 수정 중 오류가 발생했습니다',
      }
    }
  }
}
