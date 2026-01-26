/**
 * Notification Entity
 *
 * 알림 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 */

export type NotificationType =
  | 'new_comment'
  | 'comment_reply'
  | 'mention'
  | 'like'
  | 'group_notice'
  | 'group_invite'
  | 'system'

export interface NotificationProps {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  link: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
  metadata?: Record<string, unknown> | null
}

export class Notification {
  private constructor(private readonly props: NotificationProps) {}

  /**
   * Notification 엔티티를 생성합니다.
   * @throws 제목이 비어있으면 에러
   * @throws 메시지가 비어있으면 에러
   */
  static create(props: NotificationProps): Notification {
    Notification.validate(props)
    return new Notification(props)
  }

  private static validate(props: NotificationProps): void {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('알림 제목은 필수입니다.')
    }
    if (!props.message || props.message.trim().length === 0) {
      throw new Error('알림 메시지는 필수입니다.')
    }
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get userId(): string {
    return this.props.userId
  }

  get type(): NotificationType {
    return this.props.type
  }

  get title(): string {
    return this.props.title
  }

  get message(): string {
    return this.props.message
  }

  get isRead(): boolean {
    return this.props.isRead
  }

  get link(): string | null {
    return this.props.link
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  // Business Logic

  /**
   * 알림을 읽음 처리합니다.
   */
  markAsRead(): Notification {
    if (this.props.isRead) {
      return this
    }
    return new Notification({
      ...this.props,
      isRead: true,
    })
  }

  /**
   * 알림을 안읽음 처리합니다.
   */
  markAsUnread(): Notification {
    if (!this.props.isRead) {
      return this
    }
    return new Notification({
      ...this.props,
      isRead: false,
    })
  }

  /**
   * 특정 사용자의 알림인지 확인합니다.
   */
  belongsTo(userId: string): boolean {
    return this.props.userId === userId
  }

  /**
   * DTO로 변환합니다.
   */
  toDTO(): NotificationProps {
    return { ...this.props }
  }
}
