/**
 * LeaveGroup Use Case
 *
 * 사용자가 그룹에서 탈퇴합니다.
 */

import { IGroupRepository } from '@/domain/repositories/IGroupRepository'

export interface LeaveGroupInput {
  userId: string
  groupId: string
}

export interface LeaveGroupOutput {
  success: boolean
  error: string | null
}

export class LeaveGroup {
  constructor(private groupRepository: IGroupRepository) {}

  async execute(input: LeaveGroupInput): Promise<LeaveGroupOutput> {
    try {
      // 1. 그룹 존재 확인
      const group = await this.groupRepository.findById(input.groupId)
      if (!group) {
        return {
          success: false,
          error: '그룹을 찾을 수 없습니다.',
        }
      }

      // 2. 멤버 여부 확인
      const isMember = await this.groupRepository.isMember(input.groupId, input.userId)
      if (!isMember) {
        return {
          success: false,
          error: '그룹에 가입되어 있지 않습니다.',
        }
      }

      // 3. 그룹 생성자인지 확인 (생성자는 탈퇴 불가)
      if (group.createdBy === input.userId) {
        return {
          success: false,
          error: '그룹 생성자는 탈퇴할 수 없습니다. 그룹을 삭제하거나 다른 관리자에게 권한을 이전하세요.',
        }
      }

      // 4. 멤버 제거
      await this.groupRepository.removeMember(input.groupId, input.userId)

      return {
        success: true,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '그룹 탈퇴 중 오류가 발생했습니다.',
      }
    }
  }
}
