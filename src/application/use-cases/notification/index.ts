/**
 * Notification Use Cases Export
 */

export { GetNotifications } from './GetNotifications'
export type { GetNotificationsInput, GetNotificationsOutput } from './GetNotifications'

export { GetUnreadCount } from './GetUnreadCount'
export type { GetUnreadCountInput, GetUnreadCountOutput } from './GetUnreadCount'

export { MarkAsRead } from './MarkAsRead'
export type { MarkAsReadInput, MarkAsReadOutput } from './MarkAsRead'

export { MarkAllAsRead } from './MarkAllAsRead'
export type { MarkAllAsReadInput, MarkAllAsReadOutput } from './MarkAllAsRead'

export {
  CreateNotification,
  CreateLikeNotification,
  CreateReplyNotification,
  CreateGroupNoticeNotification,
} from './CreateNotification'
export type { CreateNotificationInput } from './CreateNotification'
