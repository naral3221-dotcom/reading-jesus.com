/**
 * Supabase UnifiedMeditation Repository Implementation
 *
 * 통합 묵상 Supabase 구현체.
 * 그룹 묵상, 교회 묵상, QT 나눔을 통합 관리.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type {
  IUnifiedMeditationRepository,
  UnifiedMeditationSearchParams,
  UserMeditationSearchParams,
  UnifiedMeditationWithLikeStatus,
} from '@/domain/repositories/IUnifiedMeditationRepository'
import type {
  SourceType,
  ContentType,
  UnifiedMeditationProps,
  CreateUnifiedMeditationInput,
  UpdateUnifiedMeditationInput,
  UnifiedMeditationReplyProps,
  CreateUnifiedMeditationReplyInput,
} from '@/domain/entities/UnifiedMeditation'
import type { ContentVisibility } from '@/domain/entities/PublicMeditation'

// DB Row 타입
interface MeditationRow {
  id: string
  user_id: string | null
  guest_token: string | null
  author_name: string
  source_type: SourceType
  source_id: string
  content_type: ContentType
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
  visibility: ContentVisibility | null
  is_pinned: boolean
  likes_count: number
  replies_count: number
  created_at: string
  updated_at: string | null
  // 조인 데이터
  profiles?: {
    nickname: string
    avatar_url: string | null
  } | null
  groups?: { name: string } | null
  churches?: { name: string } | null
}

interface ReplyRow {
  id: string
  meditation_id: string
  user_id: string | null
  guest_token: string | null
  author_name: string
  content: string
  is_anonymous: boolean
  mention_user_id: string | null
  mention_nickname: string | null
  created_at: string
  updated_at: string | null
  profiles?: {
    nickname: string
    avatar_url: string | null
  } | null
}

export class SupabaseUnifiedMeditationRepository implements IUnifiedMeditationRepository {
  /**
   * Row를 Props로 변환
   */
  private toMeditationProps(row: MeditationRow): UnifiedMeditationProps {
    return {
      id: row.id,
      userId: row.user_id,
      guestToken: row.guest_token,
      authorName: row.author_name,
      sourceType: row.source_type,
      sourceId: row.source_id,
      contentType: row.content_type,
      dayNumber: row.day_number,
      content: row.content,
      bibleRange: row.bible_range,
      qtDate: row.qt_date ? new Date(row.qt_date) : null,
      mySentence: row.my_sentence,
      meditationAnswer: row.meditation_answer,
      gratitude: row.gratitude,
      myPrayer: row.my_prayer,
      dayReview: row.day_review,
      isAnonymous: row.is_anonymous,
      visibility: row.visibility ?? 'public',  // 기본값 public으로 변경
      isPinned: row.is_pinned,
      likesCount: row.likes_count,
      repliesCount: row.replies_count,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
      profile: row.profiles
        ? {
            nickname: row.profiles.nickname,
            avatarUrl: row.profiles.avatar_url,
          }
        : null,
      sourceName: row.groups?.name || row.churches?.name,
    }
  }

  /**
   * Reply Row를 Props로 변환
   */
  private toReplyProps(row: ReplyRow): UnifiedMeditationReplyProps {
    return {
      id: row.id,
      meditationId: row.meditation_id,
      userId: row.user_id,
      guestToken: row.guest_token,
      authorName: row.author_name,
      content: row.content,
      isAnonymous: row.is_anonymous,
      mentionUserId: row.mention_user_id,
      mentionNickname: row.mention_nickname,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
      profile: row.profiles
        ? {
            nickname: row.profiles.nickname,
            avatarUrl: row.profiles.avatar_url,
          }
        : null,
    }
  }

  /**
   * 출처별 묵상 조회
   */
  async findBySource(params: UnifiedMeditationSearchParams): Promise<UnifiedMeditationWithLikeStatus[]> {
    const supabase = getSupabaseBrowserClient()
    const {
      sourceType,
      sourceId,
      dayNumber,
      contentType,
      userId,
      filter = 'all',
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDir = 'desc',
    } = params

    let query = supabase
      .from('unified_meditations')
      .select('*')
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)

    // dayNumber 필터
    if (dayNumber !== undefined && dayNumber !== null) {
      query = query.eq('day_number', dayNumber)
    }

    // contentType 필터
    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    // 필터 적용
    if (filter === 'mine' && userId) {
      query = query.eq('user_id', userId)
    } else if (filter === 'pinned') {
      query = query.eq('is_pinned', true)
    }

    // 정렬
    if (orderBy === 'likes_count') {
      query = query.order('likes_count', { ascending: orderDir === 'asc' })
    }
    query = query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: orderDir === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      throw new Error(`묵상 조회 실패: ${error.message}`)
    }

    if (!data) return []

    const meditations = data as MeditationRow[]

    // 좋아요 상태 확인
    let likedIds: Set<string> = new Set()
    if (userId && meditations.length > 0) {
      const { data: likes } = await supabase
        .from('unified_meditation_likes')
        .select('meditation_id')
        .eq('user_id', userId)
        .in('meditation_id', meditations.map(m => m.id))

      if (likes) {
        likedIds = new Set(likes.map(l => l.meditation_id))
      }
    }

    return meditations.map(row => ({
      ...this.toMeditationProps(row),
      isLiked: likedIds.has(row.id),
    }))
  }

  /**
   * 묵상 ID로 조회
   */
  async findById(id: string, userId?: string | null): Promise<UnifiedMeditationWithLikeStatus | null> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('unified_meditations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`묵상 조회 실패: ${error.message}`)
    }

    if (!data) return null

    // 좋아요 상태 확인
    let isLiked = false
    if (userId) {
      const { data: like } = await supabase
        .from('unified_meditation_likes')
        .select('id')
        .eq('meditation_id', id)
        .eq('user_id', userId)
        .single()

      isLiked = !!like
    }

    return {
      ...this.toMeditationProps(data as MeditationRow),
      isLiked,
    }
  }

  /**
   * 사용자의 모든 묵상 조회 (mypage용)
   */
  async findByUser(params: UserMeditationSearchParams): Promise<UnifiedMeditationProps[]> {
    const supabase = getSupabaseBrowserClient()
    const { userId, sourceType, contentType, limit = 50, offset = 0 } = params

    // profiles 조인 제거 (FK 미설정으로 400 에러 발생)
    let query = supabase
      .from('unified_meditations')
      .select('*')
      .eq('user_id', userId)

    if (sourceType) {
      query = query.eq('source_type', sourceType)
    }

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      throw new Error(`사용자 묵상 조회 실패: ${error.message}`)
    }

    const rows = data as MeditationRow[] || []

    // source_id로 그룹/교회 이름 조회
    const groupIds = rows.filter(r => r.source_type === 'group').map(r => r.source_id)
    const churchIds = rows.filter(r => r.source_type === 'church').map(r => r.source_id)

    const groupNames = new Map<string, string>()
    const churchNames = new Map<string, string>()

    if (groupIds.length > 0) {
      const { data: groups } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds)

      for (const group of groups || []) {
        groupNames.set(group.id, group.name)
      }
    }

    if (churchIds.length > 0) {
      const { data: churches } = await supabase
        .from('churches')
        .select('id, name')
        .in('id', churchIds)

      for (const church of churches || []) {
        churchNames.set(church.id, church.name)
      }
    }

    return rows.map(row => ({
      ...this.toMeditationProps(row),
      sourceName: row.source_type === 'group'
        ? groupNames.get(row.source_id)
        : churchNames.get(row.source_id),
    }))
  }

  /**
   * 사용자의 묵상 수 조회
   */
  async getUserMeditationCount(userId: string, sourceType?: SourceType | null): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    let query = supabase
      .from('unified_meditations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (sourceType) {
      query = query.eq('source_type', sourceType)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`묵상 수 조회 실패: ${error.message}`)
    }

    return count ?? 0
  }

  /**
   * 묵상 생성
   */
  async create(input: CreateUnifiedMeditationInput): Promise<UnifiedMeditationProps> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('unified_meditations')
      .insert({
        user_id: input.userId,
        guest_token: input.guestToken,
        author_name: input.authorName,
        source_type: input.sourceType,
        source_id: input.sourceId,
        content_type: input.contentType,
        day_number: input.dayNumber,
        content: input.content,
        bible_range: input.bibleRange,
        qt_date: input.qtDate?.toISOString().split('T')[0],
        my_sentence: input.mySentence,
        meditation_answer: input.meditationAnswer,
        gratitude: input.gratitude,
        my_prayer: input.myPrayer,
        day_review: input.dayReview,
        is_anonymous: input.isAnonymous ?? false,
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`묵상 생성 실패: ${error.message}`)
    }

    return this.toMeditationProps(data as MeditationRow)
  }

  /**
   * 묵상 수정
   *
   * Dual-Write 패턴: legacy_table을 통해 레거시 테이블 수정 → 트리거가 unified 동기화
   */
  async update(
    id: string,
    userId: string | null,
    guestToken: string | null,
    input: UpdateUnifiedMeditationInput
  ): Promise<UnifiedMeditationProps> {
    const supabase = getSupabaseBrowserClient()

    // 1. unified_meditations에서 legacy 정보 조회
    const { data: unified, error: fetchError } = await supabase
      .from('unified_meditations')
      .select('legacy_table, legacy_id, content_type')
      .eq('id', id)
      .single()

    if (fetchError || !unified) {
      throw new Error(`묵상 조회 실패: ${fetchError?.message || '데이터를 찾을 수 없습니다'}`)
    }

    // 2. legacy 테이블이 있으면 레거시 테이블 수정 (트리거가 자동 동기화)
    if (unified.legacy_table && unified.legacy_id) {
      const legacyTable = unified.legacy_table
      const legacyId = unified.legacy_id

      // 레거시 테이블별 업데이트 필드 구성
      let updateData: Record<string, unknown> = {}

      if (legacyTable === 'guest_comments') {
        updateData = {
          content: input.content,
          bible_range: input.bibleRange,
          is_anonymous: input.isAnonymous,
        }
      } else if (legacyTable === 'church_qt_posts') {
        updateData = {
          my_sentence: input.mySentence,
          meditation_answer: input.meditationAnswer,
          gratitude: input.gratitude,
          my_prayer: input.myPrayer,
          day_review: input.dayReview,
          is_anonymous: input.isAnonymous,
        }
      } else if (legacyTable === 'comments') {
        updateData = {
          content: input.content,
          bible_range: input.bibleRange,
          is_anonymous: input.isAnonymous,
        }
      } else if (legacyTable === 'public_meditations') {
        updateData = {
          content: input.content,
          bible_reference: input.bibleRange,
          is_anonymous: input.isAnonymous,
        }
      }

      // null/undefined 제거
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from(legacyTable)
          .update(updateData)
          .eq('id', legacyId)

        if (updateError) {
          throw new Error(`묵상 수정 실패: ${updateError.message}`)
        }
      }
    } else {
      // legacy 정보가 없으면 unified 직접 수정 (새로운 데이터)
      const { error: updateError } = await supabase
        .from('unified_meditations')
        .update({
          content: input.content,
          bible_range: input.bibleRange,
          my_sentence: input.mySentence,
          meditation_answer: input.meditationAnswer,
          gratitude: input.gratitude,
          my_prayer: input.myPrayer,
          day_review: input.dayReview,
          is_anonymous: input.isAnonymous,
        })
        .eq('id', id)

      if (updateError) {
        throw new Error(`묵상 수정 실패: ${updateError.message}`)
      }
    }

    // 3. 업데이트된 데이터 조회하여 반환
    const { data, error } = await supabase
      .from('unified_meditations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`묵상 조회 실패: ${error.message}`)
    }

    return this.toMeditationProps(data as MeditationRow)
  }

  /**
   * 묵상 삭제
   *
   * Dual-Write 패턴: legacy_table을 통해 레거시 테이블 삭제 → 트리거가 unified 동기화
   */
  async delete(id: string, userId: string | null, guestToken: string | null): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    // 1. unified_meditations에서 legacy 정보 조회
    const { data: unified, error: fetchError } = await supabase
      .from('unified_meditations')
      .select('legacy_table, legacy_id')
      .eq('id', id)
      .single()

    if (fetchError || !unified) {
      throw new Error(`묵상 조회 실패: ${fetchError?.message || '데이터를 찾을 수 없습니다'}`)
    }

    // 2. legacy 테이블이 있으면 레거시 테이블에서 삭제 (트리거가 자동으로 unified도 삭제)
    if (unified.legacy_table && unified.legacy_id) {
      const { error: deleteError } = await supabase
        .from(unified.legacy_table)
        .delete()
        .eq('id', unified.legacy_id)

      if (deleteError) {
        throw new Error(`묵상 삭제 실패: ${deleteError.message}`)
      }
    } else {
      // legacy 정보가 없으면 unified 직접 삭제 (새로운 데이터)
      const { error: deleteError } = await supabase
        .from('unified_meditations')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(`묵상 삭제 실패: ${deleteError.message}`)
      }
    }
  }

  /**
   * 좋아요 토글
   */
  async toggleLike(
    meditationId: string,
    userId: string | null,
    guestToken: string | null
  ): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()

    // DB 함수 호출
    const { data, error } = await supabase.rpc('toggle_unified_meditation_like', {
      p_meditation_id: meditationId,
      p_user_id: userId,
      p_guest_token: guestToken,
    })

    if (error) {
      throw new Error(`좋아요 토글 실패: ${error.message}`)
    }

    return data as boolean
  }

  /**
   * 고정 토글
   */
  async togglePin(meditationId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()

    // 현재 상태 조회
    const { data: current } = await supabase
      .from('unified_meditations')
      .select('is_pinned')
      .eq('id', meditationId)
      .single()

    const newPinned = !current?.is_pinned

    const { error } = await supabase
      .from('unified_meditations')
      .update({ is_pinned: newPinned })
      .eq('id', meditationId)

    if (error) {
      throw new Error(`고정 토글 실패: ${error.message}`)
    }

    return newPinned
  }

  /**
   * 묵상의 답글 조회
   */
  async findReplies(meditationId: string): Promise<UnifiedMeditationReplyProps[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('unified_meditation_replies')
      .select('*')
      .eq('meditation_id', meditationId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`답글 조회 실패: ${error.message}`)
    }

    return (data as ReplyRow[] || []).map(row => this.toReplyProps(row))
  }

  /**
   * 답글 생성
   */
  async createReply(input: CreateUnifiedMeditationReplyInput): Promise<UnifiedMeditationReplyProps> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('unified_meditation_replies')
      .insert({
        meditation_id: input.meditationId,
        user_id: input.userId,
        guest_token: input.guestToken,
        author_name: input.authorName,
        content: input.content,
        is_anonymous: input.isAnonymous ?? false,
        mention_user_id: input.mentionUserId,
        mention_nickname: input.mentionNickname,
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`답글 생성 실패: ${error.message}`)
    }

    // replies_count 증가
    try {
      await supabase.rpc('increment_replies_count', {
        p_meditation_id: input.meditationId,
      })
    } catch {
      // 실패해도 무시 (트리거로 처리 가능)
    }

    return this.toReplyProps(data as ReplyRow)
  }

  /**
   * 답글 수정
   */
  async updateReply(
    id: string,
    userId: string | null,
    guestToken: string | null,
    content: string
  ): Promise<UnifiedMeditationReplyProps> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('unified_meditation_replies')
      .update({ content })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`답글 수정 실패: ${error.message}`)
    }

    return this.toReplyProps(data as ReplyRow)
  }

  /**
   * 답글 삭제
   */
  async deleteReply(id: string, userId: string | null, guestToken: string | null): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    // meditation_id를 먼저 조회
    const { data: reply } = await supabase
      .from('unified_meditation_replies')
      .select('meditation_id')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('unified_meditation_replies')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`답글 삭제 실패: ${error.message}`)
    }

    // replies_count 감소
    if (reply?.meditation_id) {
      try {
        await supabase.rpc('decrement_replies_count', {
          p_meditation_id: reply.meditation_id,
        })
      } catch {
        // 실패해도 무시
      }
    }
  }

  /**
   * 묵상 수 조회
   */
  async getCount(
    sourceType: SourceType,
    sourceId: string,
    dayNumber?: number | null
  ): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    let query = supabase
      .from('unified_meditations')
      .select('id', { count: 'exact', head: true })
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)

    if (dayNumber !== undefined && dayNumber !== null) {
      query = query.eq('day_number', dayNumber)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`묵상 수 조회 실패: ${error.message}`)
    }

    return count ?? 0
  }

  /**
   * 좋아요 여부 확인
   */
  async isLiked(
    meditationId: string,
    userId: string | null,
    guestToken: string | null
  ): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()

    if (userId) {
      const { data } = await supabase
        .from('unified_meditation_likes')
        .select('id')
        .eq('meditation_id', meditationId)
        .eq('user_id', userId)
        .single()

      return !!data
    }

    if (guestToken) {
      const { data } = await supabase
        .from('unified_meditation_likes')
        .select('id')
        .eq('meditation_id', meditationId)
        .eq('guest_token', guestToken)
        .is('user_id', null)
        .single()

      return !!data
    }

    return false
  }
}
