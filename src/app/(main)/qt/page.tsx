'use client';

import { useEffect, useState, useCallback } from 'react';
import { QTDailyContent } from '@/types';
import {
  loadQTData,
  getAvailableQTMonths,
  getDefaultQTMonth,
  type QTMonthInfo,
} from '@/lib/qt-content';
import { QTCard, QTMonthSelector } from '@/components/qt';
import { Calendar, BookOpen, Loader2 } from 'lucide-react';
import { getTodayDateString } from '@/lib/date-utils';

// 월별 부제 (성경 범위)
const MONTH_SUBTITLES: Record<string, string> = {
  '2026-1': '창세기 ~ 출애굽기',
  '2026-2': '레위기 ~ 시편',
};

export default function QTListPage() {
  const [qtList, setQtList] = useState<QTDailyContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState<QTMonthInfo[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);

  // 초기 월 설정
  useEffect(() => {
    const months = getAvailableQTMonths();
    setAvailableMonths(months);

    const defaultMonth = getDefaultQTMonth();
    setSelectedYear(defaultMonth.year);
    setSelectedMonth(defaultMonth.month);
  }, []);

  // 선택된 월의 데이터 로드
  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await loadQTData(selectedYear, selectedMonth);
    setQtList(data);
    setLoading(false);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const today = getTodayDateString();
  const monthSubtitle = MONTH_SUBTITLES[`${selectedYear}-${selectedMonth}`] || '';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              QT 묵상
            </h1>
            <QTMonthSelector
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onMonthChange={handleMonthChange}
              availableMonths={availableMonths}
              className="w-[140px]"
            />
          </div>
          {monthSubtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {monthSubtitle} ({selectedYear}년 {selectedMonth}월)
            </p>
          )}
          <p className="text-xs text-muted-foreground/70 mt-1">
            DREAM FACTORY 팀 제작 · QT 가이드
          </p>
        </div>
      </div>

      {/* QT List */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3 pb-24">
        {qtList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>해당 월의 QT 데이터가 없습니다.</p>
          </div>
        ) : (
          (() => {
            // 주차별로 그룹화
            const weeks: { [key: string]: QTDailyContent[] } = {};
            qtList.forEach(qt => {
              const weekNum = Math.ceil(qt.day / 7);
              const weekKey = `${weekNum}주차`;
              if (!weeks[weekKey]) weeks[weekKey] = [];
              weeks[weekKey].push(qt);
            });

            return Object.entries(weeks).map(([weekName, qts]) => (
              <div key={weekName} className="space-y-2">
                <div className="flex items-center gap-2 py-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground">{weekName}</h2>
                  <div className="flex-1 h-px bg-border" />
                </div>
                {qts.map(qt => (
                  <QTCard
                    key={qt.date}
                    qt={qt}
                    href={`/qt/${qt.date}`}
                    isToday={qt.date === today}
                  />
                ))}
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
}
