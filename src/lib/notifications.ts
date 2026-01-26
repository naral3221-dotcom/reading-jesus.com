/**
 * Notification Helper Functions
 *
 * 호환성을 위해 유지되는 레거시 함수들.
 * 새 코드에서는 @/application/use-cases/notification 사용 권장.
 */

import {
  CreateNotification,
  CreateLikeNotification,
  CreateReplyNotification,
  CreateGroupNoticeNotification,
  type CreateNotificationInput,
} from '@/application/use-cases/notification'

// Use Case 인스턴스
const createNotificationUseCase = new CreateNotification()
const createLikeNotificationUseCase = new CreateLikeNotification()
const createReplyNotificationUseCase = new CreateReplyNotification()
const createGroupNoticeNotificationUseCase = new CreateGroupNoticeNotification()

/**
 * @deprecated 새 코드에서는 CreateNotification Use Case 사용 권장
 */
export async function createNotification(params: CreateNotificationInput): Promise<boolean> {
  return createNotificationUseCase.execute(params)
}

/**
 * @deprecated 새 코드에서는 CreateLikeNotification Use Case 사용 권장
 */
export async function createLikeNotification(
  commentOwnerId: string,
  actorId: string,
  commentId: string,
  groupId: string,
  dayNumber: number
): Promise<boolean> {
  return createLikeNotificationUseCase.execute(commentOwnerId, actorId, commentId, groupId, dayNumber)
}

/**
 * @deprecated 새 코드에서는 CreateReplyNotification Use Case 사용 권장
 */
export async function createReplyNotification(
  commentOwnerId: string,
  actorId: string,
  commentId: string,
  groupId: string,
  dayNumber: number,
  replyContent: string
): Promise<boolean> {
  return createReplyNotificationUseCase.execute(commentOwnerId, actorId, commentId, groupId, dayNumber, replyContent)
}

/**
 * @deprecated 새 코드에서는 CreateGroupNoticeNotification Use Case 사용 권장
 */
export async function createGroupNoticeNotification(
  groupId: string,
  groupName: string,
  noticeTitle: string,
  authorId: string
): Promise<void> {
  return createGroupNoticeNotificationUseCase.execute(groupId, groupName, noticeTitle, authorId)
}
