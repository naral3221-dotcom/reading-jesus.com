/**
 * Supabase Comment Repository Implementation
 *
 * 그룹 묵상 댓글 Supabase 구현체.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type {
  ICommentRepository,
  CommentSearchParams,
  CommentWithLikeStatus,
} from '@/domain/repositories/ICommentRepository'
import type {
  CommentProps,
  CreateCommentInput,
  UpdateCommentInput,
  CommentReplyProps,
  CreateCommentReplyInput,
  CommentAttachmentProps,
  MemberRankProps,
} from '@/domain/entities/Comment'

// DB Row 타입
interface CommentRow {
  id: string
  user_id: string
  group_id: string
  day_number: number
  content: string
  is_anonymous: boolean
  likes_count: number
  replies_count: number
  is_pinned: boolean
  created_at: string
  updated_at: string | null
  profiles: {
    nickname: string
    avatar_url: string | null
  } | null
  comment_attachments?: AttachmentRow[]
  author_rank?: MemberRankRow | null
}

interface AttachmentRow {
  id: string
  comment_id: string
  file_url: string
  file_type: 'image' | 'pdf'
  file_name: string
  file_size: number
  created_at: string
}

interface MemberRankRow {
  id: string
  name: string
  color: string
  permissions: {
    can_read: boolean
    can_comment: boolean
    can_create_meeting: boolean
    can_pin_comment: boolean
    can_manage_members: boolean
  }
}

interface ReplyRow {
  id: string
  comment_id: string
  user_id: string
  content: string
  is_anonymous: boolean
  created_at: string
  updated_at: string | null
  mention_user_id: string | null
  mention_nickname: string | null
  profiles: {
    nickname: string
    avatar_url: string | null
  } | null
}

export class SupabaseCommentRepository implements ICommentRepository {
  /**
   * 댓글 Row를 Props로 변환
   */
  private toCommentProps(row: CommentRow): CommentProps {
    return {
      id: row.id,
      userId: row.user_id,
      groupId: row.group_id,
      dayNumber: row.day_number,
      content: row.content,
      isAnonymous: row.is_anonymous,
      likesCount: row.likes_count,
      repliesCount: row.replies_count,
      isPinned: row.is_pinned,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
      profile: row.profiles
        ? {
            nickname: row.profiles.nickname,
            avatarUrl: row.profiles.avatar_url,
          }
        : null,
      attachments: row.comment_attachments?.map(this.toAttachmentProps) ?? [],
      authorRank: row.author_rank ? this.toRankProps(row.author_rank) : null,
    }
  }

  /**
   * 첨부파일 Row를 Props로 변환
   */
  private toAttachmentProps(row: AttachmentRow): CommentAttachmentProps {
    return {
      id: row.id,
      commentId: row.comment_id,
      fileUrl: row.file_url,
      fileType: row.file_type,
      fileName: row.file_name,
      fileSize: row.file_size,
      createdAt: new Date(row.created_at),
    }
  }

  /**
   * 멤버 등급 Row를 Props로 변환
   */
  private toRankProps(row: MemberRankRow): MemberRankProps {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      permissions: row.permissions,
    }
  }

  /**
   * 답글 Row를 Props로 변환
   */
  private toReplyProps(row: ReplyRow): CommentReplyProps {
    return {
      id: row.id,
      commentId: row.comment_id,
      userId: row.user_id,
      content: row.content,
      isAnonymous: row.is_anonymous,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
      mentionUserId: row.mention_user_id,
      mentionNickname: row.mention_nickname,
      profile: row.profiles
        ? {
            nickname: row.profiles.nickname,
            avatarUrl: row.profiles.avatar_url,
          }
        : null,
    }
  }

  /**
   * 그룹/Day별 댓글 조회
   */
  async findByGroupAndDay(params: CommentSearchParams): Promise<CommentWithLikeStatus[]> {
    const supabase = getSupabaseBrowserClient()
    const { groupId, dayNumber, userId, filter = 'all', limit = 50, offset = 0 } = params

    let query = supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (nickname, avatar_url),
        comment_attachments (*)
      `)
      .eq('group_id', groupId)
      .eq('day_number', dayNumber)

    // 필터 적용
    if (filter === 'mine' && userId) {
      query = query.eq('user_id', userId)
    } else if (filter === 'pinned') {
      query = query.eq('is_pinned', true)
    }

    // 정렬: 고정된 댓글 먼저, 그 다음 최신순
    query = query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      throw new Error(`댓글 조회 실패: ${error.message}`)
    }

    if (!data) return []

    // 좋아요 상태 확인
    const comments = data as CommentRow[]
    const likedSet = new Set<string>()

    if (userId) {
      const commentIds = comments.map((c) => c.id)
      if (commentIds.length > 0) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', userId)
          .in('comment_id', commentIds)

        if (likes) {
          likes.forEach((like) => likedSet.add(like.comment_id))
        }
      }
    }

    return comments.map((row) => ({
      ...this.toCommentProps(row),
      isLiked: likedSet.has(row.id),
    }))
  }

  /**
   * 댓글 ID로 조회
   */
  async findById(id: string, userId?: string): Promise<CommentWithLikeStatus | null> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (nickname, avatar_url),
        comment_attachments (*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return null

    let isLiked = false
    if (userId) {
      const { data: like } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', id)
        .eq('user_id', userId)
        .single()

      isLiked = !!like
    }

    return {
      ...this.toCommentProps(data as CommentRow),
      isLiked,
    }
  }

  /**
   * 사용자의 댓글 조회
   */
  async findByUserId(userId: string, groupId?: string): Promise<CommentProps[]> {
    const supabase = getSupabaseBrowserClient()
    let query = supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (nickname, avatar_url),
        comment_attachments (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`사용자 댓글 조회 실패: ${error.message}`)
    }

    return (data as CommentRow[])?.map(this.toCommentProps.bind(this)) ?? []
  }

  /**
   * 댓글 생성
   */
  async create(input: CreateCommentInput): Promise<CommentProps> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: input.userId,
        group_id: input.groupId,
        day_number: input.dayNumber,
        content: input.content,
        bible_range: input.bibleRange ?? null,
        is_anonymous: input.isAnonymous ?? false,
        likes_count: 0,
        replies_count: 0,
        is_pinned: false,
      })
      .select(`
        *,
        profiles:user_id (nickname, avatar_url)
      `)
      .single()

    if (error) {
      throw new Error(`댓글 생성 실패: ${error.message}`)
    }

    return this.toCommentProps(data as CommentRow)
  }

  /**
   * 댓글 수정
   */
  async update(id: string, userId: string, input: UpdateCommentInput): Promise<CommentProps> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('comments')
      .update({
        content: input.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        profiles:user_id (nickname, avatar_url),
        comment_attachments (*)
      `)
      .single()

    if (error) {
      throw new Error(`댓글 수정 실패: ${error.message}`)
    }

    return this.toCommentProps(data as CommentRow)
  }

  /**
   * 댓글 삭제
   */
  async delete(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    // 먼저 첨부파일 삭제
    await supabase.from('comment_attachments').delete().eq('comment_id', id)

    // 답글 삭제
    await supabase.from('comment_replies').delete().eq('comment_id', id)

    // 좋아요 삭제
    await supabase.from('comment_likes').delete().eq('comment_id', id)

    // 댓글 삭제
    const { error } = await supabase.from('comments').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      throw new Error(`댓글 삭제 실패: ${error.message}`)
    }
  }

  /**
   * 좋아요 토글
   */
  async toggleLike(commentId: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    // 현재 좋아요 상태 확인
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      // 좋아요 취소
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId)

      // 좋아요 수 감소
      const { error: rpcError } = await supabase.rpc('decrement_comment_likes', { comment_id: commentId })
      if (rpcError) {
        console.error('좋아요 수 감소 실패:', rpcError)
      }

      return false
    } else {
      // 좋아요 추가
      await supabase.from('comment_likes').insert({
        comment_id: commentId,
        user_id: userId,
      })

      // 좋아요 수 증가
      const { error: rpcError } = await supabase.rpc('increment_comment_likes', { comment_id: commentId })
      if (rpcError) {
        console.error('좋아요 수 증가 실패:', rpcError)
      }

      return true
    }
  }

  /**
   * 고정 토글
   */
  async togglePin(commentId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    // 현재 고정 상태 조회
    const { data } = await supabase.from('comments').select('is_pinned').eq('id', commentId).single()

    const newPinned = !(data?.is_pinned ?? false)

    const { error } = await supabase.from('comments').update({ is_pinned: newPinned }).eq('id', commentId)

    if (error) {
      throw new Error(`고정 토글 실패: ${error.message}`)
    }

    return newPinned
  }

  /**
   * 댓글의 답글 조회
   */
  async findReplies(commentId: string): Promise<CommentReplyProps[]> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('comment_replies')
      .select(`
        *,
        profiles:user_id (nickname, avatar_url)
      `)
      .eq('comment_id', commentId)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`답글 조회 실패: ${error.message}`)
    }

    return (data as ReplyRow[])?.map(this.toReplyProps.bind(this)) ?? []
  }

  /**
   * 답글 생성
   */
  async createReply(input: CreateCommentReplyInput): Promise<CommentReplyProps> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('comment_replies')
      .insert({
        comment_id: input.commentId,
        user_id: input.userId,
        content: input.content,
        is_anonymous: input.isAnonymous ?? false,
        mention_user_id: input.mentionUserId ?? null,
        mention_nickname: input.mentionNickname ?? null,
      })
      .select(`
        *,
        profiles:user_id (nickname, avatar_url)
      `)
      .single()

    if (error) {
      throw new Error(`답글 생성 실패: ${error.message}`)
    }

    // 답글 수 증가
    const { error: rpcError } = await supabase.rpc('increment_comment_replies', { comment_id: input.commentId })
    if (rpcError) {
      console.error('답글 수 증가 실패:', rpcError)
    }

    return this.toReplyProps(data as ReplyRow)
  }

  /**
   * 답글 수정
   */
  async updateReply(id: string, userId: string, content: string): Promise<CommentReplyProps> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('comment_replies')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        profiles:user_id (nickname, avatar_url)
      `)
      .single()

    if (error) {
      throw new Error(`답글 수정 실패: ${error.message}`)
    }

    return this.toReplyProps(data as ReplyRow)
  }

  /**
   * 답글 삭제
   */
  async deleteReply(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    // 먼저 comment_id 가져오기
    const { data: reply } = await supabase.from('comment_replies').select('comment_id').eq('id', id).single()

    const { error } = await supabase.from('comment_replies').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      throw new Error(`답글 삭제 실패: ${error.message}`)
    }

    // 답글 수 감소
    if (reply?.comment_id) {
      const { error: rpcError } = await supabase.rpc('decrement_comment_replies', { comment_id: reply.comment_id })
      if (rpcError) {
        console.error('답글 수 감소 실패:', rpcError)
      }
    }
  }

  /**
   * 댓글 수 조회
   */
  async getCount(groupId: string, dayNumber: number): Promise<number> {
    const supabase = getSupabaseBrowserClient()
    const { count, error } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('day_number', dayNumber)

    if (error) {
      throw new Error(`댓글 수 조회 실패: ${error.message}`)
    }

    return count ?? 0
  }

  /**
   * 사용자의 댓글 수 조회
   */
  async getUserCommentCount(userId: string, groupId?: string): Promise<number> {
    const supabase = getSupabaseBrowserClient()
    let query = supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (groupId) {
      query = query.eq('group_id', groupId)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`사용자 댓글 수 조회 실패: ${error.message}`)
    }

    return count ?? 0
  }
}
