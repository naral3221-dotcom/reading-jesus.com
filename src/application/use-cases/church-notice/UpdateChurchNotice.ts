/**
 * UpdateChurchNotice Use Case
 *
 * 교회 공지사항을 수정하는 Use Case.
 */

import { ChurchNotice } from '@/domain/entities/ChurchNotice'
import { IChurchNoticeRepository } from '@/domain/repositories/IChurchNoticeRepository'

export interface UpdateChurchNoticeInput {
  id: string
  title?: string
  content?: string
  isPinned?: boolean
  isActive?: boolean
  startsAt?: Date | null
  endsAt?: Date | null
}

export interface UpdateChurchNoticeOutput {
  notice: ChurchNotice | null
  error: string | null
}

export class UpdateChurchNotice {
  constructor(private readonly noticeRepository: IChurchNoticeRepository) {}

  async execute(input: UpdateChurchNoticeInput): Promise<UpdateChurchNoticeOutput> {
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
        isActive: input.isActive,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
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
