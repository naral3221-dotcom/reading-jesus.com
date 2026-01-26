/**
 * 2026년 리딩지저스 성경 읽기 일정
 *
 * 기간: 2026년 1월 12일 (개강) ~ 2026년 12월 12일 (종강)
 *
 * 데이터 구조:
 * - date: YYYY-MM-DD 형식의 날짜
 * - reading: 해당 날짜의 성경 읽기 범위
 * - memoryVerse: 금요일 암송 구절 (선택적)
 * - isSupplementWeek: 보충 주간 여부
 * - monthTheme: 월별 주제
 */

export interface DailyReading {
  date: string;
  reading: string;
  memoryVerse?: string;
  isSupplementWeek?: boolean;
}

export interface MonthlySchedule {
  month: number;
  theme: string;
  readings: DailyReading[];
}

// 월별 주제
export const monthlyThemes: Record<number, string> = {
  1: '예배',
  2: '말씀',
  3: '동행',
  4: '회복',
  5: '찬양',
  6: '지혜',
  7: '신뢰',
  8: '새마음',
  9: '예수 그리스도',
  10: '증언',
  11: '연합',
  12: '소망',
};

// 2026년 리딩지저스 일정
export const readingSchedule2026: DailyReading[] = [
  // ===== 1월 (예배) =====
  // 1월 12일 - 리딩지저스 개강
  { date: '2026-01-12', reading: '창 1-4' },
  { date: '2026-01-13', reading: '창 5-8' },
  { date: '2026-01-14', reading: '창 9-12' },
  { date: '2026-01-15', reading: '창 13-16' },
  { date: '2026-01-16', reading: '창 17-20', memoryVerse: '창 17:1' },
  { date: '2026-01-17', reading: '창 21-24' },

  { date: '2026-01-19', reading: '창 25-28' },
  { date: '2026-01-20', reading: '창 29-32' },
  { date: '2026-01-21', reading: '창 33-36' },
  { date: '2026-01-22', reading: '창 37-40' },
  { date: '2026-01-23', reading: '창 41-45', memoryVerse: '창 45:8' },
  { date: '2026-01-24', reading: '창 46-50' },

  { date: '2026-01-26', reading: '출 1-6' },
  { date: '2026-01-27', reading: '출 7-12' },
  { date: '2026-01-28', reading: '출 13-19' },
  { date: '2026-01-29', reading: '출 20-26' },
  { date: '2026-01-30', reading: '출 27-33', memoryVerse: '출 33:15' },
  { date: '2026-01-31', reading: '출 34-40' },

  // ===== 2월 (말씀) =====
  { date: '2026-02-02', reading: '레 1-5' },
  { date: '2026-02-03', reading: '레 6-10' },
  { date: '2026-02-04', reading: '레 11-15' },
  { date: '2026-02-05', reading: '레 16-20' },
  { date: '2026-02-06', reading: '레 21-25', memoryVerse: '레 22:31' },
  { date: '2026-02-07', reading: '레 26-27' },

  { date: '2026-02-09', reading: '민 1-6' },
  { date: '2026-02-10', reading: '민 7-12' },
  { date: '2026-02-11', reading: '민 13-18' },
  { date: '2026-02-12', reading: '민 19-24' },
  { date: '2026-02-13', reading: '민 25-30', memoryVerse: '민 30:2' },
  { date: '2026-02-14', reading: '민 31-36' },

  { date: '2026-02-16', reading: '신 1-6' },
  { date: '2026-02-17', reading: '신 7-12' },
  { date: '2026-02-18', reading: '신 13-18' },
  { date: '2026-02-19', reading: '신 19-24' },
  { date: '2026-02-20', reading: '신 25-29', memoryVerse: '신 29:29' },
  { date: '2026-02-21', reading: '신 30-34' },

  // 2월 22-28일: 보충 주간
  { date: '2026-02-22', reading: '', isSupplementWeek: true },
  { date: '2026-02-23', reading: '', isSupplementWeek: true },
  { date: '2026-02-24', reading: '', isSupplementWeek: true },
  { date: '2026-02-25', reading: '', isSupplementWeek: true },
  { date: '2026-02-26', reading: '', isSupplementWeek: true },
  { date: '2026-02-27', reading: '', isSupplementWeek: true, memoryVerse: '시 119:105' },
  { date: '2026-02-28', reading: '', isSupplementWeek: true },

  // ===== 3월 (동행) =====
  { date: '2026-03-02', reading: '수 1-4' },
  { date: '2026-03-03', reading: '수 5-8' },
  { date: '2026-03-04', reading: '수 9-12' },
  { date: '2026-03-05', reading: '수 13-16' },
  { date: '2026-03-06', reading: '수 17-20', memoryVerse: '수 18:3' },
  { date: '2026-03-07', reading: '수 21-24' },

  { date: '2026-03-09', reading: '삿 1-4' },
  { date: '2026-03-10', reading: '삿 5-8' },
  { date: '2026-03-11', reading: '삿 9-12' },
  { date: '2026-03-12', reading: '삿 13-16' },
  { date: '2026-03-13', reading: '삿 17-21', memoryVerse: '삿 21:25' },
  { date: '2026-03-14', reading: '룻 1-4' },

  { date: '2026-03-16', reading: '삼상 1-5' },
  { date: '2026-03-17', reading: '삼상 6-10' },
  { date: '2026-03-18', reading: '삼상 11-15' },
  { date: '2026-03-19', reading: '삼상 16-20' },
  { date: '2026-03-20', reading: '삼상 21-25', memoryVerse: '삼상 23:16' },
  { date: '2026-03-21', reading: '삼상 26-31' },

  { date: '2026-03-23', reading: '삼하 1-4' },
  { date: '2026-03-24', reading: '삼하 5-8' },
  { date: '2026-03-25', reading: '삼하 9-12' },
  { date: '2026-03-26', reading: '삼하 13-16' },
  { date: '2026-03-27', reading: '삼하 17-20', memoryVerse: '삼하 22:31' },
  { date: '2026-03-28', reading: '삼하 21-24' },

  { date: '2026-03-30', reading: '왕상 1-4' },
  { date: '2026-03-31', reading: '왕상 5-7' },

  // ===== 4월 (회복) =====
  { date: '2026-04-01', reading: '왕상 8-10' },
  { date: '2026-04-02', reading: '왕상 11-14' },
  { date: '2026-04-03', reading: '왕상 15-18' },
  { date: '2026-04-04', reading: '왕상 19-22' },
  // 4월 5일 부활주일

  { date: '2026-04-06', reading: '왕하 1-4' },
  { date: '2026-04-07', reading: '왕하 5-8' },
  { date: '2026-04-08', reading: '왕하 9-12' },
  { date: '2026-04-09', reading: '왕하 13-16' },
  { date: '2026-04-10', reading: '왕하 17-20', memoryVerse: '왕하 18:37' },
  { date: '2026-04-11', reading: '왕하 21-25' },

  { date: '2026-04-13', reading: '대상 1-5' },
  { date: '2026-04-14', reading: '대상 6-10' },
  { date: '2026-04-15', reading: '대상 11-15' },
  { date: '2026-04-16', reading: '대상 16-20' },
  { date: '2026-04-17', reading: '대상 21-25', memoryVerse: '대상 21:26' },
  { date: '2026-04-18', reading: '대상 26-29' },

  { date: '2026-04-20', reading: '대하 1-6' },
  { date: '2026-04-21', reading: '대하 7-12' },
  { date: '2026-04-22', reading: '대하 13-18' },
  { date: '2026-04-23', reading: '대하 19-24' },
  { date: '2026-04-24', reading: '대하 25-30', memoryVerse: '대하 30:9' },
  { date: '2026-04-25', reading: '대하 31-36' },

  { date: '2026-04-27', reading: '스 1-5' },
  { date: '2026-04-28', reading: '스 6-10' },
  { date: '2026-04-29', reading: '느 1-6' },
  { date: '2026-04-30', reading: '느 7-13' },

  // ===== 5월 (찬양) =====
  { date: '2026-05-01', reading: '에 1-5', memoryVerse: '에 4:14' },
  { date: '2026-05-02', reading: '에 6-10' },

  // 5월 3-9일: 보충 주간
  { date: '2026-05-03', reading: '', isSupplementWeek: true },
  { date: '2026-05-04', reading: '', isSupplementWeek: true },
  { date: '2026-05-05', reading: '', isSupplementWeek: true },
  { date: '2026-05-06', reading: '', isSupplementWeek: true },
  { date: '2026-05-07', reading: '', isSupplementWeek: true },
  { date: '2026-05-08', reading: '', isSupplementWeek: true, memoryVerse: '시 34:1' },
  { date: '2026-05-09', reading: '', isSupplementWeek: true },

  { date: '2026-05-11', reading: '욥 1-7' },
  { date: '2026-05-12', reading: '욥 8-14' },
  { date: '2026-05-13', reading: '욥 15-21' },
  { date: '2026-05-14', reading: '욥 22-28' },
  { date: '2026-05-15', reading: '욥 29-35', memoryVerse: '욥 33:26' },
  { date: '2026-05-16', reading: '욥 36-42' },

  { date: '2026-05-18', reading: '시 1-6' },
  { date: '2026-05-19', reading: '시 7-12' },
  { date: '2026-05-20', reading: '시 13-18' },
  { date: '2026-05-21', reading: '시 19-24' },
  { date: '2026-05-22', reading: '시 25-30', memoryVerse: '시 30:11-12' },
  { date: '2026-05-23', reading: '시 31-36' },

  { date: '2026-05-25', reading: '시 37-42' },
  { date: '2026-05-26', reading: '시 43-48' },
  { date: '2026-05-27', reading: '시 49-54' },
  { date: '2026-05-28', reading: '시 55-60' },
  { date: '2026-05-29', reading: '시 61-66', memoryVerse: '시 66:1-2' },
  { date: '2026-05-30', reading: '시 67-72' },

  // ===== 6월 (지혜) =====
  { date: '2026-06-01', reading: '시 73-78' },
  { date: '2026-06-02', reading: '시 79-84' },
  { date: '2026-06-03', reading: '시 85-90' },
  { date: '2026-06-04', reading: '시 91-96' },
  { date: '2026-06-05', reading: '시 97-102', memoryVerse: '시 101:2' },
  { date: '2026-06-06', reading: '시 103-109' },

  { date: '2026-06-08', reading: '시 110-115' },
  { date: '2026-06-09', reading: '시 116-120' },
  { date: '2026-06-10', reading: '시 121-125' },
  { date: '2026-06-11', reading: '시 126-130' },
  { date: '2026-06-12', reading: '시 131-140', memoryVerse: '시 139:23-24' },
  { date: '2026-06-13', reading: '시 141-150' },

  { date: '2026-06-15', reading: '잠 1-5' },
  { date: '2026-06-16', reading: '잠 6-10' },
  { date: '2026-06-17', reading: '잠 11-15' },
  { date: '2026-06-18', reading: '잠 16-20' },
  { date: '2026-06-19', reading: '잠 21-25', memoryVerse: '잠 24:3-4' },
  { date: '2026-06-20', reading: '잠 26-31' },

  { date: '2026-06-22', reading: '전 1-3' },
  { date: '2026-06-23', reading: '전 4-6' },
  { date: '2026-06-24', reading: '전 7-9' },
  { date: '2026-06-25', reading: '전 10-12' },
  { date: '2026-06-26', reading: '아 1-4', memoryVerse: '아 2:16' },
  { date: '2026-06-27', reading: '아 5-8' },

  // 6월 28-30일: 보충 주간
  { date: '2026-06-28', reading: '', isSupplementWeek: true },
  { date: '2026-06-29', reading: '', isSupplementWeek: true },
  { date: '2026-06-30', reading: '', isSupplementWeek: true },

  // ===== 7월 (신뢰) =====
  // 7월 1-4일: 보충 주간 계속
  { date: '2026-07-01', reading: '', isSupplementWeek: true },
  { date: '2026-07-02', reading: '', isSupplementWeek: true },
  { date: '2026-07-03', reading: '', isSupplementWeek: true, memoryVerse: '사 55:6' },
  { date: '2026-07-04', reading: '', isSupplementWeek: true },

  { date: '2026-07-06', reading: '사 1-5' },
  { date: '2026-07-07', reading: '사 6-10' },
  { date: '2026-07-08', reading: '사 11-15' },
  { date: '2026-07-09', reading: '사 16-20' },
  { date: '2026-07-10', reading: '사 21-25', memoryVerse: '사 25:1' },
  { date: '2026-07-11', reading: '사 26-30' },

  { date: '2026-07-13', reading: '사 31-36' },
  { date: '2026-07-14', reading: '사 37-42' },
  { date: '2026-07-15', reading: '사 43-48' },
  { date: '2026-07-16', reading: '사 49-54' },
  { date: '2026-07-17', reading: '사 55-60', memoryVerse: '사 55:11' },
  { date: '2026-07-18', reading: '사 61-66' },

  { date: '2026-07-20', reading: '렘 1-5' },
  { date: '2026-07-21', reading: '렘 6-10' },
  { date: '2026-07-22', reading: '렘 11-15' },
  { date: '2026-07-23', reading: '렘 16-20' },
  { date: '2026-07-24', reading: '렘 21-25', memoryVerse: '렘 23:6' },
  { date: '2026-07-25', reading: '렘 26-30' },

  { date: '2026-07-27', reading: '렘 31-35' },
  { date: '2026-07-28', reading: '렘 36-40' },
  { date: '2026-07-29', reading: '렘 41-45' },
  { date: '2026-07-30', reading: '렘 46-50' },
  { date: '2026-07-31', reading: '렘 51-52', memoryVerse: '렘 51:19' },

  // ===== 8월 (새마음) =====
  { date: '2026-08-01', reading: '애 1-5' },

  { date: '2026-08-03', reading: '겔 1-4' },
  { date: '2026-08-04', reading: '겔 5-8' },
  { date: '2026-08-05', reading: '겔 9-12' },
  { date: '2026-08-06', reading: '겔 13-16' },
  { date: '2026-08-07', reading: '겔 17-20', memoryVerse: '겔 18:31-32' },
  { date: '2026-08-08', reading: '겔 21-24' },

  { date: '2026-08-10', reading: '겔 25-28' },
  { date: '2026-08-11', reading: '겔 29-32' },
  { date: '2026-08-12', reading: '겔 33-36' },
  { date: '2026-08-13', reading: '겔 37-40' },
  { date: '2026-08-14', reading: '겔 41-44', memoryVerse: '겔 43:7' },
  { date: '2026-08-15', reading: '겔 45-48' },

  { date: '2026-08-17', reading: '욜1-암3' },
  { date: '2026-08-18', reading: '암 4-9' },
  { date: '2026-08-19', reading: '옵1-욘4' },
  { date: '2026-08-20', reading: '미 1-7' },
  { date: '2026-08-21', reading: '나1-합3', memoryVerse: '합 3:17-18' },
  { date: '2026-08-22', reading: '습 1-3' },

  { date: '2026-08-24', reading: '학 1-2' },
  { date: '2026-08-25', reading: '슥 1-5' },
  { date: '2026-08-26', reading: '슥 6-10' },
  { date: '2026-08-27', reading: '슥 11-14' },
  { date: '2026-08-28', reading: '말 1-2', memoryVerse: '말 2:15b' },
  { date: '2026-08-29', reading: '말 3-4' },

  // ===== 9월 (예수 그리스도) =====
  // 9월 1-5일: 보충 주간
  { date: '2026-09-01', reading: '', isSupplementWeek: true },
  { date: '2026-09-02', reading: '', isSupplementWeek: true },
  { date: '2026-09-03', reading: '', isSupplementWeek: true },
  { date: '2026-09-04', reading: '', isSupplementWeek: true, memoryVerse: '사 53:5' },
  { date: '2026-09-05', reading: '', isSupplementWeek: true },

  { date: '2026-09-07', reading: '마 1-3' },
  { date: '2026-09-08', reading: '마 4-6' },
  { date: '2026-09-09', reading: '마 7-9' },
  { date: '2026-09-10', reading: '마 10-12' },
  { date: '2026-09-11', reading: '마 13-15', memoryVerse: '마 14:33' },
  { date: '2026-09-12', reading: '마 16-18' },

  { date: '2026-09-14', reading: '마 19-21' },
  { date: '2026-09-15', reading: '마 22-24' },
  { date: '2026-09-16', reading: '마 25-28' },
  { date: '2026-09-17', reading: '막 1-5' },
  { date: '2026-09-18', reading: '막 6-10', memoryVerse: '막 8:29' },
  { date: '2026-09-19', reading: '막 11-16' },

  { date: '2026-09-21', reading: '눅 1-4' },
  { date: '2026-09-22', reading: '눅 5-8' },
  { date: '2026-09-23', reading: '눅 9-12' },
  { date: '2026-09-24', reading: '눅 13-16' },
  { date: '2026-09-25', reading: '눅 17-20', memoryVerse: '눅 19:10' },
  { date: '2026-09-26', reading: '눅 21-24' },

  { date: '2026-09-28', reading: '요 1-4' },
  { date: '2026-09-29', reading: '요 5-8' },
  { date: '2026-09-30', reading: '요 9-12' },

  // ===== 10월 (증언) =====
  { date: '2026-10-01', reading: '요 13-16' },
  { date: '2026-10-02', reading: '요 17-19', memoryVerse: '요 18:37' },
  { date: '2026-10-03', reading: '요 20-21' },

  { date: '2026-10-05', reading: '행 1-3' },
  { date: '2026-10-06', reading: '행 4-5' },
  { date: '2026-10-07', reading: '행 6-8' },
  { date: '2026-10-08', reading: '행 9-10' },
  { date: '2026-10-09', reading: '행 11-13', memoryVerse: '행 18:37' },
  { date: '2026-10-10', reading: '행 14-15' },

  { date: '2026-10-12', reading: '행 16-18' },
  { date: '2026-10-13', reading: '행 19-20' },
  { date: '2026-10-14', reading: '행 21-22' },
  { date: '2026-10-15', reading: '행 23-24' },
  { date: '2026-10-16', reading: '행 25-26', memoryVerse: '행 26:18' },
  { date: '2026-10-17', reading: '행 27-28' },

  { date: '2026-10-19', reading: '롬 1-3' },
  { date: '2026-10-20', reading: '롬 4-6' },
  { date: '2026-10-21', reading: '롬 7-8' },
  { date: '2026-10-22', reading: '롬 9-11' },
  { date: '2026-10-23', reading: '롬 12-14', memoryVerse: '롬 12:1' },
  { date: '2026-10-24', reading: '롬 15-16' },

  { date: '2026-10-26', reading: '고전 1-4' },
  { date: '2026-10-27', reading: '고전 5-8' },
  { date: '2026-10-28', reading: '고전 9-12' },
  { date: '2026-10-29', reading: '고전 13-16' },
  { date: '2026-10-30', reading: '고후 1-3', memoryVerse: '고후 2:14' },
  { date: '2026-10-31', reading: '고후 4-6' },

  // ===== 11월 (연합) =====
  { date: '2026-11-02', reading: '고후 7-9' },
  { date: '2026-11-03', reading: '고후 10-13' },
  { date: '2026-11-04', reading: '갈 1-6' },
  { date: '2026-11-05', reading: '엡 1-3' },
  { date: '2026-11-06', reading: '엡 4-6', memoryVerse: '엡 4:3' },
  { date: '2026-11-07', reading: '빌 1-4' },

  { date: '2026-11-09', reading: '골 1-4' },
  { date: '2026-11-10', reading: '살전 1-5' },
  { date: '2026-11-11', reading: '살후 1-3' },
  { date: '2026-11-12', reading: '딤전 1-6' },
  { date: '2026-11-13', reading: '딤후 1-4', memoryVerse: '딤후 2:22' },
  { date: '2026-11-14', reading: '딛1-3, 몬' },

  { date: '2026-11-16', reading: '히 1-3' },
  { date: '2026-11-17', reading: '히 4-6' },
  { date: '2026-11-18', reading: '히 7-9' },
  { date: '2026-11-19', reading: '히 10-13' },
  { date: '2026-11-20', reading: '약 1-3', memoryVerse: '약 3:17' },
  { date: '2026-11-21', reading: '약 4-5' },

  { date: '2026-11-23', reading: '벧전 1-5' },
  { date: '2026-11-24', reading: '벧후 1-3' },
  { date: '2026-11-25', reading: '요일 1-3' },
  { date: '2026-11-26', reading: '요일 4-5' },
  { date: '2026-11-27', reading: '요2-요3', memoryVerse: '요삼 1:8' },
  { date: '2026-11-28', reading: '유다서' },

  { date: '2026-11-30', reading: '계 1' },

  // ===== 12월 (소망) =====
  { date: '2026-12-01', reading: '계 2-3' },
  { date: '2026-12-02', reading: '계 4-5' },
  { date: '2026-12-03', reading: '계 6-7' },
  { date: '2026-12-04', reading: '계 8-9', memoryVerse: '계 8:4' },
  { date: '2026-12-05', reading: '계 10-11' },

  { date: '2026-12-07', reading: '계 12-13' },
  { date: '2026-12-08', reading: '계 14-15' },
  { date: '2026-12-09', reading: '계 16-17' },
  { date: '2026-12-10', reading: '계 18-19' },
  { date: '2026-12-11', reading: '계 20-21', memoryVerse: '계 21:3-4' },
  { date: '2026-12-12', reading: '계 22' }, // 리딩지저스 종강
];

