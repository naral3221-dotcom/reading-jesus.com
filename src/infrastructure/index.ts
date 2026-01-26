/**
 * Infrastructure Layer Export
 *
 * Supabase 클라이언트와 Repository 구현체를 통합 export합니다.
 */

// Supabase Clients
export {
  getSupabaseBrowserClient,
  createSupabaseBrowserClient,
} from './supabase/client'
export {
  getSupabaseServerClient,
  createSupabaseServerClient,
} from './supabase/server'

// Repository Implementations
export { SupabaseUserRepository } from './repositories/SupabaseUserRepository'
export { SupabaseChurchRepository } from './repositories/SupabaseChurchRepository'
export { SupabaseQTRepository } from './repositories/SupabaseQTRepository'
export { SupabaseGroupRepository } from './repositories/SupabaseGroupRepository'
