import { describe, it, expect } from 'vitest'
import { QT, QTProps, QTMeditation } from '@/domain/entities/QT'

describe('QT Entity', () => {
  const validQTProps: QTProps = {
    date: new Date('2026-01-01'),
    dayNumber: 1,
    title: '안식 (예배의 리듬)',
    bibleRange: '창 1-4장',
    verseReference: '창세기 2장 1-3절',
    verses: [
      { verse: 1, content: '천지와 만물이 다 이루어지니라' },
      { verse: 2, content: '하나님이 그가 하시던 일을 일곱째 날에 마치시니' },
      { verse: 3, content: '하나님이 그 일곱째 날을 복되게 하사 거룩하게 하셨으니' },
    ],
    meditation: {
      oneWord: '안식',
      oneWordSubtitle: '예배의 리듬',
      meditationGuide: '하나님은 일곱째 날을 거룩하게 하셨습니다.',
      jesusConnection: '예수님은 우리의 참된 안식이십니다.',
      meditationQuestions: ['오늘 하나님이 주시는 안식은 무엇인가요?'],
      prayer: '주님, 오늘 하루도 주님 안에서 쉬게 하소서.',
      copyVerse: '창세기 2:3',
    },
  }

  describe('create', () => {
    it('유효한 속성으로 QT를 생성할 수 있다', () => {
      const qt = QT.create(validQTProps)

      expect(qt.date).toEqual(new Date('2026-01-01'))
      expect(qt.dayNumber).toBe(1)
      expect(qt.title).toBe('안식 (예배의 리듬)')
      expect(qt.verses).toHaveLength(3)
      expect(qt.meditation?.oneWord).toBe('안식')
    })

    it('날짜가 없으면 에러를 던진다', () => {
      expect(() => {
        QT.create({ ...validQTProps, date: null as unknown as Date })
      }).toThrow('날짜는 필수입니다')
    })

    it('dayNumber가 1 미만이면 에러를 던진다', () => {
      expect(() => {
        QT.create({ ...validQTProps, dayNumber: 0 })
      }).toThrow('일차는 1 이상이어야 합니다')
    })

    it('dayNumber가 365를 초과하면 에러를 던진다', () => {
      expect(() => {
        QT.create({ ...validQTProps, dayNumber: 366 })
      }).toThrow('일차는 365 이하여야 합니다')
    })

    it('구절이 없어도 생성할 수 있다 (빈 배열)', () => {
      const qt = QT.create({ ...validQTProps, verses: [] })

      expect(qt.verses).toHaveLength(0)
    })
  })

  describe('getDateString', () => {
    it('YYYY-MM-DD 형식의 날짜 문자열을 반환한다', () => {
      const qt = QT.create(validQTProps)

      expect(qt.getDateString()).toBe('2026-01-01')
    })
  })

  describe('getDayOfWeek', () => {
    it('요일을 반환한다', () => {
      const qt = QT.create(validQTProps) // 2026-01-01은 목요일

      expect(qt.getDayOfWeek()).toBe('목요일')
    })
  })

  describe('hasMeditation', () => {
    it('묵상이 있으면 true를 반환한다', () => {
      const qt = QT.create(validQTProps)

      expect(qt.hasMeditation()).toBe(true)
    })

    it('묵상이 없으면 false를 반환한다', () => {
      const qt = QT.create({ ...validQTProps, meditation: null })

      expect(qt.hasMeditation()).toBe(false)
    })
  })

  describe('getOneWord', () => {
    it('핵심 단어를 반환한다', () => {
      const qt = QT.create(validQTProps)

      expect(qt.getOneWord()).toBe('안식')
    })

    it('묵상이 없으면 null을 반환한다', () => {
      const qt = QT.create({ ...validQTProps, meditation: null })

      expect(qt.getOneWord()).toBeNull()
    })
  })

  describe('getVerseCount', () => {
    it('구절 수를 반환한다', () => {
      const qt = QT.create(validQTProps)

      expect(qt.getVerseCount()).toBe(3)
    })
  })

  describe('getMeditationQuestions', () => {
    it('묵상 질문 목록을 반환한다', () => {
      const qt = QT.create(validQTProps)

      expect(qt.getMeditationQuestions()).toEqual(['오늘 하나님이 주시는 안식은 무엇인가요?'])
    })

    it('묵상이 없으면 빈 배열을 반환한다', () => {
      const qt = QT.create({ ...validQTProps, meditation: null })

      expect(qt.getMeditationQuestions()).toEqual([])
    })
  })

  describe('isToday', () => {
    it('오늘 날짜인지 확인한다', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayQt = QT.create({ ...validQTProps, date: today })
      const pastQt = QT.create({ ...validQTProps, date: new Date('2020-01-01') })

      expect(todayQt.isToday()).toBe(true)
      expect(pastQt.isToday()).toBe(false)
    })
  })
})
