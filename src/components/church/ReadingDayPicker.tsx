'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar, Search, X, ChevronDown, BookOpen } from 'lucide-react';
import readingPlan from '@/data/reading_plan.json';
import { getTodayDateString } from '@/lib/date-utils';

interface ReadingDay {
  day: number;
  date: string;
  display_date: string;
  book: string;
  range: string;
  reading: string;
  memory_verse: string | null;
}

interface ReadingDayPickerProps {
  value: number | null;
  onChange: (dayNumber: number | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ReadingDayPicker({
  value,
  onChange,
  placeholder = '통독일정 선택',
  className,
  disabled = false,
}: ReadingDayPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const plan = readingPlan as ReadingDay[];

  // 선택된 일정 정보
  const selectedDay = useMemo(() => {
    if (value === null) return null;
    return plan.find(d => d.day === value) || null;
  }, [value, plan]);

  // 검색 필터링
  const filteredDays = useMemo(() => {
    if (!searchQuery.trim()) return plan;

    const query = searchQuery.toLowerCase().trim();

    // 숫자만 입력한 경우 day로 검색
    if (/^\d+$/.test(query)) {
      const dayNum = parseInt(query);
      return plan.filter(d =>
        d.day.toString().startsWith(query) ||
        d.day === dayNum
      );
    }

    // 날짜로 검색 (예: 1/12, 01-12)
    if (/^\d{1,2}[\/\-]\d{1,2}$/.test(query)) {
      return plan.filter(d =>
        d.display_date.includes(query.replace('-', '/'))
      );
    }

    // 성경 책 또는 범위로 검색
    return plan.filter(d =>
      d.reading.toLowerCase().includes(query) ||
      d.book.toLowerCase().includes(query) ||
      d.display_date.includes(query)
    );
  }, [searchQuery, plan]);

  // 팝오버 열릴 때 선택된 항목으로 스크롤
  useEffect(() => {
    if (open && value && listRef.current) {
      // 약간의 딜레이 후 스크롤 (렌더링 대기)
      setTimeout(() => {
        const selectedElement = listRef.current?.querySelector(`[data-day="${value}"]`);
        if (selectedElement) {
          selectedElement.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
      }, 50);
    }
    // 열릴 때 검색창 포커스
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, value]);

  // 오늘 날짜에 해당하는 일정 찾기
  const getTodayDay = () => {
    const today = getTodayDateString();
    const todayPlan = plan.find(d => d.date === today);
    return todayPlan?.day || null;
  };

  // 오늘 일정으로 설정
  const handleSetToday = () => {
    const todayDay = getTodayDay();
    if (todayDay) {
      onChange(todayDay);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Calendar className="w-4 h-4 shrink-0" />
            {selectedDay ? (
              <span className="truncate">
                {selectedDay.day}일차 - {selectedDay.reading}
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronDown className={cn(
            'w-4 h-4 shrink-0 opacity-50 transition-transform',
            open && 'rotate-180'
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-2 border-b space-y-2">
          {/* 검색창 */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="일차, 날짜, 성경 검색..."
              className="pl-8 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 빠른 선택 버튼 */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={handleSetToday}
            >
              오늘 일정
            </Button>
            {value && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                선택 해제
              </Button>
            )}
          </div>
        </div>

        {/* 일정 목록 */}
        <div
          ref={listRef}
          className="max-h-[300px] overflow-y-auto"
        >
          {filteredDays.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="py-1">
              {filteredDays.map((day) => (
                <button
                  key={day.day}
                  data-day={day.day}
                  onClick={() => {
                    onChange(day.day);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left hover:bg-muted/50 flex items-start gap-3 transition-colors',
                    value === day.day && 'bg-primary/10'
                  )}
                >
                  <div className={cn(
                    'shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs',
                    value === day.day
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}>
                    <span className="font-bold text-sm">{day.day}</span>
                    <span className="opacity-70">일차</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium text-sm truncate">{day.reading}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {day.date} ({day.display_date})
                    </div>
                    {day.memory_verse && (
                      <div className="text-xs text-primary/80 mt-0.5 truncate">
                        암송: {day.memory_verse}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// 날짜로 통독일정 day 찾기 유틸리티
export function findDayByDate(date: string): number | null {
  const plan = readingPlan as ReadingDay[];
  const found = plan.find(d => d.date === date);
  return found?.day || null;
}

// day로 통독일정 정보 찾기 유틸리티
export function findReadingByDay(dayNumber: number): ReadingDay | null {
  const plan = readingPlan as ReadingDay[];
  return plan.find(d => d.day === dayNumber) || null;
}

// 통독 일정 총 일수 반환
export function getTotalReadingDays(): number {
  const plan = readingPlan as ReadingDay[];
  return plan.length;
}

// 통독 일정 전체 데이터 반환
export function getReadingPlan(): ReadingDay[] {
  return readingPlan as ReadingDay[];
}
