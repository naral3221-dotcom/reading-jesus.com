/**
 * CreateChurchQTPost Use Case
 *
 * 새 QT 나눔을 생성하는 Use Case.
 * QT 나눔 생성 시 해당 날짜의 성경 읽기를 자동으로 완료 처리합니다.
 */

import { ChurchQTPost, CreateChurchQTPostInput } from '@/domain/entities/ChurchQTPost'
import { IChurchQTPostRepository } from '@/domain/repositories/IChurchQTPostRepository'
import { IReadingCheckRepository } from '@/domain/repositories/IReadingCheckRepository'

export interface CreateChurchQTPostOutput {
  post: ChurchQTPost | null
  error: string | null
}

export class CreateChurchQTPost {
  constructor(
    private readonly churchQTPostRepository: IChurchQTPostRepository,
    private readonly readingCheckRepository?: IReadingCheckRepository
  ) {}

  async execute(input: CreateChurchQTPostInput): Promise<CreateChurchQTPostOutput> {
    try {
      const post = await this.churchQTPostRepository.save(input)

      // QT 나눔 생성 성공 시, 해당 날짜의 읽음 완료 자동 처리
      if (post && input.userId && input.dayNumber && this.readingCheckRepository) {
        try {
          await this.readingCheckRepository.create({
            userId: input.userId,
            dayNumber: input.dayNumber,
            churchId: input.churchId,
          })
        } catch {
          // 이미 읽음 완료된 경우 무시 (upsert이므로 에러가 나지 않겠지만 안전장치)
        }
      }

      return { post, error: null }
    } catch (error) {
      return {
        post: null,
        error: error instanceof Error ? error.message : 'QT 나눔 생성 중 오류가 발생했습니다',
      }
    }
  }
}
