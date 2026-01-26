/**
 * Save Custom Plan Use Case
 *
 * 커스텀 읽기 플랜 저장 및 일정 생성
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import { BibleScope } from '@/types'

export interface SaveCustomPlanInput {
  name: string
  bible_scope: BibleScope
  selected_books: string[]
  reading_days: number[]
  chapters_per_day: number
  start_date: string
  end_date: string
  total_chapters: number
  total_reading_days: number
  total_calendar_days: number
  created_by: string
}

export interface PlanScheduleItem {
  plan_id: string
  day_number: number
  reading_date?: string | null
  book_name: string
  start_chapter: number
  end_chapter: number
  chapter_count: number
  qt_guide_id?: string | null
}

export class SaveCustomPlan {
  /**
   * 커스텀 플랜을 DB에 저장하고 일정을 생성
   * @returns 생성된 플랜 ID 또는 null
   */
  async execute(
    params: SaveCustomPlanInput,
    schedules: Omit<PlanScheduleItem, 'plan_id'>[]
  ): Promise<string | null> {
    const supabase = getSupabaseBrowserClient()

    try {
      // 1. reading_plans 테이블에 플랜 저장
      const { data: plan, error: planError } = await supabase
        .from('reading_plans')
        .insert({
          name: params.name,
          plan_type: 'custom',
          bible_scope: params.bible_scope,
          selected_books: params.selected_books,
          reading_days: params.reading_days,
          chapters_per_day: params.chapters_per_day,
          start_date: params.start_date,
          end_date: params.end_date,
          total_chapters: params.total_chapters,
          total_reading_days: params.total_reading_days,
          total_calendar_days: params.total_calendar_days,
          created_by: params.created_by,
        })
        .select('id')
        .single()

      if (planError) {
        console.error('Failed to save reading plan:', planError)
        return null
      }

      // 2. plan_schedules 테이블에 일정 생성
      const schedulesWithPlanId = schedules.map(s => ({
        ...s,
        plan_id: plan.id,
      }))

      if (schedulesWithPlanId.length > 0) {
        // 대량 삽입을 위해 batch로 처리 (Supabase는 한 번에 1000개까지)
        const batchSize = 500
        for (let i = 0; i < schedulesWithPlanId.length; i += batchSize) {
          const batch = schedulesWithPlanId.slice(i, i + batchSize)
          const { error: scheduleError } = await supabase
            .from('plan_schedules')
            .insert(batch)

          if (scheduleError) {
            console.error('Failed to save plan schedules:', scheduleError)
            // 플랜은 생성되었으므로 ID는 반환
          }
        }
      }

      return plan.id
    } catch (error) {
      console.error('Error saving custom plan:', error)
      return null
    }
  }
}

/**
 * 그룹에 플랜 연결
 */
export class LinkPlanToGroup {
  async execute(groupId: string, planId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase
        .from('groups')
        .update({ plan_id: planId })
        .eq('id', groupId)

      if (error) {
        console.error('Failed to link plan to group:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error linking plan to group:', error)
      return false
    }
  }
}
