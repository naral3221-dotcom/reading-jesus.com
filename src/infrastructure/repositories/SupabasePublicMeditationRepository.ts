/**
 * SupabasePublicMeditationRepository
 * 공개 묵상 Supabase 구현체
 */

import { getSupabaseBrowserClient } from '../supabase/client'
import type {
  IPublicMeditationRepository,
  GetPublicMeditationsOptions,
  CreatePublicMeditationInput,
  UpdatePublicMeditationInput,
  CreatePublicMeditationReplyInput,
} from '@/domain/repositories/IPublicMeditationRepository'
import type { PublicMeditationProps, PublicMeditationReplyProps, MeditationType, ContentVisibility } from '@/domain/entities/PublicMeditation'

export class SupabasePublicMeditationRepository implements IPublicMeditationRepository {
  // ID로 단일 조회
  async findById(id: string, currentUserId?: string): Promise<PublicMeditationProps | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('public_meditations')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    // 프로필 정보 별도 조회
    let profile: { nickname: string; avatar_url: string | null } | null = null
    if (data.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', data.user_id)
        .single()
      profile = profileData
    }

    // 좋아요 상태 확인
    let isLiked = false
    if (currentUserId) {
      const { data: likeData } = await supabase
        .from('public_meditation_likes')
        .select('id')
        .eq('meditation_id', id)
        .eq('user_id', currentUserId)
        .single()
      isLiked = !!likeData
    }

