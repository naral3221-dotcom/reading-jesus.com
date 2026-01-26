/**
 * Supabase Church Repository Implementation
 *
 * IChurchRepository 인터페이스의 Supabase 구현체.
 */

import { Church, ChurchProps } from '@/domain/entities/Church'
import { IChurchRepository, ChurchSearchParams } from '@/domain/repositories/IChurchRepository'
import { getSupabaseBrowserClient } from '../supabase/client'

interface ChurchRow {
  id: string
  code: string
  name: string
  denomination: string | null
  address: string | null
  region_code: string | null
  write_token: string | null
  admin_token: string | null
  is_active: boolean
  allow_anonymous: boolean
  schedule_year: number | null
  schedule_start_date: string | null
  created_at: string
  updated_at: string
}

function mapRowToChurchProps(row: ChurchRow): ChurchProps {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    denomination: row.denomination,
    address: row.address,
    regionCode: row.region_code,
    writeToken: row.write_token,
    adminToken: row.admin_token,
    isActive: row.is_active,
    allowAnonymous: row.allow_anonymous,
    scheduleYear: row.schedule_year,
    scheduleStartDate: row.schedule_start_date ? new Date(row.schedule_start_date) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function mapChurchToRow(church: Church): Partial<ChurchRow> {
  return {
    id: church.id,
    code: church.code,
    name: church.name,
    denomination: church.denomination,
    address: church.address,
    region_code: church.regionCode,
    write_token: church.writeToken,
    admin_token: church.adminToken,
    is_active: church.isActive,
    allow_anonymous: church.allowAnonymous,
    schedule_year: church.scheduleYear,
    schedule_start_date: church.scheduleStartDate?.toISOString() ?? null,
  }
}

export class SupabaseChurchRepository implements IChurchRepository {
  async findById(id: string): Promise<Church | null> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return Church.fromDatabase(mapRowToChurchProps(data as ChurchRow))
  }

  async findByCode(code: string): Promise<Church | null> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !data) {
      return null
    }

    return Church.fromDatabase(mapRowToChurchProps(data as ChurchRow))
  }

  async search(params: ChurchSearchParams): Promise<Church[]> {
    const supabase = getSupabaseBrowserClient()
    let query = supabase
      .from('churches')
      .select('*')
      .eq('is_active', true)

    if (params.query) {
      query = query.or(`name.ilike.%${params.query}%,code.ilike.%${params.query}%`)
    }

    if (params.regionCode) {
      query = query.eq('region_code', params.regionCode)
    }

    if (params.denomination) {
      query = query.eq('denomination', params.denomination)
    }

    if (params.limit) {
      query = query.limit(params.limit)
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error || !data) {
      return []
    }

    return data.map((row: ChurchRow) => Church.fromDatabase(mapRowToChurchProps(row)))
  }

  async save(church: Church): Promise<Church> {
    const supabase = getSupabaseBrowserClient()
    const row = mapChurchToRow(church)

    const { data, error } = await supabase
      .from('churches')
      .upsert(row)
      .select()
      .single()

    if (error) {
      throw new Error(`교회 저장 실패: ${error.message}`)
    }

    return Church.fromDatabase(mapRowToChurchProps(data as ChurchRow))
  }

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('churches')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`교회 삭제 실패: ${error.message}`)
    }
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('churches')
      .update({ is_active: isActive })
      .eq('id', id)

    if (error) {
      throw new Error(`교회 활성화 상태 변경 실패: ${error.message}`)
    }
  }

  async updateAnonymousAllowed(id: string, allowAnonymous: boolean): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('churches')
      .update({ allow_anonymous: allowAnonymous })
      .eq('id', id)

    if (error) {
      throw new Error(`교회 익명 허용 설정 변경 실패: ${error.message}`)
    }
  }

  async isCodeAvailable(code: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from('churches')
      .select('id')
      .eq('code', code)
      .single()

    return !data
  }

  async getMemberCount(churchId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient()
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('church_id', churchId)

    if (error) {
      return 0
    }

    return count || 0
  }

  async findMembers(
    churchId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<
    Array<{
      userId: string
      displayName: string | null
      avatarUrl: string | null
      joinedAt: Date
    }>
  > {
    const supabase = getSupabaseBrowserClient()
    let query = supabase
      .from('profiles')
      .select('id, display_name, avatar_url, church_joined_at')
      .eq('church_id', churchId)
      .order('church_joined_at', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      )
    }

    const { data, error } = await query

    if (error || !data) {
      return []
    }

    return data.map(
      (row: {
        id: string
        display_name: string | null
        avatar_url: string | null
        church_joined_at: string | null
      }) => ({
        userId: row.id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        joinedAt: row.church_joined_at
          ? new Date(row.church_joined_at)
          : new Date(),
      })
    )
  }

  async removeMember(churchId: string, userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('profiles')
      .update({ church_id: null, church_joined_at: null })
      .eq('id', userId)
      .eq('church_id', churchId)

    if (error) {
      throw new Error(`교회 탈퇴 실패: ${error.message}`)
    }
  }

  async isMember(churchId: string, userId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .eq('church_id', churchId)
      .single()

    return !error && !!data
  }

  async findPopular(limit: number = 10): Promise<Array<{
    id: string
    code: string
    name: string
    denomination: string | null
    memberCount: number
  }>> {
    const supabase = getSupabaseBrowserClient()

    // 활성화된 교회 목록 조회 (멤버 수 기준 정렬)
    const { data: churches, error } = await supabase
      .from('churches')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !churches) {
      return []
    }

    // 각 교회의 멤버 수 조회
    const result = await Promise.all(
      churches.map(async (row: ChurchRow) => {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('church_id', row.id)

        return {
          id: row.id,
          code: row.code,
          name: row.name,
          denomination: row.denomination,
          memberCount: count || 0,
        }
      })
    )

    // 멤버 수 기준으로 정렬
    return result.sort((a, b) => b.memberCount - a.memberCount)
  }
}
