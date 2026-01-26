/**
 * 읽기 플랜 계산 유틸리티
 * 커스텀 플랜의 일정 계산, 날짜 계산 등
 */

import {
  BibleScope,
  BIBLE_BOOKS_INFO,
  TOTAL_BIBLE_CHAPTERS,
  type ReadingPlanConfig,
  type PlanSchedule,
} from '@/types'
import {
  SaveCustomPlan as SaveCustomPlanUseCase,
  LinkPlanToGroup as LinkPlanToGroupUseCase,
} from '@/application/use-cases/reading-plan'

// Use Case 인스턴스
const saveCustomPlanUseCase = new SaveCustomPlanUseCase()
const linkPlanToGroupUseCase = new LinkPlanToGroupUseCase()

// 성경책 정보 타입
interface BookInfo {
  name: string;
  chapters: number;
}

/**
 * 선택된 성경 범위의 총 장 수 계산
 */
export function calculateTotalChapters(
  scope: BibleScope,
  selectedBooks?: string[] | null
): number {
  if (scope === 'full') return TOTAL_BIBLE_CHAPTERS.full;
  if (scope === 'old') return TOTAL_BIBLE_CHAPTERS.old;
  if (scope === 'new') return TOTAL_BIBLE_CHAPTERS.new;

  // custom인 경우
  if (!selectedBooks || selectedBooks.length === 0) return 0;

  const allBooks = [...BIBLE_BOOKS_INFO.old, ...BIBLE_BOOKS_INFO.new];
  return selectedBooks.reduce((total, bookName) => {
    const book = allBooks.find((b) => b.name === bookName);
    return total + (book?.chapters || 0);
  }, 0);
}

/**
 * 선택된 성경 범위의 책 목록 반환
 */
export function getBooksForScope(
  scope: BibleScope,
  selectedBooks?: string[] | null
): BookInfo[] {
  if (scope === 'full') {
    return [...BIBLE_BOOKS_INFO.old, ...BIBLE_BOOKS_INFO.new];
  }
  if (scope === 'old') {
    return BIBLE_BOOKS_INFO.old;
  }
  if (scope === 'new') {
    return BIBLE_BOOKS_INFO.new;
  }

  // custom인 경우
  if (!selectedBooks || selectedBooks.length === 0) return [];

  const allBooks = [...BIBLE_BOOKS_INFO.old, ...BIBLE_BOOKS_INFO.new];
  return selectedBooks
    .map((name) => allBooks.find((b) => b.name === name))
    .filter((b): b is BookInfo => b !== undefined);
}

/**
 * 실제 읽기 일수 계산 (휴식일 제외)
 */
export function calculateReadingDays(
  totalChapters: number,
  chaptersPerDay: number
): number {
  return Math.ceil(totalChapters / chaptersPerDay);
}

/**
 * 달력 기준 총 일수 계산 (휴식일 포함)
 */
export function calculateCalendarDays(
  totalReadingDays: number,
  readingDaysPerWeek: number[]
): number {
  if (readingDaysPerWeek.length === 0) return 0;
  if (readingDaysPerWeek.length === 7) return totalReadingDays;

  // 주당 읽기 일수
  const daysPerWeek = readingDaysPerWeek.length;
  // 몇 주가 필요한지
  const fullWeeks = Math.floor(totalReadingDays / daysPerWeek);
  const remainingDays = totalReadingDays % daysPerWeek;

  return fullWeeks * 7 + remainingDays;
}

/**
 * 종료일 계산
 */
