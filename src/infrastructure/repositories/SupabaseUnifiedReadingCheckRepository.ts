/**
 * Supabase UnifiedReadingCheck Repository Implementation
 *
 * 통합 읽음 체크 Supabase 구현체.
 * 그룹 읽음 체크와 교회 읽음 체크를 통합 관리.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type {
  IUnifiedReadingCheckRepository,
  UnifiedReadingCheckSearchParams,
} from '@/domain/repositories/IUnifiedReadingCheckRepository'
import type {
  SourceType,
  UnifiedReadingCheckProps,
  CreateUnifiedReadingCheckInput,
  UnifiedReadingStreakProps,
  UnifiedReadingProgressProps,
  UserReadingsBySource,
} from '@/domain/entities/UnifiedReadingCheck'
import {
  calculateUnifiedStreak,
  calculateUnifiedProgress,
} from '@/domain/entities/UnifiedReadingCheck'

// DB Row 타입
interface ReadingCheckRow {
  id: string
  user_id: string
  source_type: SourceType
  source_id: string
  day_number: number
  checked_at: string | null
  created_at: string
}

export class SupabaseUnifiedReadingCheckRepository implements IUnifiedReadingCheckRepository {
  /**
   * Row를 Props로 변환
   */
  private toReadingCheckProps(row: ReadingCheckRow): UnifiedReadingCheckProps {
    return {
      id: row.id,
      userId: row.user_id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      dayNumber: row.day_number,
      checkedAt: row.checked_at ? new Date(row.checked_at) : null,
      createdAt: new Date(row.created_at),
    }
  }

  /**
   * 사용자의 특정 출처 읽음 기록 조회
   */
  async findByUserAndSource(params: UnifiedReadingCheckSearchParams): Promise<UnifiedReadingCheckProps[]> {
    const supabase = getSupabaseBrowserClient()
    const { userId, sourceType, sourceId } = params

    const { data, error } = await supabase
      .from('unified_reading_checks')
      .select('*')
      .eq('user_id', userId)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .order('day_number', { ascending: true })

    if (error) {
      throw new Error(`읽음 기록 조회 실패: ${error.message}`)
    }

    return (data as ReadingCheckRow[] || []).map(row => this.toReadingCheckProps(row))
  }

  /**
   * 체크된 day number 목록 조회
   */
  async getCheckedDayNumbers(params: UnifiedReadingCheckSearchParams): Promise<number[]> {
    const supabase = getSupabaseBrowserClient()
    const { userId, sourceType, sourceId } = params

    const { data, error } = await supabase
      .from('unified_reading_checks')
      .select('day_number')
      .eq('user_id', userId)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .order('day_number', { ascending: true })

    if (error) {
      throw new Error(`체크 목록 조회 실패: ${error.message}`)
    }

    return (data || []).map(row => row.day_number)
  }

  /**
   * 특정 day의 읽음 상태 확인
   */
  async isChecked(
    userId: string,
    sourceType: SourceType,
    sourceId: string,
    dayNumber: number
  ): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('unified_reading_checks')
      .select('id')
      .eq('user_id', userId)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .eq('day_number', dayNumber)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`읽음 상태 확인 실패: ${error.message}`)
    }

    return !!data
  }

  /**
   * 읽음 토글 (체크/해제)
   */
  async toggle(
    userId: string,
    sourceType: SourceType,
    sourceId: string,
    dayNumber: number
  ): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()

    // DB 함수 호출
    const { data, error } = await supabase.rpc('toggle_unified_reading_check', {
      p_user_id: userId,
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_day_number: dayNumber,
    })

    if (error) {
      throw new Error(`읽음 토글 실패: ${error.message}`)
    }

    return data as boolean
  }

  /**
   * 읽음 체크 생성
   */
  async create(input: CreateUnifiedReadingCheckInput): Promise<UnifiedReadingCheckProps> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('unified_reading_checks')
      .insert({
        user_id: input.userId,
        source_type: input.sourceType,
        source_id: input.sourceId,
        day_number: input.dayNumber,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`읽음 체크 생성 실패: ${error.message}`)
    }

    return this.toReadingCheckProps(data as ReadingCheckRow)
  }

  /**
   * 읽음 체크 삭제
   */
  async delete(
    userId: string,
    sourceType: SourceType,
    sourceId: string,
    dayNumber: number
  ): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase
      .from('unified_reading_checks')
      .delete()
      .eq('user_id', userId)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .eq('day_number', dayNumber)

    if (error) {
      throw new Error(`읽음 체크 삭제 실패: ${error.message}`)
    }
  }

  /**
   * 진행률 조회
   */
  async getProgress(
    params: UnifiedReadingCheckSearchParams,
    totalDays: number = 365,
    currentDay: number = 1
  ): Promise<UnifiedReadingProgressProps> {
    const checkedDays = await this.getCheckedDayNumbers(params)
    return calculateUnifiedProgress(checkedDays, totalDays, currentDay)
  }

  /**
   * 스트릭 계산
   */
  async calculateStreak(
    params: UnifiedReadingCheckSearchParams,
    currentDay: number = 1
  ): Promise<UnifiedReadingStreakProps> {
    const checkedDays = await this.getCheckedDayNumbers(params)
    return calculateUnifiedStreak(checkedDays, currentDay)
  }

  /**
   * 사용자의 모든 출처별 읽음 기록 조회 (mypage용)
   */
  async findAllByUser(userId: string): Promise<UserReadingsBySource[]> {
    const supabase = getSupabaseBrowserClient()

    // 모든 읽음 기록 조회
    const { data: readingData, error: readingError } = await supabase
      .from('unified_reading_checks')
      .select('*')
      .eq('user_id', userId)
      .order('source_type', { ascending: true })
      .order('source_id', { ascending: true })
      .order('day_number', { ascending: true })

    if (readingError) {
      throw new Error(`읽음 기록 조회 실패: ${readingError.message}`)
    }

    if (!readingData || readingData.length === 0) {
      return []
    }

    // 출처별로 그룹화
    const groupedBySource = new Map<string, {
      sourceType: SourceType
      sourceId: string
      readings: UnifiedReadingCheckProps[]
    }>()

    for (const row of readingData as ReadingCheckRow[]) {
      const key = `${row.source_type}:${row.source_id}`
      if (!groupedBySource.has(key)) {
        groupedBySource.set(key, {
          sourceType: row.source_type,
          sourceId: row.source_id,
          readings: [],
        })
      }
      groupedBySource.get(key)!.readings.push(this.toReadingCheckProps(row))
    }

    // 출처 이름 조회
    const groupIds = Array.from(groupedBySource.values())
      .filter(g => g.sourceType === 'group')
      .map(g => g.sourceId)
    const churchIds = Array.from(groupedBySource.values())
      .filter(g => g.sourceType === 'church')
      .map(g => g.sourceId)

    const groupNames = new Map<string, string>()
    const churchNames = new Map<string, string>()

    if (groupIds.length > 0) {
      const { data: groups } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds)

      for (const group of groups || []) {
        groupNames.set(group.id, group.name)
      }
    }

    if (churchIds.length > 0) {
      const { data: churches } = await supabase
        .from('churches')
        .select('id, name')
        .in('id', churchIds)

      for (const church of churches || []) {
        churchNames.set(church.id, church.name)
      }
    }

    // 결과 생성
    const result: UserReadingsBySource[] = []
    for (const [, group] of Array.from(groupedBySource.entries())) {
      const sourceName = group.sourceType === 'group'
        ? groupNames.get(group.sourceId) || '그룹'
        : churchNames.get(group.sourceId) || '교회'

      const totalDays = 365 // TODO: 실제 total_days 조회 필요
      const completedDays = group.readings.length
      const progressPercentage = Math.round((completedDays / totalDays) * 100)

      result.push({
        sourceType: group.sourceType,
        sourceId: group.sourceId,
        sourceName,
        readings: group.readings,
        totalDays,
        completedDays,
        progressPercentage,
      })
    }

    return result
  }

  /**
   * 최근 N일간 읽음 기록 조회
   */
  async getRecentReadings(
    params: UnifiedReadingCheckSearchParams,
    days: number
  ): Promise<UnifiedReadingCheckProps[]> {
    const supabase = getSupabaseBrowserClient()
    const { userId, sourceType, sourceId } = params

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('unified_reading_checks')
      .select('*')
      .eq('user_id', userId)
      .eq('source_type', sourceType)
      .eq('source_id', sourceId)
      .gte('checked_at', startDate.toISOString())
      .order('checked_at', { ascending: false })

    if (error) {
      throw new Error(`최근 읽음 기록 조회 실패: ${error.message}`)
    }

    return (data as ReadingCheckRow[] || []).map(row => this.toReadingCheckProps(row))
  }

  /**
   * 총 읽은 일수 조회
   */
  async getTotalReadDays(userId: string, sourceType?: SourceType | null): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    let query = supabase
      .from('unified_reading_checks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (sourceType) {
      query = query.eq('source_type', sourceType)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`읽은 일수 조회 실패: ${error.message}`)
    }

    return count ?? 0
  }
}
