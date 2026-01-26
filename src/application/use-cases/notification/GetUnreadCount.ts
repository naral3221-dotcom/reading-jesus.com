/**
 * GetUnreadCount Use Case
 *
 * 읽지 않은 알림 개수를 조회하는 Use Case.
 */

import { INotificationRepository } from '@/domain/repositories/INotificationRepository'

export interface GetUnreadCountInput {
  userId: string
}

export interface GetUnreadCountOutput {
  count: number
  error: string | null
}

export class GetUnreadCount {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(input: GetUnreadCountInput): Promise<GetUnreadCountOutput> {
    try {
      const count = await this.notificationRepository.getUnreadCount(input.userId)

      return { count, error: null }
    } catch (error) {
      return {
        count: 0,
        error: error instanceof Error ? error.message : '알림 개수 조회 중 오류가 발생했습니다',
      }
    }
  }
}