export function calculateEndDate(
  startDate: string,
  totalReadingDays: number,
  readingDays: number[]
): string {
  const start = new Date(startDate);
  const currentDate = new Date(start);
  let readingCount = 0;

  // 읽기 일수만큼 진행
  while (readingCount < totalReadingDays) {
    const dayOfWeek = currentDate.getDay(); // 0=일, 1=월, ..., 6=토
    if (readingDays.includes(dayOfWeek)) {
      readingCount++;
    }
    if (readingCount < totalReadingDays) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return currentDate.toISOString().split('T')[0];
}

/**
 * 특정 날짜의 Day 번호 계산
 */
export function calculateDayNumber(
  startDate: string,
  targetDate: string,
  readingDays: number[]
): number {
  const start = new Date(startDate);
  const target = new Date(targetDate);

  if (target < start) return 0;

  let dayNumber = 0;
  const currentDate = new Date(start);

  while (currentDate <= target) {
    const dayOfWeek = currentDate.getDay();
    if (readingDays.includes(dayOfWeek)) {
      dayNumber++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dayNumber;
}

/**
 * Day 번호로 실제 날짜 계산
 */
export function calculateDateFromDayNumber(
  startDate: string,
  dayNumber: number,
  readingDays: number[]
): string {
  const start = new Date(startDate);
  const currentDate = new Date(start);
  let count = 0;

  while (count < dayNumber) {
    const dayOfWeek = currentDate.getDay();
    if (readingDays.includes(dayOfWeek)) {
      count++;
    }
    if (count < dayNumber) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return currentDate.toISOString().split('T')[0];
}

/**
 * 플랜 일정 생성 (plan_schedules 데이터)
 */
export function generatePlanSchedules(
  planId: string,
  scope: BibleScope,
  selectedBooks: string[] | null,
  chaptersPerDay: number,
  readingDays: number[],
  startDate: string
): Omit<PlanSchedule, 'id' | 'created_at'>[] {
  const books = getBooksForScope(scope, selectedBooks);
  const schedules: Omit<PlanSchedule, 'id' | 'created_at'>[] = [];

  let dayNumber = 0;
  const currentDate = new Date(startDate);
  let bookIndex = 0;
  let currentChapter = 1;

  while (bookIndex < books.length) {
    const book = books[bookIndex];
    const dayOfWeek = currentDate.getDay();

    // 읽기 요일인지 확인
    if (readingDays.includes(dayOfWeek)) {
      dayNumber++;
      const startChapter = currentChapter;
      let chaptersToRead = chaptersPerDay;
      let endChapter = startChapter;
      const readingBookName = book.name;

      // 이 Day에 읽을 장들 계산
      while (chaptersToRead > 0 && bookIndex < books.length) {
        const currentBook = books[bookIndex];
        const remainingInBook = currentBook.chapters - currentChapter + 1;

        if (remainingInBook <= chaptersToRead) {
          // 현재 책 완료
          endChapter = currentBook.chapters;
          chaptersToRead -= remainingInBook;
          bookIndex++;
          currentChapter = 1;
        } else {
          // 현재 책 내에서 읽기
          endChapter = currentChapter + chaptersToRead - 1;
          currentChapter = endChapter + 1;
          chaptersToRead = 0;
        }
      }

      schedules.push({
        plan_id: planId,
        day_number: dayNumber,
        reading_date: currentDate.toISOString().split('T')[0],
        book_name: readingBookName,
        start_chapter: startChapter,
        end_chapter: endChapter,
        chapter_count: endChapter - startChapter + 1,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return schedules;
}

/**
 * 플랜 설정 요약 문자열 생성
 */
export function generatePlanSummary(plan: Partial<ReadingPlanConfig>): string {
  const parts: string[] = [];

  if (plan.bible_scope) {
    switch (plan.bible_scope) {
      case 'full':
        parts.push('전체 성경');
        break;
      case 'old':
        parts.push('구약');
        break;
      case 'new':
        parts.push('신약');
        break;
      case 'custom':
        parts.push(`${plan.selected_books?.length || 0}권`);
        break;
    }
  }

  if (plan.chapters_per_day) {
    parts.push(`하루 ${plan.chapters_per_day}장`);
  }

  if (plan.reading_days && plan.reading_days.length < 7) {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const days = plan.reading_days.sort().map((d) => dayNames[d]).join('');
    parts.push(`주 ${plan.reading_days.length}일 (${days})`);
  }

  if (plan.total_reading_days) {
    parts.push(`${plan.total_reading_days}일`);
  }

  return parts.join(' · ');
}

/**
 * 오늘의 읽기 범위 문자열 생성
 */
export function formatReadingRange(
  bookName: string,
  startChapter: number,
  endChapter: number
): string {
  if (startChapter === endChapter) {
    return `${bookName} ${startChapter}장`;
  }
  return `${bookName} ${startChapter}-${endChapter}장`;
}

/**
 * 요일 배열을 읽기 쉬운 문자열로 변환
 */
export function formatReadingDays(days: number[]): string {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const sortedDays = [...days].sort();

  // 연속된 범위 확인
  const isConsecutive =
    sortedDays.length > 1 &&
    sortedDays.every((d, i) => i === 0 || d === sortedDays[i - 1] + 1);

  if (isConsecutive && sortedDays.length >= 3) {
    return `${dayNames[sortedDays[0]]}~${dayNames[sortedDays[sortedDays.length - 1]]}`;
  }

  return sortedDays.map((d) => dayNames[d]).join(', ');
}

/**
 * 진행률 계산
 */
export function calculateProgress(
  completedDays: number,
  totalDays: number
): number {
  if (totalDays === 0) return 0;
  return Math.round((completedDays / totalDays) * 100);
}

/**
 * 커스텀 플랜 저장 인터페이스
 */
export interface SaveCustomPlanParams {
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

/**
 * 커스텀 플랜을 DB에 저장하고 일정을 생성
 * @deprecated 새 코드에서는 SaveCustomPlan Use Case 사용 권장
 * @returns 생성된 플랜 ID 또는 null
 */
export async function saveCustomPlan(params: SaveCustomPlanParams): Promise<string | null> {
  // 일정 생성 (plan_id는 임시로 빈 문자열)
  const schedules = generatePlanSchedules(
    '', // plan_id는 Use Case에서 설정
    params.bible_scope,
    params.selected_books,
    params.chapters_per_day,
    params.reading_days,
    params.start_date
  )

  // plan_id 제외한 일정 데이터
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const schedulesWithoutPlanId = schedules.map(({ plan_id: _planId, ...rest }) => rest)

  return saveCustomPlanUseCase.execute(params, schedulesWithoutPlanId)
}

/**
 * 그룹에 플랜 연결
 * @deprecated 새 코드에서는 LinkPlanToGroup Use Case 사용 권장
 */
export async function linkPlanToGroup(groupId: string, planId: string): Promise<boolean> {
  return linkPlanToGroupUseCase.execute(groupId, planId)
}
