/**
 * GetUnifiedFeed Use Case (V2 - unified_meditations 통합)
 *
 * 통합 피드 조회 - unified_meditations 단일 테이블에서 조회합니다.
 * 커서 기반 페이지네이션 사용 (created_at 기준)
 */

import type { UnifiedFeedItem, FeedSource } from '@/components/feed/UnifiedFeedCard'

export type UnifiedFeedTab = 'all' | 'following' | 'group' | 'church'
export type FeedContentTypeFilter = 'all' | 'qt' | 'meditation'

export interface GetUnifiedFeedInput {
  tab: UnifiedFeedTab
  typeFilter?: FeedContentTypeFilter
  currentUserId?: string
  limit?: number
  cursor?: string
  groupIds?: string[]
  churchId?: string | null
  followingUserIds?: string[]
}

export interface GetUnifiedFeedOutput {
  items: UnifiedFeedItem[]
  nextCursor?: string
  hasMore: boolean
  error?: string
}

// DB에서 조회한 unified_meditations Row 타입
interface UnifiedMeditationRow {
  id: string
  user_id: string | null
  author_name: string | null
  source_type: 'group' | 'church' | 'public'
  source_id: string | null
  content_type: 'qt' | 'free' | 'memo'
  day_number: number | null
  content: string | null
  bible_range: string | null
  qt_date: string | null
  my_sentence: string | null
  meditation_answer: string | null
  gratitude: string | null
  my_prayer: string | null
  day_review: string | null
  is_anonymous: boolean
  visibility: 'private' | 'group' | 'church' | 'public' | null
  is_pinned: boolean
  likes_count: number
  replies_count: number
  created_at: string
  updated_at: string | null
  legacy_table: string | null
  legacy_id: string | null
}

// 프로필, 그룹, 교회 정보용 타입
interface ProfileInfo {
  nickname: string
  avatar_url: string | null
}

interface GroupInfo {
  id: string
  name: string
  church_id: string | null
}

interface ChurchInfo {
  id: string
  name: string
  code: string
}

// unified_meditations Row를 UnifiedFeedItem으로 변환
function mapRowToFeedItem(
  row: UnifiedMeditationRow,
  profileMap: Map<string, ProfileInfo>,
  groupMap: Map<string, GroupInfo>,
  churchMap: Map<string, ChurchInfo>
): UnifiedFeedItem {
  const profile = row.user_id ? profileMap.get(row.user_id) : null

  // source에 따라 처리
  let source: FeedSource = 'personal'
  let sourceName: string | undefined
  let churchName: string | undefined
  let churchCode: string | undefined
  let sourceId: string | undefined

  if (row.source_type === 'group' && row.source_id) {
    source = 'group'
    const group = groupMap.get(row.source_id)
    sourceName = group?.name || '그룹'
    sourceId = row.source_id
    if (group?.church_id) {
      const church = churchMap.get(group.church_id)
      if (church) {
        churchName = church.name
        churchCode = church.code
      }
    }
  } else if (row.source_type === 'church' && row.source_id) {
    source = 'church'
    const church = churchMap.get(row.source_id)
    sourceName = church?.name || '교회'
    churchName = church?.name
    churchCode = church?.code
    sourceId = row.source_id
  } else if (row.source_type === 'public') {
    source = 'personal'
  }

  // content_type에 따라 type 결정
  const type = row.content_type === 'qt' ? 'qt' : 'meditation'

  // author_name 결정
  const authorName = row.is_anonymous
    ? '익명'
    : (row.author_name || profile?.nickname || '알 수 없는 사용자')

  return {
    id: row.id,
    type,
    source,
    sourceName,
    sourceId,
    churchName,
    churchCode,
    authorId: row.user_id || '',
    authorName,
    authorAvatarUrl: profile?.avatar_url,
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at,
    dayNumber: row.day_number,
    bibleRange: row.bible_range ?? undefined,
    content: row.content || '',
    qtDate: row.qt_date ?? undefined,
    mySentence: row.my_sentence ?? undefined,
    meditationAnswer: row.meditation_answer ?? undefined,
    gratitude: row.gratitude ?? undefined,
    myPrayer: row.my_prayer ?? undefined,
    dayReview: row.day_review ?? undefined,
    likesCount: row.likes_count || 0,
    repliesCount: row.replies_count || 0,
    isPublic: row.visibility !== 'private',
  }
}

export class GetUnifiedFeed {
  constructor(
    private getSupabaseClient: () => ReturnType<typeof import('@/infrastructure/supabase/client').getSupabaseBrowserClient>
  ) {}

