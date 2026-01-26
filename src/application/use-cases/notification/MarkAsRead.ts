/**
 * MarkAsRead Use Case
 *
 * 알림을 읽음 처리하는 Use Case.
 */

import { Notification } from '@/domain/entities/Notification'
import { INotificationRepository } from '@/domain/repositories/INotificationRepository'

export interface MarkAsReadInput {
  id: string
}

export interface MarkAsReadOutput {
  notification: Notification | null
  error: string | null
}

export class MarkAsRead {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: MarkAsReadInput): Promise<MarkAsReadOutput> {
    try {
      const notification = await this.notificationRepository.markAsRead(input.id)

      return { notification, error: null }
    } catch (error) {
      return {
        notification: null,
        error: error instanceof Error ? error.message : '알림 읽음 처리 중 오류가 발생했습니다',
      }
    }
  }
}
