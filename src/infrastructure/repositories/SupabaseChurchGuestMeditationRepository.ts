/**
 * Supabase Guest Comment Repository Implementation
 *
 * IGuestCommentRepository 인터페이스의 Supabase 구현체.
 */

import {
  GuestComment,
  GuestCommentProps,
  GuestCommentReply,
  GuestCommentReplyProps,
  CreateGuestCommentInput,
  UpdateGuestCommentInput,
  CreateGuestCommentReplyInput,
} from '@/domain/entities/ChurchGuestMeditation'
import {
  IGuestCommentRepository,
  GuestCommentSearchParams,
} from '@/domain/repositories/IChurchGuestMeditationRepository'
import { getSupabaseBrowserClient } from '../supabase/client'

interface GuestCommentRow {
  id: string
  church_id: string
  guest_token: string | null
  guest_name: string
  content: string
  bible_range: string | null
  day_number: number | null
  linked_user_id: string | null
  is_anonymous: boolean
  is_pinned: boolean
  likes_count: number
  replies_count: number
  created_at: string
  updated_at: string
}

interface GuestCommentReplyRow {
  id: string
  comment_id: string
  user_id: string | null
  device_id: string | null
  guest_name: string
  content: string
  is_anonymous: boolean
  created_at: string
}

function mapRowToCommentProps(row: GuestCommentRow): GuestCommentProps {
  return {
    id: row.id,
    churchId: row.church_id,
    guestToken: row.guest_token,
    guestName: row.guest_name,
    content: row.content,
    bibleRange: row.bible_range,
    dayNumber: row.day_number,
    linkedUserId: row.linked_user_id,
    isAnonymous: row.is_anonymous ?? false,
    isPinned: row.is_pinned ?? false,
    likesCount: row.likes_count ?? 0,
    repliesCount: row.replies_count ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at || row.created_at),
  }
}

function mapRowToReplyProps(row: GuestCommentReplyRow): GuestCommentReplyProps {
  return {
    id: row.id,
    commentId: row.comment_id,
    userId: row.user_id,
    deviceId: row.device_id,
    guestName: row.guest_name,
    content: row.content,
    isAnonymous: row.is_anonymous ?? false,
    createdAt: new Date(row.created_at),
  }
}

export class SupabaseGuestCommentRepository implements IGuestCommentRepository {
  private supabase = getSupabaseBrowserClient()

  async findById(id: string): Promise<GuestComment | null> {
    const { data, error } = await this.supabase
      .from('guest_comments')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return GuestComment.create(mapRowToCommentProps(data as GuestCommentRow))
  }

  async findByChurchId(params: GuestCommentSearchParams): Promise<GuestComment[]> {
    let query = this.supabase
      .from('guest_comments')
      .select('*')
      .eq('church_id', params.churchId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (params.dayNumber !== undefined && params.dayNumber !== null) {
      query = query.eq('day_number', params.dayNumber)
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
      GuestComment.create(mapRowToCommentProps(row as GuestCommentRow))
    )
  }

  async findByDay(churchId: string, dayNumber: number): Promise<GuestComment[]> {
    return this.findByChurchId({ churchId, dayNumber })
  }

  async save(input: GuestComment | CreateGuestCommentInput): Promise<GuestComment> {
    if (input instanceof GuestComment) {
      // 기존 댓글 수정
      const { data, error } = await this.supabase
        .from('guest_comments')
        .update({
          guest_name: input.guestName,
          content: input.content,
          bible_range: input.bibleRange,
          is_anonymous: input.isAnonymous,
          is_pinned: input.isPinned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()

      if (error || !data) {
        throw new Error('댓글 수정에 실패했습니다')
      }

      return GuestComment.create(mapRowToCommentProps(data as GuestCommentRow))
    } else {
      // 새 댓글 생성
      const { data, error } = await this.supabase
        .from('guest_comments')
        .insert({
          church_id: input.churchId,
          guest_token: input.guestToken ?? null,
          guest_name: input.guestName,
          content: input.content,
          bible_range: input.bibleRange ?? null,
          day_number: input.dayNumber ?? null,
          linked_user_id: input.linkedUserId ?? null,
          is_anonymous: input.isAnonymous ?? false,
          is_pinned: false,
          likes_count: 0,
          replies_count: 0,
        })
        .select()
        .single()

      if (error || !data) {
        throw new Error('댓글 생성에 실패했습니다')
      }

      return GuestComment.create(mapRowToCommentProps(data as GuestCommentRow))
    }
  }

  async update(id: string, input: UpdateGuestCommentInput): Promise<GuestComment> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.guestName !== undefined) updateData.guest_name = input.guestName
    if (input.content !== undefined) updateData.content = input.content
    if (input.bibleRange !== undefined) updateData.bible_range = input.bibleRange
    if (input.isAnonymous !== undefined) updateData.is_anonymous = input.isAnonymous

    const { data, error } = await this.supabase
      .from('guest_comments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw new Error('댓글 수정에 실패했습니다')
    }

    return GuestComment.create(mapRowToCommentProps(data as GuestCommentRow))
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('guest_comments')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('댓글 삭제에 실패했습니다')
    }
  }

