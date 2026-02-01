/**
 * Repository Interfaces Export
 */

export type { IUserRepository } from './IUserRepository'
export type { IChurchRepository, ChurchSearchParams } from './IChurchRepository'
export type { IQTRepository } from './IQTRepository'
export type { IGroupRepository, GroupSearchParams } from './IGroupRepository'
export type { IChurchNoticeRepository, ChurchNoticeSearchParams } from './IChurchNoticeRepository'
export type { IGroupNoticeRepository, GroupNoticeSearchParams } from './IGroupNoticeRepository'
export type { INotificationRepository, NotificationSearchParams } from './INotificationRepository'
export type { IGuestCommentRepository, GuestCommentSearchParams, GuestCommentWithLikeStatus } from './IChurchGuestMeditationRepository'
export type { IChurchQTPostRepository, ChurchQTPostSearchParams } from './IChurchQTPostRepository'
export type { ICommentReplyRepository } from './ICommentReplyRepository'
export type { IPrayerRepository, PrayerSearchParams } from './IPrayerRepository'
export type { IReadingCheckRepository, ReadingCheckContext, ReadingCheckSearchParams } from './IReadingCheckRepository'
export type { ICommentRepository, CommentSearchParams, CommentWithLikeStatus } from './IGroupMeditationRepository'
export type {
  IPublicMeditationRepository,
  GetPublicMeditationsOptions,
  CreatePublicMeditationInput,
  UpdatePublicMeditationInput,
  CreatePublicMeditationReplyInput,
} from './IPublicMeditationRepository'
export type {
  IUserFollowRepository,
  GetFollowersOptions,
  GetFollowingOptions,
} from './IUserFollowRepository'

export type {
  IPublicMeditationCommentRepository,
  CreateCommentInput as CreateMeditationCommentInput,
  GetCommentsInput as GetMeditationCommentsInput,
  GetCommentsOutput as GetMeditationCommentsOutput,
} from './IPublicMeditationCommentRepository'

export type { IUserDailyReadingRepository } from './IUserDailyReadingRepository'

// 통합 묵상/읽음 체크
export type {
  IUnifiedMeditationRepository,
  UnifiedMeditationSearchParams,
  UserMeditationSearchParams,
  UnifiedMeditationWithLikeStatus,
} from './IUnifiedMeditationRepository'
export type {
  IUnifiedReadingCheckRepository,
  UnifiedReadingCheckSearchParams,
} from './IUnifiedReadingCheckRepository'

// ===== 새 명명 체계 추가 export =====
export type { IChurchGuestMeditationRepository, ChurchGuestMeditationSearchParams, ChurchGuestMeditationWithLikeStatus } from './IChurchGuestMeditationRepository'
export type { IGroupMeditationRepository, GroupMeditationSearchParams, GroupMeditationWithLikeStatus } from './IGroupMeditationRepository'