  async execute(input: GetUnifiedFeedInput): Promise<GetUnifiedFeedOutput> {
    const { tab, typeFilter = 'all', limit = 20, cursor } = input

    try {
      switch (tab) {
        case 'all':
          return await this.getAllPublicFeed(limit, cursor, typeFilter)
        case 'following':
          return await this.getFollowingFeed(input.followingUserIds || [], limit, cursor, typeFilter)
        case 'group':
          return await this.getGroupFeed(input.groupIds || [], limit, cursor, typeFilter)
        case 'church':
          return await this.getChurchFeed(input.churchId, limit, cursor, typeFilter)
        default:
          return { items: [], hasMore: false }
      }
    } catch (error) {
      return {
        items: [],
        hasMore: false,
        error: error instanceof Error ? error.message : '피드 조회 실패',
      }
    }
  }

  /**
   * 전체 공개 피드 - unified_meditations에서 모든 공개 묵상 조회
   */
  private async getAllPublicFeed(
    limit: number,
    cursor?: string,
    typeFilter: FeedContentTypeFilter = 'all'
  ): Promise<GetUnifiedFeedOutput> {
    const supabase = this.getSupabaseClient()
    const fetchLimit = limit + 1

    // unified_meditations에서 조회
    let query = supabase
      .from('unified_meditations')
      .select('*')
      .in('visibility', ['public', 'church']) // 공개 또는 교회 공개
      .order('created_at', { ascending: false })
      .limit(fetchLimit)

    // 콘텐츠 타입 필터
    if (typeFilter === 'qt') {
      query = query.eq('content_type', 'qt')
    } else if (typeFilter === 'meditation') {
      query = query.in('content_type', ['free', 'memo'])
    }

    // 커서 기반 페이지네이션
    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`피드 조회 실패: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return { items: [], hasMore: false }
    }

    const rows = data as UnifiedMeditationRow[]

    // 관련 정보 조회
    const { profileMap, groupMap, churchMap } = await this.fetchRelatedInfo(rows)

    // 변환
    const items = rows.map(row => mapRowToFeedItem(row, profileMap, groupMap, churchMap))

    // 페이지네이션 처리
    const hasMore = items.length > limit
    const limitedItems = items.slice(0, limit)
    const nextCursor = limitedItems.length > 0
      ? limitedItems[limitedItems.length - 1].createdAt
      : undefined

    return {
      items: limitedItems,
      nextCursor,
      hasMore,
    }
  }

  /**
   * 팔로잉 피드 - 팔로우한 사용자들의 공개 묵상
   */
  private async getFollowingFeed(
    followingUserIds: string[],
    limit: number,
    cursor?: string,
    typeFilter: FeedContentTypeFilter = 'all'
  ): Promise<GetUnifiedFeedOutput> {
    if (followingUserIds.length === 0) {
      return { items: [], hasMore: false }
    }

    const supabase = this.getSupabaseClient()
    const fetchLimit = limit + 1

    let query = supabase
      .from('unified_meditations')
      .select('*')
      .in('user_id', followingUserIds)
      .in('visibility', ['public', 'church'])
      .order('created_at', { ascending: false })
      .limit(fetchLimit)

    if (typeFilter === 'qt') {
      query = query.eq('content_type', 'qt')
    } else if (typeFilter === 'meditation') {
      query = query.in('content_type', ['free', 'memo'])
    }

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`팔로잉 피드 조회 실패: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return { items: [], hasMore: false }
    }

    const rows = data as UnifiedMeditationRow[]
    const { profileMap, groupMap, churchMap } = await this.fetchRelatedInfo(rows)

    const items = rows.map(row => mapRowToFeedItem(row, profileMap, groupMap, churchMap))

    const hasMore = items.length > limit
    const limitedItems = items.slice(0, limit)
    const nextCursor = limitedItems.length > 0
      ? limitedItems[limitedItems.length - 1].createdAt
      : undefined

