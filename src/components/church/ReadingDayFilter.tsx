'use client';

import { useState, useMemo } from 'react';
import { Calendar, BookOpen, Check, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import readingPlan from '@/data/reading_plan.json';
import {
  ReadingDay,
  groupByMonth,
  groupByBook,
  getUniqueMonths,
  getBooksByTestament,
  getMonthLabel
} from '@/lib/reading-plan-utils';

interface ReadingDayFilterProps {
  value: number | null;
  onChange: (dayNumber: number | null) => void;
  className?: string;
}

export function ReadingDayFilter({ value, onChange, className }: ReadingDayFilterProps) {
  const [filterMode, setFilterMode] = useState<'month' | 'book'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [testament, setTestament] = useState<'old' | 'new'>('old');

  // 그룹핑된 데이터 (메모이제이션)
  const daysByMonth = useMemo(() => groupByMonth(readingPlan as ReadingDay[]), []);
  const daysByBook = useMemo(() => groupByBook(readingPlan as ReadingDay[]), []);
  const months = useMemo(() => getUniqueMonths(readingPlan as ReadingDay[]), []);
  const booksByTestament = useMemo(() => getBooksByTestament(readingPlan as ReadingDay[]), []);

  // 현재 선택된 일정 정보
  const selectedDay = useMemo(() => {
    if (value === null) return null;
    return (readingPlan as ReadingDay[]).find(d => d.day === value) || null;
  }, [value]);

  // 월 선택 핸들러
  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    // 월 변경 시 일정 선택 초기화하지 않음 (사용자가 직접 선택)
  };

  // 성경책 선택 핸들러
  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
  };

  // 일정 선택 핸들러
  const handleDaySelect = (day: ReadingDay) => {
    onChange(day.day);
  };

  // 필터 모드 변경 핸들러
  const handleModeChange = (mode: string) => {
    setFilterMode(mode as 'month' | 'book');
    // 모드 변경 시 선택 초기화
    setSelectedMonth('');
    setSelectedBook('');
  };

  // 현재 선택된 항목에 따른 일정 목록
  const currentDays = useMemo(() => {
    if (filterMode === 'month' && selectedMonth) {
      return daysByMonth[selectedMonth] || [];
    }
    if (filterMode === 'book' && selectedBook) {
      return daysByBook[selectedBook] || [];
    }
    return [];
  }, [filterMode, selectedMonth, selectedBook, daysByMonth, daysByBook]);

  // 현재 testament의 성경책 목록
  const currentBooks = testament === 'old' ? booksByTestament.old : booksByTestament.new;

  return (
    <div className={cn('space-y-3', className)}>
      <Tabs value={filterMode} onValueChange={handleModeChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="month" className="text-xs sm:text-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            월별로 찾기
          </TabsTrigger>
          <TabsTrigger value="book" className="text-xs sm:text-sm">
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            성경으로 찾기
          </TabsTrigger>
        </TabsList>

        {/* 월별 필터 */}
        <TabsContent value="month" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 월 선택 */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">월 선택</label>
              <div className="border rounded-lg max-h-[180px] overflow-y-auto">
                {months.map(month => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => handleMonthSelect(month)}
                    className={cn(
                      'w-full px-3 py-2.5 text-left text-sm flex items-center justify-between',
                      'hover:bg-muted/50 transition-colors',
                      selectedMonth === month && 'bg-primary/10 text-primary font-medium'
                    )}
                  >
                    <span>{getMonthLabel(month)}</span>
                    {selectedMonth === month && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 일정 선택 */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                {selectedMonth ? `${selectedMonth}월 일정` : '일정 선택'}
              </label>
              <div className={cn(
                'border rounded-lg max-h-[180px] overflow-y-auto',
                !selectedMonth && 'opacity-50'
              )}>
                {selectedMonth ? (
                  currentDays.map(day => (
                    <button
                      key={day.day}
                      type="button"
                      onClick={() => handleDaySelect(day)}
                      className={cn(
                        'w-full px-3 py-2.5 text-left text-sm flex items-center justify-between',
                        'hover:bg-muted/50 transition-colors',
                        value === day.day && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <span className="truncate pr-2">
                        {day.day}일차 - {day.reading}
                      </span>
                      {value === day.day && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    먼저 월을 선택하세요
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 성경별 필터 */}
        <TabsContent value="book" className="mt-3">
          {/* 구약/신약 서브탭 */}
          <div className="flex gap-1 mb-2">
            <button
              type="button"
              onClick={() => { setTestament('old'); setSelectedBook(''); }}
              className={cn(
                'flex-1 py-1.5 text-xs rounded-md transition-colors',
                testament === 'old'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              구약 ({booksByTestament.old.length}권)
            </button>
            <button
              type="button"
              onClick={() => { setTestament('new'); setSelectedBook(''); }}
              className={cn(
                'flex-1 py-1.5 text-xs rounded-md transition-colors',
                testament === 'new'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              신약 ({booksByTestament.new.length}권)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 성경책 선택 */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">성경책 선택</label>
              <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                {currentBooks.map(book => (
                  <button
                    key={book}
                    type="button"
                    onClick={() => handleBookSelect(book)}
                    className={cn(
                      'w-full px-3 py-2.5 text-left text-sm flex items-center justify-between',
                      'hover:bg-muted/50 transition-colors',
                      selectedBook === book && 'bg-primary/10 text-primary font-medium'
                    )}
                  >
                    <span>{book}</span>
                    {selectedBook === book && <ChevronRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 일정 선택 */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                {selectedBook ? `${selectedBook} 일정` : '일정 선택'}
              </label>
              <div className={cn(
                'border rounded-lg max-h-[150px] overflow-y-auto',
                !selectedBook && 'opacity-50'
              )}>
                {selectedBook ? (
                  currentDays.map(day => (
                    <button
                      key={day.day}
                      type="button"
                      onClick={() => handleDaySelect(day)}
                      className={cn(
                        'w-full px-3 py-2.5 text-left text-sm flex items-center justify-between',
                        'hover:bg-muted/50 transition-colors',
                        value === day.day && 'bg-primary/10 text-primary font-medium'
                      )}
                    >
                      <span className="truncate pr-2">
                        {day.day}일차 - {day.reading}
                      </span>
                      {value === day.day && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    먼저 성경책을 선택하세요
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 선택된 일정 표시 */}
      {selectedDay && (
        <div className="flex items-center justify-between px-3 py-2 bg-primary/5 rounded-lg text-sm">
          <span className="text-muted-foreground">선택됨:</span>
          <span className="font-medium text-primary">
            {selectedDay.day}일차 - {selectedDay.reading}
          </span>
        </div>
      )}
    </div>
  );
}
