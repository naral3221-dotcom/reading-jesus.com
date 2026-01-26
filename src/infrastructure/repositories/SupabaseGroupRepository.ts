/**
 * Supabase Group Repository
 *
 * IGroupRepository를 Supabase로 구현합니다.
 */

import { IGroupRepository, GroupSearchParams } from '@/domain/repositories/IGroupRepository'
import {
  Group,
  GroupProps,
  GroupMember,
  GroupMemberProps,
  ReadingPlanType,
  BibleRangeType,
  ScheduleMode,
  GroupRole,
} from '@/domain/entities/Group'
import { getSupabaseBrowserClient } from '../supabase/client'

interface GroupRow {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string | null
  invite_code: string
  created_by: string | null
  created_at: string
  reading_plan_type: ReadingPlanType
  goal: string | null
  rules: string | null
  is_public: boolean
  max_members: number
  allow_anonymous: boolean
  require_daily_reading: boolean
  bible_range_type: BibleRangeType
  bible_range_books: string[] | null
  schedule_mode: ScheduleMode
  church_id?: string | null
  is_church_official?: boolean
}

interface GroupMemberRow {
  id: string
  group_id: string
  user_id: string
  role: GroupRole
  joined_at: string
}

// Supabase join 쿼리 결과 타입 (Supabase는 단일 관계도 배열로 반환할 수 있음)
interface GroupMemberWithGroup {
  group_id: string
  groups: GroupRow | GroupRow[] | null
}

function mapRowToGroupProps(row: GroupRow): GroupProps {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    inviteCode: row.invite_code,
    createdBy: row.created_by,
    createdAt: row.created_at,
    readingPlanType: row.reading_plan_type,
    goal: row.goal,
    rules: row.rules,
    isPublic: row.is_public,
    maxMembers: row.max_members,
    allowAnonymous: row.allow_anonymous,
    requireDailyReading: row.require_daily_reading,
    bibleRangeType: row.bible_range_type,
    bibleRangeBooks: row.bible_range_books,
    scheduleMode: row.schedule_mode,
    churchId: row.church_id,
    isChurchOfficial: row.is_church_official,
  }
}

function mapRowToMemberProps(row: GroupMemberRow): GroupMemberProps {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  }
}

export class SupabaseGroupRepository implements IGroupRepository {
  private supabase = getSupabaseBrowserClient()

  async findById(id: string): Promise<Group | null> {
    const { data, error } = await this.supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return Group.create(mapRowToGroupProps(data as GroupRow))
  }

  async findByInviteCode(inviteCode: string): Promise<Group | null> {
    const { data, error } = await this.supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return Group.create(mapRowToGroupProps(data as GroupRow))
  }

  async findByUserId(userId: string): Promise<Group[]> {
    const { data, error } = await this.supabase
      .from('group_members')
      .select(`
        group_id,
        groups (*)
      `)
      .eq('user_id', userId)

    if (error || !data) {
      return []
    }

    return (data as unknown as GroupMemberWithGroup[])
      .filter((item) => item.groups !== null)
      .map((item) => {
        // Supabase는 단일 관계도 배열로 반환할 수 있음
        const groupData = Array.isArray(item.groups) ? item.groups[0] : item.groups
        return Group.create(mapRowToGroupProps(groupData as GroupRow))
      })
  }

  async findByChurchId(churchId: string): Promise<Group[]> {
    const { data, error } = await this.supabase
      .from('groups')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map((row: GroupRow) => Group.create(mapRowToGroupProps(row)))
  }

  async search(params: GroupSearchParams): Promise<Group[]> {
    let query = this.supabase.from('groups').select('*')

    if (params.churchId) {
      query = query.eq('church_id', params.churchId)
    }

    if (params.isPublic !== undefined) {
      query = query.eq('is_public', params.isPublic)
    }

    if (params.query) {
      query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`)
    }

    if (params.limit) {
      query = query.limit(params.limit)
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error || !data) {
      return []
    }

    return data.map((row: GroupRow) => Group.create(mapRowToGroupProps(row)))
  }

  async save(group: Group): Promise<Group> {
    const dto = group.toDTO()

    const row = {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      start_date: dto.startDate,
      end_date: dto.endDate,
      invite_code: dto.inviteCode,
      created_by: dto.createdBy,
      reading_plan_type: dto.readingPlanType,
      goal: dto.goal,
      rules: dto.rules,
      is_public: dto.isPublic,
      max_members: dto.maxMembers,
      allow_anonymous: dto.allowAnonymous,
      require_daily_reading: dto.requireDailyReading,
      bible_range_type: dto.bibleRangeType,
      bible_range_books: dto.bibleRangeBooks,
      schedule_mode: dto.scheduleMode,
      church_id: dto.churchId,
      is_church_official: dto.isChurchOfficial,
    }

    const { data, error } = await this.supabase
      .from('groups')
      .upsert(row)
      .select()
      .single()

    if (error) {
      throw new Error(`그룹 저장 실패: ${error.message}`)
    }

    return Group.create(mapRowToGroupProps(data as GroupRow))
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('groups').delete().eq('id', id)

    if (error) {
      throw new Error(`그룹 삭제 실패: ${error.message}`)
    }
  }

  async findMembers(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await this.supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true })

    if (error || !data) {
      return []
    }

    return data.map((row: GroupMemberRow) => GroupMember.create(mapRowToMemberProps(row)))
  }

  async getMemberCount(groupId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)

    if (error) {
      return 0
    }

    return count || 0
  }

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    return !error && !!data
  }

  async addMember(
    groupId: string,
    userId: string,
    role: 'admin' | 'member' = 'member'
  ): Promise<GroupMember> {
    const { data, error } = await this.supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`멤버 추가 실패: ${error.message}`)
    }

    return GroupMember.create(mapRowToMemberProps(data as GroupMemberRow))
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`멤버 제거 실패: ${error.message}`)
    }
  }

  async updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> {
    const { error } = await this.supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`역할 변경 실패: ${error.message}`)
    }
  }
}
