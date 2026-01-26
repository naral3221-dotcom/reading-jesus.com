/**
 * Supabase Prayer Repository Implementation
 *
 * IPrayerRepository의 Supabase 구현체.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import { IPrayerRepository, PrayerSearchParams } from '@/domain/repositories/IPrayerRepository'
import { PrayerProps, CreatePrayerInput, UpdatePrayerInput } from '@/domain/entities/Prayer'

interface PrayerRow {
  id: string
  group_id: string
  user_id: string
  content: string
  is_anonymous: boolean
  is_answered: boolean
  answered_at: string | null
  support_count: number
  created_at: string
  updated_at: string
  profile: { nickname: string; avatar_url: string | null } | { nickname: string; avatar_url: string | null }[] | null
}

export class SupabasePrayerRepository implements IPrayerRepository {
  /**
   * 그룹의 기도제목 목록을 조회합니다.
   */
  async findByGroupId(params: PrayerSearchParams): Promise<PrayerProps[]> {
    const supabase = getSupabaseBrowserClient()
    // 기도제목 조회
    const { data, error } = await supabase
      .from('prayer_requests')
      .select(`
        *,
        profile:user_id (nickname, avatar_url)
      `)
      .eq('group_id', params.groupId)
      .order('is_answered', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw new Error(`기도제목 조회 실패: ${error.message}`)

    // 현재 사용자의 함께 기도 상태 확인
    let supportedIds: Set<string> = new Set()
    if (params.userId) {
      const { data: supports } = await supabase
        .from('prayer_support')
        .select('prayer_id')
        .eq('user_id', params.userId)

      if (supports) {
        supportedIds = new Set(supports.map((s) => s.prayer_id))
      }
    }

    return (data || []).map((row: PrayerRow) => ({
      ...this.toEntity(row),
      isSupported: supportedIds.has(row.id),
    }))
  }

  /**
   * ID로 기도제목을 조회합니다.
   */
  async findById(id: string): Promise<PrayerProps | null> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('prayer_requests')
      .select(`
        *,
        profile:user_id (nickname, avatar_url)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`기도제목 조회 실패: ${error.message}`)
    }

    return data ? this.toEntity(data as PrayerRow) : null
  }

  /**
   * 새 기도제목을 생성합니다.
   */
  async create(input: CreatePrayerInput): Promise<PrayerProps> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('prayer_requests')
      .insert({
        group_id: input.groupId,
        user_id: input.userId,
        content: input.content.trim(),
        is_anonymous: input.isAnonymous ?? false,
      })
      .select(`
        *,
        profile:user_id (nickname, avatar_url)
      `)
      .single()

    if (error) throw new Error(`기도제목 생성 실패: ${error.message}`)
    if (!data) throw new Error('기도제목 생성 후 데이터를 가져올 수 없습니다.')

    return this.toEntity(data as PrayerRow)
  }

  /**
   * 기도제목을 수정합니다.
   */
  async update(id: string, input: UpdatePrayerInput): Promise<PrayerProps> {
    const supabase = getSupabaseBrowserClient()
    const updateData: Record<string, unknown> = {}

    if (input.content !== undefined) {
      updateData.content = input.content.trim()
    }
    if (input.isAnonymous !== undefined) {
      updateData.is_anonymous = input.isAnonymous
    }

    const { data, error } = await supabase
      .from('prayer_requests')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        profile:user_id (nickname, avatar_url)
      `)
      .single()

    if (error) throw new Error(`기도제목 수정 실패: ${error.message}`)
    if (!data) throw new Error('기도제목 수정 후 데이터를 가져올 수 없습니다.')

    return this.toEntity(data as PrayerRow)
  }

  /**
   * 기도제목을 삭제합니다.
   */
  async delete(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('prayer_requests')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(`기도제목 삭제 실패: ${error.message}`)
  }

  /**
   * 기도제목을 응답됨으로 표시합니다.
   */
  async markAsAnswered(id: string, userId: string): Promise<PrayerProps> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('prayer_requests')
      .update({
        is_answered: true,
        answered_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        profile:user_id (nickname, avatar_url)
      `)
      .single()

    if (error) throw new Error(`응답 표시 실패: ${error.message}`)
    if (!data) throw new Error('응답 표시 후 데이터를 가져올 수 없습니다.')

    return this.toEntity(data as PrayerRow)
  }

  /**
   * 함께 기도를 토글합니다.
   */
  async toggleSupport(prayerId: string, userId: string): Promise<{ supported: boolean }> {
    const supabase = getSupabaseBrowserClient()
    // 현재 상태 확인
    const { data: existing } = await supabase
      .from('prayer_support')
      .select('id')
      .eq('prayer_id', prayerId)
      .eq('user_id', userId)
      .single()

    if (existing) {
      // 취소
      const { error } = await supabase
        .from('prayer_support')
        .delete()
        .eq('prayer_id', prayerId)
        .eq('user_id', userId)

      if (error) throw new Error(`함께 기도 취소 실패: ${error.message}`)
      return { supported: false }
    } else {
      // 추가
      const { error } = await supabase
        .from('prayer_support')
        .insert({
          prayer_id: prayerId,
          user_id: userId,
        })

      if (error) throw new Error(`함께 기도 추가 실패: ${error.message}`)
      return { supported: true }
    }
  }

  /**
   * 사용자가 함께 기도한 목록을 조회합니다.
   */
  async getSupportedPrayerIds(userId: string): Promise<string[]> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('prayer_support')
      .select('prayer_id')
      .eq('user_id', userId)

    if (error) throw new Error(`함께 기도 목록 조회 실패: ${error.message}`)

    return (data || []).map((s) => s.prayer_id)
  }

  /**
   * DB 행을 엔티티 Props로 변환합니다.
   */
  private toEntity(row: PrayerRow): PrayerProps {
    // profile이 배열로 올 수 있음 (조인 결과)
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile

    return {
      id: row.id,
      groupId: row.group_id,
      userId: row.user_id,
      content: row.content,
      isAnonymous: row.is_anonymous,
      isAnswered: row.is_answered,
      answeredAt: row.answered_at ? new Date(row.answered_at) : null,
      supportCount: row.support_count,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      profile: profile
        ? {
            nickname: profile.nickname,
            avatar_url: profile.avatar_url,
          }
        : null,
    }
  }
}
