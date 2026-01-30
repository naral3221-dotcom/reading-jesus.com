/**
 * Get Public Feed Use Case
 *
 * 전체 공개 피드 조회 (guest_comments + church_qt_posts 병합)
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type { PublicFeedItem, PublicFeedFilters, PublicFeedResponse } from '@/types'

const ITEMS_PER_PAGE = 20

export interface GetPublicFeedInput {
  filters?: PublicFeedFilters
  cursor?: string
  limit?: number
}

export class GetPublicFeed {
  async execute(input: GetPublicFeedInput): Promise<PublicFeedResponse> {
    const supabase = getSupabaseBrowserClient()
    const { filters = {}, cursor, limit = ITEMS_PER_PAGE } = input

    // 기간 필터 계산
    let dateFilter: string | null = null
    if (filters.period === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      dateFilter = today.toISOString()
    } else if (filters.period === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setHours(0, 0, 0, 0)
      dateFilter = weekAgo.toISOString()
    }

    const items: PublicFeedItem[] = []

    // 타입 필터에 따라 쿼리 실행
    const shouldFetchMeditation = !filters.type || filters.type === 'all' || filters.type === 'meditation'
    const shouldFetchQt = !filters.type || filters.type === 'all' || filters.type === 'qt'

    // 1. guest_comments 쿼리 (묵상)
    if (shouldFetchMeditation) {
      let guestQuery = supabase
        .from('guest_comments')
        .select(`
          id,
          guest_name,
          content,
          day_number,
          bible_range,
          is_anonymous,
          created_at,
          likes_count,
          replies_count,
          church_id,
          linked_user_id,
          churches!inner(id, code, name),
          profiles:linked_user_id(avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (cursor) {
        guestQuery = guestQuery.lt('created_at', cursor)
      }
      if (filters.churchId) {
        guestQuery = guestQuery.eq('church_id', filters.churchId)
      }
      if (dateFilter) {
        guestQuery = guestQuery.gte('created_at', dateFilter)
      }

      const { data: guestData, error: guestError } = await guestQuery

      if (!guestError && guestData) {
        for (const item of guestData) {
          const church = item.churches as unknown as { id: string; code: string; name: string }
          const profile = item.profiles as unknown as { avatar_url: string | null } | null
          items.push({
            id: item.id,
            type: 'meditation',
            authorId: item.linked_user_id,
            authorName: item.guest_name,
            authorAvatarUrl: profile?.avatar_url,
            isAnonymous: item.is_anonymous || false,
            createdAt: item.created_at,
            churchId: church.id,
            churchCode: church.code,
            churchName: church.name,
            content: item.content,
            dayNumber: item.day_number,
            bibleRange: item.bible_range,
            likesCount: item.likes_count || 0,
            repliesCount: item.replies_count || 0,
          })
        }
      }
    }

    // 2. church_qt_posts 쿼리 (QT)
    if (shouldFetchQt) {
      let qtQuery = supabase
        .from('church_qt_posts')
        .select(`
          id,
          author_name,
          qt_date,
          my_sentence,
          meditation_answer,
          gratitude,
          my_prayer,
          day_review,
          is_anonymous,
          created_at,
          likes_count,
          replies_count,
          day_number,
          church_id,
          user_id,
          churches!inner(id, code, name),
          profiles:user_id(avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (cursor) {
        qtQuery = qtQuery.lt('created_at', cursor)
      }
      if (filters.churchId) {
        qtQuery = qtQuery.eq('church_id', filters.churchId)
      }
      if (dateFilter) {
        qtQuery = qtQuery.gte('created_at', dateFilter)
      }

      const { data: qtData, error: qtError } = await qtQuery

      if (!qtError && qtData) {
        for (const item of qtData) {
          const church = item.churches as unknown as { id: string; code: string; name: string }
          const profile = item.profiles as unknown as { avatar_url: string | null } | null
          items.push({
            id: item.id,
            type: 'qt',
            authorId: item.user_id,
            authorName: item.author_name,
            authorAvatarUrl: profile?.avatar_url,
            isAnonymous: item.is_anonymous || false,
            createdAt: item.created_at,
            churchId: church.id,
            churchCode: church.code,
            churchName: church.name,
            mySentence: item.my_sentence,
            meditationAnswer: item.meditation_answer,
            gratitude: item.gratitude,
            myPrayer: item.my_prayer,
            dayReview: item.day_review,
            qtDate: item.qt_date,
            dayNumber: item.day_number,
            likesCount: item.likes_count || 0,
            repliesCount: item.replies_count || 0,
          })
        }
      }
    }

    // 3. 시간순 정렬 (최신순)
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // 4. limit 적용
    const limitedItems = items.slice(0, limit)

    // 5. 다음 커서 계산
    const nextCursor = limitedItems.length === limit && limitedItems.length > 0
      ? limitedItems[limitedItems.length - 1].createdAt
      : null

    return {
      items: limitedItems,
      nextCursor,
      hasMore: limitedItems.length === limit,
    }
  }
}
