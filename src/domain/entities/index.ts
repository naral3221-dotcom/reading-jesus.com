/**
 * Domain Entities Export
 */

export { User } from './User'
export type { UserProps } from './User'

export { Church } from './Church'
export type { ChurchProps } from './Church'

export { QT } from './QT'
export type { QTProps, QTVerse, QTMeditation } from './QT'

export { Group, GroupMember } from './Group'
export type {
  GroupProps,
  GroupMemberProps,
  ReadingPlanType,
  BibleRangeType,
  ScheduleMode,
  GroupRole,
} from './Group'

export { ChurchNotice } from './ChurchNotice'
export type { ChurchNoticeProps, CreateChurchNoticeInput } from './ChurchNotice'

export { GroupNotice } from './GroupNotice'
export type { GroupNoticeProps, CreateGroupNoticeInput, UpdateGroupNoticeInput } from './GroupNotice'

export { Notification } from './Notification'
export type { NotificationProps, CreateNotificationInput, NotificationType } from './Notification'

export { GuestComment, GuestCommentReply } from './ChurchGuestMeditation'
export type {
  GuestCommentProps,
  CreateGuestCommentInput,
  UpdateGuestCommentInput,
  GuestCommentReplyProps,
  CreateGuestCommentReplyInput,
  GuestCommentLikeProps,
} from './ChurchGuestMeditation'

export { ChurchQTPost, ChurchQTPostReply } from './ChurchQTPost'
export type {
  ChurchQTPostProps,
  CreateChurchQTPostInput,
  UpdateChurchQTPostInput,
  ChurchQTPostReplyProps,
  CreateChurchQTPostReplyInput,
  ChurchQTPostLikeProps,
} from './ChurchQTPost'

export { CommentReply } from './CommentReply'
export type {
  CommentReplyProps,
  CreateCommentReplyInput,
} from './CommentReply'

export { Prayer } from './Prayer'
export type {
  PrayerProps,
  CreatePrayerInput,
  UpdatePrayerInput,
  PrayerSupportProps,
} from './Prayer'

export { ReadingCheck, calculateStreak, calculateProgress } from './ReadingCheck'
export type {
  ReadingCheckProps,
  CreateReadingCheckInput,
  ReadingStreakProps,
  ReadingProgressProps,
} from './ReadingCheck'

export { Comment, CommentReply as GroupCommentReply } from './GroupMeditation'
export type {
  CommentProps,
  CreateCommentInput,
  UpdateCommentInput,
  CommentReplyProps as GroupCommentReplyProps,
  CreateCommentReplyInput as CreateGroupCommentReplyInput,
  CommentAttachmentProps,
  MemberRankProps,
} from './GroupMeditation'

export { PublicMeditation, PublicMeditationReply } from './PublicMeditation'
export type {
  PublicMeditationProps,
  PublicMeditationReplyProps,
} from './PublicMeditation'

export { UserFollow, isFollowing, getFollowersCount, getFollowingCount } from './UserFollow'
export type {
  UserFollowProps,
  UserWithFollowStatus,
} from './UserFollow'

export { PublicMeditationComment } from './PublicMeditationComment'
export type {
  PublicMeditationCommentProps,
  MeditationType,
} from './PublicMeditationComment'

export { UserDailyReading } from './UserDailyReading'
export type {
  UserDailyReadingProps,
  ReadingPlanType as UserDailyReadingPlanType,
  AppliedGroup,
} from './UserDailyReading'

// ===== 새 명명 체계 추가 export =====

// ChurchGuestMeditation
export {
  ChurchGuestMeditation,
  ChurchGuestMeditationReply,
} from './ChurchGuestMeditation'
export type {
  ChurchGuestMeditationProps,
  CreateChurchGuestMeditationInput,
  UpdateChurchGuestMeditationInput,
  ChurchGuestMeditationReplyProps,
  CreateChurchGuestMeditationReplyInput,
  ChurchGuestMeditationLikeProps,
} from './ChurchGuestMeditation'

// GroupMeditation
export {
  GroupMeditation,
  GroupMeditationReply,
} from './GroupMeditation'
export type {
  GroupMeditationProps,
  CreateGroupMeditationInput,
  UpdateGroupMeditationInput,
  GroupMeditationReplyProps,
  CreateGroupMeditationReplyInput,
  GroupMeditationAttachmentProps,
} from './GroupMeditation'
