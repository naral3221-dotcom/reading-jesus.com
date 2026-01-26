/**
 * 스트릭(연속 읽기) 계산 유틸리티
 */

/**
 * 연속 읽기 일수 계산
 * 현재 날짜부터 역순으로 확인하여 연속된 읽기 일수를 반환
 *
 * @param checkedDays - 체크된 day_number 배열
 * @param currentDay - 현재 day (그룹 시작일 기준)
 * @returns 연속 읽기 일수
 */
export function calculateStreak(checkedDays: number[], currentDay: number): number {
  if (!checkedDays.length) return 0;

  const daySet = new Set(checkedDays);
  let streak = 0;

  // 현재 날짜부터 역순으로 확인
  for (let day = currentDay; day >= 1; day--) {
    if (daySet.has(day)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 최장 연속 읽기 일수 계산
 *
 * @param checkedDays - 체크된 day_number 배열 (정렬 필요 없음)
 * @returns 최장 연속 읽기 일수
 */
export function calculateLongestStreak(checkedDays: number[]): number {
  if (!checkedDays.length) return 0;

  const sortedDays = [...checkedDays].sort((a, b) => a - b);
  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] === sortedDays[i - 1] + 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (sortedDays[i] !== sortedDays[i - 1]) {
      // 중복이 아닌 경우에만 리셋
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * 스트릭 레벨 계산
 * 스트릭 일수에 따라 표시할 레벨/색상 결정
 *
 * @param streak - 연속 읽기 일수
 * @returns 레벨 정보 (level, color, label)
 */
export function getStreakLevel(streak: number): {
  level: number;
  color: string;
  label: string;
  emoji: string;
} {
  if (streak >= 100) {
    return { level: 5, color: 'text-accent', label: '전설', emoji: '👑' };
  }
  if (streak >= 30) {
    return { level: 4, color: 'text-foreground', label: '마스터', emoji: '⭐' };
  }
  if (streak >= 14) {
    return { level: 3, color: 'text-accent', label: '열정', emoji: '🔥' };
  }
  if (streak >= 7) {
    return { level: 2, color: 'text-accent', label: '꾸준함', emoji: '🔥' };
  }
  if (streak >= 3) {
    return { level: 1, color: 'text-accent', label: '시작', emoji: '🔥' };
  }
  return { level: 0, color: 'text-muted-foreground', label: '', emoji: '' };
}

/**
 * 그룹 시작일 기준 현재 Day 계산
 *
 * @param startDate - 그룹 시작일 (YYYY-MM-DD)
 * @returns 현재 Day (1부터 시작)
 */
export function calculateCurrentDay(startDate: string): number {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays + 1);
}
