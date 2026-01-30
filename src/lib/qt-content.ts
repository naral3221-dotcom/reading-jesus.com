/**
 * QT 컨텐츠 로딩 유틸리티
 *
 * hwpx에서 추출한 QT 데이터를 로드하고 관리합니다.
 *
 * ## 아키텍처 참고
 * - 이 파일: JSON 동적 로딩 + 유틸리티 함수 (qtToMarkdown, createQTWritingTemplate)
 * - SupabaseQTRepository: Domain Layer의 QT 엔티티를 반환하는 Repository
 * - React Query 훅 (useQT): SupabaseQTRepository를 사용하여 캐싱된 데이터 제공
 *
 * 기존 코드와의 호환성을 위해 이 파일을 유지하며,
 * 새 코드는 React Query 훅 사용을 권장합니다.
 *
 * @see src/infrastructure/repositories/SupabaseQTRepository.ts
 * @see src/presentation/hooks/queries/useQT.ts
 */

import { QTDailyContent } from '@/types';
import { getTodayDateString } from '@/lib/date-utils';

// 월별 QT 데이터 캐시 (Map<"year-month", QTDailyContent[]>)
const qtDataCache: Map<string, QTDailyContent[]> = new Map();

// 월 이름 매핑
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

// 사용 가능한 QT 월 정보
export interface QTMonthInfo {
  year: number;
  month: number;
  monthName: string;
  displayName: string;
  available: boolean;
}

/**
 * 사용 가능한 QT 월 목록 반환
 * 추후 API로 확장 가능
 */
export function getAvailableQTMonths(): QTMonthInfo[] {
  // 현재 하드코딩 - 추후 동적으로 확장 가능
  return [
    { year: 2026, month: 1, monthName: 'january', displayName: '2026년 1월', available: true },
    { year: 2026, month: 2, monthName: 'february', displayName: '2026년 2월', available: true },
  ];
}

/**
 * 특정 년/월의 QT 데이터가 사용 가능한지 확인
 */
export function isQTMonthAvailable(year: number, month: number): boolean {
  const months = getAvailableQTMonths();
  return months.some(m => m.year === year && m.month === month && m.available);
}

/**
 * QT 데이터 로드 (동적 월별 로딩)
 * @param year - 년도 (기본: 현재 년도)
 * @param month - 월 (기본: 현재 월)
 */
export async function loadQTData(year?: number, month?: number): Promise<QTDailyContent[]> {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? (now.getMonth() + 1);
  const cacheKey = `${targetYear}-${targetMonth}`;

  // 캐시 확인
  if (qtDataCache.has(cacheKey)) {
    return qtDataCache.get(cacheKey)!;
  }

  // 사용 가능한 월인지 확인
  if (!isQTMonthAvailable(targetYear, targetMonth)) {
    console.warn(`QT data not available for ${targetYear}-${targetMonth}`);
    return [];
  }

  try {
    const monthName = MONTH_NAMES[targetMonth - 1];
    const response = await fetch(`/data/qt-${monthName}-${targetYear}.json`);

    if (!response.ok) {
      console.error(`Failed to load QT data: ${response.status}`);
      return [];
    }

    const data: QTDailyContent[] = await response.json();
    qtDataCache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error loading QT data:', error);
    return [];
  }
}

/**
 * 모든 사용 가능한 월의 QT 데이터 로드
 */
export async function loadAllQTData(): Promise<QTDailyContent[]> {
  const months = getAvailableQTMonths().filter(m => m.available);
  const allData: QTDailyContent[] = [];

  for (const monthInfo of months) {
    const data = await loadQTData(monthInfo.year, monthInfo.month);
    allData.push(...data);
  }

  return allData;
}

/**
 * 특정 날짜의 QT 컨텐츠 가져오기
 * 날짜에서 년/월을 파싱하여 적절한 데이터 로드
 */
export async function getQTByDate(date: string): Promise<QTDailyContent | null> {
  // YYYY-MM-DD 형식에서 년월 파싱
  const [yearStr, monthStr] = date.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (isNaN(year) || isNaN(month)) {
    console.error(`Invalid date format: ${date}`);
    return null;
  }

  const data = await loadQTData(year, month);
  return data.find(qt => qt.date === date) || null;
}

/**
 * 특정 월의 QT 컨텐츠 목록 가져오기
 */
export async function getQTByMonth(year: number, month: number): Promise<QTDailyContent[]> {
  const data = await loadQTData(year, month);
  return data.filter(qt => qt.year === year && qt.month === month);
}

/**
 * 오늘의 QT 컨텐츠 가져오기
 */
export async function getTodayQT(): Promise<QTDailyContent | null> {
  const today = getTodayDateString();
  return getQTByDate(today);
}

