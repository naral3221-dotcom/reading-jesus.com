import { differenceInDays, parseISO, isAfter, startOfDay } from 'date-fns';

/**
 * 한국 시간 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다.
 * UTC 기준이 아닌 KST 기준으로 계산합니다.
 */
export function getTodayDateString(): string {
  const now = new Date();
  // 한국 시간대 오프셋 (UTC+9)
  const koreaOffset = 9 * 60; // 분 단위
  const localOffset = now.getTimezoneOffset(); // 분 단위 (UTC - local)
  const koreaTime = new Date(now.getTime() + (koreaOffset + localOffset) * 60 * 1000);

  const year = koreaTime.getFullYear();
  const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
  const day = String(koreaTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 그룹의 시작일을 기준으로 현재 Day Index를 계산합니다.
 * @param startDate - 그룹의 통독 시작일 (YYYY-MM-DD)
 * @returns 현재 Day Index (1부터 시작)
 */
export function calculateDayIndex(startDate: string): number {
  const start = parseISO(startDate);
  const today = startOfDay(new Date());

  // 시작일이 아직 안 됐으면 0 반환
  if (isAfter(start, today)) {
    return 0;
  }

  // 시작일부터 오늘까지의 일수 + 1 (1일차부터 시작)
  const dayIndex = differenceInDays(today, start) + 1;

  return dayIndex;
}

/**
 * 특정 Day Index가 현재 접근 가능한지 확인합니다.
 * @param targetDay - 확인하려는 Day Index
 * @param startDate - 그룹의 통독 시작일
 * @returns 접근 가능 여부
 */
export function isDayAccessible(targetDay: number, startDate: string): boolean {
  const currentDay = calculateDayIndex(startDate);

  // 현재 날짜까지의 일차만 접근 가능
  return targetDay > 0 && targetDay <= currentDay;
}

/**
 * 특정 Day Index가 오늘인지 확인합니다.
 * @param targetDay - 확인하려는 Day Index
 * @param startDate - 그룹의 통독 시작일
 * @returns 오늘 여부
 */
export function isToday(targetDay: number, startDate: string): boolean {
  const currentDay = calculateDayIndex(startDate);
  return targetDay === currentDay;
}

/**
 * 시작일이 유효한지 확인합니다 (과거 또는 오늘).
 * @param startDate - 확인하려는 시작일
 * @returns 유효 여부
 */
export function isValidStartDate(startDate: string): boolean {
  const start = parseISO(startDate);
  const today = startOfDay(new Date());

  return !isAfter(start, today);
}

/**
 * Day Index로부터 실제 날짜를 계산합니다.
 * @param dayIndex - Day Index
 * @param startDate - 그룹의 통독 시작일
 * @returns 해당 날짜 (Date 객체)
 */
export function getDayDate(dayIndex: number, startDate: string): Date {
  const start = parseISO(startDate);
  const date = new Date(start);
  date.setDate(date.getDate() + dayIndex - 1);
  return date;
}

/**
 * 통독 진행률을 계산합니다.
 * @param completedDays - 완료한 일수
 * @param totalDays - 전체 일수
 * @returns 진행률 (0-100)
 */
export function calculateProgress(completedDays: number, totalDays: number): number {
  if (totalDays === 0) return 0;
  return Math.round((completedDays / totalDays) * 100);
}

// ============================================
// 상대 시간 및 포맷 유틸리티 (교회 페이지용)
// ============================================

/**
 * 상대 시간 포맷 (방금 전, 5분 전, 오늘 14:30, 어제, 12월 25일)
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // 1분 미만
  if (diffSeconds < 60) {
    return '방금 전';
  }

  // 1시간 미만
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  // 오늘
  const isTodayDate = date.toDateString() === now.toDateString();
  if (isTodayDate) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `오늘 ${hours}:${minutes}`;
  }

  // 어제
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return '어제';
  }

  // 7일 이내
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }

  // 올해
  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  // 다른 해
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 한국식 날짜 포맷 (12월 28일 (토))
 */
export function formatKoreanDate(dateString: string): string {
  const date = new Date(dateString);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];

  return `${month}월 ${day}일 (${dayOfWeek})`;
}

/**
 * 한국식 날짜 포맷 (년도 포함)
 */
export function formatKoreanDateWithYear(dateString: string): string {
  const date = new Date(dateString);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];

  return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
}

/**
 * 짧은 날짜 포맷 (12/28)
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// ============================================
// 아바타 유틸리티
// ============================================

/**
 * 이름에서 이니셜 추출 (아바타용)
 */
export function getInitials(name: string): string {
  if (!name) return '?';

  // 한글 이름: 첫 글자
  if (/[가-힣]/.test(name)) {
    return name.charAt(0);
  }

  // 영문 이름: 첫 두 글자의 대문자
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  return name.charAt(0).toUpperCase();
}

/**
 * 이름 기반 아바타 색상 생성 (일관된 색상 반환)
 * 모든 색상은 흰색 텍스트와 충분한 대비(WCAG AA)를 보장합니다.
 */
export function getAvatarColor(name: string): string {
  // 흰색 텍스트와 충분한 대비를 보장하는 진한 색상 팔레트 (500-700 레벨)
  const colors = [
    'bg-slate-600',
    'bg-slate-700',
    'bg-gray-600',
    'bg-gray-700',
    'bg-zinc-600',
    'bg-zinc-700',
    'bg-neutral-600',
    'bg-neutral-700',
    'bg-stone-600',
    'bg-stone-700',
    'bg-primary',
  ];

  // 빈 이름 처리 - 기본 색상 반환
  if (!name || name.trim().length === 0) {
    return 'bg-slate-600';
  }

  // 이름의 문자 코드 합으로 색상 결정
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