    return {
      items: limitedItems,
      nextCursor,
      hasMore,
    }
  }

  /**
   * 그룹 피드 - 내 그룹의 모든 묵상
   */
  private async getGroupFeed(
    groupIds: string[],
    limit: number,
    cursor?: string,
    typeFilter: FeedContentTypeFilter = 'all'
  ): Promise<GetUnifiedFeedOutput> {
    if (groupIds.length === 0) {
      return { items: [], hasMore: false }
    }

    // 그룹 피드는 meditation 타입만 있음
    if (typeFilter === 'qt') {
      return { items: [], hasMore: false }
    }

    const supabase = this.getSupabaseClient()
    const fetchLimit = limit + 1

    let query = supabase
      .from('unified_meditations')
      .select('*')
      .eq('source_type', 'group')
      .in('source_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(fetchLimit)

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`그룹 피드 조회 실패: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return { items: [], hasMore: false }
    }

    const rows = data as UnifiedMeditationRow[]
    const { profileMap, groupMap, churchMap } = await this.fetchRelatedInfo(rows)

    const items = rows.map(row => mapRowToFeedItem(row, profileMap, groupMap, churchMap))

    const hasMore = items.length > limit
    const limitedItems = items.slice(0, limit)
    const nextCursor = limitedItems.length > 0
      ? limitedItems[limitedItems.length - 1].createdAt
      : undefined

    return {
      items: limitedItems,
      nextCursor,
      hasMore,
    }
  }

  /**
   * 교회 피드 - 내 교회의 모든 묵상
   */
  private async getChurchFeed(
    churchId: string | null | undefined,
    limit: number,
    cursor?: string,
    typeFilter: FeedContentTypeFilter = 'all'
  ): Promise<GetUnifiedFeedOutput> {
    if (!churchId) {
      return { items: [], hasMore: false }
    }

    const supabase = this.getSupabaseClient()
    const fetchLimit = limit + 1

    let query = supabase
      .from('unified_meditations')
      .select('*')
      .eq('source_type', 'church')
      .eq('source_id', churchId)
      .order('created_at', { ascending: false })
      .limit(fetchLimit)

    if (typeFilter === 'qt') {
      query = query.eq('content_type', 'qt')
    } else if (typeFilter === 'meditation') {
      query = query.in('content_type', ['free', 'memo'])
    }

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`교회 피드 조회 실패: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return { items: [], hasMore: false }
    }

    const rows = data as UnifiedMeditationRow[]
    const { profileMap, groupMap, churchMap } = await this.fetchRelatedInfo(rows)

    const items = rows.map(row => mapRowToFeedItem(row, profileMap, groupMap, churchMap))

    const hasMore = items.length > limit
    const limitedItems = items.slice(0, limit)
    const nextCursor = limitedItems.length > 0
      ? limitedItems[limitedItems.length - 1].createdAt
      : undefined

    return {
      items: limitedItems,
      nextCursor,
      hasMore,
    }
  }

  /**
   * 관련 정보 (프로필, 그룹, 교회) 조회
   */
  private async fetchRelatedInfo(rows: UnifiedMeditationRow[]): Promise<{
    profileMap: Map<string, ProfileInfo>
    groupMap: Map<string, GroupInfo>
    churchMap: Map<string, ChurchInfo>
  }> {
    const supabase = this.getSupabaseClient()

    // 사용자 ID 수집
    const userIds = Array.from(
      new Set(rows.map(r => r.user_id).filter((id): id is string => id !== null))
    )

    // 그룹 ID 수집
    const groupIds = Array.from(
      new Set(
        rows
          .filter(r => r.source_type === 'group' && r.source_id)
          .map(r => r.source_id!)
      )
    )

    // 교회 ID 수집 (source_type이 church이거나, 그룹에서 참조하는 교회)
    const directChurchIds = rows
      .filter(r => r.source_type === 'church' && r.source_id)
      .map(r => r.source_id!)

    // 프로필 조회
    const profileMap = new Map<string, ProfileInfo>()
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', userIds)

      if (profiles) {
        for (const p of profiles) {
          profileMap.set(p.id, { nickname: p.nickname, avatar_url: p.avatar_url })
        }
      }
    }

    // 그룹 조회
    const groupMap = new Map<string, GroupInfo>()
    if (groupIds.length > 0) {
      const { data: groups } = await supabase
        .from('groups')
        .select('id, name, church_id')
        .in('id', groupIds)

      if (groups) {
        for (const g of groups) {
          groupMap.set(g.id, { id: g.id, name: g.name, church_id: g.church_id })
        }
      }
    }

    // 그룹에서 참조하는 교회 ID 추가
    const groupChurchIds = Array.from(groupMap.values())
      .map(g => g.church_id)
      .filter((id): id is string => id !== null)

    const allChurchIds = Array.from(new Set([...directChurchIds, ...groupChurchIds]))

    // 교회 조회
    const churchMap = new Map<string, ChurchInfo>()
    if (allChurchIds.length > 0) {
      const { data: churches } = await supabase
        .from('churches')
        .select('id, name, code')
        .in('id', allChurchIds)

      if (churches) {
        for (const c of churches) {
          churchMap.set(c.id, { id: c.id, name: c.name, code: c.code })
        }
      }
    }

    return { profileMap, groupMap, churchMap }
  }
}
