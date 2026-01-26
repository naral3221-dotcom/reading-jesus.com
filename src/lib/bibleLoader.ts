/**
 * 성경 데이터 로더
 * bible.json 파일에서 성경 구절을 가져오는 유틸리티
 */

// 성경 전체 데이터 타입 (키: "창1:1" 형식)
type BibleData = Record<string, string>;

// 성경 번역본 타입
export type BibleVersion = 'revised' | 'klb';

// 캐시된 성경 데이터 (버전별)
const cachedBibleData: Record<BibleVersion, BibleData | null> = {
  revised: null,
  klb: null,
};

/**
 * 성경 전체 데이터를 로드 (한 번만 로드하고 캐싱)
 * @param version 성경 번역본 ('revised': 개역개정, 'klb': 현대인의성경)
 */
export async function loadBibleData(version: BibleVersion = 'revised'): Promise<BibleData> {
  if (cachedBibleData[version]) {
    return cachedBibleData[version]!;
  }

  try {
    const filename = version === 'klb' ? 'bible_klb.json' : 'bible.json';
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${version} bible data`);
    }
    const data = await response.json();
    cachedBibleData[version] = data;
    return data;
  } catch (error) {
    console.error(`Error loading ${version} bible data:`, error);
    return {};
  }
}

/**
 * 책 이름을 약어로 변환
 * 예: "창세기" -> "창", "마태복음" -> "마"
 */
export function getBookAbbr(bookName: string): string {
  const bookMapping: Record<string, string> = {
    // 구약
    '창세기': '창',
    '출애굽기': '출',
    '레위기': '레',
    '민수기': '민',
    '신명기': '신',
    '여호수아': '수',
    '사사기': '삿',
    '룻기': '룻',
    '사무엘상': '삼상',
    '사무엘하': '삼하',
    '열왕기상': '왕상',
    '열왕기하': '왕하',
    '역대상': '대상',
    '역대하': '대하',
    '에스라': '스',
    '느헤미야': '느',
    '에스더': '에',
    '욥기': '욥',
    '시편': '시',
    '잠언': '잠',
    '전도서': '전',
    '아가': '아',
    '이사야': '사',
    '예레미야': '렘',
    '예레미야애가': '애',
    '에스겔': '겔',
    '다니엘': '단',
    '호세아': '호',
    '요엘': '욜',
    '아모스': '암',
    '오바댜': '옵',
    '요나': '욘',
    '미가': '미',
    '나훔': '나',
    '하박국': '합',
    '스바냐': '습',
    '학개': '학',
    '스가랴': '슥',
    '말라기': '말',

    // 신약
    '마태복음': '마',
    '마가복음': '막',
    '누가복음': '눅',
    '요한복음': '요',
    '사도행전': '행',
    '로마서': '롬',
    '고린도전서': '고전',
    '고린도후서': '고후',
    '갈라디아서': '갈',
    '에베소서': '엡',
    '빌립보서': '빌',
    '골로새서': '골',
    '데살로니가전서': '살전',
    '데살로니가후서': '살후',
    '디모데전서': '딤전',
    '디모데후서': '딤후',
    '디도서': '딛',
    '빌레몬서': '몬',
    '히브리서': '히',
    '야고보서': '약',
    '베드로전서': '벧전',
    '베드로후서': '벧후',
    '요한일서': '요일',
    '요한이서': '요이',
    '요한삼서': '요삼',
    '유다서': '유',
    '요한계시록': '계',
  };

  return bookMapping[bookName] || bookName;
}

/**
 * 특정 절 가져오기
 * @param book 책 이름 (예: "창세기" 또는 "창")
 * @param chapter 장 번호
 * @param verse 절 번호
 * @param version 성경 번역본
 */
export async function getVerse(
  book: string,
  chapter: number,
  verse: number,
  version: BibleVersion = 'revised'
): Promise<string | null> {
  const bibleData = await loadBibleData(version);
  // 항상 getBookAbbr 시도 (룻기 같은 2글자 책 이름 처리)
  const abbr = getBookAbbr(book) || book;
  const key = `${abbr}${chapter}:${verse}`;
  return bibleData[key] || null;
}

/**
 * 특정 장의 모든 절 가져오기
 * @param book 책 이름
 * @param chapter 장 번호
 * @param version 성경 번역본
 */
export async function getChapter(
  book: string,
  chapter: number,
  version: BibleVersion = 'revised'
): Promise<Record<number, string>> {
  const bibleData = await loadBibleData(version);
  // 항상 getBookAbbr 시도 (룻기 같은 2글자 책 이름 처리)
  const abbr = getBookAbbr(book) || book;
  const prefix = `${abbr}${chapter}:`;

  const verses: Record<number, string> = {};

  Object.keys(bibleData).forEach((key) => {
    if (key.startsWith(prefix)) {
      const verseNum = parseInt(key.split(':')[1]);
      verses[verseNum] = bibleData[key];
    }
  });

  return verses;
}

/**
 * 특정 책의 모든 장 가져오기
 * @param book 책 이름
 * @param version 성경 번역본
 */
export async function getBook(
  book: string,
  version: BibleVersion = 'revised'
): Promise<Record<number, Record<number, string>>> {
  const bibleData = await loadBibleData(version);
  // 항상 getBookAbbr 시도 (룻기 같은 2글자 책 이름 처리)
  const abbr = getBookAbbr(book) || book;

  const chapters: Record<number, Record<number, string>> = {};

  Object.keys(bibleData).forEach((key) => {
    if (key.startsWith(abbr)) {
      const [, chapterAndVerse] = key.split(abbr);
      const [chapterStr, verseStr] = chapterAndVerse.split(':');
      const chapter = parseInt(chapterStr);
      const verse = parseInt(verseStr);

      if (!chapters[chapter]) {
        chapters[chapter] = {};
      }
      chapters[chapter][verse] = bibleData[key];
    }
  });

  return chapters;
}

/**
 * 범위로 절 가져오기
 * @param book 책 이름
 * @param chapter 장 번호
 * @param startVerse 시작 절
 * @param endVerse 끝 절
 * @param version 성경 번역본
 */
export async function getVerseRange(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number,
  version: BibleVersion = 'revised'
): Promise<string[]> {
  const bibleData = await loadBibleData(version);
  // 항상 getBookAbbr 시도 (룻기 같은 2글자 책 이름 처리)
  const abbr = getBookAbbr(book) || book;

  const verses: string[] = [];
  for (let i = startVerse; i <= endVerse; i++) {
    const key = `${abbr}${chapter}:${i}`;
    if (bibleData[key]) {
      verses.push(bibleData[key]);
    }
  }

  return verses;
}

/**
 * 약어에서 책 이름 가져오기
 */
export function getBookNameFromAbbr(abbr: string): string {
  const reverseMapping: Record<string, string> = {
    '창': '창세기', '출': '출애굽기', '레': '레위기', '민': '민수기',
    '신': '신명기', '수': '여호수아', '삿': '사사기', '룻': '룻기',
    '삼상': '사무엘상', '삼하': '사무엘하', '왕상': '열왕기상', '왕하': '열왕기하',
    '대상': '역대상', '대하': '역대하', '스': '에스라', '느': '느헤미야',
    '에': '에스더', '욥': '욥기', '시': '시편', '잠': '잠언',
    '전': '전도서', '아': '아가', '사': '이사야', '렘': '예레미야',
    '애': '예레미야애가', '겔': '에스겔', '단': '다니엘', '호': '호세아',
    '욜': '요엘', '암': '아모스', '옵': '오바댜', '욘': '요나',
    '미': '미가', '나': '나훔', '합': '하박국', '습': '스바냐',
    '학': '학개', '슥': '스가랴', '말': '말라기',
    '마': '마태복음', '막': '마가복음', '눅': '누가복음', '요': '요한복음',
    '행': '사도행전', '롬': '로마서', '고전': '고린도전서', '고후': '고린도후서',
    '갈': '갈라디아서', '엡': '에베소서', '빌': '빌립보서', '골': '골로새서',
    '살전': '데살로니가전서', '살후': '데살로니가후서', '딤전': '디모데전서', '딤후': '디모데후서',
    '딛': '디도서', '몬': '빌레몬서', '히': '히브리서', '약': '야고보서',
    '벧전': '베드로전서', '벧후': '베드로후서', '요일': '요한1서', '요이': '요한2서',
    '요삼': '요한3서', '유': '유다서', '계': '요한계시록',
  };
  return reverseMapping[abbr] || abbr;
}

/**
 * 성경 본문 검색
 * @param query 검색어
 * @param version 성경 번역본
 * @param limit 최대 결과 수
 */
export interface BibleSearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  key: string;
}

export async function searchBible(
  query: string,
  version: BibleVersion = 'revised',
  limit: number = 50
): Promise<BibleSearchResult[]> {
  if (!query.trim()) return [];

  const bibleData = await loadBibleData(version);
  const results: BibleSearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const [key, text] of Object.entries(bibleData)) {
    if (text.toLowerCase().includes(lowerQuery)) {
      // 키 파싱: "창1:1" -> book="창", chapter=1, verse=1
      const match = key.match(/^([가-힣]+)(\d+):(\d+)$/);
      if (match) {
        const [, abbr, chapterStr, verseStr] = match;
        results.push({
          book: getBookNameFromAbbr(abbr),
          chapter: parseInt(chapterStr),
          verse: parseInt(verseStr),
          text,
          key,
        });

        if (results.length >= limit) break;
      }
    }
  }

  return results;
}
