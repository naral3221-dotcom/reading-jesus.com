/**
 * Supabase PersonalProject Repository Implementation
 *
 * 개인 성경 읽기 프로젝트 Supabase 구현체.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type {
  IPersonalProjectRepository,
  PersonalProjectSearchParams,
} from '@/domain/repositories/IPersonalProjectRepository'
import type {
  PersonalProjectProps,
  CreatePersonalProjectInput,
  UpdatePersonalProjectInput,
  PersonalProjectWithStats,
  PersonalReadingPlanType,
} from '@/domain/entities/PersonalProject'
import {
  getPlanTotalDays,
  calculateCurrentDay,
  calculatePersonalStreak,
} from '@/domain/entities/PersonalProject'

// DB Row 타입
interface ProjectRow {
  id: string
  user_id: string
  name: string
  reading_plan_type: string
  start_date: string
  is_active: boolean
  created_at: string
  updated_at: string | null
}

interface DailyCheckRow {
  day_number: number
  is_read: boolean
  checked_at: string | null
}

export class SupabasePersonalProjectRepository implements IPersonalProjectRepository {
  /**
   * 프로젝트 Row를 Props로 변환
   */
  private toProjectProps(row: ProjectRow): PersonalProjectProps {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      readingPlanType: row.reading_plan_type as PersonalReadingPlanType,
      startDate: new Date(row.start_date),
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
    }
  }

  /**
   * 프로젝트에 통계 추가
   */
  private async addStats(project: PersonalProjectProps, checkedDays: number[]): Promise<PersonalProjectWithStats> {
    const totalDays = getPlanTotalDays(project.readingPlanType)
    const currentDay = calculateCurrentDay(project.startDate, project.readingPlanType)
    const completedDays = checkedDays.length
    const progressPercentage = Math.round((completedDays / totalDays) * 100)
    const currentStreak = calculatePersonalStreak(checkedDays, currentDay)

    return {
      ...project,
      completedDays,
      totalDays,
      progressPercentage,
      currentDay,
      currentStreak,
    }
  }

  /**
   * 사용자의 프로젝트 목록 조회
   */
  async findByUserId(params: PersonalProjectSearchParams): Promise<PersonalProjectWithStats[]> {
    const supabase = getSupabaseBrowserClient()
    const { userId, activeOnly = true } = params

    let query = supabase
      .from('personal_reading_projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`프로젝트 조회 실패: ${error.message}`)
    }

    if (!data || data.length === 0) return []

    // 각 프로젝트에 통계 추가
    const projectsWithStats = await Promise.all(
      (data as ProjectRow[]).map(async (row) => {
        const props = this.toProjectProps(row)
        const checkedDays = await this.getCheckedDays(row.id)
        return this.addStats(props, checkedDays)
      })
    )

    return projectsWithStats
  }

  /**
   * 프로젝트 ID로 조회
   */
  async findById(id: string, userId: string): Promise<PersonalProjectWithStats | null> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('personal_reading_projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !data) return null

    const props = this.toProjectProps(data as ProjectRow)
    const checkedDays = await this.getCheckedDays(id)
    return this.addStats(props, checkedDays)
  }

  /**
   * 프로젝트 생성
   */
  async create(input: CreatePersonalProjectInput): Promise<PersonalProjectProps> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('personal_reading_projects')
      .insert({
        user_id: input.userId,
        name: input.name,
        reading_plan_type: input.readingPlanType,
        start_date: input.startDate.toISOString().split('T')[0],
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`프로젝트 생성 실패: ${error.message}`)
    }

    return this.toProjectProps(data as ProjectRow)
  }

  /**
   * 프로젝트 수정
   */
  async update(id: string, userId: string, input: UpdatePersonalProjectInput): Promise<PersonalProjectProps> {
    const supabase = getSupabaseBrowserClient()
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.name !== undefined) {
      updateData.name = input.name
    }
    if (input.isActive !== undefined) {
      updateData.is_active = input.isActive
    }

    const { data, error } = await supabase
      .from('personal_reading_projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`프로젝트 수정 실패: ${error.message}`)
    }

    return this.toProjectProps(data as ProjectRow)
  }

  /**
   * 프로젝트 삭제
   */
  async delete(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    // 먼저 체크 기록 삭제
    await supabase.from('personal_daily_checks').delete().eq('project_id', id)

    // 프로젝트 삭제
    const { error } = await supabase
      .from('personal_reading_projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`프로젝트 삭제 실패: ${error.message}`)
    }
  }

  /**
   * 일일 체크 조회
   */
  async getCheckedDays(projectId: string): Promise<number[]> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('personal_daily_checks')
      .select('day_number')
      .eq('project_id', projectId)
      .eq('is_read', true)

    if (error) {
      throw new Error(`체크 조회 실패: ${error.message}`)
    }

    return (data as DailyCheckRow[])?.map((row) => row.day_number) ?? []
  }

  /**
   * 일일 체크 토글
   */
  async toggleDailyCheck(projectId: string, dayNumber: number): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    // 현재 체크 상태 확인
    const { data: existing } = await supabase
      .from('personal_daily_checks')
      .select('is_read')
      .eq('project_id', projectId)
      .eq('day_number', dayNumber)
      .single()

    if (existing) {
      // 토글
      const newIsRead = !existing.is_read
      await supabase
        .from('personal_daily_checks')
        .update({
          is_read: newIsRead,
          checked_at: newIsRead ? new Date().toISOString() : null,
        })
        .eq('project_id', projectId)
        .eq('day_number', dayNumber)

      return newIsRead
    } else {
      // 새로 생성
      await supabase.from('personal_daily_checks').insert({
        project_id: projectId,
        day_number: dayNumber,
        is_read: true,
        checked_at: new Date().toISOString(),
      })

      return true
    }
  }

  /**
   * 프로젝트 통계 계산
   */
  async getStats(projectId: string): Promise<{
    completedDays: number
    totalDays: number
    progressPercentage: number
    currentDay: number
    currentStreak: number
  }> {
    const supabase = getSupabaseBrowserClient()
    // 프로젝트 정보 조회
    const { data: project } = await supabase
      .from('personal_reading_projects')
      .select('reading_plan_type, start_date')
      .eq('id', projectId)
      .single()

    if (!project) {
      throw new Error('프로젝트를 찾을 수 없습니다')
    }

    const planType = project.reading_plan_type as PersonalReadingPlanType
    const startDate = new Date(project.start_date)

    // 체크된 날짜 조회
    const checkedDays = await this.getCheckedDays(projectId)

    const totalDays = getPlanTotalDays(planType)
    const currentDay = calculateCurrentDay(startDate, planType)
    const completedDays = checkedDays.length
    const progressPercentage = Math.round((completedDays / totalDays) * 100)
    const currentStreak = calculatePersonalStreak(checkedDays, currentDay)

    return {
      completedDays,
      totalDays,
      progressPercentage,
      currentDay,
      currentStreak,
    }
  }
}
