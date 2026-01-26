/**
 * Supabase ReadingCheck Repository Implementation
 *
 * 읽음 체크 저장소의 Supabase 구현체.
 * daily_checks (그룹용) 및 church_reading_checks (교회용) 테이블을 사용합니다.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import {
  ReadingCheckProps,
  CreateReadingCheckInput,
  ReadingStreakProps,
  ReadingProgressProps,
  calculateStreak,
  calculateProgress,
} from '@/domain/entities/ReadingCheck'
import {
  IReadingCheckRepository,
  ReadingCheckContext,
  ReadingCheckSearchParams,
} from '@/domain/repositories/IReadingCheckRepository'

interface DailyCheckRow {
  id: string
  user_id: string
  group_id: string
  day_number: number
  is_read: boolean
  checked_at: string | null
  created_at: string
}

interface ChurchReadingCheckRow {
  id: string
  user_id: string
  church_id: string
  day_number: number
  checked_at: string | null
  created_at: string
}

export class SupabaseReadingCheckRepository implements IReadingCheckRepository {
  private getTable(context: ReadingCheckContext): 'daily_checks' | 'church_reading_checks' {
    return context.churchId ? 'church_reading_checks' : 'daily_checks'
  }

  private getContextColumn(context: ReadingCheckContext): 'group_id' | 'church_id' {
    return context.churchId ? 'church_id' : 'group_id'
  }

  private getContextValue(context: ReadingCheckContext): string {
    return (context.churchId || context.groupId) as string
  }

  private toEntity(row: DailyCheckRow | ChurchReadingCheckRow): ReadingCheckProps {
    const isChurch = 'church_id' in row
    // church_reading_checks는 is_read 컬럼이 없고, 레코드 존재 자체가 체크됨을 의미
    const isRead = isChurch ? row.checked_at !== null : (row as DailyCheckRow).is_read
    return {
      id: row.id,
      userId: row.user_id,
      groupId: isChurch ? null : (row as DailyCheckRow).group_id,
      churchId: isChurch ? (row as ChurchReadingCheckRow).church_id : null,
      dayNumber: row.day_number,
      isRead,
      checkedAt: row.checked_at ? new Date(row.checked_at) : null,
      createdAt: new Date(row.created_at),
    }
  }

  async findByUser(params: ReadingCheckSearchParams): Promise<ReadingCheckProps[]> {
    const supabase = getSupabaseBrowserClient()
    const table = this.getTable(params)
    const contextColumn = this.getContextColumn(params)
    const contextValue = this.getContextValue(params)

    let query = supabase
      .from(table)
      .select('*')
      .eq('user_id', params.userId)
      .eq(contextColumn, contextValue)

    // daily_checks(그룹)는 is_read 컬럼 사용, church_reading_checks(교회)는 레코드 존재 = 체크됨
    if (table === 'daily_checks') {
      query = query.eq('is_read', true)
    }

    const { data, error } = await query.order('day_number', { ascending: true })

    if (error) {
      throw new Error(`읽음 체크 조회 실패: ${error.message}`)
    }

    return (data || []).map(row => this.toEntity(row))
  }

  async findByUserAndDay(
    userId: string,
    dayNumber: number,
    context: ReadingCheckContext
  ): Promise<ReadingCheckProps | null> {
    const supabase = getSupabaseBrowserClient()
    const table = this.getTable(context)
    const contextColumn = this.getContextColumn(context)
    const contextValue = this.getContextValue(context)

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .eq(contextColumn, contextValue)
      .eq('day_number', dayNumber)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`읽음 체크 조회 실패: ${error.message}`)
    }

    return data ? this.toEntity(data) : null
  }

  async getCheckedDayNumbers(params: ReadingCheckSearchParams): Promise<number[]> {
    const supabase = getSupabaseBrowserClient()
    const table = this.getTable(params)
    const contextColumn = this.getContextColumn(params)
    const contextValue = this.getContextValue(params)

    let query = supabase
      .from(table)
      .select('day_number')
      .eq('user_id', params.userId)
      .eq(contextColumn, contextValue)

    // daily_checks(그룹)만 is_read 필터 적용
    if (table === 'daily_checks') {
      query = query.eq('is_read', true)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`읽음 체크 조회 실패: ${error.message}`)
    }

    return (data || []).map(row => row.day_number)
  }

  async create(input: CreateReadingCheckInput): Promise<ReadingCheckProps> {
    const supabase = getSupabaseBrowserClient()
    const context: ReadingCheckContext = {
      groupId: input.groupId,
      churchId: input.churchId,
    }
    const table = this.getTable(context)
    const contextColumn = this.getContextColumn(context)
    const contextValue = this.getContextValue(context)

    const now = new Date().toISOString()

    // church_reading_checks는 is_read 컬럼이 없음
    const upsertData: Record<string, unknown> = {
      user_id: input.userId,
      [contextColumn]: contextValue,
      day_number: input.dayNumber,
      checked_at: now,
    }

    // daily_checks(그룹)만 is_read 컬럼 사용
    if (table === 'daily_checks') {
      upsertData.is_read = true
    }

    const { data, error } = await supabase
      .from(table)
      .upsert(upsertData, {
        onConflict: `user_id,${contextColumn},day_number`,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`읽음 체크 생성 실패: ${error.message}`)
    }

    return this.toEntity(data)
  }

  async delete(userId: string, dayNumber: number, context: ReadingCheckContext): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const table = this.getTable(context)
    const contextColumn = this.getContextColumn(context)
    const contextValue = this.getContextValue(context)

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)
      .eq(contextColumn, contextValue)
      .eq('day_number', dayNumber)

    if (error) {
      throw new Error(`읽음 체크 삭제 실패: ${error.message}`)
    }
  }

  async toggle(userId: string, dayNumber: number, context: ReadingCheckContext): Promise<boolean> {
    const existing = await this.findByUserAndDay(userId, dayNumber, context)

    if (existing?.isRead) {
      await this.delete(userId, dayNumber, context)
      return false
    } else {
      await this.create({
        userId,
        dayNumber,
        groupId: context.groupId,
        churchId: context.churchId,
      })
      return true
    }
  }

  async calculateStreak(params: ReadingCheckSearchParams): Promise<ReadingStreakProps> {
    const checkedDays = await this.getCheckedDayNumbers(params)
    return calculateStreak(checkedDays)
  }

  async getProgress(
    params: ReadingCheckSearchParams,
    totalDays: number = 365
  ): Promise<ReadingProgressProps> {
    const checkedDays = await this.getCheckedDayNumbers(params)
    return calculateProgress(checkedDays, totalDays)
  }

  async getMonthlyStats(
    userId: string,
    year: number,
    month: number,
    context: ReadingCheckContext
  ): Promise<{ day: number; checked: boolean }[]> {
    const supabase = getSupabaseBrowserClient()
    const table = this.getTable(context)
    const contextColumn = this.getContextColumn(context)
    const contextValue = this.getContextValue(context)

    // 해당 월의 첫째 날과 마지막 날 계산
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    const daysInMonth = endDate.getDate()

    let query = supabase
      .from(table)
      .select('day_number, checked_at')
      .eq('user_id', userId)
      .eq(contextColumn, contextValue)
      .gte('checked_at', startDate.toISOString())
      .lte('checked_at', endDate.toISOString())

    // daily_checks(그룹)만 is_read 필터 적용
    if (table === 'daily_checks') {
      query = query.eq('is_read', true)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`월별 통계 조회 실패: ${error.message}`)
    }

    const checkedDays = new Set((data || []).map(row => {
      const date = new Date(row.checked_at)
      return date.getDate()
    }))

    const result: { day: number; checked: boolean }[] = []
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({ day, checked: checkedDays.has(day) })
    }

    return result
  }

  async findAllGroupReadings(
    userId: string,
    groupIds: string[]
  ): Promise<{
    groupId: string
    groupName: string
    readings: ReadingCheckProps[]
  }[]> {
    if (groupIds.length === 0) {
      return []
    }

    const supabase = getSupabaseBrowserClient()
    // 그룹 정보와 읽기 체크를 함께 조회
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', groupIds)

    if (groupsError) {
      throw new Error(`그룹 정보 조회 실패: ${groupsError.message}`)
    }

    const { data: checks, error: checksError } = await supabase
      .from('daily_checks')
      .select('*')
      .eq('user_id', userId)
      .in('group_id', groupIds)
      .eq('is_read', true)  // daily_checks는 is_read 컬럼 존재
      .order('checked_at', { ascending: false })

    if (checksError) {
      throw new Error(`읽기 체크 조회 실패: ${checksError.message}`)
    }

    // 그룹별로 데이터 정리
    const groupMap = new Map<string, { name: string; readings: ReadingCheckProps[] }>()

    // 그룹 초기화
    for (const group of groups || []) {
      groupMap.set(group.id, { name: group.name, readings: [] })
    }

    // 읽기 데이터 추가
    for (const check of checks || []) {
      const group = groupMap.get(check.group_id)
      if (group) {
        group.readings.push(this.toEntity(check as DailyCheckRow))
      }
    }

    return Array.from(groupMap.entries()).map(([groupId, data]) => ({
      groupId,
      groupName: data.name,
      readings: data.readings,
    }))
  }
}
