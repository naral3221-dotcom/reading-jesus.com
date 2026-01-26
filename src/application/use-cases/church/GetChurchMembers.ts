/**
 * Get Church Members Use Case
 *
 * 교회 멤버 목록을 조회합니다.
 */

import { IChurchRepository } from '@/domain/repositories/IChurchRepository'

export interface GetChurchMembersInput {
  churchId: string
  limit?: number
  offset?: number
}

export interface ChurchMember {
  userId: string
  displayName: string | null
  avatarUrl: string | null
  joinedAt: Date
}

export interface GetChurchMembersOutput {
  members: ChurchMember[]
  totalCount: number
  error: string | null
}

export class GetChurchMembers {
  constructor(private churchRepository: IChurchRepository) {}

  async execute(input: GetChurchMembersInput): Promise<GetChurchMembersOutput> {
    try {
      const { churchId, limit, offset } = input

      // 1. 교회 존재 확인
      const church = await this.churchRepository.findById(churchId)
      if (!church) {
        return {
          members: [],
          totalCount: 0,
          error: '존재하지 않는 교회입니다.',
        }
      }

      // 2. 멤버 목록 조회
      const members = await this.churchRepository.findMembers(churchId, {
        limit,
        offset,
      })

      // 3. 총 멤버 수 조회
      const totalCount = await this.churchRepository.getMemberCount(churchId)

      return {
        members,
        totalCount,
        error: null,
      }
    } catch (error) {
      return {
        members: [],
        totalCount: 0,
        error: error instanceof Error ? error.message : '멤버 목록 조회 중 오류가 발생했습니다.',
      }
    }
  }
}
