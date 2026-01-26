/**
 * Draft Use Cases
 *
 * 드래프트(임시 저장) 서버 동기화 관련 Use Case
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type { Draft } from '@/types'

/**
 * 서버에서 드래프트 목록 가져오기
 */
export class LoadDraftsFromServer {
  async execute(userId: string, groupId: string): Promise<Draft[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('draft_posts')
      .select('*')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('드래프트 로드 에러:', error)
      return []
    }

    return (data || []).map(d => ({ ...d, synced: true }))
  }
}

/**
 * 드래프트를 서버에 저장
 */
export class SaveDraftToServer {
  async execute(draft: Draft): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()

    // synced는 localStorage 전용 필드이므로 제외
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { synced: _synced, ...draftData } = draft

    const { error } = await supabase
      .from('draft_posts')
      .upsert({
        ...draftData,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('드래프트 저장 에러:', error)
      return false
    }

    return true
  }
}

/**
 * 서버에서 드래프트 삭제
 */
export class DeleteDraftFromServer {
  async execute(id: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase
      .from('draft_posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('드래프트 삭제 에러:', error)
      return false
    }

    return true
  }
}
