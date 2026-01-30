/**
 * Supabase Church QT Post Repository Implementation
 *
 * IChurchQTPostRepository 인터페이스의 Supabase 구현체.
 */

import {
  ChurchQTPost,
  ChurchQTPostProps,
  ChurchQTPostReply,
  ChurchQTPostReplyProps,
  CreateChurchQTPostInput,
  UpdateChurchQTPostInput,
  CreateChurchQTPostReplyInput,
} from '@/domain/entities/ChurchQTPost'
import type { ContentVisibility } from '@/domain/entities/PublicMeditation'
import {
  IChurchQTPostRepository,
  ChurchQTPostSearchParams,
} from '@/domain/repositories/IChurchQTPostRepository'
import { getSupabaseBrowserClient } from '../supabase/client'

interface ChurchQTPostRow {
  id: string
  church_id: string
  author_name: string
  qt_date: string
  day_number: number | null
  my_sentence: string | null
  meditation_answer: string | null
  gratitude: string | null
  my_prayer: string | null
  day_review: string | null
  user_id: string | null
  is_anonymous: boolean
  visibility: ContentVisibility | null
  is_pinned: boolean
  likes_count: number
  replies_count: number
  created_at: string
  updated_at: string
}

interface ChurchQTPostReplyRow {
  id: string
  post_id: string
  user_id: string | null
  device_id: string | null
  guest_name: string
  content: string
  is_anonymous: boolean
  created_at: string
}

function mapRowToPostProps(row: ChurchQTPostRow): ChurchQTPostProps {
  return {
    id: row.id,
    churchId: row.church_id,
    authorName: row.author_name,
    qtDate: row.qt_date,
    dayNumber: row.day_number,
    mySentence: row.my_sentence,
    meditationAnswer: row.meditation_answer,
    gratitude: row.gratitude,
    myPrayer: row.my_prayer,
    dayReview: row.day_review,
    userId: row.user_id,
    isAnonymous: row.is_anonymous ?? false,
    visibility: row.visibility ?? 'church',
    isPinned: row.is_pinned ?? false,
    likesCount: row.likes_count ?? 0,
    repliesCount: row.replies_count ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at || row.created_at),
  }
}

function mapRowToReplyProps(row: ChurchQTPostReplyRow): ChurchQTPostReplyProps {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    deviceId: row.device_id,
    guestName: row.guest_name,
    content: row.content,
    isAnonymous: row.is_anonymous ?? false,
    createdAt: new Date(row.created_at),
  }
}

export class SupabaseChurchQTPostRepository implements IChurchQTPostRepository {
  private supabase = getSupabaseBrowserClient()

