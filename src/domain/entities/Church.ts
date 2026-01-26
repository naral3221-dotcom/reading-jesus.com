/**
 * Church Entity
 *
 * 교회 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 * 외부 의존성 없이 순수 TypeScript로 구현됩니다.
 */

export interface ChurchProps {
  id: string
  code: string
  name: string
  denomination: string | null
  address: string | null
  regionCode: string | null
  writeToken: string | null
  adminToken: string | null
  isActive: boolean
  allowAnonymous: boolean
  scheduleYear: number | null
  scheduleStartDate: Date | null
  createdAt: Date
  updatedAt: Date
}

export class Church {
  private constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly denomination: string | null,
    public readonly address: string | null,
    public readonly regionCode: string | null,
    public readonly writeToken: string | null,
    public readonly adminToken: string | null,
    public readonly isActive: boolean,
    public readonly allowAnonymous: boolean,
    public readonly scheduleYear: number | null,
    public readonly scheduleStartDate: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Church 엔티티를 생성합니다. (새로운 교회 생성 시 사용)
   * @throws 코드나 이름이 유효하지 않으면 에러
   */
  static create(props: ChurchProps): Church {
    Church.validateCode(props.code)
    Church.validateName(props.name)

    return new Church(
      props.id,
      props.code,
      props.name,
      props.denomination,
      props.address,
      props.regionCode,
      props.writeToken,
      props.adminToken,
      props.isActive,
      props.allowAnonymous,
      props.scheduleYear,
      props.scheduleStartDate,
      props.createdAt,
      props.updatedAt
    )
  }

  /**
   * DB에서 읽어온 데이터로 Church 엔티티를 복원합니다.
   * 기존 데이터는 validation을 스킵합니다.
   */
  static fromDatabase(props: ChurchProps): Church {
    return new Church(
      props.id,
      props.code,
      props.name,
      props.denomination,
      props.address,
      props.regionCode,
      props.writeToken,
      props.adminToken,
      props.isActive,
      props.allowAnonymous,
      props.scheduleYear,
      props.scheduleStartDate,
      props.createdAt,
      props.updatedAt
    )
  }

  private static validateCode(code: string): void {
    if (!code || code.trim().length === 0) {
      throw new Error('교회 코드는 필수입니다')
    }
    if (code.length < 2) {
      throw new Error('교회 코드는 2자 이상이어야 합니다')
    }
    // 영문 소문자, 숫자, 하이픈만 허용
    if (!/^[a-z0-9-]+$/.test(code)) {
      throw new Error('교회 코드는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다')
    }
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('교회 이름은 필수입니다')
    }
  }

  /**
   * 교회를 비활성화합니다.
   */
  deactivate(): Church {
    return new Church(
      this.id,
      this.code,
      this.name,
      this.denomination,
      this.address,
      this.regionCode,
      this.writeToken,
      this.adminToken,
      false,
      this.allowAnonymous,
      this.scheduleYear,
      this.scheduleStartDate,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 교회를 활성화합니다.
   */
  activate(): Church {
    return new Church(
      this.id,
      this.code,
      this.name,
      this.denomination,
      this.address,
      this.regionCode,
      this.writeToken,
      this.adminToken,
      true,
      this.allowAnonymous,
      this.scheduleYear,
      this.scheduleStartDate,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 익명 모드를 활성화합니다.
   */
  enableAnonymous(): Church {
    return new Church(
      this.id,
      this.code,
      this.name,
      this.denomination,
      this.address,
      this.regionCode,
      this.writeToken,
      this.adminToken,
      this.isActive,
      true,
      this.scheduleYear,
      this.scheduleStartDate,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 익명 모드를 비활성화합니다.
   */
  disableAnonymous(): Church {
    return new Church(
      this.id,
      this.code,
      this.name,
      this.denomination,
      this.address,
      this.regionCode,
      this.writeToken,
      this.adminToken,
      this.isActive,
      false,
      this.scheduleYear,
      this.scheduleStartDate,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 교회 이름을 변경합니다.
   * @throws 이름이 유효하지 않으면 에러
   */
  updateName(newName: string): Church {
    Church.validateName(newName)

    return new Church(
      this.id,
      this.code,
      newName,
      this.denomination,
      this.address,
      this.regionCode,
      this.writeToken,
      this.adminToken,
      this.isActive,
      this.allowAnonymous,
      this.scheduleYear,
      this.scheduleStartDate,
      this.createdAt,
      new Date()
    )
  }

  /**
   * 작성 토큰을 검증합니다.
   */
  validateWriteToken(token: string): boolean {
    if (!this.writeToken) {
      return false
    }
    return this.writeToken === token
  }

  /**
   * 관리자 토큰을 검증합니다.
   */
  validateAdminToken(token: string): boolean {
    if (!this.adminToken) {
      return false
    }
    return this.adminToken === token
  }

  /**
   * 교회 URL을 반환합니다.
   */
  getUrl(): string {
    return `/church/${this.code}`
  }

  /**
   * DTO 형태로 변환합니다.
   */
  toDTO(): ChurchProps {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      denomination: this.denomination,
      address: this.address,
      regionCode: this.regionCode,
      writeToken: this.writeToken,
      adminToken: this.adminToken,
      isActive: this.isActive,
      allowAnonymous: this.allowAnonymous,
      scheduleYear: this.scheduleYear,
      scheduleStartDate: this.scheduleStartDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
