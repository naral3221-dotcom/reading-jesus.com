/**
 * MarkAllAsRead Use Case
 *
 * 모든 알림을 읽음 처리하는 Use Case.
 */

import { INotificationRepository } from '@/domain/repositories/INotificationRepository'

export interface MarkAllAsReadInput {
  userId: string
}

export interface MarkAllAsReadOutput {
  success: boolean
  error: string | null
}

export class MarkAllAsRead {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: MarkAllAsReadInput): Promise<MarkAllAsReadOutput> {
    try {
      await this.notificationRepository.markAllAsRead(input.userId)

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알림 일괄 읽음 처리 중 오류가 발생했습니다',
      }
    }
  }
}
