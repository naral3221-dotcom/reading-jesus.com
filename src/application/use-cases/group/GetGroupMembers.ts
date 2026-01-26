/**
 * GetGroupMembers Use Case
 *
 * 그룹의 멤버 목록을 조회합니다.
 */

import { IGroupRepository } from '@/domain/repositories/IGroupRepository'
import { GroupMember } from '@/domain/entities/Group'

export interface GetGroupMembersInput {
  groupId: string
}

export interface GetGroupMembersOutput {
  members: GroupMember[]
  totalCount: number
  error: string | null
}

export class GetGroupMembers {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(input: GetGroupMembersInput): Promise<GetGroupMembersOutput> {
    try {
      // 1. 그룹 존재 확인
      const group = await this.groupRepository.findById(input.groupId)
      if (!group) {
        return {
          members: [],
          totalCount: 0,
          error: '그룹을 찾을 수 없습니다.',
        }
      }

      // 2. 멤버 목록 조회
      const members = await this.groupRepository.findMembers(input.groupId)
      const totalCount = members.length

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
