/**
 * JoinChurch Use Case
 *
 * 사용자가 교회에 가입하는 Use Case.
 */

import { User } from '@/domain/entities/User'
import { Church } from '@/domain/entities/Church'
import { IUserRepository } from '@/domain/repositories/IUserRepository'
import { IChurchRepository } from '@/domain/repositories/IChurchRepository'

export interface JoinChurchInput {
  userId: string
  churchCode: string
  writeToken?: string
}

export interface JoinChurchOutput {
  user: User | null
  church: Church | null
  error: string | null
}

export class JoinChurch {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly churchRepository: IChurchRepository
  ) {}

  async execute(input: JoinChurchInput): Promise<JoinChurchOutput> {
    try {
      // 1. 사용자 조회
      const user = await this.userRepository.findById(input.userId)
      if (!user) {
        return { user: null, church: null, error: '사용자를 찾을 수 없습니다' }
      }

      // 2. 이미 교회에 가입되어 있는지 확인
      if (user.isChurchMember()) {
        return { user: null, church: null, error: '이미 교회에 가입되어 있습니다' }
      }

      // 3. 교회 조회
      const church = await this.churchRepository.findByCode(input.churchCode)
      if (!church) {
        return { user: null, church: null, error: '교회를 찾을 수 없습니다' }
      }

      // 4. 교회가 활성화 상태인지 확인
      if (!church.isActive) {
        return { user: null, church: null, error: '비활성화된 교회입니다' }
      }

      // 5. 작성 토큰이 필요한 경우 검증
      if (church.writeToken && input.writeToken) {
        if (!church.validateWriteToken(input.writeToken)) {
          return { user: null, church: null, error: '잘못된 가입 코드입니다' }
        }
      }

      // 6. 교회 가입 처리
      await this.userRepository.updateChurchMembership(user.id, church.id)

      // 7. 업데이트된 사용자 정보 조회
      const updatedUser = await this.userRepository.findById(user.id)

      return { user: updatedUser, church, error: null }
    } catch (error) {
      return {
        user: null,
        church: null,
        error: error instanceof Error ? error.message : '교회 가입 중 오류가 발생했습니다',
      }
    }
  }
}
