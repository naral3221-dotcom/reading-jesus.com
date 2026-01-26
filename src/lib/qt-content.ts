/**
 * QT 컨텐츠 로딩 유틸리티
 *
 * hwpx에서 추출한 QT 데이터를 로드하고 관리합니다.
 *
 * ## 아키텍처 참고
 * - 이 파일: JSON 직접 import + 유틸리티 함수 (qtToMarkdown, createQTWritingTemplate)
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
import qtJanuary2026 from '../../data/qt-january-2026.json';

// QT 데이터를 직접 import하여 사용 (fetch 대신)
const qtDataCache: QTDailyContent[] = qtJanuary2026 as QTDailyContent[];

/**
 * QT 데이터 로드 (1월 2026년)
 */
export async function loadQTData(): Promise<QTDailyContent[]> {
  return qtDataCache;
}

/**
 * 특정 날짜의 QT 컨텐츠 가져오기
 */
export async function getQTByDate(date: string): Promise<QTDailyContent | null> {
  const data = await loadQTData();
  return data.find(qt => qt.date === date) || null;
}

/**
 * 특정 월의 QT 컨텐츠 목록 가져오기
 */
export async function getQTByMonth(year: number, month: number): Promise<QTDailyContent[]> {
  const data = await loadQTData();
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
 */
export async function getQTByDateRange(
  startDate: string,
  endDate: string
): Promise<QTDailyContent[]> {
  const data = await loadQTData();
  return data.filter(qt => qt.date >= startDate && qt.date <= endDate);
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
