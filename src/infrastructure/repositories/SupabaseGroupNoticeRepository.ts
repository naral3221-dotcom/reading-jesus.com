/**
 * Supabase Group Notice Repository Implementation
 *
 * IGroupNoticeRepository 인터페이스의 Supabase 구현체.
 */

import { GroupNotice, GroupNoticeProps, CreateGroupNoticeInput } from '@/domain/entities/GroupNotice'
import { IGroupNoticeRepository, GroupNoticeSearchParams } from '@/domain/repositories/IGroupNoticeRepository'
import { getSupabaseBrowserClient } from '../supabase/client'

interface GroupNoticeRow {
  id: string
  group_id: string
  author_id: string
  title: string
  content: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

interface ProfileRow {
  nickname: string
  avatar_url: string | null
}

function mapRowToNoticeProps(row: GroupNoticeRow, author?: ProfileRow | null): GroupNoticeProps {
  return {
    id: row.id,
    groupId: row.group_id,
    authorId: row.author_id,
    title: row.title,
    content: row.content,
    isPinned: row.is_pinned,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    author: author
      ? { nickname: author.nickname, avatarUrl: author.avatar_url }
      : { nickname: '알 수 없음', avatarUrl: null },
  }
}

export class SupabaseGroupNoticeRepository implements IGroupNoticeRepository {
  private supabase = getSupabaseBrowserClient()

  async findById(id: string): Promise<GroupNotice | null> {
    const { data, error } = await this.supabase
      .from('group_notices')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    // Author 정보 조회
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', data.author_id)
      .single()

    return GroupNotice.create(mapRowToNoticeProps(data as GroupNoticeRow, profile as ProfileRow | null))
  }

  async findByGroupId(params: GroupNoticeSearchParams): Promise<GroupNotice[]> {
    let query = this.supabase
      .from('group_notices')
      .select('*')
      .eq('group_id', params.groupId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (params.limit) {
      query = query.limit(params.limit)
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error || !data) {
      return []
    }

    // 각 공지의 Author 정보를 병렬로 조회
    const noticesWithAuthor = await Promise.all(
      data.map(async (row) => {
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', row.author_id)
          .single()

        return GroupNotice.create(mapRowToNoticeProps(row as GroupNoticeRow, profile as ProfileRow | null))
      })
    )

    return noticesWithAuthor
  }

  async save(input: GroupNotice | CreateGroupNoticeInput): Promise<GroupNotice> {
    if (input instanceof GroupNotice) {
      // 기존 공지 수정
      const { data, error } = await this.supabase
        .from('group_notices')
        .update({
          title: input.title,
          content: input.content,
          is_pinned: input.isPinned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()

      if (error || !data) {
        throw new Error('공지사항 수정에 실패했습니다')
      }

      // Author 정보 조회
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', data.author_id)
        .single()

      return GroupNotice.create(mapRowToNoticeProps(data as GroupNoticeRow, profile as ProfileRow | null))
    } else {
      // 새 공지 생성
      const { data, error } = await this.supabase
        .from('group_notices')
        .insert({
          group_id: input.groupId,
          author_id: input.authorId,
          title: input.title,
          content: input.content,
          is_pinned: input.isPinned ?? false,
        })
        .select()
        .single()

      if (error || !data) {
        throw new Error('공지사항 생성에 실패했습니다')
      }

      // Author 정보 조회
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', data.author_id)
        .single()

      return GroupNotice.create(mapRowToNoticeProps(data as GroupNoticeRow, profile as ProfileRow | null))
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('group_notices')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('공지사항 삭제에 실패했습니다')
    }
  }

  async togglePin(id: string): Promise<GroupNotice> {
    // 현재 상태 조회
    const notice = await this.findById(id)
    if (!notice) {
      throw new Error('공지사항을 찾을 수 없습니다')
    }

    const { data, error } = await this.supabase
      .from('group_notices')
      .update({
        is_pinned: !notice.isPinned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw new Error('고정 상태 변경에 실패했습니다')
    }

    // Author 정보 조회
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', data.author_id)
      .single()

    return GroupNotice.create(mapRowToNoticeProps(data as GroupNoticeRow, profile as ProfileRow | null))
  }
}
