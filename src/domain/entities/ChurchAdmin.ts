/**
 * ChurchAdmin Domain Entity
 *
 * 교회 관리자 엔티티 정의.
 */

/**
 * 교회 관리자 속성
 */
export interface ChurchAdminProps {
  id: string
  email: string
  churchId: string
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date | null
  // 교회 정보 (조인 시)
  church?: {
    id: string
    name: string
    code: string
  }
}

/**
 * 교회 관리자 생성 입력
 */
export interface CreateChurchAdminInput {
  email: string
  password: string
  churchId: string
}

/**
 * 교회 관리자 인증 입력
 */
export interface AuthenticateChurchAdminInput {
  email: string
  password: string
  churchCode: string
}

/**
 * 토큰 인증 입력
 */
export interface TokenAuthInput {
  token: string
  churchCode: string
}

/**
 * 교회 관리자 인증 결과
 */
export interface ChurchAdminAuthResult {
  admin: ChurchAdminProps | null
  churchId: string | null
  churchName: string | null
  error: string | null
}

/**
 * 교회 관리자 엔티티 클래스
 */
export class ChurchAdmin {
  private constructor(private readonly props: ChurchAdminProps) {}

  get id(): string {
    return this.props.id
  }

  get email(): string {
    return this.props.email
  }

  get churchId(): string {
    return this.props.churchId
  }

  get isActive(): boolean {
    return this.props.isActive
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get church(): ChurchAdminProps['church'] {
    return this.props.church
  }

  toProps(): ChurchAdminProps {
    return { ...this.props }
  }

  /**
   * 교회 관리자 생성
   */
  static create(props: ChurchAdminProps): ChurchAdmin {
    // 이메일 유효성 검증
    if (!props.email || !props.email.includes('@')) {
      throw new Error('유효한 이메일 주소를 입력해주세요')
    }

    // 교회 ID 필수
    if (!props.churchId) {
      throw new Error('교회 ID가 필요합니다')
    }

    return new ChurchAdmin(props)
  }

  /**
   * 활성 상태인지 확인
   */
  canAccess(): boolean {
    return this.props.isActive
  }
}
