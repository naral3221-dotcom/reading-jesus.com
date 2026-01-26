/**
 * JoinGroup Use Case
 *
 * 사용자가 그룹에 가입합니다.
 */

import { IGroupRepository } from '@/domain/repositories/IGroupRepository'
import { Group, GroupMember } from '@/domain/entities/Group'

export interface JoinGroupInput {
  userId: string
  groupId?: string
  inviteCode?: string
}

export interface JoinGroupOutput {
  group: Group | null
  member: GroupMember | null
  error: string | null
}

export class JoinGroup {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(input: JoinGroupInput): Promise<JoinGroupOutput> {
    try {
      // 1. 그룹 찾기
      let group: Group | null = null

      if (input.groupId) {
        group = await this.groupRepository.findById(input.groupId)
      } else if (input.inviteCode) {
        group = await this.groupRepository.findByInviteCode(input.inviteCode)
      }

      if (!group) {
        return {
          group: null,
          member: null,
          error: '그룹을 찾을 수 없습니다.',
        }
      }

      // 2. 이미 멤버인지 확인
      const isMember = await this.groupRepository.isMember(group.id, input.userId)
      if (isMember) {
        return {
          group: null,
          member: null,
          error: '이미 그룹에 가입되어 있습니다.',
        }
      }

      // 3. 그룹이 활성 상태인지 확인
      if (!group.isActive()) {
        return {
          group: null,
          member: null,
          error: '그룹이 활성 상태가 아닙니다.',
        }
      }

      // 4. 최대 멤버 수 확인
      const memberCount = await this.groupRepository.getMemberCount(group.id)
      if (!group.canAcceptMoreMembers(memberCount)) {
        return {
          group: null,
          member: null,
          error: '그룹의 최대 멤버 수에 도달했습니다.',
        }
      }

      // 5. 멤버 추가
      const member = await this.groupRepository.addMember(group.id, input.userId, 'member')

      return {
        group,
        member,
        error: null,
      }
    } catch (error) {
      return {
        group: null,
        member: null,
        error: error instanceof Error ? error.message : '그룹 가입 중 오류가 발생했습니다.',
      }
    }
  }
}
