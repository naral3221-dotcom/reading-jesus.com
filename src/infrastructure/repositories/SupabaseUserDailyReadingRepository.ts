/**
 * SupabaseUserDailyReadingRepository
 *
 * IUserDailyReadingRepository의 Supabase 구현체입니다.
 * 기존 lib/reading-utils.ts의 로직을 Clean Architecture로 이전했습니다.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import { IUserDailyReadingRepository } from '@/domain/repositories/IUserDailyReadingRepository'
import {
  UserDailyReading,
  ReadingPlanType,
  AppliedGroup,
} from '@/domain/entities/UserDailyReading'
import readingPlan from '@/data/reading_plan.json'
import { differenceInDays } from 'date-fns'

// 리딩지저스 기본 플랜 ID
const READING_JESUS_2026_PLAN_ID = '00000000-0000-0000-0000-000000000001'

// 리딩지저스 플랜 데이터
interface ReadingPlanData {
  day: number
  date: string
  book: string
  reading: string
}
const readingPlanData = readingPlan as ReadingPlanData[]

// 그룹 데이터 타입
interface GroupData {
  id: string
  name: string
  start_date: string
  schedule_mode: string
  bible_range_type: string
  plan_id: string | null
  church_id: string | null
}

export class SupabaseUserDailyReadingRepository implements IUserDailyReadingRepository {
  private getClient() {
    return getSupabaseBrowserClient()
  }

  async getUserDailyReadings(userId: string): Promise<UserDailyReading[]> {
    const supabase = this.getClient()

    // 1. 사용자가 속한 모든 그룹 가져오기
    const { data: groupMemberships } = await supabase
      .from('group_members')
      .select(`
        group_id,
        groups (
          id,
          name,
          start_date,
          schedule_mode,
          bible_range_type,
          plan_id,
          church_id
        )
      `)
      .eq('user_id', userId)

    // 2. 플랜별로 그룹핑
    const planGroups = new Map<
      string,
      {
        planId: string
        planName: string
        planType: ReadingPlanType
        dayNumber: number
        bookName: string
        startChapter: number
        endChapter: number
        chapterCount: number
        groups: AppliedGroup[]
      }
    >()

    if (groupMemberships) {
      for (const membership of groupMemberships) {
        // Supabase에서 1:1 관계도 배열로 반환될 수 있음
        const rawGroup = membership.groups
        const groupData = (Array.isArray(rawGroup) ? rawGroup[0] : rawGroup) as GroupData | null
        if (!groupData) continue

        const group = {
          id: groupData.id,
          name: groupData.name,
          startDate: groupData.start_date,
          scheduleMode: groupData.schedule_mode,
          bibleRangeType: groupData.bible_range_type,
          planId: groupData.plan_id,
          churchId: groupData.church_id,
        }

        // 리딩지저스 플랜인지 확인
        const isReadingJesus =
          group.bibleRangeType === 'reading_jesus' ||
          group.planId === READING_JESUS_2026_PLAN_ID ||
          !group.planId

        if (isReadingJesus) {
          const dayNumber = this.calculateTodayDayNumber(
            group.startDate,
            (group.scheduleMode || 'calendar') as 'calendar' | 'day_count'
          )
          const todayPlan = this.findReadingJesusByDay(dayNumber)

          if (todayPlan) {
            const planKey = `reading_jesus_${dayNumber}`

            if (!planGroups.has(planKey)) {
              const { startChapter, endChapter } = this.parseReadingRange(todayPlan.reading)

              planGroups.set(planKey, {
                planId: READING_JESUS_2026_PLAN_ID,
                planName: '리딩지저스 2026',
                planType: 'reading_jesus',
                dayNumber,
                bookName: todayPlan.book,
                startChapter,
                endChapter,
                chapterCount: endChapter - startChapter + 1,
                groups: [],
              })
            }

            planGroups.get(planKey)!.groups.push({
              id: group.id,
              name: group.name,
              type: group.churchId ? 'church' : 'group',
            })
          }
        }
        // TODO: 커스텀 플랜 지원 추가
      }
    }

    // 3. 체크 상태 가져오기 (배치 쿼리로 최적화)
    const allGroupIds = Array.from(planGroups.values()).flatMap((p) => p.groups.map((g) => g.id))
    const allDayNumbers = Array.from(new Set(Array.from(planGroups.values()).map((p) => p.dayNumber)))

    const checksMap = new Map<string, boolean>()
    if (allGroupIds.length > 0 && allDayNumbers.length > 0) {
      const { data: checks } = await supabase
        .from('daily_checks')
        .select('group_id, day_number, is_read')
        .eq('user_id', userId)
        .in('group_id', allGroupIds)
        .in('day_number', allDayNumbers)

      if (checks) {
        for (const check of checks) {
          if (check.is_read) {
            checksMap.set(`${check.group_id}_${check.day_number}`, true)
          }
        }
      }
    }

    // 4. 결과 생성
    const readings: UserDailyReading[] = []

    for (const planData of Array.from(planGroups.values())) {
      // 해당 플랜의 그룹들 중 하나라도 체크했는지 확인
      const isChecked = planData.groups.some((g) =>
        checksMap.get(`${g.id}_${planData.dayNumber}`)
      )

      readings.push(
        UserDailyReading.create({
          planId: planData.planId,
          planName: planData.planName,
          planType: planData.planType,
          dayNumber: planData.dayNumber,
          bookName: planData.bookName,
          startChapter: planData.startChapter,
          endChapter: planData.endChapter,
          chapterCount: planData.chapterCount,
          appliedGroups: planData.groups,
          isChecked,
        })
      )
    }

    return readings
  }

  async togglePlanCheck(
    userId: string,
    planId: string,
    dayNumber: number,
    groupIds: string[],
    isChecked: boolean
  ): Promise<boolean> {
    const supabase = this.getClient()
    const now = new Date().toISOString()

    try {
      if (!isChecked) {
        // 체크 해제: 모든 관련 그룹의 체크 삭제
        await supabase
          .from('daily_checks')
          .delete()
          .eq('user_id', userId)
          .eq('day_number', dayNumber)
          .in('group_id', groupIds)
      } else {
        // 체크: 모든 관련 그룹에 체크 기록
        const records = groupIds.map((groupId) => ({
          user_id: userId,
          group_id: groupId,
          day_number: dayNumber,
          is_read: true,
          checked_at: now,
          plan_id: planId === READING_JESUS_2026_PLAN_ID ? null : planId,
        }))

        await supabase.from('daily_checks').upsert(records, {
          onConflict: 'user_id,group_id,day_number',
        })
      }

      return true
    } catch (error) {
      console.error('togglePlanCheck error:', error)
      return false
    }
  }

  // Helper: 오늘 날짜 문자열 (한국 시간 기준)
  private getTodayDateString(): string {
    const now = new Date()
    // 한국 시간대 오프셋 (UTC+9)
    const koreaOffset = 9 * 60 // 분 단위
    const localOffset = now.getTimezoneOffset() // 분 단위 (UTC - local)
    const koreaTime = new Date(now.getTime() + (koreaOffset + localOffset) * 60 * 1000)

    const year = koreaTime.getFullYear()
    const month = String(koreaTime.getMonth() + 1).padStart(2, '0')
    const day = String(koreaTime.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  // Helper: 날짜로 리딩지저스 Day 찾기
  private findReadingJesusDayByDate(dateStr: string): ReadingPlanData | undefined {
    const exactMatch = readingPlanData.find((p) => p.date === dateStr)
    if (exactMatch) return exactMatch

    const pastPlans = readingPlanData.filter((p) => p.date <= dateStr)
    if (pastPlans.length > 0) {
      return pastPlans[pastPlans.length - 1]
    }

    const futurePlans = readingPlanData.filter((p) => p.date > dateStr)
    return futurePlans[0]
  }

  // Helper: Day 번호로 리딩지저스 일정 찾기
  private findReadingJesusByDay(day: number): ReadingPlanData | undefined {
    return readingPlanData.find((p) => p.day === day)
  }

  // Helper: 그룹의 오늘 Day 번호 계산
  private calculateTodayDayNumber(
    startDate: string,
    scheduleMode: 'calendar' | 'day_count'
  ): number {
    if (scheduleMode === 'calendar') {
      const todayStr = this.getTodayDateString()
      const plan = this.findReadingJesusDayByDate(todayStr)
      return plan?.day || 1
    } else {
      const start = new Date(startDate)
      const today = new Date()
      const dayIndex = differenceInDays(today, start) + 1
      return Math.max(1, Math.min(dayIndex, readingPlanData.length))
    }
  }

  // Helper: 읽기 범위 파싱
  private parseReadingRange(reading: string): { startChapter: number; endChapter: number } {
    const match = reading.match(/(\d+)(?:-(\d+))?장/)

    if (match) {
      const start = parseInt(match[1], 10)
      const end = match[2] ? parseInt(match[2], 10) : start
      return { startChapter: start, endChapter: end }
    }

    return { startChapter: 1, endChapter: 1 }
  }
}
