/**
 * CreateChurchNotice Use Case
 *
 * 교회 공지사항을 생성하는 Use Case.
 */

import { ChurchNotice, CreateChurchNoticeInput } from '@/domain/entities/ChurchNotice'
import { IChurchNoticeRepository } from '@/domain/repositories/IChurchNoticeRepository'

export interface CreateChurchNoticeOutput {
  notice: ChurchNotice | null
  error: string | null
}

export class CreateChurchNotice {
  constructor(private readonly noticeRepository: IChurchNoticeRepository) {}

  async execute(input: CreateChurchNoticeInput): Promise<CreateChurchNoticeOutput> {
    try {
      // 도메인 검증은 엔티티에서 수행
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
