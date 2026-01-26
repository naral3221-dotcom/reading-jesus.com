/**
 * Supabase Server Client
 *
 * 서버 환경에서 사용하는 Supabase 클라이언트.
 * 기존 lib/supabase-server.ts를 래핑합니다.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function getSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component에서 호출 시 무시
          }
        },
      },
    }
  )
}

// 기존 코드와의 호환성을 위한 별칭
export const createSupabaseServerClient = getSupabaseServerClient
