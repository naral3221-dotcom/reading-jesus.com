/**
 * 통독일정 필터링을 위한 유틸리티 함수들
 */

export interface ReadingDay {
  day: number;
  date: string;
  display_date: string;
  book: string;
  range: string;
  reading: string;
  memory_verse: string | null;
}

// 구약 성경책 목록 (39권)
const OLD_TESTAMENT_BOOKS = [
  '창세기', '출애굽기', '레위기', '민수기', '신명기',
  '여호수아', '사사기', '룻기', '사무엘상', '사무엘하',
  '열왕기상', '열왕기하', '역대상', '역대하', '에스라',
  '느헤미야', '에스더', '욥기', '시편', '잠언',
  '전도서', '아가', '이사야', '예레미야', '예레미야애가',
  '에스겔', '다니엘', '호세아', '요엘', '아모스',
  '오바댜', '요나', '미가', '나훔', '하박국',
  '스바냐', '학개', '스가랴', '말라기'
];

// 신약 성경책 목록 (27권)
const NEW_TESTAMENT_BOOKS = [
  '마태복음', '마가복음', '누가복음', '요한복음', '사도행전',
  '로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서',
  '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서',
  '디모데후서', '디도서', '빌레몬서', '히브리서', '야고보서',
  '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서',
  '유다서', '요한계시록'
];

/**
 * 월별로 일정 그룹핑
 */
export function groupByMonth(plan: ReadingDay[]): Record<string, ReadingDay[]> {
  const groups: Record<string, ReadingDay[]> = {};

  plan.forEach(day => {
    const month = parseInt(day.date.slice(5, 7)).toString(); // "01" -> "1"

    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(day);
  });

  return groups;
}

/**
 * 성경책별로 일정 그룹핑
 */
export function groupByBook(plan: ReadingDay[]): Record<string, ReadingDay[]> {
  const groups: Record<string, ReadingDay[]> = {};

  plan.forEach(day => {
    // 복수 책 처리 (예: "디도서,빌레몬서")
    const books = day.book.split(',').map(b => b.trim());

    books.forEach(book => {
      if (!groups[book]) {
        groups[book] = [];
      }
      // 중복 방지 (같은 day가 여러 책에 포함될 수 있음)
      if (!groups[book].some(d => d.day === day.day)) {
        groups[book].push(day);
      }
    });
  });

  return groups;
}

/**
 * 고유 월 목록 반환 (정렬됨)
 */
export function getUniqueMonths(plan: ReadingDay[]): string[] {
  const months = new Set<string>();

  plan.forEach(day => {
    const month = parseInt(day.date.slice(5, 7)).toString();
    months.add(month);
  });

  return Array.from(months).sort((a, b) => parseInt(a) - parseInt(b));
}

/**
 * 구약/신약으로 분류된 성경책 목록 반환
 * (실제 통독일정에 있는 책만 반환)
 */
export function getBooksByTestament(plan: ReadingDay[]): { old: string[]; new: string[] } {
  const allBooks = new Set<string>();

  plan.forEach(day => {
    const books = day.book.split(',').map(b => b.trim());
    books.forEach(book => allBooks.add(book));
  });

  const oldBooks: string[] = [];
  const newBooks: string[] = [];

  // 구약 순서대로 추가
  OLD_TESTAMENT_BOOKS.forEach(book => {
    if (allBooks.has(book)) {
      oldBooks.push(book);
    }
  });

  // 신약 순서대로 추가
  NEW_TESTAMENT_BOOKS.forEach(book => {
    if (allBooks.has(book)) {
      newBooks.push(book);
    }
  });

  return { old: oldBooks, new: newBooks };
}

/**
 * 성경책이 구약인지 확인
 */
export function isOldTestament(book: string): boolean {
  return OLD_TESTAMENT_BOOKS.includes(book);
}

/**
 * 월 이름 반환
 */
export function getMonthLabel(month: string): string {
  return `${month}월`;
}
