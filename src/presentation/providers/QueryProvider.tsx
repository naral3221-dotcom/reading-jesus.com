'use client'

/**
 * React Query Provider
 *
 * 앱 전체에서 React Query를 사용할 수 있도록 QueryClient를 제공합니다.
 * Auth state listener를 통해 인증 상태 변경 시 관련 쿼리를 자동으로 무효화합니다.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect, createContext, useContext, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { userKeys } from '../hooks/queries/useUser'
import { groupKeys } from '../hooks/queries/useGroup'

// Auth 초기화 상태 Context
const AuthInitializedContext = createContext(false)

export function useAuthInitialized() {
  return useContext(AuthInitializedContext)
}

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [authInitialized, setAuthInitialized] = useState(false)
  const initialCheckDone = useRef(false)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 기본 staleTime: 1분
            staleTime: 1000 * 60,
            // 기본 gcTime (구 cacheTime): 5분
            gcTime: 1000 * 60 * 5,
            // 재시도 횟수
            retry: 1,
            // 창 포커스 시 리페치 비활성화
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  // Auth state change listener
  useEffect(() => {
    // 이미 초기화 체크가 완료되었으면 스킵
    if (initialCheckDone.current) return
    initialCheckDone.current = true

    // 즉시 사용자 확인 (getUser는 서버에서 토큰 검증)
    supabase.auth.getUser().then(() => {
      // 캐시를 먼저 완전히 제거
      queryClient.removeQueries({ queryKey: userKeys.all })
      queryClient.removeQueries({ queryKey: groupKeys.all })

      // 그 다음 authInitialized 설정 (이제 쿼리가 fresh start)
      setAuthInitialized(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        // INITIAL_SESSION은 getUser와 중복되므로 무시
        if (event === 'INITIAL_SESSION') {
          return
        }

        // 인증 상태가 변경되면 사용자/그룹 관련 쿼리 캐시 완전 제거 후 refetch
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          queryClient.removeQueries({ queryKey: userKeys.all })
          queryClient.removeQueries({ queryKey: groupKeys.all })
          // 명시적으로 refetch 트리거
          queryClient.refetchQueries({ queryKey: userKeys.all })
          queryClient.refetchQueries({ queryKey: groupKeys.all })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient])

  return (
    <AuthInitializedContext.Provider value={authInitialized}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </AuthInitializedContext.Provider>
  )
}
