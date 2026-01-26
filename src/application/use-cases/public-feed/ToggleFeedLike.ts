/**
 * Toggle Feed Like Use Case
 *
 * 피드 아이템 좋아요 토글
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'

export interface ToggleFeedLikeInput {
  itemId: string
  itemType: 'meditation' | 'qt'
  userId?: string
  deviceId?: string
}

export interface ToggleFeedLikeResult {
  liked: boolean
  error?: string
}

export class ToggleFeedLike {
  async execute(input: ToggleFeedLikeInput): Promise<ToggleFeedLikeResult> {
    const { itemId, itemType, userId, deviceId } = input

    if (!userId && !deviceId) {
      return { liked: false, error: 'User ID or Device ID is required' }
    }

    const supabase = getSupabaseBrowserClient()
    const table = itemType === 'meditation' ? 'guest_comment_likes' : 'church_qt_post_likes'
    const idField = itemType === 'meditation' ? 'comment_id' : 'post_id'

    // 기존 좋아요 확인
    let query = supabase.from(table).select('id')

    if (userId) {
      query = query.eq(idField, itemId).eq('user_id', userId)
    } else {
      query = query.eq(idField, itemId).eq('device_id', deviceId)
    }

    const { data: existing } = await query.maybeSingle()

    if (existing) {
      // 좋아요 취소
      await supabase.from(table).delete().eq('id', existing.id)
      return { liked: false }
    } else {
      // 좋아요 추가
      const insertData: Record<string, unknown> = {
        [idField]: itemId,
      }
      if (userId) {
        insertData.user_id = userId
      } else {
        insertData.device_id = deviceId
      }

      await supabase.from(table).insert(insertData)
      return { liked: true }
    }
  }
}
