/**
 * DeleteChurchNotice Use Case
 *
 * 교회 공지사항을 삭제하는 Use Case.
 */

import { IChurchNoticeRepository } from '@/domain/repositories/IChurchNoticeRepository'

export interface DeleteChurchNoticeInput {
  id: string
}

export interface DeleteChurchNoticeOutput {
  success: boolean
  error: string | null
}

export class DeleteChurchNotice {
  constructor(private readonly noticeRepository: IChurchNoticeRepository) {}

  async execute(input: DeleteChurchNoticeInput): Promise<DeleteChurchNoticeOutput> {
    try {
      // 존재 여부 확인
      const existingNotice = await this.noticeRepository.findById(input.id)
      if (!existingNotice) {
        return {
          success: false,
          error: '공지사항을 찾을 수 없습니다',
        }
      }

      await this.noticeRepository.delete(input.id)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '공지사항 삭제 중 오류가 발생했습니다',
      }
    }
  }
}
