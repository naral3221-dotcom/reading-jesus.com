/**
 * Group Entity
 *
 * 그룹 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 * 외부 의존성 없이 순수 TypeScript로 구현됩니다.
 */

export type ReadingPlanType = '365' | '180' | '90' | 'custom'
export type BibleRangeType = 'full' | 'ot' | 'nt' | 'custom'
export type ScheduleMode = 'calendar' | 'day_count'
export type GroupRole = 'admin' | 'member'

export interface GroupProps {
  id: string
  name: string
  description: string | null
  startDate: string // YYYY-MM-DD
  endDate: string | null
  inviteCode: string
  createdBy: string | null
  createdAt: string
  readingPlanType: ReadingPlanType
  goal: string | null
  rules: string | null
  isPublic: boolean
  maxMembers: number
  allowAnonymous: boolean
  requireDailyReading: boolean
  bibleRangeType: BibleRangeType
  bibleRangeBooks: string[] | null
  scheduleMode: ScheduleMode
  churchId?: string | null
  isChurchOfficial?: boolean
}

export interface GroupMemberProps {
  id: string
  groupId: string
  userId: string
  role: GroupRole
  joinedAt: string
}

export class GroupMember {
  private constructor(private readonly props: GroupMemberProps) {}

  static create(props: GroupMemberProps): GroupMember {
    return new GroupMember(props)
  }

  get id(): string {
    return this.props.id
  }

  get groupId(): string {
    return this.props.groupId
  }

  get userId(): string {
    return this.props.userId
  }

  get role(): GroupRole {
    return this.props.role
  }

  get joinedAt(): string {
    return this.props.joinedAt
  }

  isAdmin(): boolean {
    return this.props.role === 'admin'
  }

  toDTO(): GroupMemberProps {
    return { ...this.props }
  }
}

export class Group {
  private constructor(private readonly props: GroupProps) {}

  /**
   * Group 엔티티를 생성합니다.
   * @throws 그룹 이름이 비어있으면 에러
   */
  static create(props: GroupProps): Group {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('그룹 이름은 필수입니다.')
    }
    if (props.name.length > 50) {
      throw new Error('그룹 이름은 50자를 초과할 수 없습니다.')
    }
    if (props.maxMembers < 1 || props.maxMembers > 1000) {
      throw new Error('최대 멤버 수는 1~1000 사이여야 합니다.')
    }
    return new Group(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | null {
    return this.props.description
  }

  get startDate(): string {
    return this.props.startDate
  }

  get endDate(): string | null {
    return this.props.endDate
  }

  get inviteCode(): string {
    return this.props.inviteCode
  }

  get createdBy(): string | null {
    return this.props.createdBy
  }

  get createdAt(): string {
    return this.props.createdAt
  }

  get readingPlanType(): ReadingPlanType {
    return this.props.readingPlanType
  }

  get goal(): string | null {
    return this.props.goal
  }

  get rules(): string | null {
    return this.props.rules
  }

  get isPublic(): boolean {
    return this.props.isPublic
  }

  get maxMembers(): number {
    return this.props.maxMembers
  }

  get allowAnonymous(): boolean {
    return this.props.allowAnonymous
  }

  get requireDailyReading(): boolean {
    return this.props.requireDailyReading
  }

  get bibleRangeType(): BibleRangeType {
    return this.props.bibleRangeType
  }

  get bibleRangeBooks(): string[] | null {
    return this.props.bibleRangeBooks
  }

  get scheduleMode(): ScheduleMode {
    return this.props.scheduleMode
  }

  get churchId(): string | null | undefined {
    return this.props.churchId
  }

  get isChurchOfficial(): boolean | undefined {
    return this.props.isChurchOfficial
  }

  // Business Logic

  /**
   * 초대 코드가 유효한지 검증합니다.
   */
  validateInviteCode(code: string): boolean {
    return this.props.inviteCode === code
  }

  /**
   * 그룹이 교회 그룹인지 확인합니다.
   */
  isChurchGroup(): boolean {
    return !!this.props.churchId
  }

  /**
   * 그룹이 활성 상태인지 확인합니다.
   */
  isActive(): boolean {
    const now = new Date()
    const startDate = new Date(this.props.startDate)

    if (now < startDate) {
      return false
    }

    if (this.props.endDate) {
      const endDate = new Date(this.props.endDate)
      return now <= endDate
    }

    return true
  }

  /**
   * 그룹에 더 많은 멤버를 받을 수 있는지 확인합니다.
   */
  canAcceptMoreMembers(currentMemberCount: number): boolean {
    return currentMemberCount < this.props.maxMembers
  }

  /**
   * 그룹 이름을 업데이트합니다.
   */
  updateName(newName: string): Group {
    if (!newName || newName.trim().length === 0) {
      throw new Error('그룹 이름은 필수입니다.')
    }
    if (newName.length > 50) {
      throw new Error('그룹 이름은 50자를 초과할 수 없습니다.')
    }
    return new Group({
      ...this.props,
      name: newName.trim(),
    })
  }

  /**
   * 그룹 설명을 업데이트합니다.
   */
  updateDescription(newDescription: string | null): Group {
    return new Group({
      ...this.props,
      description: newDescription,
    })
  }

  /**
   * 그룹 공개 여부를 변경합니다.
   */
  setPublic(isPublic: boolean): Group {
    return new Group({
      ...this.props,
      isPublic,
    })
  }

  /**
   * DTO로 변환합니다.
   */
  toDTO(): GroupProps {
    return { ...this.props }
  }
}
