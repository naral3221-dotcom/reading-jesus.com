/**
 * Supabase Church Notice Repository Implementation
 *
 * IChurchNoticeRepository 인터페이스의 Supabase 구현체.
 */

import { ChurchNotice, ChurchNoticeProps, CreateChurchNoticeInput } from '@/domain/entities/ChurchNotice'
import { IChurchNoticeRepository, ChurchNoticeSearchParams } from '@/domain/repositories/IChurchNoticeRepository'
import { getSupabaseBrowserClient } from '../supabase/client'

interface ChurchNoticeRow {
  id: string
  church_id: string
  title: string
  content: string
  is_pinned: boolean
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
}

function mapRowToNoticeProps(row: ChurchNoticeRow): ChurchNoticeProps {
  return {
    id: row.id,
    churchId: row.church_id,
    title: row.title,
    content: row.content,
    isPinned: row.is_pinned,
    isActive: row.is_active,
    startsAt: row.starts_at ? new Date(row.starts_at) : null,
    endsAt: row.ends_at ? new Date(row.ends_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function mapNoticeToRow(notice: ChurchNotice): Partial<ChurchNoticeRow> {
  return {
    id: notice.id,
    church_id: notice.churchId,
    title: notice.title,
    content: notice.content,
    is_pinned: notice.isPinned,
    is_active: notice.isActive,
    starts_at: notice.startsAt?.toISOString() ?? null,
    ends_at: notice.endsAt?.toISOString() ?? null,
  }
}

export class SupabaseChurchNoticeRepository implements IChurchNoticeRepository {
  private supabase = getSupabaseBrowserClient()

  async findById(id: string): Promise<ChurchNotice | null> {
    const { data, error } = await this.supabase
      .from('church_notices')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return ChurchNotice.create(mapRowToNoticeProps(data as ChurchNoticeRow))
  }

  async findByChurchId(params: ChurchNoticeSearchParams): Promise<ChurchNotice[]> {
    let query = this.supabase
      .from('church_notices')
      .select('*')
      .eq('church_id', params.churchId)

    if (params.activeOnly) {
      query = query.eq('is_active', true)
    }

    query = query
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

    return data.map((row) => ChurchNotice.create(mapRowToNoticeProps(row as ChurchNoticeRow)))
  }

  async findActiveByChurchId(churchId: string): Promise<ChurchNotice[]> {
    const now = new Date().toISOString()

    const { data, error } = await this.supabase
      .from('church_notices')
      .select('*')
      .eq('church_id', churchId)
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((row) => ChurchNotice.create(mapRowToNoticeProps(row as ChurchNoticeRow)))
  }

  async save(input: ChurchNotice | CreateChurchNoticeInput): Promise<ChurchNotice> {
    if (input instanceof ChurchNotice) {
      // 기존 공지 수정
      const row = mapNoticeToRow(input)
      const { data, error } = await this.supabase
        .from('church_notices')
        .update({
          title: row.title,
          content: row.content,
          is_pinned: row.is_pinned,
          is_active: row.is_active,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .select()
        .single()

      if (error || !data) {
        throw new Error('공지사항 수정에 실패했습니다')
      }

      return ChurchNotice.create(mapRowToNoticeProps(data as ChurchNoticeRow))
    } else {
      // 새 공지 생성
      const { data, error } = await this.supabase
        .from('church_notices')
        .insert({
          church_id: input.churchId,
          title: input.title,
          content: input.content,
          is_pinned: input.isPinned ?? false,
          is_active: input.isActive ?? true,
          starts_at: input.startsAt?.toISOString() ?? null,
          ends_at: input.endsAt?.toISOString() ?? null,
        })
        .select()
        .single()

      if (error || !data) {
        throw new Error('공지사항 생성에 실패했습니다')
      }

      return ChurchNotice.create(mapRowToNoticeProps(data as ChurchNoticeRow))
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('church_notices')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('공지사항 삭제에 실패했습니다')
    }
  }

  async togglePin(id: string): Promise<ChurchNotice> {
    // 현재 상태 조회
    const notice = await this.findById(id)
    if (!notice) {
      throw new Error('공지사항을 찾을 수 없습니다')
    }

    const { data, error } = await this.supabase
      .from('church_notices')
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

    return ChurchNotice.create(mapRowToNoticeProps(data as ChurchNoticeRow))
  }

  async toggleActive(id: string): Promise<ChurchNotice> {
    // 현재 상태 조회
    const notice = await this.findById(id)
    if (!notice) {
      throw new Error('공지사항을 찾을 수 없습니다')
    }

    const { data, error } = await this.supabase
      .from('church_notices')
      .update({
        is_active: !notice.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw new Error('활성 상태 변경에 실패했습니다')
    }

    return ChurchNotice.create(mapRowToNoticeProps(data as ChurchNoticeRow))
  }
}