  async togglePin(id: string): Promise<GuestComment> {
    const comment = await this.findById(id)
    if (!comment) {
      throw new Error('댓글을 찾을 수 없습니다')
    }

    const { data, error } = await this.supabase
      .from('guest_comments')
      .update({
        is_pinned: !comment.isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw new Error('고정 상태 변경에 실패했습니다')
    }

    return GuestComment.create(mapRowToCommentProps(data as GuestCommentRow))
  }

  // 좋아요 관련

  async addLike(commentId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('guest_comment_likes')
      .insert({
        comment_id: commentId,
        user_id: userId,
      })

    if (error) {
      // 이미 좋아요한 경우 무시
      if (error.code === '23505') return
      throw new Error('좋아요 추가에 실패했습니다')
    }

    // 좋아요 수 증가
    const { error: rpcError } = await this.supabase.rpc('increment_guest_comment_likes', { comment_id: commentId })
    if (rpcError) {
      console.error('좋아요 수 증가 실패:', rpcError)
    }
  }

  async removeLike(commentId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('guest_comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId)

    if (error) {
      throw new Error('좋아요 제거에 실패했습니다')
    }

    // 좋아요 수 감소
    const { error: rpcError } = await this.supabase.rpc('decrement_guest_comment_likes', { comment_id: commentId })
    if (rpcError) {
      console.error('좋아요 수 감소 실패:', rpcError)
    }
  }

  async hasLiked(commentId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('guest_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return false
    }

    return data !== null
  }

  async getLikedCommentIds(commentIds: string[], userId: string): Promise<string[]> {
    if (commentIds.length === 0) return []

    const { data, error } = await this.supabase
      .from('guest_comment_likes')
      .select('comment_id')
      .eq('user_id', userId)
      .in('comment_id', commentIds)

    if (error || !data) {
      return []
    }

    return data.map((like) => like.comment_id)
  }

  // 답글 관련

  async findReplies(commentId: string): Promise<GuestCommentReply[]> {
    const { data, error } = await this.supabase
      .from('guest_comment_replies')
      .select('*')
      .eq('comment_id', commentId)
      .order('created_at', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map((row) =>
      GuestCommentReply.create(mapRowToReplyProps(row as GuestCommentReplyRow))
    )
  }

  async addReply(input: CreateGuestCommentReplyInput): Promise<GuestCommentReply> {
    const { data, error } = await this.supabase
      .from('guest_comment_replies')
      .insert({
        comment_id: input.commentId,
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
    const { error: rpcError } = await this.supabase.rpc('increment_guest_comment_replies', { comment_id: input.commentId })
    if (rpcError) {
      console.error('답글 수 증가 실패:', rpcError)
    }

    return GuestCommentReply.create(mapRowToReplyProps(data as GuestCommentReplyRow))
  }

  async deleteReply(replyId: string): Promise<void> {
    // 먼저 답글 정보 조회
    const { data: reply, error: fetchError } = await this.supabase
      .from('guest_comment_replies')
      .select('comment_id')
      .eq('id', replyId)
      .single()

    if (fetchError || !reply) {
      throw new Error('답글을 찾을 수 없습니다')
    }

    const { error } = await this.supabase
      .from('guest_comment_replies')
      .delete()
      .eq('id', replyId)

    if (error) {
      throw new Error('답글 삭제에 실패했습니다')
    }

    // 답글 수 감소
    const { error: rpcError } = await this.supabase.rpc('decrement_guest_comment_replies', { comment_id: reply.comment_id })
    if (rpcError) {
      console.error('답글 수 감소 실패:', rpcError)
    }
  }
}

// ===== 새 명명 체계 별칭 =====

/** SupabaseChurchGuestMeditationRepository = SupabaseGuestCommentRepository */
export const SupabaseChurchGuestMeditationRepository = SupabaseGuestCommentRepository
export type SupabaseChurchGuestMeditationRepository = SupabaseGuestCommentRepository
