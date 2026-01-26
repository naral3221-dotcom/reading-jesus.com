/**
 * GetGroup Use Case
 *
 * 그룹 정보를 조회합니다.
 */

import { IGroupRepository } from '@/domain/repositories/IGroupRepository'
import { Group } from '@/domain/entities/Group'

export interface GetGroupInput {
  groupId?: string
  inviteCode?: string
}

export interface GetGroupOutput {
  group: Group | null
  memberCount: number
  error: string | null
}

export class GetGroup {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(input: GetGroupInput): Promise<GetGroupOutput> {
    try {
      let group: Group | null = null

      if (input.groupId) {
        group = await this.groupRepository.findById(input.groupId)
      } else if (input.inviteCode) {
        group = await this.groupRepository.findByInviteCode(input.inviteCode)
      }

      if (!group) {
        return {
          group: null,
          memberCount: 0,
          error: '그룹을 찾을 수 없습니다.',
        }
      }

      const memberCount = await this.groupRepository.getMemberCount(group.id)

      return {
        group,
        memberCount,
        error: null,
      }
    } catch (error) {
      return {
        group: null,
        memberCount: 0,
        error: error instanceof Error ? error.message : '그룹 조회 중 오류가 발생했습니다.',
      }
    }
  }
}
