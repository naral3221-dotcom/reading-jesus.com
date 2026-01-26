/**
 * Supabase Browser Client
 *
 * Infrastructure Layer에서 사용하는 Supabase 클라이언트입니다.
 * 실제 클라이언트는 lib/supabase.ts에서 제공합니다.
 */

import { supabase } from '@/lib/supabase'

// lib/supabase의 클라이언트를 그대로 반환
export function getSupabaseBrowserClient() {
  return supabase
}

// 기존 코드와의 호환성을 위한 별칭
export const createSupabaseBrowserClient = getSupabaseBrowserClient
