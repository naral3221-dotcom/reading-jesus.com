/**
 * React Query Hooks Export
 */

// QT Hooks
export {
  useTodayQT,
  useDailyQT,
  useQTByDayNumber,
  useMonthlyQT,
  qtKeys,
} from './useQT'

// Church Hooks
export {
  useChurchById,
  useChurchByCode,
  useSearchChurches,
  useJoinChurch,
  churchKeys,
} from './useChurch'

// User Hooks
export {
  useCurrentUser,
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
  userKeys,
} from './useUser'

// Group Hooks
export {
  useGroupById,
  useGroupByInviteCode,
  useUserGroups,
  useGroupMembers,
  useSearchGroups,
  useJoinGroup,
  useLeaveGroup,
  useChurchGroups,
  groupKeys,
  type ChurchGroup,
} from './useGroup'

// Church Notice Hooks
export {
  useChurchNotices,
  useActiveChurchNotices,
  useCreateChurchNotice,
  useUpdateChurchNotice,
  useDeleteChurchNotice,
  useToggleNoticePin,
  useToggleNoticeActive,
  churchNoticeKeys,
} from './useChurchNotice'

// Group Notice Hooks
export {
  useGroupNotices,
  useCreateGroupNotice,
  useUpdateGroupNotice,
  useDeleteGroupNotice,
  groupNoticeKeys,
} from './useGroupNotice'

// Notification Hooks
export {
  useNotifications,
  useUnreadNotificationCount,
  useMarkAsRead,
  useMarkAllAsRead,
  notificationKeys,
} from './useNotification'

// Guest Comment Hooks
export {
  useGuestComments,
  useCreateGuestComment,
  useUpdateGuestComment,
  useDeleteGuestComment,
  useToggleGuestCommentLike,
  useGuestCommentReplies,
  useCreateGuestCommentReply,
  useDeleteGuestCommentReply,
  guestCommentKeys,
} from './useChurchGuestMeditation'

// Church QT Post Hooks
export {
  useChurchQTPosts,
  useCreateChurchQTPost,
  useUpdateChurchQTPost,
  useDeleteChurchQTPost,
  useToggleChurchQTPostLike,
  useChurchQTPostReplies,
  useCreateChurchQTPostReply,
  useDeleteChurchQTPostReply,
  churchQTPostKeys,
} from './useChurchQTPost'

// Comment Reply Hooks
export {
  useCommentReplies,
  useCreateCommentReply,
  useDeleteCommentReply,
  commentReplyKeys,
} from './useCommentReply'

// Prayer Hooks
export {
  usePrayers,
  useCreatePrayer,
  useDeletePrayer,
  useMarkPrayerAsAnswered,
  useTogglePrayerSupport,
  prayerKeys,
} from './usePrayer'

// ReadingCheck Hooks
export {
  useReadingChecks,
  useCheckedDayNumbers,
  useToggleReadingCheck,
  useReadingProgress,
  useReadingStreak,
  useReadingCheckWithToggle,
  readingCheckKeys,
} from './useReadingCheck'

// Comment Hooks (그룹 묵상 댓글)
export {
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useToggleCommentLike,
  useToggleCommentPin,
  useCommentReplies as useGroupCommentReplies,
  useCreateCommentReply as useCreateGroupCommentReply,
  useDeleteCommentReply as useDeleteGroupCommentReply,
  useInfiniteComments,
  useGroupFeed,
  commentKeys,
} from './useGroupMeditation'

// PersonalProject Hooks (개인 성경 읽기 프로젝트)
export {
  useUserProjects,
  useProject,
  useProjectChecks,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useToggleProjectCheck,
  personalProjectKeys,
} from './usePersonalProject'

// ChurchAdmin Hooks (교회 관리자)
export {
  useChurchByCodeForAdmin,
  useChurchAdmins,
  useIsChurchAdmin,
  useChurchAdminLogin,
  useChurchAdminTokenLogin,
  useCreateChurchAdmin,
  useDeleteChurchAdmin,
  useToggleChurchAdminActive,
  useSendPasswordResetEmail,
  useChurchAdminLogout,
  churchAdminKeys,
} from './useChurchAdmin'

// SystemAdmin Hooks (시스템 관리자)
export {
  useSystemStats,
  useAdminChurches,
  useCreateChurch,
  useDeleteChurch,
  useToggleChurchActive,
  useRegenerateChurchToken,
  useRegionCodes,
  useAdminGroups,
  useDeleteGroup,
  useToggleGroupActive,
  useAdminUsers,
  useDeleteUser,
  systemAdminKeys,
} from './useSystemAdmin'

// GroupMeeting Hooks (그룹 모임)
export {
  useGroupMeetings,
  useCreateMeeting,
  useJoinMeeting,
  useCancelMeetingParticipation,
  groupMeetingKeys,
} from './useGroupMeeting'

// UserPlans Hooks (사용자 플랜)
export {
  useUserPlans,
  userPlanKeys,
  type PlanOption,
} from './useUserPlans'

// Encouragement Hooks (격려 메시지)
export {
  useSendEncouragement,
  useReceivedEncouragements,
  useUnreadEncouragementCount,
  useMarkEncouragementAsRead,
  useMarkAllEncouragementAsRead,
  encouragementKeys,
  type SendEncouragementInput,
  type SendEncouragementResult,
} from './useEncouragement'

// Badge Hooks (배지)
export {
  useUserBadges,
  useUnnotifiedBadges,
  useMarkBadgeAsNotified,
  badgeKeys,
} from './useBadge'

// Church Stats Hooks (교회 통계)
export {
  useTodayStats,
  useChurchReadingProgress,
  useCompletedReadingDays,
  useRecentChurchPosts,
  useUserActivityStats,
  churchStatsKeys,
  type TodayStatsData,
  type ReadingProgressData,
  type ChurchPost,
  type UserActivityStats,
} from './useChurchStats'

// Reading Schedule Hooks (성경 통독 일정)
export {
  useWeeklyReadingSchedule,
  readingScheduleKeys,
  type ReadingSchedule,
} from './useReadingSchedule'

// ===== 새 명명 체계 추가 export =====

// ChurchGuestMeditation
export {
  churchGuestMeditationKeys,
  useChurchGuestMeditations,
  useCreateChurchGuestMeditation,
  useUpdateChurchGuestMeditation,
  useDeleteChurchGuestMeditation,
  useToggleChurchGuestMeditationLike,
  useChurchGuestMeditationReplies,
  useCreateChurchGuestMeditationReply,
  useDeleteChurchGuestMeditationReply,
} from './useChurchGuestMeditation'

// GroupMeditation
export {
  groupMeditationKeys,
  useGroupMeditations,
  useCreateGroupMeditation,
  useUpdateGroupMeditation,
  useDeleteGroupMeditation,
  useToggleGroupMeditationLike,
  useToggleGroupMeditationPin,
  useGroupMeditationReplies,
  useCreateGroupMeditationReply,
  useDeleteGroupMeditationReply,
} from './useGroupMeditation'