  async findById(id: string): Promise<ChurchQTPost | null> {
    const { data, error } = await this.supabase
      .from('church_qt_posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return ChurchQTPost.create(mapRowToPostProps(data as ChurchQTPostRow))
  }

  async findByChurchId(params: ChurchQTPostSearchParams): Promise<ChurchQTPost[]> {
    let query = this.supabase
      .from('church_qt_posts')
      .select('*')
      .eq('church_id', params.churchId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (params.dayNumber !== undefined && params.dayNumber !== null) {
      query = query.eq('day_number', params.dayNumber)
    }

    if (params.qtDate) {
      query = query.eq('qt_date', params.qtDate)
    }

    if (params.limit) {
      const offset = params.offset || 0
      query = query.range(offset, offset + params.limit - 1)
    }

    const { data, error } = await query

    if (error || !data) {
      return []
    }

    return data.map((row) =>
      ChurchQTPost.create(mapRowToPostProps(row as ChurchQTPostRow))
    )
  }

  async findByDate(churchId: string, qtDate: string): Promise<ChurchQTPost[]> {
    return this.findByChurchId({ churchId, qtDate })
  }

  async save(input: ChurchQTPost | CreateChurchQTPostInput): Promise<ChurchQTPost> {
    if (input instanceof ChurchQTPost) {
      // 기존 QT 수정
      const { data, error } = await this.supabase
        .from('church_qt_posts')
        .update({
          author_name: input.authorName,
          my_sentence: input.mySentence,
          meditation_answer: input.meditationAnswer,
          gratitude: input.gratitude,
          my_prayer: input.myPrayer,
          day_review: input.dayReview,
          is_anonymous: input.isAnonymous,
          is_pinned: input.isPinned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()

      if (error || !data) {
        throw new Error('QT 나눔 수정에 실패했습니다')
      }

      return ChurchQTPost.create(mapRowToPostProps(data as ChurchQTPostRow))
    } else {
      // 새 QT 생성
      const { data, error } = await this.supabase
        .from('church_qt_posts')
        .insert({
          church_id: input.churchId,
          author_name: input.authorName,
          qt_date: input.qtDate,
          day_number: input.dayNumber ?? null,
          my_sentence: input.mySentence ?? null,
          meditation_answer: input.meditationAnswer ?? null,
          gratitude: input.gratitude ?? null,
          my_prayer: input.myPrayer ?? null,
          day_review: input.dayReview ?? null,
          user_id: input.userId ?? null,
          is_anonymous: input.isAnonymous ?? false,
          is_pinned: false,
          likes_count: 0,
          replies_count: 0,
        })
        .select()
        .single()

      if (error || !data) {
        throw new Error('QT 나눔 생성에 실패했습니다')
      }

      return ChurchQTPost.create(mapRowToPostProps(data as ChurchQTPostRow))
    }
  }

  async update(id: string, input: UpdateChurchQTPostInput): Promise<ChurchQTPost> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.authorName !== undefined) updateData.author_name = input.authorName
    if (input.mySentence !== undefined) updateData.my_sentence = input.mySentence
    if (input.meditationAnswer !== undefined) updateData.meditation_answer = input.meditationAnswer
    if (input.gratitude !== undefined) updateData.gratitude = input.gratitude
    if (input.myPrayer !== undefined) updateData.my_prayer = input.myPrayer
    if (input.dayReview !== undefined) updateData.day_review = input.dayReview
    if (input.isAnonymous !== undefined) updateData.is_anonymous = input.isAnonymous
    if (input.qtDate !== undefined) updateData.qt_date = input.qtDate
    if (input.dayNumber !== undefined) updateData.day_number = input.dayNumber

    const { data, error } = await this.supabase
      .from('church_qt_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw new Error('QT 나눔 수정에 실패했습니다')
    }

    return ChurchQTPost.create(mapRowToPostProps(data as ChurchQTPostRow))
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('church_qt_posts')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('QT 나눔 삭제에 실패했습니다')
    }
  }

  async togglePin(id: string): Promise<ChurchQTPost> {
    const post = await this.findById(id)
    if (!post) {
      throw new Error('QT 나눔을 찾을 수 없습니다')
    }

    const { data, error } = await this.supabase
      .from('church_qt_posts')
      .update({
        is_pinned: !post.isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw new Error('고정 상태 변경에 실패했습니다')
    }

    return ChurchQTPost.create(mapRowToPostProps(data as ChurchQTPostRow))
  }

  // 좋아요 관련

  async addLike(postId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('church_qt_post_likes')
      .insert({
        post_id: postId,
        user_id: userId,
      })

    if (error) {
      // 이미 좋아요한 경우 무시
      if (error.code === '23505') return
      throw new Error('좋아요 추가에 실패했습니다')
    }

    // 좋아요 수 증가
    const { error: rpcError } = await this.supabase.rpc('increment_church_qt_post_likes', { post_id: postId })
    if (rpcError) {
      console.error('좋아요 수 증가 실패:', rpcError)
    }
  }

  async removeLike(postId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('church_qt_post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (error) {
      throw new Error('좋아요 제거에 실패했습니다')
    }

    // 좋아요 수 감소
    const { error: rpcError } = await this.supabase.rpc('decrement_church_qt_post_likes', { post_id: postId })
    if (rpcError) {
      console.error('좋아요 수 감소 실패:', rpcError)
    }
  }

  async hasLiked(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('church_qt_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return false
    }

    return data !== null
  }

  async getLikedPostIds(postIds: string[], userId: string): Promise<string[]> {
    if (postIds.length === 0) return []

    const { data, error } = await this.supabase
      .from('church_qt_post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)

    if (error || !data) {
      return []
    }

    return data.map((like) => like.post_id)
  }

  // 답글 관련

  async findReplies(postId: string): Promise<ChurchQTPostReply[]> {
    const { data, error } = await this.supabase
      .from('church_qt_post_replies')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map((row) =>
      ChurchQTPostReply.create(mapRowToReplyProps(row as ChurchQTPostReplyRow))
    )
  }

  async addReply(input: CreateChurchQTPostReplyInput): Promise<ChurchQTPostReply> {
    const { data, error } = await this.supabase
      .from('church_qt_post_replies')
      .insert({
        post_id: input.postId,
        user_id: input.userId ?? null,
        device_id: input.deviceId ?? null,
        guest_name: input.guestName,
        content: input.content,
        is_anonymous: input.isAnonymous ?? false,
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error('답글 추가에 실패했습니다')
    }

    // 답글 수 증가
    const { error: rpcError } = await this.supabase.rpc('increment_church_qt_post_replies', { post_id: input.postId })
    if (rpcError) {
      console.error('답글 수 증가 실패:', rpcError)
    }

    return ChurchQTPostReply.create(mapRowToReplyProps(data as ChurchQTPostReplyRow))
  }

  async deleteReply(replyId: string): Promise<void> {
    // 먼저 답글 정보 조회
    const { data: reply, error: fetchError } = await this.supabase
      .from('church_qt_post_replies')
      .select('post_id')
      .eq('id', replyId)
      .single()

    if (fetchError || !reply) {
      throw new Error('답글을 찾을 수 없습니다')
    }

    const { error } = await this.supabase
      .from('church_qt_post_replies')
      .delete()
      .eq('id', replyId)

    if (error) {
      throw new Error('답글 삭제에 실패했습니다')
    }

    // 답글 수 감소
    const { error: rpcError } = await this.supabase.rpc('decrement_church_qt_post_replies', { post_id: reply.post_id })
    if (rpcError) {
      console.error('답글 수 감소 실패:', rpcError)
    }
  }
}
