/**
 * GetUnifiedFeed Use Case
 *
 * 통합 피드 조회 - 그룹/교회/개인 묵상을 하나의 피드로 조회합니다.
 */

import type { UnifiedFeedItem } from '@/components/feed/UnifiedFeedCard'

export type UnifiedFeedTab = 'all' | 'following' | 'group' | 'church'

export interface GetUnifiedFeedInput {
  tab: UnifiedFeedTab
  currentUserId?: string
  limit?: number
  offset?: number
  groupIds?: string[] // 내 그룹 ID 목록
  churchId?: string | null // 내 교회 ID
  followingUserIds?: string[] // 팔로잉 사용자 ID 목록
}

export interface GetUnifiedFeedOutput {
  items: UnifiedFeedItem[]
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

export class GetUnifiedFeed {
  constructor(
    private getSupabaseClient: () => ReturnType<typeof import('@/infrastructure/supabase/client').getSupabaseBrowserClient>
  ) {}

  async execute(input: GetUnifiedFeedInput): Promise<GetUnifiedFeedOutput> {
    const { tab, limit = 20, offset = 0 } = input

    try {
      switch (tab) {
        case 'all':
          return await this.getAllPublicFeed(limit, offset)
        case 'following':
          return await this.getFollowingFeed(input.followingUserIds || [], limit, offset)
        case 'group':
          return await this.getGroupFeed(input.groupIds || [], limit, offset)
        case 'church':
          return await this.getChurchFeed(input.churchId, limit, offset)
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
  private async getAllPublicFeed(limit: number, offset: number): Promise<GetUnifiedFeedOutput> {
    const supabase = this.getSupabaseClient()
    const items: UnifiedFeedItem[] = []

    // 1. 공개된 그룹 묵상
    const { data: groupComments } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles!user_id(nickname, avatar_url),
        group:groups!group_id(name, church:churches(name, code))
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (groupComments) {
      items.push(...groupComments.map(row => mapGroupCommentToFeedItem(row as GroupCommentRow)))
    }

    // 2. 교회 QT 묵상 (church_qt_posts는 기본적으로 모두 공개)
    const { data: churchPosts } = await supabase
      .from('church_qt_posts')
      .select(`
        *,
        church:churches(name, code)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (churchPosts) {
      // 프로필 정보 별도 조회 (user_id가 있는 경우만)
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

    // 3. 공개 묵상 (public_meditations 테이블)
    const { data: publicMeditations } = await supabase
      .from('public_meditations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (publicMeditations) {
      // 프로필 정보 별도 조회
      const userIds = Array.from(new Set(publicMeditations.map(p => p.user_id)))
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      items.push(...publicMeditations.map(row => mapPublicMeditationToFeedItem({
        ...row,
        profile: profileMap.get(row.user_id) || null
      } as PublicMeditationRow)))
    }

    // 시간순 정렬 및 limit 적용
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const limitedItems = items.slice(0, limit)

    return {
      items: limitedItems,
      hasMore: items.length > limit,
    }
  }

  // 팔로잉 피드 - 팔로우한 사용자들의 공개 묵상
  private async getFollowingFeed(
    followingUserIds: string[],
    limit: number,
    offset: number
  ): Promise<GetUnifiedFeedOutput> {
    if (followingUserIds.length === 0) {
      return { items: [], hasMore: false }
    }

    const supabase = this.getSupabaseClient()
    const items: UnifiedFeedItem[] = []

    // 1. 팔로잉 사용자의 공개된 그룹 묵상
    const { data: groupComments } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles!user_id(nickname, avatar_url),
        group:groups!group_id(name, church:churches(name, code))
      `)
      .eq('is_public', true)
      .in('user_id', followingUserIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (groupComments) {
      items.push(...groupComments.map(row => mapGroupCommentToFeedItem(row as GroupCommentRow)))
    }

    // 2. 팔로잉 사용자의 교회 QT 묵상
    const { data: churchPosts } = await supabase
      .from('church_qt_posts')
      .select(`
        *,
        church:churches(name, code)
      `)
      .in('user_id', followingUserIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (churchPosts) {
      // 프로필 정보 별도 조회 (user_id가 있는 경우만)
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

    // 3. 팔로잉 사용자의 공개 묵상
    const { data: publicMeditations } = await supabase
      .from('public_meditations')
      .select('*')
      .in('user_id', followingUserIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (publicMeditations) {
      // 프로필 정보 별도 조회
      const userIds = Array.from(new Set(publicMeditations.map(p => p.user_id)))
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', userIds)

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

      items.push(...publicMeditations.map(row => mapPublicMeditationToFeedItem({
        ...row,
        profile: profileMap.get(row.user_id) || null
      } as PublicMeditationRow)))
    }

    // 시간순 정렬 및 limit 적용
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const limitedItems = items.slice(0, limit)

    return {
      items: limitedItems,
      hasMore: items.length > limit,
    }
  }

  // 그룹 피드 - 내 그룹의 모든 묵상
  private async getGroupFeed(groupIds: string[], limit: number, offset: number): Promise<GetUnifiedFeedOutput> {
    if (groupIds.length === 0) {
      return { items: [], hasMore: false }
    }

    const supabase = this.getSupabaseClient()

    const { data: groupComments } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles!user_id(nickname, avatar_url),
        group:groups!group_id(name, church:churches(name, code))
      `)
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const items = (groupComments || []).map(row => mapGroupCommentToFeedItem(row as GroupCommentRow))

    return {
      items,
      hasMore: items.length >= limit,
    }
  }

  // 교회 피드 - 내 교회의 모든 묵상
  private async getChurchFeed(churchId: string | null | undefined, limit: number, offset: number): Promise<GetUnifiedFeedOutput> {
    if (!churchId) {
      return { items: [], hasMore: false }
    }

    const supabase = this.getSupabaseClient()

    const { data: churchPosts } = await supabase
      .from('church_qt_posts')
      .select(`
        *,
        church:churches(name, code)
      `)
      .eq('church_id', churchId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!churchPosts || churchPosts.length === 0) {
      return { items: [], hasMore: false }
    }

    // 프로필 정보 별도 조회 (user_id가 있는 경우만)
    const userIds = Array.from(new Set(churchPosts.map(p => p.user_id).filter((id): id is string => id !== null)))
    let profileMap = new Map<string, { id: string; nickname: string; avatar_url: string | null }>()

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', userIds)

      profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
    }

    const items = churchPosts.map(row => mapChurchQTPostToFeedItem({
      ...row,
      profile: row.user_id ? profileMap.get(row.user_id) || null : null
    } as ChurchQTPostRow))

    return {
      items,
      hasMore: items.length >= limit,
    }
  }
}
