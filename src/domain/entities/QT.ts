/**
 * QT Entity
 *
 * QT(묵상) 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 * 외부 의존성 없이 순수 TypeScript로 구현됩니다.
 */

export interface QTVerse {
  verse: number
  content: string
}

export interface QTMeditation {
  oneWord: string | null
  oneWordSubtitle: string | null
  meditationGuide: string | null
  jesusConnection: string | null
  meditationQuestions: string[]
  prayer: string | null
  copyVerse: string | null
}

export interface QTProps {
  date: Date
  dayNumber: number
  title: string | null
  bibleRange: string | null
  verseReference: string | null
  verses: QTVerse[]
  meditation: QTMeditation | null
}

const DAY_OF_WEEK_KOREAN = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

export class QT {
  private constructor(
    public readonly date: Date,
    public readonly dayNumber: number,
    public readonly title: string | null,
    public readonly bibleRange: string | null,
    public readonly verseReference: string | null,
    public readonly verses: QTVerse[],
    public readonly meditation: QTMeditation | null
  ) {}

  /**
   * QT 엔티티를 생성합니다.
   * @throws 날짜가 없거나 dayNumber가 유효하지 않으면 에러
   */
  static create(props: QTProps): QT {
    if (!props.date) {
      throw new Error('날짜는 필수입니다')
    }
    if (props.dayNumber < 1) {
      throw new Error('일차는 1 이상이어야 합니다')
    }
    if (props.dayNumber > 365) {
      throw new Error('일차는 365 이하여야 합니다')
    }

    return new QT(
      props.date,
      props.dayNumber,
      props.title,
      props.bibleRange,
      props.verseReference,
      props.verses,
      props.meditation
    )
  }

  /**
   * YYYY-MM-DD 형식의 날짜 문자열을 반환합니다.
   */
  getDateString(): string {
    const year = this.date.getFullYear()
    const month = String(this.date.getMonth() + 1).padStart(2, '0')
    const day = String(this.date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 요일을 한국어로 반환합니다.
   */
  getDayOfWeek(): string {
    return DAY_OF_WEEK_KOREAN[this.date.getDay()]
  }

  /**
   * 묵상이 있는지 확인합니다.
   */
  hasMeditation(): boolean {
    return this.meditation !== null
  }

  /**
   * 핵심 단어를 반환합니다.
   */
  getOneWord(): string | null {
    return this.meditation?.oneWord ?? null
  }

  /**
   * 구절 수를 반환합니다.
   */
  getVerseCount(): number {
    return this.verses.length
  }

  /**
   * 묵상 질문 목록을 반환합니다.
   */
  getMeditationQuestions(): string[] {
    return this.meditation?.meditationQuestions ?? []
  }

  /**
   * 오늘 날짜인지 확인합니다.
   */
  isToday(): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const qtDate = new Date(this.date)
    qtDate.setHours(0, 0, 0, 0)
    return today.getTime() === qtDate.getTime()
  }

  /**
   * DTO 형태로 변환합니다.
   */
  toDTO(): QTProps {
    return {
      date: this.date,
      dayNumber: this.dayNumber,
      title: this.title,
      bibleRange: this.bibleRange,
      verseReference: this.verseReference,
      verses: this.verses,
      meditation: this.meditation,
    }
  }

  /**
   * 기존 QTDailyContent 타입과 호환되는 형태로 변환합니다.
   * lib/qt-content.ts의 유틸리티 함수들과 함께 사용할 수 있습니다.
   */
  toQTDailyContent(): {
    month: number
    year: number
    day: number
    dayOfWeek: string
    date: string
    title: string | null
    bibleRange: string | null
    verseReference: string | null
    verses: QTVerse[]
    meditation: QTMeditation | null
  } {
    return {
      month: this.date.getMonth() + 1,
      year: this.date.getFullYear(),
      day: this.date.getDate(),
      dayOfWeek: this.getDayOfWeek(),
      date: this.getDateString(),
      title: this.title,
      bibleRange: this.bibleRange,
      verseReference: this.verseReference,
      verses: this.verses,
      meditation: this.meditation,
    }
  }
}
