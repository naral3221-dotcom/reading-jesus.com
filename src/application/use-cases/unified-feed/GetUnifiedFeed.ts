/**
 * GetUnifiedFeed Use Case
 *
 * 통합 피드 조회 - 그룹/교회/개인 묵상을 하나의 피드로 조회합니다.
 * 커서 기반 페이지네이션 사용 (created_at 기준)
 */

import type { UnifiedFeedItem } from '@/components/feed/UnifiedFeedCard'

export type UnifiedFeedTab = 'all' | 'following' | 'group' | 'church'
export type FeedContentTypeFilter = 'all' | 'qt' | 'meditation'

export interface GetUnifiedFeedInput {
  tab: UnifiedFeedTab
  typeFilter?: FeedContentTypeFilter // 콘텐츠 타입 필터 (전체/QT/묵상)
  currentUserId?: string
  limit?: number
  cursor?: string // 마지막 항목의 created_at (ISO string)
  groupIds?: string[] // 내 그룹 ID 목록
  churchId?: string | null // 내 교회 ID
  followingUserIds?: string[] // 팔로잉 사용자 ID 목록
}

export interface GetUnifiedFeedOutput {
  items: UnifiedFeedItem[]
  nextCursor?: string // 다음 페이지를 위한 커서
  hasMore: boolean
  error?: string
}

// DB에서 조회한 그룹 묵상 타입
interface GroupCommentRow {
  id: string
  user_id: string
  group_id: string
  day_number: number | null
  content: string
  is_public: boolean
  likes_count: number
  replies_count: number
  created_at: string
  updated_at: string
  profile?: {
    nickname: string
    avatar_url: string | null
  } | null
  group?: {
    name: string
    church_id?: string | null
    church?: {
      name: string
      code: string
    } | null
  } | null
}

// DB에서 조회한 교회 QT 묵상 타입
interface ChurchQTPostRow {
  id: string
  user_id: string | null  // 비로그인 사용자는 null
  church_id: string
  author_name: string  // 작성자 이름 (비로그인/로그인 모두 직접 저장)
  qt_date: string
  day_number: number | null
  my_sentence: string | null
  meditation_answer: string | null
  gratitude: string | null
  my_prayer: string | null
  day_review: string | null
  is_anonymous: boolean
  is_pinned: boolean
  likes_count: number
  replies_count: number
  created_at: string
  updated_at: string
  profile?: {
    nickname: string
    avatar_url: string | null
  } | null
  church?: {
    name: string
    code: string
  } | null
}

// DB에서 조회한 공개 묵상 타입
interface PublicMeditationRow {
  id: string
  user_id: string
  title: string | null
  content: string
  bible_reference: string | null
  is_anonymous: boolean
  likes_count: number
  replies_count: number
  created_at: string
  updated_at: string
  profile?: {
    nickname: string
    avatar_url: string | null
  } | null
}

// DB에서 조회한 교회 내 짧은 묵상 타입 (guest_comments)
interface GuestCommentRow {
  id: string
  church_id: string
  guest_name: string
  linked_user_id: string | null
  day_number: number | null
  bible_range: string | null
  content: string
  is_anonymous: boolean
  likes_count: number
  replies_count: number
  created_at: string
  updated_at: string
  profile?: {
    nickname: string
    avatar_url: string | null
  } | null
  church?: {
    name: string
    code: string
  } | null
}

// 그룹 묵상을 UnifiedFeedItem으로 변환
function mapGroupCommentToFeedItem(row: GroupCommentRow): UnifiedFeedItem {
  return {
    id: row.id,
    type: 'meditation',
    source: 'group',
    sourceName: row.group?.name || '그룹',
    churchName: row.group?.church?.name,
    churchCode: row.group?.church?.code,
    sourceId: row.group_id,
    authorId: row.user_id,
    authorName: row.profile?.nickname || '알 수 없는 사용자',
    authorAvatarUrl: row.profile?.avatar_url,
    isAnonymous: false,
    createdAt: row.created_at,
    dayNumber: row.day_number,
    content: row.content,
    likesCount: row.likes_count || 0,
    repliesCount: row.replies_count || 0,
    isPublic: row.is_public,
  }
}