// 특별 일정 (공휴일, 이벤트 등)
export const specialDates2026: Record<string, string> = {
  '2026-01-01': '신정',
  '2026-01-12': '리딩지저스 개강',
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-03-01': '삼일절',
  '2026-03-02': '대체 공휴일',
  '2026-04-05': '부활주일',
  '2026-05-05': '어린이날',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-08-17': '대체 공휴일',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절',
  '2026-10-05': '대체 공휴일',
  '2026-10-09': '한글날',
  '2026-12-12': '리딩지저스 종강',
  '2026-12-25': '성탄절',
};

// 헬퍼 함수: 특정 날짜의 읽기 일정 가져오기
export function getReadingByDate(dateStr: string): DailyReading | undefined {
  return readingSchedule2026.find(r => r.date === dateStr);
}

// 헬퍼 함수: 특정 월의 읽기 일정 가져오기
export function getReadingsByMonth(month: number): DailyReading[] {
  const monthStr = month.toString().padStart(2, '0');
  return readingSchedule2026.filter(r => r.date.startsWith(`2026-${monthStr}`));
}

// 헬퍼 함수: 금요일 암송 구절만 가져오기
export function getMemoryVerses(): DailyReading[] {
  return readingSchedule2026.filter(r => r.memoryVerse);
}

// 헬퍼 함수: 보충 주간 가져오기
export function getSupplementWeeks(): DailyReading[] {
  return readingSchedule2026.filter(r => r.isSupplementWeek);
}

export default readingSchedule2026;