    return this.mapToProps({ ...data, profile }, isLiked)
  }

  // 전체 조회 (페이지네이션)
  async findAll(options: GetPublicMeditationsOptions): Promise<PublicMeditationProps[]> {
    const supabase = getSupabaseBrowserClient()
    const { limit = 20, offset = 0, userId, currentUserId, followingUserIds, visibility } = options

    let query = supabase
      .from('public_meditations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 특정 사용자의 묵상만
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // 팔로잉 사용자들의 묵상만
    if (followingUserIds && followingUserIds.length > 0) {
      query = query.in('user_id', followingUserIds)
    }

    // 공개 범위 필터
    if (visibility && visibility.length > 0) {
      query = query.in('visibility', visibility)
    }

    const { data, error } = await query

    if (error || !data) return []

    // 프로필 정보 별도 조회
    const userIds = Array.from(new Set(data.map(d => d.user_id).filter((id): id is string => id !== null)))
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

    // 좋아요 상태 일괄 조회
    let likedIds: Set<string> = new Set()
    if (currentUserId && data.length > 0) {
      const meditationIds = data.map(d => d.id)
      const { data: likesData } = await supabase
        .from('public_meditation_likes')
        .select('meditation_id')
        .eq('user_id', currentUserId)
        .in('meditation_id', meditationIds)

      if (likesData) {
        likedIds = new Set(likesData.map(l => l.meditation_id))
      }
    }

    return data.map(d => this.mapToProps({
      ...d,
      profile: d.user_id ? profileMap.get(d.user_id) || null : null
    }, likedIds.has(d.id)))
  }

  // 특정 사용자의 묵상 조회
  async findByUserId(
    userId: string,
    options?: { limit?: number; offset?: number; currentUserId?: string }
  ): Promise<PublicMeditationProps[]> {
    return this.findAll({
      ...options,
      userId,
    })
  }

  // 인기 묵상 조회 (좋아요 순) - public_meditations + church_qt_posts 통합
  async findPopular(options?: {
    limit?: number
    currentUserId?: string
    daysAgo?: number
  }): Promise<PublicMeditationProps[]> {
    const supabase = getSupabaseBrowserClient()
    const { limit = 10, currentUserId, daysAgo = 7 } = options ?? {}

    // 최근 N일 이내의 묵상만 조회
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - daysAgo)
    const sinceDateStr = sinceDate.toISOString()

    // 1. public_meditations 조회
    const { data: publicData } = await supabase
      .from('public_meditations')
      .select('*')
      .gte('created_at', sinceDateStr)
      .gte('likes_count', 2)
      .order('likes_count', { ascending: false })
      .limit(limit)

    // 2. church_qt_posts 조회 (좋아요 2개 이상)
    const { data: churchData } = await supabase
      .from('church_qt_posts')
      .select(`
        *,
        church:churches(name, code)
      `)
      .gte('created_at', sinceDateStr)
      .gte('likes_count', 2)
      .order('likes_count', { ascending: false })
      .limit(limit)

    // 결과 통합
    const results: PublicMeditationProps[] = []

    // public_meditations 변환
    if (publicData && publicData.length > 0) {
      // 프로필 정보 별도 조회
      const publicUserIds = Array.from(new Set(publicData.map(p => p.user_id).filter((id): id is string => id !== null)))
      let publicProfileMap = new Map<string, { nickname: string; avatar_url: string | null }>()

      if (publicUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .in('id', publicUserIds)

        if (profiles) {
          publicProfileMap = new Map(profiles.map(p => [p.id, { nickname: p.nickname, avatar_url: p.avatar_url }]))
        }
      }

      // 좋아요 상태 조회
      let publicLikedIds: Set<string> = new Set()
      if (currentUserId) {
        const { data: likesData } = await supabase
          .from('public_meditation_likes')
          .select('meditation_id')
          .eq('user_id', currentUserId)
          .in('meditation_id', publicData.map(d => d.id))

        if (likesData) {
          publicLikedIds = new Set(likesData.map(l => l.meditation_id))
        }
      }

      results.push(...publicData.map(d => this.mapToProps({
        ...d,
        profile: d.user_id ? publicProfileMap.get(d.user_id) || null : null
      }, publicLikedIds.has(d.id))))
    }

    // church_qt_posts 변환
    if (churchData && churchData.length > 0) {
      // 프로필 정보 조회
      const userIds = Array.from(new Set(churchData.map(p => p.user_id).filter((id): id is string => id !== null)))
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

      // 좋아요 상태 조회
      let churchLikedIds: Set<string> = new Set()
      if (currentUserId) {
        const { data: likesData } = await supabase
          .from('church_qt_post_likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', churchData.map(d => d.id))

        if (likesData) {
          churchLikedIds = new Set(likesData.map(l => l.post_id))
        }
      }

      // church_qt_posts를 PublicMeditationProps 형태로 변환
      results.push(...churchData.map(d => this.mapChurchQTToProps(d, profileMap.get(d.user_id ?? ''), churchLikedIds.has(d.id))))
    }

    // 좋아요 순으로 정렬하고 limit 적용
    results.sort((a, b) => b.likesCount - a.likesCount)
    return results.slice(0, limit)
  }

  // church_qt_posts를 PublicMeditationProps로 변환
  private mapChurchQTToProps(
    data: Record<string, unknown>,
    profile: { nickname: string; avatar_url: string | null } | undefined,
    isLiked: boolean
  ): PublicMeditationProps {
    const church = data.church as { name: string; code: string } | null

    // meditation_answer를 content로 사용 (배열인 경우 join)
    let content = ''
    const meditationAnswer = data.meditation_answer
    if (Array.isArray(meditationAnswer)) {
      content = meditationAnswer.filter(Boolean).join('\n')
    } else if (typeof meditationAnswer === 'string') {
      content = meditationAnswer
    }

    // content가 비어있으면 다른 필드 사용
    if (!content) {
      const mySentence = data.my_sentence
      if (Array.isArray(mySentence)) {
        content = mySentence.filter(Boolean).join('\n')
      } else if (typeof mySentence === 'string') {
        content = mySentence
      }
    }

    return {
      id: data.id as string,
      userId: (data.user_id as string) ?? '',
      title: null,
      content: content || '(내용 없음)',
      bibleReference: church ? `${church.name}` : null,
      isAnonymous: (data.is_anonymous as boolean) ?? false,
      visibility: (data.visibility as ContentVisibility) ?? 'church',
      likesCount: (data.likes_count as number) ?? 0,
      repliesCount: (data.replies_count as number) ?? 0,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
      projectId: null,
      dayNumber: data.day_number as number | null,
      meditationType: 'qt',
      oneWord: null,
      meditationQuestion: null,
      meditationAnswer: content,
      gratitude: data.gratitude as string | null,
      myPrayer: data.my_prayer as string | null,
      dayReview: data.day_review as string | null,
      profile: profile ? {
        nickname: profile.nickname,
        avatarUrl: profile.avatar_url,
      } : null,
      isLiked,
    }
  }

  // 팔로잉 사용자들의 묵상 조회
  async findByFollowing(
    followingUserIds: string[],
    options?: { limit?: number; offset?: number; currentUserId?: string }
  ): Promise<PublicMeditationProps[]> {
    if (followingUserIds.length === 0) return []
    return this.findAll({
      ...options,
      followingUserIds,
    })
  }

  // 카운트
  async count(options?: { userId?: string; followingUserIds?: string[] }): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    let query = supabase
      .from('public_meditations')
      .select('id', { count: 'exact', head: true })

    if (options?.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options?.followingUserIds && options.followingUserIds.length > 0) {
      query = query.in('user_id', options.followingUserIds)
    }

    const { count } = await query
    return count ?? 0
  }

  // 개인 프로젝트별 묵상 조회 (신규)
  async findByProjectId(
    projectId: string,
    options?: { limit?: number; offset?: number; currentUserId?: string }
  ): Promise<PublicMeditationProps[]> {
    const supabase = getSupabaseBrowserClient()
    const { limit = 20, offset = 0, currentUserId } = options ?? {}

    const { data, error } = await supabase
      .from('public_meditations')
      .select('*')
      .eq('project_id', projectId)
      .order('day_number', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error || !data) return []

    // 프로필 정보 별도 조회
    const userIds = Array.from(new Set(data.map(d => d.user_id).filter((id): id is string => id !== null)))
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

    // 좋아요 상태 일괄 조회
    let likedIds: Set<string> = new Set()
    if (currentUserId && data.length > 0) {
      const meditationIds = data.map(d => d.id)
      const { data: likesData } = await supabase
        .from('public_meditation_likes')
        .select('meditation_id')
        .eq('user_id', currentUserId)
        .in('meditation_id', meditationIds)

      if (likesData) {
        likedIds = new Set(likesData.map(l => l.meditation_id))
      }
    }

    return data.map(d => this.mapToProps({
      ...d,
      profile: d.user_id ? profileMap.get(d.user_id) || null : null
    }, likedIds.has(d.id)))
  }

  // 특정 프로젝트의 특정 Day 묵상 조회 (신규)
  async findByProjectDay(
    projectId: string,
    dayNumber: number,
    currentUserId?: string
  ): Promise<PublicMeditationProps | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('public_meditations')
      .select('*')
      .eq('project_id', projectId)
      .eq('day_number', dayNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    // 프로필 정보 별도 조회
    let profile: { nickname: string; avatar_url: string | null } | null = null
    if (data.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', data.user_id)
        .single()
      profile = profileData
    }

    // 좋아요 상태 확인
    let isLiked = false
    if (currentUserId) {
      const { data: likeData } = await supabase
        .from('public_meditation_likes')
        .select('id')
        .eq('meditation_id', data.id)
        .eq('user_id', currentUserId)
        .single()
      isLiked = !!likeData
    }

    return this.mapToProps({ ...data, profile }, isLiked)
  }

  // 프로젝트별 묵상 개수 (신규)
  async countByProject(projectId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    const { count } = await supabase
      .from('public_meditations')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)

    return count ?? 0
  }

  // 생성
  async create(input: CreatePublicMeditationInput): Promise<PublicMeditationProps> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('public_meditations')
      .insert({
        user_id: input.userId,
        title: input.title ?? null,
        content: input.content,
        bible_reference: input.bibleReference ?? null,
        is_anonymous: input.isAnonymous ?? false,
        visibility: input.visibility ?? 'public',
        // 개인 프로젝트 관련 필드 (신규)
        project_id: input.projectId ?? null,
        day_number: input.dayNumber ?? null,
        meditation_type: input.meditationType ?? 'free',
        // QT 형식 전용 필드 (신규)
        one_word: input.oneWord ?? null,
        meditation_question: input.meditationQuestion ?? null,
        meditation_answer: input.meditationAnswer ?? null,
        gratitude: input.gratitude ?? null,
        my_prayer: input.myPrayer ?? null,
        day_review: input.dayReview ?? null,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(`공개 묵상 생성 실패: ${error?.message}`)
    }

    // 프로필 정보 별도 조회
    let profile: { nickname: string; avatar_url: string | null } | null = null
    if (data.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', data.user_id)
        .single()
      profile = profileData
    }

    return this.mapToProps({ ...data, profile }, false)
  }

  // 수정
  async update(id: string, userId: string, input: UpdatePublicMeditationInput): Promise<PublicMeditationProps> {
    const supabase = getSupabaseBrowserClient()

    const updateData: Record<string, unknown> = {}
    if (input.title !== undefined) updateData.title = input.title
    if (input.content !== undefined) updateData.content = input.content
    if (input.bibleReference !== undefined) updateData.bible_reference = input.bibleReference
    if (input.isAnonymous !== undefined) updateData.is_anonymous = input.isAnonymous
    if (input.visibility !== undefined) updateData.visibility = input.visibility
    // QT 형식 필드 (신규)
    if (input.oneWord !== undefined) updateData.one_word = input.oneWord
    if (input.meditationQuestion !== undefined) updateData.meditation_question = input.meditationQuestion
    if (input.meditationAnswer !== undefined) updateData.meditation_answer = input.meditationAnswer
    if (input.gratitude !== undefined) updateData.gratitude = input.gratitude
    if (input.myPrayer !== undefined) updateData.my_prayer = input.myPrayer
    if (input.dayReview !== undefined) updateData.day_review = input.dayReview

    const { data, error } = await supabase
      .from('public_meditations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId) // 본인만 수정 가능
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(`공개 묵상 수정 실패: ${error?.message}`)
    }

    // 프로필 정보 별도 조회
    let profile: { nickname: string; avatar_url: string | null } | null = null
    if (data.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', data.user_id)
        .single()
      profile = profileData
    }

    return this.mapToProps({ ...data, profile }, false)
  }

  // 삭제
  async delete(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase
      .from('public_meditations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // 본인만 삭제 가능

    if (error) {
      throw new Error(`공개 묵상 삭제 실패: ${error.message}`)
    }
  }

  // 좋아요 토글
  async toggleLike(meditationId: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()

    // 현재 좋아요 상태 확인
    const { data: existing } = await supabase
      .from('public_meditation_likes')
      .select('id')
      .eq('meditation_id', meditationId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      // 좋아요 취소
      await supabase
        .from('public_meditation_likes')
        .delete()
        .eq('meditation_id', meditationId)
        .eq('user_id', userId)
      return false
    } else {
      // 좋아요 추가
      await supabase
        .from('public_meditation_likes')
        .insert({
          meditation_id: meditationId,
          user_id: userId,
        })
      return true
    }
  }

  // 댓글 조회
  async findReplies(meditationId: string): Promise<PublicMeditationReplyProps[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('public_meditation_replies')
      .select('*')
      .eq('meditation_id', meditationId)
      .order('created_at', { ascending: true })

    if (error || !data) return []

    // 프로필 정보 별도 조회
    const userIds = Array.from(new Set(data.map(d => d.user_id).filter((id): id is string => id !== null)))
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

    return data.map(d => this.mapReplyToProps({
      ...d,
      profile: d.user_id ? profileMap.get(d.user_id) || null : null
    }))
  }

  // 댓글 생성
  async createReply(input: CreatePublicMeditationReplyInput): Promise<PublicMeditationReplyProps> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('public_meditation_replies')
      .insert({
        meditation_id: input.meditationId,
        user_id: input.userId,
        content: input.content,
        is_anonymous: input.isAnonymous ?? false,
        parent_reply_id: input.parentReplyId ?? null,
        mention_user_id: input.mentionUserId ?? null,
        mention_nickname: input.mentionNickname ?? null,
      })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error(`댓글 생성 실패: ${error?.message}`)
    }

    // 프로필 정보 별도 조회
    let profile: { nickname: string; avatar_url: string | null } | null = null
    if (data.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', data.user_id)
        .single()
      profile = profileData
    }

    return this.mapReplyToProps({ ...data, profile })
  }

  // 댓글 삭제
  async deleteReply(replyId: string, userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase
      .from('public_meditation_replies')
      .delete()
      .eq('id', replyId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`댓글 삭제 실패: ${error.message}`)
    }
  }

  // DB row -> Props 매핑
  private mapToProps(data: Record<string, unknown>, isLiked: boolean): PublicMeditationProps {
    const profile = data.profile as { nickname: string; avatar_url: string | null } | null
    return {
      id: data.id as string,
      userId: data.user_id as string,
      title: data.title as string | null,
      content: data.content as string,
      bibleReference: data.bible_reference as string | null,
      isAnonymous: data.is_anonymous as boolean,
      visibility: (data.visibility as ContentVisibility) ?? 'public',
      likesCount: (data.likes_count as number) ?? 0,
      repliesCount: (data.replies_count as number) ?? 0,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
      // 개인 프로젝트 관련 필드 (신규)
      projectId: data.project_id as string | null,
      dayNumber: data.day_number as number | null,
      meditationType: (data.meditation_type as MeditationType) ?? 'free',
      // QT 형식 전용 필드 (신규)
      oneWord: data.one_word as string | null,
      meditationQuestion: data.meditation_question as string | null,
      meditationAnswer: data.meditation_answer as string | null,
      gratitude: data.gratitude as string | null,
      myPrayer: data.my_prayer as string | null,
      dayReview: data.day_review as string | null,
      // 조인 데이터
      profile: profile ? {
        nickname: profile.nickname,
        avatarUrl: profile.avatar_url,
      } : null,
      isLiked,
    }
  }

  private mapReplyToProps(data: Record<string, unknown>): PublicMeditationReplyProps {
    const profile = data.profile as { nickname: string; avatar_url: string | null } | null
    return {
      id: data.id as string,
      meditationId: data.meditation_id as string,
      userId: data.user_id as string,
      content: data.content as string,
      isAnonymous: data.is_anonymous as boolean,
      parentReplyId: data.parent_reply_id as string | null,
      mentionUserId: data.mention_user_id as string | null,
      mentionNickname: data.mention_nickname as string | null,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
      profile: profile ? {
        nickname: profile.nickname,
        avatarUrl: profile.avatar_url,
      } : null,
    }
  }
}