// 교회 QT 묵상을 UnifiedFeedItem으로 변환
function mapChurchQTPostToFeedItem(row: ChurchQTPostRow): UnifiedFeedItem {
  // author_name 우선, 없으면 profile.nickname, 마지막으로 익명
  const authorName = row.author_name || row.profile?.nickname || '익명'

  return {
    id: row.id,
    type: 'qt',
    source: 'church',
    sourceName: row.church?.name || '교회',
    sourceId: row.church_id,
    churchName: row.church?.name,
    churchCode: row.church?.code,
    authorId: row.user_id || '',  // 비로그인 사용자는 빈 문자열
    authorName,
    authorAvatarUrl: row.profile?.avatar_url,
    isAnonymous: row.is_anonymous || false,
    createdAt: row.created_at,
    dayNumber: row.day_number,
    qtDate: row.qt_date,
    mySentence: row.my_sentence,
    meditationAnswer: row.meditation_answer,
    gratitude: row.gratitude,
    myPrayer: row.my_prayer,
    dayReview: row.day_review,
    likesCount: row.likes_count || 0,
    repliesCount: row.replies_count || 0,
    isPublic: true,  // church_qt_posts는 기본적으로 공개
  }
}

// 공개 묵상을 UnifiedFeedItem으로 변환
function mapPublicMeditationToFeedItem(row: PublicMeditationRow): UnifiedFeedItem {
  return {
    id: row.id,
    type: 'meditation',
    source: 'personal',
    authorId: row.user_id,
    authorName: row.profile?.nickname || '알 수 없는 사용자',
    authorAvatarUrl: row.profile?.avatar_url,
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at,
    bibleRange: row.bible_reference,
    content: row.content,
    likesCount: row.likes_count || 0,
    repliesCount: row.replies_count || 0,
    isPublic: true,
  }
}

