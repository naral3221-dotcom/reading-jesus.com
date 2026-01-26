/**
 * Presentation Layer Export
 *
 * React Query 훅과 Zustand 스토어를 통합 export합니다.
 * 기존 컴포넌트에서 아래와 같이 import 가능:
 *
 * import { useTodayQT, useUIStore } from '@/presentation'
 */

// React Query Hooks
export {
  useTodayQT,
  useDailyQT,
  useQTByDayNumber,
  useMonthlyQT,
  qtKeys,
} from './hooks/queries/useQT'

export {
  useChurchById,
  useChurchByCode,
  useSearchChurches,
  useJoinChurch,
  churchKeys,
} from './hooks/queries/useChurch'

export {
  useCurrentUser,
  useUpdateProfile,
  userKeys,
} from './hooks/queries/useUser'

export {
  useGroupById,
  useGroupByInviteCode,
  useUserGroups,
  useGroupMembers,
  useSearchGroups,
  useJoinGroup,
  useLeaveGroup,
  groupKeys,
} from './hooks/queries/useGroup'

// Zustand Stores
export { useUIStore } from './hooks/stores/useUIStore'
export { useUserSettingsStore } from './hooks/stores/useUserSettingsStore'
export { useGroupStore, useGroupCompat } from './hooks/stores/useGroupStore'

// Providers
export { QueryProvider } from './providers/QueryProvider'
