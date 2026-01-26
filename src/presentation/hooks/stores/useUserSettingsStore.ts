'use client'

/**
 * User Settings Store (Zustand)
 *
 * 사용자 설정 관련 전역 상태를 관리합니다.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UserSettingsState {
  // 알림 설정
  notificationsEnabled: boolean
  notificationTime: string // HH:MM 형식
  setNotificationsEnabled: (enabled: boolean) => void
  setNotificationTime: (time: string) => void

  // 읽기 플랜 설정
  activeGroupId: string | null
  setActiveGroupId: (groupId: string | null) => void

  // 익명 모드
  isAnonymous: boolean
  setAnonymous: (anonymous: boolean) => void

  // 성경 버전
  bibleVersion: 'krv' | 'niv' | 'nasb'
  setBibleVersion: (version: UserSettingsState['bibleVersion']) => void

  // QT 설정
  showMeditationGuide: boolean
  showJesusConnection: boolean
  setShowMeditationGuide: (show: boolean) => void
  setShowJesusConnection: (show: boolean) => void

  // 최근 본 QT 일차
  lastViewedQTDay: number | null
  setLastViewedQTDay: (day: number | null) => void

  // 설정 초기화
  resetSettings: () => void
}

const defaultSettings = {
  notificationsEnabled: false,
  notificationTime: '07:00',
  activeGroupId: null,
  isAnonymous: false,
  bibleVersion: 'krv' as const,
  showMeditationGuide: true,
  showJesusConnection: true,
  lastViewedQTDay: null,
}

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      // 알림 설정
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setNotificationTime: (notificationTime) => set({ notificationTime }),

      // 읽기 플랜 설정
      setActiveGroupId: (activeGroupId) => set({ activeGroupId }),

      // 익명 모드
      setAnonymous: (isAnonymous) => set({ isAnonymous }),

      // 성경 버전
      setBibleVersion: (bibleVersion) => set({ bibleVersion }),

      // QT 설정
      setShowMeditationGuide: (showMeditationGuide) => set({ showMeditationGuide }),
      setShowJesusConnection: (showJesusConnection) => set({ showJesusConnection }),

      // 최근 본 QT 일차
      setLastViewedQTDay: (lastViewedQTDay) => set({ lastViewedQTDay }),

      // 설정 초기화
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'reading-jesus-user-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
