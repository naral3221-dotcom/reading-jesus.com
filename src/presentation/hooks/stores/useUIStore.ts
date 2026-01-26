'use client'

/**
 * UI Store (Zustand)
 *
 * UI 관련 전역 상태를 관리합니다.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UIState {
  // 사이드바 상태
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // 테마
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: UIState['theme']) => void

  // 글꼴 크기
  fontSize: 'small' | 'medium' | 'large'
  setFontSize: (size: UIState['fontSize']) => void

  // 성경 읽기 모드
  bibleReadingMode: 'scroll' | 'page'
  setBibleReadingMode: (mode: UIState['bibleReadingMode']) => void

  // 로딩 상태
  isGlobalLoading: boolean
  setGlobalLoading: (loading: boolean) => void

  // 토스트/알림 메시지
  toastMessage: string | null
  toastType: 'success' | 'error' | 'info' | null
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  hideToast: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 사이드바
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // 테마
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // 글꼴 크기
      fontSize: 'medium',
      setFontSize: (fontSize) => set({ fontSize }),

      // 성경 읽기 모드
      bibleReadingMode: 'scroll',
      setBibleReadingMode: (bibleReadingMode) => set({ bibleReadingMode }),

      // 로딩 상태 (persist 제외)
      isGlobalLoading: false,
      setGlobalLoading: (isGlobalLoading) => set({ isGlobalLoading }),

      // 토스트 (persist 제외)
      toastMessage: null,
      toastType: null,
      showToast: (message, type = 'info') =>
        set({ toastMessage: message, toastType: type }),
      hideToast: () => set({ toastMessage: null, toastType: null }),
    }),
    {
      name: 'reading-jesus-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        bibleReadingMode: state.bibleReadingMode,
      }),
    }
  )
)
