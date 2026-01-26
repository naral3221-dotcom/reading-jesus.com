/**
 * Prayer Entity
 *
 * 기도제목 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 */

import type { Profile } from '@/types'

export interface PrayerProps {
  id: string
  groupId: string
  userId: string
  content: string
  isAnonymous: boolean
  isAnswered: boolean
  answeredAt: Date | null
  supportCount: number
  createdAt: Date
  updatedAt: Date
  profile: Pick<Profile, 'nickname' | 'avatar_url'> | null
  isSupported?: boolean
}

export interface CreatePrayerInput {
  groupId: string
  userId: string
  content: string
  isAnonymous?: boolean
}

export interface UpdatePrayerInput {
  content?: string
  isAnonymous?: boolean
}

// 함께 기도합니다
export interface PrayerSupportProps {
  id: string
  prayerId: string
  userId: string
  createdAt: Date
}

export class Prayer {
  private constructor(private readonly props: PrayerProps) {}

  /**
   * Prayer 엔티티를 생성합니다.
   * @throws 내용이 비어있거나 2000자 초과시 에러
   */
  static create(props: PrayerProps): Prayer {
    Prayer.validate(props)
    return new Prayer(props)
  }

  private static validate(props: PrayerProps): void {
    if (!props.content || props.content.trim().length === 0) {
      throw new Error('기도제목 내용은 필수입니다.')
    }
    if (props.content.length > 2000) {
      throw new Error('기도제목은 2000자를 초과할 수 없습니다.')
    }
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get groupId(): string {
    return this.props.groupId
  }

  get userId(): string {
    return this.props.userId
  }

  get content(): string {
    return this.props.content
  }

  get isAnonymous(): boolean {
    return this.props.isAnonymous
  }

  get isAnswered(): boolean {
    return this.props.isAnswered
  }

  get answeredAt(): Date | null {
    return this.props.answeredAt
  }

  get supportCount(): number {
    return this.props.supportCount
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get profile(): Pick<Profile, 'nickname' | 'avatar_url'> | null {
    return this.props.profile
  }

  get isSupported(): boolean {
    return this.props.isSupported ?? false
  }

  // Business Logic

  /**
   * 기도제목을 수정합니다.
   */
  update(input: UpdatePrayerInput): Prayer {
    const newProps = {
      ...this.props,
      content: input.content !== undefined ? input.content : this.props.content,
      isAnonymous: input.isAnonymous !== undefined ? input.isAnonymous : this.props.isAnonymous,
      updatedAt: new Date(),
    }
    Prayer.validate(newProps)
    return new Prayer(newProps)
  }

  /**
   * 기도제목을 응답됨으로 표시합니다.
   */
  markAsAnswered(): Prayer {
    if (this.props.isAnswered) {
      return this
    }
    return new Prayer({
      ...this.props,
      isAnswered: true,
      answeredAt: new Date(),
      updatedAt: new Date(),
    })
  }

  /**
   * 함께 기도 수를 증가시킵니다.
   */
  incrementSupport(): Prayer {
    return new Prayer({
      ...this.props,
      supportCount: this.props.supportCount + 1,
    })
  }

  /**
   * 함께 기도 수를 감소시킵니다.
   */
  decrementSupport(): Prayer {
    return new Prayer({
      ...this.props,
      supportCount: Math.max(0, this.props.supportCount - 1),
    })
  }

  /**
   * 특정 사용자가 작성자인지 확인합니다.
   */
  isAuthor(userId: string | null): boolean {
    if (!userId) return false
    return this.props.userId === userId
  }

  /**
   * 표시할 이름을 반환합니다. (익명이면 '익명')
   */
  getDisplayName(): string {
    if (this.props.isAnonymous) return '익명'
    return this.props.profile?.nickname || '알 수 없음'
  }

  /**
   * DTO로 변환합니다.
   */
  toDTO(): PrayerProps {
    return { ...this.props }
  }
}