/**
 * 날짜 범위의 QT 컨텐츠 가져오기
 * 범위가 여러 월에 걸칠 수 있으므로 모든 데이터 로드
 */
export async function getQTByDateRange(
  startDate: string,
  endDate: string
): Promise<QTDailyContent[]> {
  const data = await loadAllQTData();
  return data.filter(qt => qt.date >= startDate && qt.date <= endDate);
}

/**
 * 현재 날짜 기준으로 기본 선택할 월 정보 반환
 * 해당 월 데이터가 없으면 가장 최신 월로 fallback
 */
export function getDefaultQTMonth(): { year: number; month: number } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 현재 월 데이터가 있으면 반환
  if (isQTMonthAvailable(currentYear, currentMonth)) {
    return { year: currentYear, month: currentMonth };
  }

  // 없으면 가장 최신 월로 fallback
  const months = getAvailableQTMonths().filter(m => m.available);
  if (months.length > 0) {
    const latest = months[months.length - 1];
    return { year: latest.year, month: latest.month };
  }

  // fallback
  return { year: 2026, month: 1 };
}

/**
 * QT 컨텐츠를 마크다운 형식으로 변환
 */
export function qtToMarkdown(qt: QTDailyContent): string {
  const lines: string[] = [];

  // 헤더
  lines.push(`# ${qt.title || '오늘의 QT'}`);
  lines.push(`**${qt.date}** (${qt.dayOfWeek})`);
  lines.push('');

  // 통독 범위
  if (qt.bibleRange) {
    lines.push(`📖 **통독**: ${qt.bibleRange}`);
  }

  // 본문 구절
  if (qt.verseReference) {
    lines.push(`📜 **본문**: ${qt.verseReference}`);
    lines.push('');
  }

  // 성경 본문
  if (qt.verses.length > 0) {
    lines.push('## 성경 본문');
    qt.verses.forEach(v => {
      lines.push(`**${v.verse}절** ${v.content}`);
    });
    lines.push('');
  }

  // 묵상 내용
  if (qt.meditation) {
    const m = qt.meditation;

    if (m.oneWord) {
      lines.push(`## ONE WORD: ${m.oneWord}${m.oneWordSubtitle ? ` (${m.oneWordSubtitle})` : ''}`);
      lines.push('');
    }

    if (m.meditationGuide) {
      lines.push('### 묵상 길잡이');
      lines.push(m.meditationGuide);
      lines.push('');
    }

    if (m.jesusConnection) {
      lines.push('### 예수님 연결');
      lines.push(m.jesusConnection);
      lines.push('');
    }

    if (m.meditationQuestions && m.meditationQuestions.length > 0) {
      lines.push('### 묵상 질문');
      m.meditationQuestions.forEach((q, i) => {
        if (m.meditationQuestions.length > 1) {
          lines.push(`> ${i + 1}. ${q}`);
        } else {
          lines.push(`> ${q}`);
        }
      });
      lines.push('');
    }

    if (m.prayer) {
      lines.push('### 오늘의 기도');
      lines.push(`*${m.prayer}*`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * QT 작성 템플릿 생성
 */
export function createQTWritingTemplate(qt: QTDailyContent): string {
  const lines: string[] = [];

  lines.push(`## 📖 ${qt.verseReference || qt.bibleRange || '오늘의 말씀'}`);
  lines.push('');

  // 한 단어 동그라미
  lines.push('### 🔵 한 단어 동그라미');
  lines.push('본문에서 마음에 남는 단어 하나를 적어보세요.');
  lines.push('');
  lines.push('**나의 한 단어**: ');
  lines.push('');

  // 필사 구절
  if (qt.meditation?.copyVerse) {
    lines.push('### ✍️ 오늘의 필사');
    lines.push(`> ${qt.meditation.copyVerse}`);
    lines.push('');
  }

  // 내 말로 한 문장
  lines.push('### 💬 내 말로 한 문장');
  lines.push('본문 내용을 나의 말로 요약해 보세요.');
  lines.push('');
  lines.push('');

  // 묵상 질문
  if (qt.meditation?.meditationQuestions && qt.meditation.meditationQuestions.length > 0) {
    lines.push('### ❓ 묵상 질문');
    qt.meditation.meditationQuestions.forEach((q, i) => {
      if (qt.meditation!.meditationQuestions.length > 1) {
        lines.push(`> ${i + 1}. ${q}`);
      } else {
        lines.push(`> ${q}`);
      }
    });
    lines.push('');
    lines.push('**나의 묵상**: ');
    lines.push('');
  }

  // 감사와 적용
  lines.push('### 🙏 감사와 적용');
  lines.push('');
  lines.push('');

  // 나의 기도
  lines.push('### 🙌 나의 기도');
  lines.push('');

  return lines.join('\n');
}
