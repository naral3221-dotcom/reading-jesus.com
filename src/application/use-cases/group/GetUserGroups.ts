/**
 * GetUserGroups Use Case
 *
 * 사용자가 속한 그룹 목록을 조회합니다.
 */

import { IGroupRepository } from '@/domain/repositories/IGroupRepository'
import { Group } from '@/domain/entities/Group'

export interface GetUserGroupsInput {
  userId: string
}

export interface GroupWithMemberCount {
  group: Group
  memberCount: number
}

export interface GetUserGroupsOutput {
  groups: GroupWithMemberCount[]
  error: string | null
}

export class GetUserGroups {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(input: GetUserGroupsInput): Promise<GetUserGroupsOutput> {
    try {
      const groups = await this.groupRepository.findByUserId(input.userId)

      const groupsWithCount = await Promise.all(
        groups.map(async (group) => {
          const memberCount = await this.groupRepository.getMemberCount(group.id)
          return { group, memberCount }
        })
      )

      return {
        groups: groupsWithCount,
        error: null,
      }
    } catch (error) {
      return {
        groups: [],
        error: error instanceof Error ? error.message : '그룹 목록 조회 중 오류가 발생했습니다.',
      }
    }
  }
}
