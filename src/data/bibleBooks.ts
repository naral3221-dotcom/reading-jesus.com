import type { BibleBook } from '@/types';

// 성경 66권 목록
export const BIBLE_BOOKS: BibleBook[] = [
  // 구약 39권
  { name: '창세기', abbr: '창', testament: 'old', chapters: 50 },
  { name: '출애굽기', abbr: '출', testament: 'old', chapters: 40 },
  { name: '레위기', abbr: '레', testament: 'old', chapters: 27 },
  { name: '민수기', abbr: '민', testament: 'old', chapters: 36 },
  { name: '신명기', abbr: '신', testament: 'old', chapters: 34 },
  { name: '여호수아', abbr: '수', testament: 'old', chapters: 24 },
  { name: '사사기', abbr: '삿', testament: 'old', chapters: 21 },
  { name: '룻기', abbr: '룻', testament: 'old', chapters: 4 },
  { name: '사무엘상', abbr: '삼상', testament: 'old', chapters: 31 },
  { name: '사무엘하', abbr: '삼하', testament: 'old', chapters: 24 },
  { name: '열왕기상', abbr: '왕상', testament: 'old', chapters: 22 },
  { name: '열왕기하', abbr: '왕하', testament: 'old', chapters: 25 },
  { name: '역대상', abbr: '대상', testament: 'old', chapters: 29 },
  { name: '역대하', abbr: '대하', testament: 'old', chapters: 36 },
  { name: '에스라', abbr: '스', testament: 'old', chapters: 10 },
  { name: '느헤미야', abbr: '느', testament: 'old', chapters: 13 },
  { name: '에스더', abbr: '에', testament: 'old', chapters: 10 },
  { name: '욥기', abbr: '욥', testament: 'old', chapters: 42 },
  { name: '시편', abbr: '시', testament: 'old', chapters: 150 },
  { name: '잠언', abbr: '잠', testament: 'old', chapters: 31 },
  { name: '전도서', abbr: '전', testament: 'old', chapters: 12 },
  { name: '아가', abbr: '아', testament: 'old', chapters: 8 },
  { name: '이사야', abbr: '사', testament: 'old', chapters: 66 },
  { name: '예레미야', abbr: '렘', testament: 'old', chapters: 52 },
  { name: '예레미야애가', abbr: '애', testament: 'old', chapters: 5 },
  { name: '에스겔', abbr: '겔', testament: 'old', chapters: 48 },
  { name: '다니엘', abbr: '단', testament: 'old', chapters: 12 },
  { name: '호세아', abbr: '호', testament: 'old', chapters: 14 },
  { name: '요엘', abbr: '욜', testament: 'old', chapters: 3 },
  { name: '아모스', abbr: '암', testament: 'old', chapters: 9 },
  { name: '오바댜', abbr: '옵', testament: 'old', chapters: 1 },
  { name: '요나', abbr: '욘', testament: 'old', chapters: 4 },
  { name: '미가', abbr: '미', testament: 'old', chapters: 7 },
  { name: '나훔', abbr: '나', testament: 'old', chapters: 3 },
  { name: '하박국', abbr: '합', testament: 'old', chapters: 3 },
  { name: '스바냐', abbr: '습', testament: 'old', chapters: 3 },
  { name: '학개', abbr: '학', testament: 'old', chapters: 2 },
  { name: '스가랴', abbr: '슥', testament: 'old', chapters: 14 },
  { name: '말라기', abbr: '말', testament: 'old', chapters: 4 },

  // 신약 27권
  { name: '마태복음', abbr: '마', testament: 'new', chapters: 28 },
  { name: '마가복음', abbr: '막', testament: 'new', chapters: 16 },
  { name: '누가복음', abbr: '눅', testament: 'new', chapters: 24 },
  { name: '요한복음', abbr: '요', testament: 'new', chapters: 21 },
  { name: '사도행전', abbr: '행', testament: 'new', chapters: 28 },
  { name: '로마서', abbr: '롬', testament: 'new', chapters: 16 },
  { name: '고린도전서', abbr: '고전', testament: 'new', chapters: 16 },
  { name: '고린도후서', abbr: '고후', testament: 'new', chapters: 13 },
  { name: '갈라디아서', abbr: '갈', testament: 'new', chapters: 6 },
  { name: '에베소서', abbr: '엡', testament: 'new', chapters: 6 },
  { name: '빌립보서', abbr: '빌', testament: 'new', chapters: 4 },
  { name: '골로새서', abbr: '골', testament: 'new', chapters: 4 },
  { name: '데살로니가전서', abbr: '살전', testament: 'new', chapters: 5 },
  { name: '데살로니가후서', abbr: '살후', testament: 'new', chapters: 3 },
  { name: '디모데전서', abbr: '딤전', testament: 'new', chapters: 6 },
  { name: '디모데후서', abbr: '딤후', testament: 'new', chapters: 4 },
  { name: '디도서', abbr: '딛', testament: 'new', chapters: 3 },
  { name: '빌레몬서', abbr: '몬', testament: 'new', chapters: 1 },
  { name: '히브리서', abbr: '히', testament: 'new', chapters: 13 },
  { name: '야고보서', abbr: '약', testament: 'new', chapters: 5 },
  { name: '베드로전서', abbr: '벧전', testament: 'new', chapters: 5 },
  { name: '베드로후서', abbr: '벧후', testament: 'new', chapters: 3 },
  { name: '요한1서', abbr: '요일', testament: 'new', chapters: 5 },
  { name: '요한2서', abbr: '요이', testament: 'new', chapters: 1 },
  { name: '요한3서', abbr: '요삼', testament: 'new', chapters: 1 },
  { name: '유다서', abbr: '유', testament: 'new', chapters: 1 },
  { name: '요한계시록', abbr: '계', testament: 'new', chapters: 22 },
];

// 책 이름으로 책 정보 찾기
export function getBibleBook(bookName: string): BibleBook | undefined {
  return BIBLE_BOOKS.find(b => b.name === bookName || b.abbr === bookName);
}

// 구약/신약 필터
export function getOldTestament(): BibleBook[] {
  return BIBLE_BOOKS.filter(b => b.testament === 'old');
}

export function getNewTestament(): BibleBook[] {
  return BIBLE_BOOKS.filter(b => b.testament === 'new');
}
