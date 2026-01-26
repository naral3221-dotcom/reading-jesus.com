/**
 * Leave Church Use Case
 *
 * 사용자가 교회에서 탈퇴합니다.
 */

import { IChurchRepository } from '@/domain/repositories/IChurchRepository'

export interface LeaveChurchInput {
  churchId: string
  userId: string
}

export interface LeaveChurchOutput {
  success: boolean
  error: string | null
}

export class LeaveChurch {
  constructor(private churchRepository: IChurchRepository) {}

  async execute(input: LeaveChurchInput): Promise<LeaveChurchOutput> {
    try {
      const { churchId, userId } = input

      // 1. 교회 존재 확인
      const church = await this.churchRepository.findById(churchId)
      if (!church) {
        return {
          success: false,
          error: '존재하지 않는 교회입니다.',
        }
      }

      // 2. 멤버인지 확인
      const isMember = await this.churchRepository.isMember(churchId, userId)
      if (!isMember) {
        return {
          success: false,
          error: '해당 교회의 멤버가 아닙니다.',
        }
      }

      // 3. 탈퇴 처리
      await this.churchRepository.removeMember(churchId, userId)

      return {
        success: true,
        error: null,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '교회 탈퇴 중 오류가 발생했습니다.',
      }
    }
  }
}
