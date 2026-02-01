/**
 * SupabasePublicMeditationCommentRepository
 *
 * IPublicMeditationCommentRepository의 Supabase 구현체.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import {
  IPublicMeditationCommentRepository,
  CreateCommentInput,
  GetCommentsInput,
  GetCommentsOutput,
} from '@/domain/repositories/IPublicMeditationCommentRepository'
import { PublicMeditationComment, MeditationType } from '@/domain/entities/PublicMeditationComment'

// DB Row 타입
interface CommentRow {
  id: string
  meditation_id: string
  meditation_type: string
  user_id: string
  content: string
  is_anonymous: boolean
  parent_id: string | null
  likes_count: number
  created_at: string
  updated_at: string
  profiles: { nickname: string; avatar_url: string | null } | null
  replies?: unknown[]
}

export class SupabasePublicMeditationCommentRepository implements IPublicMeditationCommentRepository {
  private getClient() {
    return getSupabaseBrowserClient()
  }

  async create(input: CreateCommentInput): Promise<PublicMeditationComment> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('public_meditation_comments')
      .insert({
        meditation_id: input.meditationId,
        meditation_type: input.meditationType,
        user_id: input.userId,
        content: input.content,
        is_anonymous: input.isAnonymous ?? false,
        parent_id: input.parentId ?? null,
      })
      .select(`
        *,
        profiles:user_id (
          nickname,
          avatar_url
        )
      `)
      .single()

    if (error) throw new Error(`댓글 작성 실패: ${error.message}`)

    return this.mapToEntity(data, input.userId)
  }

  async getComments(input: GetCommentsInput): Promise<GetCommentsOutput> {
    const supabase = this.getClient()
    const limit = input.limit ?? 20
    const offset = input.offset ?? 0

    // 기본 쿼리
    let query = supabase
      .from('public_meditation_comments')
      .select(`
        *,
        profiles:user_id (
          nickname,
          avatar_url
        ),
        replies:public_meditation_comments!parent_id (
          id
        )
      `, { count: 'exact' })
      .eq('meditation_id', input.meditationId)
      .eq('meditation_type', input.meditationType)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    // 최상위 댓글만 조회하거나 특정 부모의 답글만 조회
    if (input.parentId === null) {
      query = query.is('parent_id', null)
    } else if (input.parentId) {
      query = query.eq('parent_id', input.parentId)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`댓글 조회 실패: ${error.message}`)

    // 현재 사용자의 좋아요 상태 조회
    let likedCommentIds: Set<string> = new Set()
    if (input.currentUserId && data && data.length > 0) {
      const commentIds = data.map((c) => c.id)
      const { data: likes } = await supabase
        .from('public_meditation_comment_likes')
        .select('comment_id')
        .eq('user_id', input.currentUserId)
        .in('comment_id', commentIds)

      if (likes) {
        likedCommentIds = new Set(likes.map((l) => l.comment_id))
      }
    }

    const comments = (data ?? []).map((row) =>
      this.mapToEntity(row, input.currentUserId, likedCommentIds)
    )

    return {
      data: comments,
      totalCount: count ?? 0,
      hasMore: (count ?? 0) > offset + limit,
    }
  }

  async findById(id: string, currentUserId?: string): Promise<PublicMeditationComment | null> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('public_meditation_comments')
      .select(`
        *,
        profiles:user_id (
          nickname,
          avatar_url
        ),
        replies:public_meditation_comments!parent_id (
          id
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) return null

    // 현재 사용자의 좋아요 상태 조회
    let isLiked = false
    if (currentUserId) {
      const { data: like } = await supabase
        .from('public_meditation_comment_likes')
        .select('id')
        .eq('comment_id', id)
        .eq('user_id', currentUserId)
        .single()
      isLiked = !!like
    }

    return this.mapToEntity(data, currentUserId, isLiked ? new Set([id]) : new Set())
  }

  async update(id: string, content: string): Promise<PublicMeditationComment> {
    const supabase = this.getClient()

    const { data, error } = await supabase
      .from('public_meditation_comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        profiles:user_id (
          nickname,
          avatar_url
        )
      `)
      .single()

    if (error) throw new Error(`댓글 수정 실패: ${error.message}`)

    return this.mapToEntity(data)
  }

  async delete(id: string): Promise<boolean> {
    const supabase = this.getClient()

    const { error } = await supabase
      .from('public_meditation_comments')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`댓글 삭제 실패: ${error.message}`)

    return true
  }

  async toggleLike(commentId: string, userId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const supabase = this.getClient()

    // 현재 좋아요 상태 확인
    const { data: existingLike } = await supabase
      .from('public_meditation_comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (existingLike) {
      // 좋아요 취소
      await supabase
        .from('public_meditation_comment_likes')
        .delete()
        .eq('id', existingLike.id)
    } else {
      // 좋아요 추가
      await supabase
        .from('public_meditation_comment_likes')
        .insert({ comment_id: commentId, user_id: userId })
    }

    // 업데이트된 좋아요 수 조회
    const { data: comment } = await supabase
      .from('public_meditation_comments')
      .select('likes_count')
      .eq('id', commentId)
      .single()

    return {
      isLiked: !existingLike,
      likesCount: comment?.likes_count ?? 0,
    }
  }

  async getCommentsCount(meditationId: string, meditationType: MeditationType): Promise<number> {
    const supabase = this.getClient()

    const { count, error } = await supabase
      .from('public_meditation_comments')
      .select('*', { count: 'exact', head: true })
      .eq('meditation_id', meditationId)
      .eq('meditation_type', meditationType)

    if (error) throw new Error(`댓글 수 조회 실패: ${error.message}`)

    return count ?? 0
  }

  private mapToEntity(row: CommentRow, currentUserId?: string, likedIds?: Set<string>): PublicMeditationComment {
    const repliesCount = Array.isArray(row.replies) ? row.replies.length : 0

    return PublicMeditationComment.create({
      id: row.id,
      meditationId: row.meditation_id,
      meditationType: row.meditation_type as MeditationType,
      userId: row.user_id,
      content: row.content,
      isAnonymous: row.is_anonymous,
      parentId: row.parent_id,
      likesCount: row.likes_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      authorNickname: row.profiles?.nickname,
      authorAvatarUrl: row.profiles?.avatar_url,
      isLiked: likedIds?.has(row.id) ?? false,
      repliesCount,
    })
  }
}
