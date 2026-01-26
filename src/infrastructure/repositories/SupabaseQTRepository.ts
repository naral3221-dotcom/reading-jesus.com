/**
 * Supabase QT Repository Implementation
 *
 * IQTRepository 인터페이스의 Supabase 구현체.
 * QT 데이터는 로컬 JSON 파일에서 로드합니다.
 */

import { QT, QTProps, QTVerse, QTMeditation } from '@/domain/entities/QT'
import { IQTRepository } from '@/domain/repositories/IQTRepository'

// QT JSON 데이터 타입 (기존 qt-content.ts 기반)
interface QTJsonData {
  month: number
  year: number
  day: number
  dayOfWeek: string
  date: string
  title: string | null
  bibleRange: string | null
  verseReference: string | null
  verses: Array<{ verse: number; content: string }>
  meditation: {
    oneWord: string | null
    oneWordSubtitle: string | null
    meditationGuide: string | null
    jesusConnection: string | null
    meditationQuestions: string[]
    prayer: string | null
    copyVerse: string | null
  } | null
}

function mapJsonToQTProps(json: QTJsonData): QTProps {
  const verses: QTVerse[] = json.verses.map(v => ({
    verse: v.verse,
    content: v.content,
  }))

  const meditation: QTMeditation | null = json.meditation
    ? {
        oneWord: json.meditation.oneWord,
        oneWordSubtitle: json.meditation.oneWordSubtitle,
        meditationGuide: json.meditation.meditationGuide,
        jesusConnection: json.meditation.jesusConnection,
        meditationQuestions: json.meditation.meditationQuestions || [],
        prayer: json.meditation.prayer,
        copyVerse: json.meditation.copyVerse,
      }
    : null

  return {
    date: new Date(json.date),
    dayNumber: json.day,
    title: json.title,
    bibleRange: json.bibleRange,
    verseReference: json.verseReference,
    verses,
    meditation,
  }
}

export class SupabaseQTRepository implements IQTRepository {
  private qtDataCache: Map<string, QTJsonData[]> = new Map()

  private async loadQTData(year: number, month: number): Promise<QTJsonData[]> {
    const cacheKey = `${year}-${month}`

    if (this.qtDataCache.has(cacheKey)) {
      return this.qtDataCache.get(cacheKey)!
    }

    try {
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ]
      const monthName = monthNames[month - 1]
      const response = await fetch(`/data/qt-${monthName}-${year}.json`)

      if (!response.ok) {
        return []
      }

      const data: QTJsonData[] = await response.json()
      this.qtDataCache.set(cacheKey, data)
      return data
    } catch {
      return []
    }
  }

  async findByDate(date: Date): Promise<QT | null> {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const data = await this.loadQTData(year, month)
    const qtData = data.find(d => d.day === day && d.month === month)

    if (!qtData) {
      return null
    }

    return QT.create(mapJsonToQTProps(qtData))
  }

  async findByDayNumber(dayNumber: number): Promise<QT | null> {
    // 2026년 1월 1일부터 시작하는 365일 플랜 기준
    const startDate = new Date(2026, 0, 1)
    const targetDate = new Date(startDate)
    targetDate.setDate(startDate.getDate() + dayNumber - 1)

    return this.findByDate(targetDate)
  }

  async findByMonth(year: number, month: number): Promise<QT[]> {
    const data = await this.loadQTData(year, month)

    return data.map(d => QT.create(mapJsonToQTProps(d)))
  }

  async findToday(): Promise<QT | null> {
    const today = new Date()
    return this.findByDate(today)
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<QT[]> {
    const results: QT[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      const qt = await this.findByDate(current)
      if (qt) {
        results.push(qt)
      }
      current.setDate(current.getDate() + 1)
    }

    return results
  }
}
