/**
 * Supabase SystemAdmin Repository Implementation
 *
 * 시스템 관리 Supabase 구현체.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type { ISystemAdminRepository } from '@/domain/repositories/ISystemAdminRepository'
import type {
  SystemStatsProps,
  ChurchListItemProps,
  GroupListItemProps,
  UserListItemProps,
  RegionCodeProps,
  CreateChurchInput,
  AdminSearchParams,
  PaginatedResult,
} from '@/domain/entities/SystemAdmin'

// 기본값
const DEFAULT_LIMIT = 10

export class SupabaseSystemAdminRepository implements ISystemAdminRepository {
  // ===== 통계 =====
  async getSystemStats(): Promise<SystemStatsProps> {
    const supabase = getSupabaseBrowserClient()
    const [churches, groups, users, comments, prayers] = await Promise.all([
      supabase.from('churches').select('id, is_active', { count: 'exact', head: true }),
      supabase.from('groups').select('id, is_active', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('prayers').select('id', { count: 'exact', head: true }),
    ])

    // 활성 교회/그룹 카운트
    const [activeChurches, activeGroups] = await Promise.all([
      supabase
        .from('churches')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      supabase.from('groups').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])

    return {
      totalChurches: churches.count ?? 0,
      activeChurches: activeChurches.count ?? 0,
      totalGroups: groups.count ?? 0,
      activeGroups: activeGroups.count ?? 0,
      totalUsers: users.count ?? 0,
      activeUsersLast30Days: 0, // TODO: 30일 내 활성 사용자
      totalComments: comments.count ?? 0,
      totalPrayers: prayers.count ?? 0,
    }
  }

  // ===== 교회 관리 =====
  async getChurches(params: AdminSearchParams): Promise<PaginatedResult<ChurchListItemProps>> {
    const supabase = getSupabaseBrowserClient()
    const { query, page = 1, limit = DEFAULT_LIMIT } = params
    const offset = (page - 1) * limit

    let queryBuilder = supabase
      .from('churches')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,code.ilike.%${query}%`)
    }

    const { data, count, error } = await queryBuilder

    if (error) {
      throw new Error(`교회 목록 조회 실패: ${error.message}`)
    }

    const items: ChurchListItemProps[] = (data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      denomination: row.denomination,
      regionCode: row.region_code,
      address: row.address,
      pastorName: row.pastor_name,
      contactPerson: row.contact_person,
      contactPhone: row.contact_phone,
      writeToken: row.write_token,
      adminToken: row.admin_token,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
    }))

    return {
      items,
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  }

  async createChurch(input: CreateChurchInput): Promise<ChurchListItemProps> {
    const supabase = getSupabaseBrowserClient()
    // 1. 교회 코드 생성 (지역코드 + 랜덤)
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
    const churchCode = `${input.regionCode}${randomPart}`

    // 2. 토큰 생성
    const adminToken = `admin-${crypto.randomUUID()}`
    const writeToken = `write-${crypto.randomUUID()}`

    // 3. 교회 생성
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .insert({
        code: churchCode,
        name: input.name,
        denomination: input.denomination || null,
        region_code: input.regionCode,
        address: input.address || null,
        pastor_name: input.pastorName || null,
        contact_person: input.contactPerson || null,
        contact_phone: input.contactPhone || null,
        admin_token: adminToken,
        write_token: writeToken,
        is_active: true,
      })
      .select()
      .single()

    if (churchError) {
      throw new Error(`교회 생성 실패: ${churchError.message}`)
    }

    // 4. 관리자 계정 생성 (선택적)
    if (input.adminEmail && input.adminPassword) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.adminEmail,
        password: input.adminPassword,
      })

      if (!authError && authData.user) {
        // church_admins 테이블에 추가
        await supabase.from('church_admins').insert({
          id: authData.user.id,
          email: input.adminEmail,
          church_id: church.id,
          is_active: true,
        })
      }
    }

    return {
      id: church.id,
      code: church.code,
      name: church.name,
      denomination: church.denomination,
      regionCode: church.region_code,
      address: church.address,
      pastorName: church.pastor_name,
      contactPerson: church.contact_person,
      contactPhone: church.contact_phone,
      writeToken: church.write_token,
      adminToken: church.admin_token,
      isActive: church.is_active,
      createdAt: new Date(church.created_at),
    }
  }

  async deleteChurch(id: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from('churches').delete().eq('id', id)

    if (error) {
      throw new Error(`교회 삭제 실패: ${error.message}`)
    }
  }

  async toggleChurchActive(id: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    const { data: current } = await supabase
      .from('churches')
      .select('is_active')
      .eq('id', id)
      .single()

    if (!current) {
      throw new Error('교회를 찾을 수 없습니다')
    }

    const newIsActive = !current.is_active

    const { error } = await supabase.from('churches').update({ is_active: newIsActive }).eq('id', id)

    if (error) {
      throw new Error(`상태 변경 실패: ${error.message}`)
    }

    return newIsActive
  }

  async regenerateChurchToken(id: string, tokenType: 'admin' | 'write'): Promise<string> {
    const supabase = getSupabaseBrowserClient()
    const newToken = `${tokenType}-${crypto.randomUUID()}`
    const field = tokenType === 'admin' ? 'admin_token' : 'write_token'

    const { error } = await supabase.from('churches').update({ [field]: newToken }).eq('id', id)

    if (error) {
      throw new Error(`토큰 재생성 실패: ${error.message}`)
    }

    return newToken
  }

  async getRegionCodes(): Promise<RegionCodeProps[]> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from('region_codes').select('code, name').order('name')

    if (error) {
      // 테이블이 없을 수 있으므로 기본값 반환
      return [
        { code: 'SE', name: '서울' },
        { code: 'GG', name: '경기' },
        { code: 'IC', name: '인천' },
        { code: 'CB', name: '충북' },
        { code: 'CN', name: '충남' },
        { code: 'DJ', name: '대전' },
        { code: 'SJ', name: '세종' },
        { code: 'GB', name: '경북' },
        { code: 'GN', name: '경남' },
        { code: 'DG', name: '대구' },
        { code: 'US', name: '울산' },
        { code: 'BS', name: '부산' },
        { code: 'JB', name: '전북' },
        { code: 'JN', name: '전남' },
        { code: 'GJ', name: '광주' },
        { code: 'GW', name: '강원' },
        { code: 'JJ', name: '제주' },
      ]
    }

    return data.map((row) => ({
      code: row.code,
      name: row.name,
    }))
  }

  // ===== 그룹 관리 =====
  async getGroups(params: AdminSearchParams): Promise<PaginatedResult<GroupListItemProps>> {
    const supabase = getSupabaseBrowserClient()
    const { query, page = 1, limit = DEFAULT_LIMIT } = params
    const offset = (page - 1) * limit

    let queryBuilder = supabase
      .from('groups')
      .select(
        `
        *,
        profiles:creator_id(nickname),
        group_members(count)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,invite_code.ilike.%${query}%`)
    }

    const { data, count, error } = await queryBuilder

    if (error) {
      throw new Error(`그룹 목록 조회 실패: ${error.message}`)
    }

    const items: GroupListItemProps[] = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      inviteCode: row.invite_code,
      creatorId: row.creator_id,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      memberCount: Array.isArray(row.group_members) ? row.group_members.length : 0,
      creatorNickname:
        row.profiles && typeof row.profiles === 'object' && 'nickname' in row.profiles
          ? (row.profiles as { nickname: string }).nickname
          : undefined,
    }))

    return {
      items,
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  }

  async deleteGroup(id: string): Promise<void> {
    // Admin API를 통해 그룹 삭제 (RLS 우회 필요)
    const response = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'groups', id }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || '그룹 삭제 실패')
    }
  }

  async toggleGroupActive(id: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    const { data: current } = await supabase
      .from('groups')
      .select('is_active')
      .eq('id', id)
      .single()

    if (!current) {
      throw new Error('그룹을 찾을 수 없습니다')
    }

    const newIsActive = !current.is_active

    const { error } = await supabase.from('groups').update({ is_active: newIsActive }).eq('id', id)

    if (error) {
      throw new Error(`상태 변경 실패: ${error.message}`)
    }

    return newIsActive
  }

  // ===== 사용자 관리 =====
  async getUsers(params: AdminSearchParams): Promise<PaginatedResult<UserListItemProps>> {
    const supabase = getSupabaseBrowserClient()
    const { query, page = 1, limit = DEFAULT_LIMIT } = params
    const offset = (page - 1) * limit

    let queryBuilder = supabase
      .from('profiles')
      .select(
        `
        *,
        churches:church_id(name)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (query) {
      queryBuilder = queryBuilder.ilike('nickname', `%${query}%`)
    }

    const { data, count, error } = await queryBuilder

    if (error) {
      throw new Error(`사용자 목록 조회 실패: ${error.message}`)
    }

    const items: UserListItemProps[] = (data ?? []).map((row) => ({
      id: row.id,
      email: '', // profiles 테이블에는 email이 없음
      nickname: row.nickname,
      avatarUrl: row.avatar_url,
      hasCompletedOnboarding: row.has_completed_onboarding,
      churchId: row.church_id,
      churchName:
        row.churches && typeof row.churches === 'object' && 'name' in row.churches
          ? (row.churches as { name: string }).name
          : undefined,
      createdAt: new Date(row.created_at),
      lastActiveAt: row.updated_at ? new Date(row.updated_at) : null,
    }))

    return {
      items,
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    }
  }

  async deleteUser(id: string): Promise<void> {
    // Admin API를 통해 사용자 삭제 (RLS 우회 필요)
    const response = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'profiles', id }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || '사용자 삭제 실패')
    }
  }

  // ===== 시스템 관리자 =====
  async getSystemAdmins(): Promise<{ id: string; email: string; createdAt: Date }[]> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('system_admins')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      // 테이블이 없을 수 있음
      return []
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      createdAt: new Date(row.created_at),
    }))
  }

  async addSystemAdmin(email: string, password: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    // Auth에 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData.user) {
      throw new Error(`관리자 생성 실패: ${authError?.message || '알 수 없는 오류'}`)
    }

    // system_admins 테이블에 추가
    const { error } = await supabase.from('system_admins').insert({
      id: authData.user.id,
      email,
    })

    if (error) {
      throw new Error(`관리자 정보 저장 실패: ${error.message}`)
    }
  }

  async removeSystemAdmin(id: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from('system_admins').delete().eq('id', id)

    if (error) {
      throw new Error(`관리자 삭제 실패: ${error.message}`)
    }
  }
}
