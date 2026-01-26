/**
 * GetChurch Use Case
 *
 * 교회 정보를 조회하는 Use Case.
 */

import { Church } from '@/domain/entities/Church'
import { IChurchRepository } from '@/domain/repositories/IChurchRepository'

export interface GetChurchInput {
  id?: string
  code?: string
}

export interface GetChurchOutput {
  church: Church | null
  memberCount?: number
  error: string | null
}

export class GetChurch {
  constructor(private readonly churchRepository: IChurchRepository) {}

  async execute(input: GetChurchInput): Promise<GetChurchOutput> {
    try {
      let church: Church | null = null

      if (input.id) {
        church = await this.churchRepository.findById(input.id)
      } else if (input.code) {
        church = await this.churchRepository.findByCode(input.code)
      }

      if (!church) {
        return { church: null, error: null }
      }

      const memberCount = await this.churchRepository.getMemberCount(church.id)

      return { church, memberCount, error: null }
    } catch (error) {
      return {
        church: null,
        error: error instanceof Error ? error.message : '교회 정보 조회 중 오류가 발생했습니다',
      }
    }
  }
}
