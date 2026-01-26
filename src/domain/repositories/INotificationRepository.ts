/**
 * Notification Repository Interface
 *
 * 알림 데이터 접근을 위한 인터페이스입니다.
 * Infrastructure 레이어에서 구현됩니다.
 */

import { Notification, CreateNotificationInput } from '../entities/Notification'

export interface NotificationSearchParams {
  userId: string
  unreadOnly?: boolean
  limit?: number
  offset?: number
}

export interface INotificationRepository {
  /**
   * ID로 알림을 조회합니다.
   */
  findById(id: string): Promise<Notification | null>

  /**
   * 사용자의 알림 목록을 조회합니다.
   * 최신순으로 정렬됩니다.
   */
  findByUserId(params: NotificationSearchParams): Promise<Notification[]>

  /**
   * 읽지 않은 알림 개수를 조회합니다.
   */
  getUnreadCount(userId: string): Promise<number>

  /**
   * 알림을 저장합니다. (생성)
   */
  save(input: CreateNotificationInput): Promise<Notification>

  /**
   * 알림을 읽음 처리합니다.
   */
  markAsRead(id: string): Promise<Notification>

  /**
   * 모든 알림을 읽음 처리합니다.
   */
  markAllAsRead(userId: string): Promise<void>

  /**
   * 알림을 삭제합니다.
   */
  delete(id: string): Promise<void>

  /**
   * 사용자의 모든 알림을 삭제합니다.
   */
  deleteAll(userId: string): Promise<void>
}
