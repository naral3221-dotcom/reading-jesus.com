'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Check, BookOpen, Calendar, Hash, CalendarDays, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BibleScope,
  BIBLE_BOOKS_INFO,
  TOTAL_BIBLE_CHAPTERS,
  WEEKDAYS,
} from '@/types';
import {
  calculateTotalChapters,
  calculateReadingDays,
  calculateEndDate,
  formatReadingDays,
} from '@/lib/plan-utils';
import { getTodayDateString } from '@/lib/date-utils';

interface CustomPlanWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (planData: CustomPlanData) => void;
}

export interface CustomPlanData {
  name: string;
  bible_scope: BibleScope;
  selected_books: string[];
  reading_days: number[];
  chapters_per_day: number;
  start_date: string;
  total_chapters: number;
  total_reading_days: number;
  end_date: string;
}

const STEPS = [
  { id: 1, title: '읽을 말씀', icon: BookOpen },
  { id: 2, title: '통독 요일', icon: Calendar },
  { id: 3, title: '통독 방식', icon: Hash },
  { id: 4, title: '시작일', icon: CalendarDays },
  { id: 5, title: '확인', icon: FileText },
];

export function CustomPlanWizard({ open, onOpenChange, onComplete }: CustomPlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: 읽을 말씀
  const [bibleScope, setBibleScope] = useState<BibleScope>('full');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

  // Step 2: 통독 요일
  const [readingDays, setReadingDays] = useState<number[]>([1, 2, 3, 4, 5]); // 월~금

  // Step 3: 하루 분량
  const [chaptersPerDay, setChaptersPerDay] = useState(3);

  // Step 4: 시작일
  const [startDate, setStartDate] = useState(getTodayDateString());

  // Step 5: 플랜 이름
  const [planName, setPlanName] = useState('');

  // 계산된 값들
  const totalChapters = useMemo(() => {
    return calculateTotalChapters(bibleScope, selectedBooks);
  }, [bibleScope, selectedBooks]);

  const totalReadingDays = useMemo(() => {
    if (totalChapters === 0 || chaptersPerDay === 0) return 0;
    return calculateReadingDays(totalChapters, chaptersPerDay);
  }, [totalChapters, chaptersPerDay]);

  const endDate = useMemo(() => {
    if (totalReadingDays === 0 || readingDays.length === 0) return '';
    return calculateEndDate(startDate, totalReadingDays, readingDays);
  }, [startDate, totalReadingDays, readingDays]);

  // 선택된 책 목록 가져오기
  const getSelectedBooksForScope = (): string[] => {
    if (bibleScope === 'full') {
      return [...BIBLE_BOOKS_INFO.old, ...BIBLE_BOOKS_INFO.new].map(b => b.name);
    }
    if (bibleScope === 'old') {
      return BIBLE_BOOKS_INFO.old.map(b => b.name);
    }
    if (bibleScope === 'new') {
      return BIBLE_BOOKS_INFO.new.map(b => b.name);
    }
    return selectedBooks;
  };

  const handleScopeChange = (scope: BibleScope) => {
    setBibleScope(scope);
    if (scope !== 'custom') {
      setSelectedBooks([]);
    }
  };

  const toggleBook = (bookName: string) => {
    setSelectedBooks(prev =>
      prev.includes(bookName)
        ? prev.filter(b => b !== bookName)
        : [...prev, bookName]
    );
  };

  const toggleWeekday = (day: number) => {
    setReadingDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return bibleScope !== 'custom' || selectedBooks.length > 0;
      case 2:
        return readingDays.length > 0;
      case 3:
        return chaptersPerDay > 0;
      case 4:
        return !!startDate;
      case 5:
        return planName.trim().length > 0;
      default:
        return true;
    }
  };

  const handleComplete = () => {
    const finalBooks = getSelectedBooksForScope();
    onComplete({
      name: planName.trim(),
      bible_scope: bibleScope,
      selected_books: finalBooks,
      reading_days: readingDays,
      chapters_per_day: chaptersPerDay,
      start_date: startDate,
      total_chapters: totalChapters,
      total_reading_days: totalReadingDays,
      end_date: endDate,
    });
  };

  const getScopeSummary = () => {
    switch (bibleScope) {
      case 'full':
        return `전체 성경 (66권, ${TOTAL_BIBLE_CHAPTERS.full}장)`;
      case 'old':
        return `구약 (39권, ${TOTAL_BIBLE_CHAPTERS.old}장)`;
      case 'new':
        return `신약 (27권, ${TOTAL_BIBLE_CHAPTERS.new}장)`;
      case 'custom':
        return `${selectedBooks.length}권 선택, ${totalChapters}장`;
      default:
        return '';
    }
  };

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setBibleScope('full');
      setSelectedBooks([]);
      setReadingDays([1, 2, 3, 4, 5]);
      setChaptersPerDay(3);
      setStartDate(getTodayDateString());
      setPlanName('');
    }
  }, [open]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>커스텀 통독 플랜 만들기</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Progress */}
          <div className="flex items-center justify-between mb-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    isCompleted && 'bg-primary/20 text-primary',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  'text-xs mt-1',
                  isActive && 'text-primary font-medium',
                  !isActive && 'text-muted-foreground'
                )}>
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 mx-1',
                  currentStep > step.id ? 'bg-primary/50' : 'bg-muted'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {/* Step 1: 읽을 말씀 선택 */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1. 읽을 말씀 선택하기</h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'full', label: '전체 성경', desc: `66권, ${TOTAL_BIBLE_CHAPTERS.full}장` },
                { value: 'old', label: '구약만', desc: `39권, ${TOTAL_BIBLE_CHAPTERS.old}장` },
                { value: 'new', label: '신약만', desc: `27권, ${TOTAL_BIBLE_CHAPTERS.new}장` },
                { value: 'custom', label: '직접 선택', desc: '원하는 책 선택' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleScopeChange(option.value as BibleScope)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    bibleScope === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.desc}</div>
                </button>
              ))}
            </div>

            {/* 커스텀 책 선택 */}
            {bibleScope === 'custom' && (
              <div className="border rounded-lg p-3 space-y-3 max-h-48 overflow-y-auto">
                {/* 구약 */}
                <div>
                  <div className="text-sm font-medium text-accent mb-2">구약 (39권)</div>
                  <div className="flex flex-wrap gap-1">
                    {BIBLE_BOOKS_INFO.old.map(book => (
                      <button
                        key={book.name}
                        type="button"
                        onClick={() => toggleBook(book.name)}
                        className={cn(
                          'px-2 py-1 text-xs rounded-md transition-colors',
                          selectedBooks.includes(book.name)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                      >
                        {book.name.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 신약 */}
                <div>
                  <div className="text-sm font-medium text-accent mb-2">신약 (27권)</div>
                  <div className="flex flex-wrap gap-1">
                    {BIBLE_BOOKS_INFO.new.map(book => (
                      <button
                        key={book.name}
                        type="button"
                        onClick={() => toggleBook(book.name)}
                        className={cn(
                          'px-2 py-1 text-xs rounded-md transition-colors',
                          selectedBooks.includes(book.name)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        )}
                      >
                        {book.name.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 선택 결과 */}
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">선택: </span>
              <span className="font-medium">{getScopeSummary()}</span>
            </div>
          </div>
        )}

        {/* Step 2: 통독 요일 선택 */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2. 통독 요일 선택하기</h3>
            <p className="text-sm text-muted-foreground">
              성경을 읽을 요일을 선택하세요
            </p>

            <div className="flex justify-center gap-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleWeekday(day.value)}
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    readingDays.includes(day.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {day.short}
                </button>
              ))}
            </div>

            {/* 빠른 선택 버튼 */}
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReadingDays([1, 2, 3, 4, 5])}
              >
                월~금
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReadingDays([1, 2, 3, 4, 5, 6])}
              >
                월~토
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReadingDays([0, 1, 2, 3, 4, 5, 6])}
              >
                매일
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-center">
              <span className="text-muted-foreground">선택: </span>
              <span className="font-medium">
                주 {readingDays.length}일 ({formatReadingDays(readingDays)})
              </span>
            </div>
          </div>
        )}

        {/* Step 3: 하루 분량 */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 3. 통독 방식 선택하기</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm">하루에</span>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={chaptersPerDay}
                  onChange={(e) => setChaptersPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center"
                />
                <span className="text-sm">장씩 읽기</span>
              </div>

              {/* 추천 버튼 */}
              <div className="flex gap-2">
                {[2, 3, 4, 5].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant={chaptersPerDay === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChaptersPerDay(num)}
                  >
                    {num}장
                  </Button>
                ))}
              </div>
            </div>

            {/* 계산 결과 */}
            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <span>📊</span>
                <span>계산 결과</span>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  총 <strong>{totalChapters}장</strong>을
                  하루 <strong>{chaptersPerDay}장</strong>씩 읽으면
                </p>
                <p className="text-lg font-bold text-primary">
                  {totalReadingDays}일이 필요합니다
                </p>
                <p className="text-xs text-muted-foreground">
                  (주 {readingDays.length}일 읽기 기준)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: 시작일 */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 4. 통독 시작일 선택하기</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">시작일</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* 일정 안내 */}
            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <span>📅</span>
                <span>일정 안내</span>
              </div>
              <div className="text-sm space-y-1">
                <p>시작일: <strong>{startDate}</strong></p>
                <p>종료일: <strong>{endDate || '계산 중...'}</strong></p>
                <p className="text-muted-foreground">
                  기간: {totalReadingDays}일 (실제 읽기 {totalReadingDays}일)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: 확인 */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 5. 플랜 확인 및 생성</h3>

            {/* 플랜 요약 */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="text-sm font-medium mb-3">📋 플랜 요약</div>
              <div className="text-sm space-y-1.5">
                <p><span className="text-muted-foreground">읽을 말씀:</span> {getScopeSummary()}</p>
                <p><span className="text-muted-foreground">통독 요일:</span> {formatReadingDays(readingDays)} (주 {readingDays.length}일)</p>
                <p><span className="text-muted-foreground">하루 분량:</span> {chaptersPerDay}장</p>
                <p><span className="text-muted-foreground">기간:</span> {totalReadingDays}일</p>
                <p><span className="text-muted-foreground">시작~종료:</span> {startDate} ~ {endDate}</p>
              </div>
            </div>

            {/* 플랜 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">플랜 이름</label>
              <Input
                placeholder="예: 신약 30일 완독"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                이 이름은 플랜 선택 시 표시됩니다
              </p>
            </div>
          </div>
        )}
      </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? handleCancel : () => setCurrentStep(prev => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {currentStep === 1 ? '취소' : '이전'}
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!canProceed()}
              >
                다음
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={!canProceed()}
              >
                <Check className="w-4 h-4 mr-1" />
                플랜 생성하기
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