// 교회 내 짧은 묵상(guest_comments)을 UnifiedFeedItem으로 변환
function mapGuestCommentToFeedItem(row: GuestCommentRow): UnifiedFeedItem {
  // 로그인 사용자면 profile.nickname, 아니면 guest_name 사용
  const authorName = row.is_anonymous ? '익명' : (row.profile?.nickname || row.guest_name || '알 수 없는 사용자')

  return {
    id: row.id,
    type: 'meditation',
    source: 'church',
    sourceName: row.church?.name || '교회',
    sourceId: row.church_id,
    churchName: row.church?.name,
    churchCode: row.church?.code,
    authorId: row.linked_user_id || '',
    authorName,
    authorAvatarUrl: row.profile?.avatar_url,
    isAnonymous: row.is_anonymous,
    createdAt: row.created_at,
    dayNumber: row.day_number,
    bibleRange: row.bible_range,
    content: row.content,
    likesCount: row.likes_count || 0,
    repliesCount: row.replies_count || 0,
    isPublic: true,
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

  // 전체 공개 피드 - 공개된 모든 묵상 (그룹 + 교회 + 개인)
  private async getAllPublicFeed(limit: number, cursor?: string, typeFilter: FeedContentTypeFilter = 'all'): Promise<GetUnifiedFeedOutput> {
    const supabase = this.getSupabaseClient()
    const items: UnifiedFeedItem[] = []

    // 각 테이블에서 limit + 1개씩 가져옴 (hasMore 판단용)
    const fetchLimit = limit + 1

    // typeFilter에 따라 조건부 쿼리 실행
    const shouldFetchMeditation = typeFilter === 'all' || typeFilter === 'meditation'
    const shouldFetchQT = typeFilter === 'all' || typeFilter === 'qt'

    console.log('[GetUnifiedFeed] getAllPublicFeed 시작:', { limit, cursor, typeFilter, shouldFetchMeditation, shouldFetchQT })

    // 1. 공개된 그룹 묵상 (meditation 필터일 때만)
    if (shouldFetchMeditation) {
      let groupQuery = supabase
        .from('comments')
        .select(`
          *,
          group:groups!group_id(name, church_id)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(fetchLimit)

      if (cursor) {
        groupQuery = groupQuery.lt('created_at', cursor)
      }

      const { data: groupComments, error: groupError } = await groupQuery

      console.log('[GetUnifiedFeed] 그룹 묵상 조회 결과:', { count: groupComments?.length || 0, error: groupError })

      if (groupComments && groupComments.length > 0) {
        // 프로필 정보 별도 조회
        const userIds = Array.from(new Set(groupComments.map(c => c.user_id).filter((id): id is string => id !== null)))
        let profileMap = new Map<string, { nickname: string; avatar_url: string | null }>()

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .in('id', userIds)

          if (profiles) {
            profileMap = new Map(profiles.map(p => [p.id, { nickname: p.nickname, avatar_url: p.avatar_url }]))
          }
        }

        // 교회 정보 별도 조회 (그룹에 church_id가 있는 경우)
        const churchIds = Array.from(new Set(groupComments.map(c => c.group?.church_id).filter((id): id is string => id !== null)))
        let churchMap = new Map<string, { name: string; code: string }>()

        if (churchIds.length > 0) {
          const { data: churches } = await supabase
            .from('churches')
            .select('id, name, code')
            .in('id', churchIds)

          if (churches) {
            churchMap = new Map(churches.map(c => [c.id, { name: c.name, code: c.code }]))
          }
        }

        items.push(...groupComments.map(row => {
          const profile = row.user_id ? profileMap.get(row.user_id) : null
          const church = row.group?.church_id ? churchMap.get(row.group.church_id) : null
          return mapGroupCommentToFeedItem({
            ...row,
            profile: profile || null,
            group: row.group ? {
              ...row.group,
              church: church || null
            } : null
          } as GroupCommentRow)
        }))
      }
    }

    // 2. 교회 QT 묵상 (qt 필터일 때만) - RLS가 접근 허용하는 모든 글 조회
    if (shouldFetchQT) {
      let churchQuery = supabase
        .from('church_qt_posts')
        .select(`
          *,
          church:churches(name, code)
        `)
        .order('created_at', { ascending: false })
        .limit(fetchLimit)

      if (cursor) {
        churchQuery = churchQuery.lt('created_at', cursor)
      }

      const { data: churchPosts, error: churchError } = await churchQuery

      console.log('[GetUnifiedFeed] 교회 QT 조회 결과:', { count: churchPosts?.length || 0, error: churchError })

      if (churchPosts) {
        // 프로필 정보 별도 조회
        const userIds = Array.from(new Set(churchPosts.map(p => p.user_id).filter((id): id is string => id !== null)))
        let profileMap = new Map<string, { id: string; nickname: string; avatar_url: string | null }>()

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .in('id', userIds)

          profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
        }

        items.push(...churchPosts.map(row => mapChurchQTPostToFeedItem({
          ...row,
          profile: row.user_id ? profileMap.get(row.user_id) || null : null
        } as ChurchQTPostRow)))
      }
    }

    // 3. 공개 묵상 (meditation 필터일 때만)
    if (shouldFetchMeditation) {
      let publicQuery = supabase
        .from('public_meditations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(fetchLimit)

      if (cursor) {
        publicQuery = publicQuery.lt('created_at', cursor)
      }

      const { data: publicMeditations, error: publicError } = await publicQuery

      console.log('[GetUnifiedFeed] 공개 묵상 조회 결과:', { count: publicMeditations?.length || 0, error: publicError })

      if (publicMeditations && publicMeditations.length > 0) {
        // 프로필 정보 별도 조회 (public_meditations.user_id -> auth.users -> profiles)
        const userIds = Array.from(new Set(publicMeditations.map(p => p.user_id).filter((id): id is string => id !== null)))
        let profileMap = new Map<string, { id: string; nickname: string; avatar_url: string | null }>()

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .in('id', userIds)

          profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
        }

        items.push(...publicMeditations.map(row => mapPublicMeditationToFeedItem({
          ...row,
          profile: row.user_id ? profileMap.get(row.user_id) || null : null
        } as PublicMeditationRow)))
      }
    }

    // 4. 교회 내 짧은 묵상 - guest_comments (meditation 필터일 때만) - RLS가 접근 허용하는 모든 글 조회
    if (shouldFetchMeditation) {
      let guestQuery = supabase
        .from('guest_comments')
        .select(`
          *,
          church:churches(name, code)
        `)
        .order('created_at', { ascending: false })
        .limit(fetchLimit)

      if (cursor) {
        guestQuery = guestQuery.lt('created_at', cursor)
      }

      const { data: guestComments, error: guestError } = await guestQuery

      console.log('[GetUnifiedFeed] 교회 내 짧은 묵상 조회 결과:', { count: guestComments?.length || 0, error: guestError })

      if (guestComments && guestComments.length > 0) {
        // 프로필 정보 별도 조회 (linked_user_id가 있는 경우)
        const userIds = Array.from(new Set(guestComments.map(c => c.linked_user_id).filter((id): id is string => id !== null)))
        let profileMap = new Map<string, { nickname: string; avatar_url: string | null }>()

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .in('id', userIds)

          if (profiles) {
            profileMap = new Map(profiles.map(p => [p.id, { nickname: p.nickname, avatar_url: p.avatar_url }]))
          }
        }

        items.push(...guestComments.map(row => mapGuestCommentToFeedItem({
          ...row,
          profile: row.linked_user_id ? profileMap.get(row.linked_user_id) || null : null
        } as GuestCommentRow)))
      }
    }

    // 시간순 정렬
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // limit 적용 및 hasMore 판단
    const hasMore = items.length > limit
    const limitedItems = items.slice(0, limit)
    const nextCursor = limitedItems.length > 0 ? limitedItems[limitedItems.length - 1].createdAt : undefined

    console.log('[GetUnifiedFeed] 최종 결과:', { totalItems: items.length, limitedItems: limitedItems.length, hasMore, nextCursor })

    return {
      items: limitedItems,
      nextCursor,
      hasMore,
    }
  }

  // 팔로잉 피드 - 팔로우한 사용자들의 공개 묵상
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
    const items: UnifiedFeedItem[] = []
    const fetchLimit = limit + 1

    // typeFilter에 따라 조건부 쿼리 실행
    const shouldFetchMeditation = typeFilter === 'all' || typeFilter === 'meditation'
    const shouldFetchQT = typeFilter === 'all' || typeFilter === 'qt'

    // 1. 팔로잉 사용자의 공개된 그룹 묵상 (meditation 필터일 때만)
    if (shouldFetchMeditation) {
      let groupQuery = supabase
        .from('comments')
        .select(`
          *,
          group:groups!group_id(name, church_id)
        `)
        .eq('is_public', true)
        .in('user_id', followingUserIds)
        .order('created_at', { ascending: false })
        .limit(fetchLimit)

      if (cursor) {
        groupQuery = groupQuery.lt('created_at', cursor)
      }

      const { data: groupComments } = await groupQuery

      if (groupComments && groupComments.length > 0) {
        // 프로필 정보 별도 조회
        const userIds = Array.from(new Set(groupComments.map(c => c.user_id).filter((id): id is string => id !== null)))
        let profileMap = new Map<string, { nickname: string; avatar_url: string | null }>()

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .in('id', userIds)

          if (profiles) {
            profileMap = new Map(profiles.map(p => [p.id, { nickname: p.nickname, avatar_url: p.avatar_url }]))
          }
        }

        // 교회 정보 별도 조회
        const churchIds = Array.from(new Set(groupComments.map(c => c.group?.church_id).filter((id): id is string => id !== null)))
        let churchMap = new Map<string, { name: string; code: string }>()

        if (churchIds.length > 0) {
          const { data: churches } = await supabase
            .from('churches')
            .select('id, name, code')
            .in('id', churchIds)

          if (churches) {
            churchMap = new Map(churches.map(c => [c.id, { name: c.name, code: c.code }]))
          }
        }

        items.push(...groupComments.map(row => {
          const profile = row.user_id ? profileMap.get(row.user_id) : null
          const church = row.group?.church_id ? churchMap.get(row.group.church_id) : null
          return mapGroupCommentToFeedItem({
            ...row,
            profile: profile || null,
            group: row.group ? {
              ...row.group,
              church: church || null
            } : null
          } as GroupCommentRow)
        }))
      }
    }

    // 2. 팔로잉 사용자의 교회 QT 묵상 (qt 필터일 때만) - RLS가 접근 허용하는 글
    if (shouldFetchQT) {
      let churchQuery = supabase
        .from('church_qt_posts')
        .select(`
          *,
          church:churches(name, code)
        `)
        .in('user_id', followingUserIds)
        .order('created_at', { ascending: false })
        .limit(fetchLimit)

      if (cursor) {
        churchQuery = churchQuery.lt('created_at', cursor)
      }

      const { data: churchPosts } = await churchQuery

      if (churchPosts) {
        const userIds = Array.from(new Set(churchPosts.map(p => p.user_id).filter((id): id is string => id !== null)))
        let profileMap = new Map<string, { id: string; nickname: string; avatar_url: string | null }>()

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .in('id', userIds)

          profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
        }

        items.push(...churchPosts.map(row => mapChurchQTPostToFeedItem({
          ...row,
          profile: row.user_id ? profileMap.get(row.user_id) || null : null
        } as ChurchQTPostRow)))
      }
    }

    // 3. 팔로잉 사용자의 공개 묵상 (meditation 필터일 때만)
    if (shouldFetchMeditation) {
      let publicQuery = supabase
        .from('public_meditations')
        .select('*')
        .in('user_id', followingUserIds)
        .order('created_at', { ascending: false })
        .limit(fetchLimit)

      if (cursor) {
        publicQuery = publicQuery.lt('created_at', cursor)
      }

      const { data: publicMeditations } = await publicQuery

      if (publicMeditations && publicMeditations.length > 0) {
        // 프로필 정보 별도 조회
        const userIds = Array.from(new Set(publicMeditations.map(p => p.user_id).filter((id): id is string => id !== null)))
        let profileMap = new Map<string, { id: string; nickname: string; avatar_url: string | null }>()

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .in('id', userIds)

          profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
        }

        items.push(...publicMeditations.map(row => mapPublicMeditationToFeedItem({
          ...row,
          profile: row.user_id ? profileMap.get(row.user_id) || null : null
        } as PublicMeditationRow)))
      }
    }

    // 시간순 정렬
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const hasMore = items.length > limit
    const limitedItems = items.slice(0, limit)
    const nextCursor = limitedItems.length > 0 ? limitedItems[limitedItems.length - 1].createdAt : undefined

    return {
      items: limitedItems,
      nextCursor,
      hasMore,
    }
  }

  // 그룹 피드 - 내 그룹의 모든 묵상
  private async getGroupFeed(groupIds: string[], limit: number, cursor?: string, typeFilter: FeedContentTypeFilter = 'all'): Promise<GetUnifiedFeedOutput> {
    if (groupIds.length === 0) {
      return { items: [], hasMore: false }
    }

    // 그룹 피드는 meditation 타입만 있으므로, qt 필터일 때는 빈 결과 반환
    if (typeFilter === 'qt') {
      return { items: [], hasMore: false }
    }

    const supabase = this.getSupabaseClient()
    const fetchLimit = limit + 1

    let query = supabase
      .from('comments')
      .select(`
        *,
        group:groups!group_id(name, church_id)
      `)
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(fetchLimit)

    if (cursor) {
      query = query.lt('created_at', cursor)
    }

    const { data: groupComments } = await query

    if (!groupComments || groupComments.length === 0) {
      return { items: [], hasMore: false }
    }

    // 프로필 정보 별도 조회
    const userIds = Array.from(new Set(groupComments.map(c => c.user_id).filter((id): id is string => id !== null)))
    let profileMap = new Map<string, { nickname: string; avatar_url: string | null }>()

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', userIds)

      if (profiles) {
        profileMap = new Map(profiles.map(p => [p.id, { nickname: p.nickname, avatar_url: p.avatar_url }]))
      }
    }

    // 교회 정보 별도 조회
    const churchIds = Array.from(new Set(groupComments.map(c => c.group?.church_id).filter((id): id is string => id !== null)))
    let churchMap = new Map<string, { name: string; code: string }>()

    if (churchIds.length > 0) {
      const { data: churches } = await supabase
        .from('churches')
        .select('id, name, code')
        .in('id', churchIds)

      if (churches) {
        churchMap = new Map(churches.map(c => [c.id, { name: c.name, code: c.code }]))
      }
    }

    const items = groupComments.map(row => {
      const profile = row.user_id ? profileMap.get(row.user_id) : null
      const church = row.group?.church_id ? churchMap.get(row.group.church_id) : null
      return mapGroupCommentToFeedItem({
        ...row,
        profile: profile || null,
        group: row.group ? {
          ...row.group,
          church: church || null
        } : null
      } as GroupCommentRow)
    })

    const hasMore = items.length > limit
    const limitedItems = items.slice(0, limit)
    const nextCursor = limitedItems.length > 0 ? limitedItems[limitedItems.length - 1].createdAt : undefined

    return {
      items: limitedItems,
      nextCursor,
      hasMore,
    }
  }

  // 교회 피드 - 내 교회의 모든 묵상 (QT + 짧은 묵상)
  private async getChurchFeed(churchId: string | null | undefined, limit: number, cursor?: string, typeFilter: FeedContentTypeFilter = 'all'): Promise<GetUnifiedFeedOutput> {
    if (!churchId) {
      return { items: [], hasMore: false }
    }

    const supabase = this.getSupabaseClient()
    const items: UnifiedFeedItem[] = []
    const fetchLimit = limit + 1

    // typeFilter에 따라 조건부 쿼리 실행
    const shouldFetchQT = typeFilter === 'all' || typeFilter === 'qt'
    const shouldFetchMeditation = typeFilter === 'all' || typeFilter === 'meditation'

    // 1. 교회 QT 묵상 (qt 필터일 때만) - RLS가 접근 허용하는 글
    if (shouldFetchQT) {
      let qtQuery = supabase
        .from('church_qt_posts')
        .select(`
          *,
          church:churches(name, code)
        `)
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })
        .limit(fetchLimit)

      if (cursor) {
        qtQuery = qtQuery.lt('created_at', cursor)
      }

      const { data: churchPosts } = await qtQuery

      if (churchPosts && churchPosts.length > 0) {
        // 프로필 정보 별도 조회
        const userIds = Array.from(new Set(churchPosts.map(p => p.user_id).filter((id): id is string => id !== null)))
        let profileMap = new Map<string, { id: string; nickname: string; avatar_url: string | null }>()

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .in('id', userIds)

          profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
        }

        items.push(...churchPosts.map(row => mapChurchQTPostToFeedItem({
          ...row,
          profile: row.user_id ? profileMap.get(row.user_id) || null : null
        } as ChurchQTPostRow)))
      }
    }

    // 2. 교회 짧은 묵상 - guest_comments (meditation 필터일 때만) - RLS가 접근 허용하는 글
    if (shouldFetchMeditation) {
      let guestQuery = supabase
        .from('guest_comments')
        .select(`
          *,
          church:churches(name, code)
        `)
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })
        .limit(fetchLimit)

      if (cursor) {
        guestQuery = guestQuery.lt('created_at', cursor)
      }

      const { data: guestComments } = await guestQuery

      if (guestComments && guestComments.length > 0) {
        // 프로필 정보 별도 조회 (linked_user_id가 있는 경우)
        const userIds = Array.from(new Set(guestComments.map(c => c.linked_user_id).filter((id): id is string => id !== null)))
        let profileMap = new Map<string, { nickname: string; avatar_url: string | null }>()

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, nickname, avatar_url')
            .in('id', userIds)

          if (profiles) {
            profileMap = new Map(profiles.map(p => [p.id, { nickname: p.nickname, avatar_url: p.avatar_url }]))
          }
        }

        items.push(...guestComments.map(row => mapGuestCommentToFeedItem({
          ...row,
          profile: row.linked_user_id ? profileMap.get(row.linked_user_id) || null : null
        } as GuestCommentRow)))
      }
    }

    // 시간순 정렬
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // limit 적용 및 hasMore 판단
    const hasMore = items.length > limit
    const limitedItems = items.slice(0, limit)
    const nextCursor = limitedItems.length > 0 ? limitedItems[limitedItems.length - 1].createdAt : undefined

    return {
      items: limitedItems,
      nextCursor,
      hasMore,
    }
  }
}
