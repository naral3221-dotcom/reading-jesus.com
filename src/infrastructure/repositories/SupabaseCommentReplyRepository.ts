/**
 * Supabase CommentReply Repository Implementation
 *
 * ICommentReplyRepository의 Supabase 구현체.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import { ICommentReplyRepository } from '@/domain/repositories/ICommentReplyRepository'
import { CommentReplyProps, CreateCommentReplyInput } from '@/domain/entities/CommentReply'

interface CommentReplyRow {
  id: string
  comment_id: string
  user_id: string
  content: string
  is_anonymous: boolean
  created_at: string
  profile: { nickname: string; avatar_url: string | null } | { nickname: string; avatar_url: string | null }[] | null
}

export class SupabaseCommentReplyRepository implements ICommentReplyRepository {
  /**
   * 특정 댓글의 답글 목록을 조회합니다.
   */
  async findByCommentId(commentId: string): Promise<CommentReplyProps[]> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('comment_replies')
      .select(`
        *,
        profile:user_id (nickname, avatar_url)
      `)
      .eq('comment_id', commentId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`답글 조회 실패: ${error.message}`)

    return (data || []).map((row: CommentReplyRow) => this.toEntity(row))
  }

  /**
   * 새 답글을 생성합니다.
   */
  async create(input: CreateCommentReplyInput): Promise<CommentReplyProps> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('comment_replies')
      .insert({
        comment_id: input.commentId,
        user_id: input.userId,
        content: input.content.trim(),
        is_anonymous: input.isAnonymous ?? false,
      })
      .select(`
        *,
        profile:user_id (nickname, avatar_url)
      `)
      .single()

    if (error) throw new Error(`답글 생성 실패: ${error.message}`)
    if (!data) throw new Error('답글 생성 후 데이터를 가져올 수 없습니다.')

    return this.toEntity(data as CommentReplyRow)
  }

  /**
   * 답글을 삭제합니다.
   */
  async delete(replyId: string, userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('comment_replies')
      .delete()
      .eq('id', replyId)
      .eq('user_id', userId)

    if (error) throw new Error(`답글 삭제 실패: ${error.message}`)
  }

  /**
   * DB 행을 엔티티 Props로 변환합니다.
   */
  private toEntity(row: CommentReplyRow): CommentReplyProps {
    // profile이 배열로 올 수 있음 (조인 결과)
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile

    return {
      id: row.id,
      commentId: row.comment_id,
      userId: row.user_id,
      content: row.content,
      isAnonymous: row.is_anonymous,
      createdAt: new Date(row.created_at),
      profile: profile
        ? {
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
          }
        : null,
    }
  }
}
