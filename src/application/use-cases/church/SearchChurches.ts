/**
 * SearchChurches Use Case
 *
 * 교회를 검색하는 Use Case.
 */

import { Church } from '@/domain/entities/Church'
import { IChurchRepository, ChurchSearchParams } from '@/domain/repositories/IChurchRepository'

export interface SearchChurchesInput {
  query?: string
  regionCode?: string
  denomination?: string
  limit?: number
  offset?: number
}

export interface SearchChurchesOutput {
  churches: Church[]
  error: string | null
}

export class SearchChurches {
  constructor(private readonly churchRepository: IChurchRepository) {}

  async execute(input: SearchChurchesInput): Promise<SearchChurchesOutput> {
    try {
      const params: ChurchSearchParams = {
        query: input.query,
        regionCode: input.regionCode,
        denomination: input.denomination,
        limit: input.limit || 20,
        offset: input.offset || 0,
      }

      const churches = await this.churchRepository.search(params)

      return { churches, error: null }
    } catch (error) {
      return {
        churches: [],
        error: error instanceof Error ? error.message : '교회 검색 중 오류가 발생했습니다',
      }
    }
  }
}
