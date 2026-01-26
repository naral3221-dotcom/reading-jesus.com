/**
 * GetNotifications Use Case
 *
 * 알림 목록을 조회하는 Use Case.
 */

import { Notification } from '@/domain/entities/Notification'
import { INotificationRepository } from '@/domain/repositories/INotificationRepository'

export interface GetNotificationsInput {
  userId: string
  unreadOnly?: boolean
  limit?: number
  offset?: number
}

export interface GetNotificationsOutput {
  notifications: Notification[]
  error: string | null
}

export class GetNotifications {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: GetNotificationsInput): Promise<GetNotificationsOutput> {
    try {
      const notifications = await this.notificationRepository.findByUserId({
        userId: input.userId,
        unreadOnly: input.unreadOnly,
        limit: input.limit,
        offset: input.offset,
      })

      return { notifications, error: null }
    } catch (error) {
      return {
        notifications: [],
        error: error instanceof Error ? error.message : '알림 조회 중 오류가 발생했습니다',
      }
    }
  }
}
