/**
 * DeleteGroupNotice Use Case
 *
 * 그룹 공지사항을 삭제하는 Use Case.
 */

import { IGroupNoticeRepository } from '@/domain/repositories/IGroupNoticeRepository'

export interface DeleteGroupNoticeInput {
  id: string
}

export interface DeleteGroupNoticeOutput {
  success: boolean
  error: string | null
}

export class DeleteGroupNotice {
  constructor(private readonly noticeRepository: IGroupNoticeRepository) {}

  async execute(input: DeleteGroupNoticeInput): Promise<DeleteGroupNoticeOutput> {
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
