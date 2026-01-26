/**
 * Get Popular Churches Use Case
 *
 * 인기 교회 목록 조회 (게시물 수 기준)
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'

export interface PopularChurch {
  id: string
  code: string
  name: string
  postCount: number
}

export class GetPopularChurches {
  async execute(limit: number = 10): Promise<PopularChurch[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('churches')
      .select(`id, code, name`)
      .eq('is_active', true)
      .limit(limit)

    if (error || !data) {
      return []
    }

    // 각 교회의 게시물 수 계산
    const churchesWithCount = await Promise.all(
      data.map(async (church) => {
        const [guestResult, qtResult] = await Promise.all([
          supabase
            .from('guest_comments')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', church.id),
          supabase
            .from('church_qt_posts')
            .select('id', { count: 'exact', head: true })
            .eq('church_id', church.id),
        ])

        const postCount = (guestResult.count || 0) + (qtResult.count || 0)
        return { ...church, postCount }
      })
    )

    // 게시물 수 기준 정렬
    return churchesWithCount
      .filter(c => c.postCount > 0)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, limit)
  }
}
