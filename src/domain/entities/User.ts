/**
 * User Entity
 *
 * 사용자 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 * 외부 의존성 없이 순수 TypeScript로 구현됩니다.
 */

export interface UserProps {
  id: string
  nickname: string
  avatarUrl: string | null
  hasCompletedOnboarding: boolean
  createdAt: Date
  updatedAt: Date
  churchId: string | null
  churchJoinedAt: Date | null
}

export class User {
  private constructor(
    public readonly id: string,
    public readonly nickname: string,
    public readonly avatarUrl: string | null,
    public readonly hasCompletedOnboarding: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly churchId: string | null,
    public readonly churchJoinedAt: Date | null
  ) {}

  /**
   * User 엔티티를 생성합니다.
   * @throws 닉네임이 빈 문자열이거나 20자를 초과하면 에러
   */
  static create(props: UserProps): User {
    User.validateNickname(props.nickname)

    return new User(
      props.id,
      props.nickname,
      props.avatarUrl,
      props.hasCompletedOnboarding,
      props.createdAt,
      props.updatedAt,
      props.churchId,
      props.churchJoinedAt
    )
  }

  private static validateNickname(nickname: string): void {
    if (!nickname || nickname.trim().length === 0) {
      throw new Error('닉네임은 필수입니다')
    }
    if (nickname.length > 20) {
      throw new Error('닉네임은 20자 이하여야 합니다')
    }
  }

  /**
   * 교회에 가입합니다.
   * @throws 이미 교회에 가입되어 있으면 에러
   */
  joinChurch(churchId: string): User {
    if (this.churchId) {
      throw new Error('이미 교회에 가입되어 있습니다')
    }

    return new User(
      this.id,
      this.nickname,
      this.avatarUrl,
      this.hasCompletedOnboarding,
      this.createdAt,
      new Date(),
      churchId,
      new Date()
    )
  }

  /**
   * 교회를 탈퇴합니다.
   * @throws 가입된 교회가 없으면 에러
   */
  leaveChurch(): User {
    if (!this.churchId) {
      throw new Error('가입된 교회가 없습니다')
    }

    return new User(
      this.id,
      this.nickname,
      this.avatarUrl,
      this.hasCompletedOnboarding,
      this.createdAt,
      new Date(),
      null,
      null
    )
  }

  /**
   * 닉네임을 변경합니다.
   * @throws 닉네임이 유효하지 않으면 에러
   */
  updateNickname(newNickname: string): User {
    User.validateNickname(newNickname)

    return new User(
      this.id,
      newNickname,
      this.avatarUrl,
      this.hasCompletedOnboarding,
      this.createdAt,
      new Date(),
      this.churchId,
      this.churchJoinedAt
    )
  }

  /**
   * 온보딩을 완료 처리합니다.
   */
  completeOnboarding(): User {
    return new User(
      this.id,
      this.nickname,
      this.avatarUrl,
      true,
      this.createdAt,
      new Date(),
      this.churchId,
      this.churchJoinedAt
    )
  }

  /**
   * 교회 가입 여부를 반환합니다.
   */
  isChurchMember(): boolean {
    return this.churchId !== null
  }

  /**
   * DTO 형태로 변환합니다.
   */
  toDTO(): UserProps {
    return {
      id: this.id,
      nickname: this.nickname,
      avatarUrl: this.avatarUrl,
      hasCompletedOnboarding: this.hasCompletedOnboarding,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      churchId: this.churchId,
      churchJoinedAt: this.churchJoinedAt,
    }
  }
}
