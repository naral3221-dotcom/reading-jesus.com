'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Loader2, PenLine } from 'lucide-react';
import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/date-utils';
import Link from 'next/link';
import { getQTByDate } from '@/lib/qt-content';
import type { QTDailyContent } from '@/types';
import { QTContentRenderer } from './QTContentRenderer';
import QTViewer from '@/components/qt/QTViewer';

interface QTSliderItem {
  id: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
  dayReview: string | null;
  qtDate: string;
  // 사용자 QT 답변 필드
  selectedWord?: string | null;
  oneSentence?: string | null;
  questionAnswer?: string | null;
  gratitude?: string | null;
  prayer?: string | null;
}

interface QTCardSliderProps {
  items: QTSliderItem[];
  churchCode: string;
  autoSlideInterval?: number; // 밀리초 단위, 기본 3000ms
}

export function QTCardSlider({
  items,
  churchCode,
  autoSlideInterval = 3000
}: QTCardSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // QT 원문 모달 상태
  const [qtModalOpen, setQtModalOpen] = useState(false);
  const [qtContent, setQtContent] = useState<QTDailyContent | null>(null);
  const [loadingQt, setLoadingQt] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QTSliderItem | null>(null);

  // 다음 슬라이드로 이동
  const goToNext = useCallback(() => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  // 이전 슬라이드로 이동
  const goToPrev = useCallback(() => {
    if (items.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  // 자동 슬라이드
  useEffect(() => {
    if (isPaused || items.length <= 1) return;

    const timer = setInterval(() => {
      goToNext();
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [isPaused, items.length, autoSlideInterval, goToNext]);

  // QT 원문 보기
  const handleViewQTContent = useCallback(async (item: QTSliderItem) => {
    setLoadingQt(true);
    setQtModalOpen(true);
    setSelectedItem(item);

    try {
      const qt = await getQTByDate(item.qtDate);
      setQtContent(qt);
    } catch (error) {
      console.error('QT 데이터 로드 실패:', error);
      setQtContent(null);
    } finally {
      setLoadingQt(false);
    }
  }, []);

  // 아이템이 없으면 렌더링하지 않음
  if (items.length === 0) {
    return null;
  }

  const currentItem = items[currentIndex];
  const displayName = currentItem.isAnonymous ? '익명' : currentItem.authorName;
  const avatarColor = currentItem.isAnonymous ? 'bg-muted-foreground' : getAvatarColor(currentItem.authorName);
  const initials = currentItem.isAnonymous ? '?' : getInitials(currentItem.authorName);

  return (
    <div className="space-y-3">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          오늘의 QT 나눔
          <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-xs font-medium">
            {items.length}
          </span>
        </h2>
        <Link
          href={`/church/${churchCode}/sharing`}
          className="text-xs text-accent hover:text-accent/80 font-medium"
        >
          전체보기 →
        </Link>
      </div>

      {/* 카드 슬라이더 */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
      >
        <Card className="overflow-hidden border-border shadow-soft bg-card">
          <div className="p-4">
            {/* 작성자 정보 */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center shrink-0 shadow-sm`}>
                <span className="text-white font-semibold text-sm">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {displayName}
                  </p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full font-medium">
                    <BookOpen className="w-3 h-3" />
                    QT
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(currentItem.createdAt)}
                </p>
              </div>
            </div>

            {/* QT 내용 */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 bg-primary text-primary-foreground rounded flex items-center justify-center text-[10px] font-bold shadow-sm">
                  ✦
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {currentItem.dayReview ? '말씀과 함께한 하루 점검' :
                   currentItem.oneSentence ? '마음에 남는 말씀' :
                   currentItem.questionAnswer ? '묵상' :
                   currentItem.gratitude ? '감사와 적용' : '나의 묵상'}
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
                {currentItem.dayReview ||
                 currentItem.oneSentence ||
                 currentItem.questionAnswer ||
                 currentItem.gratitude ||
                 currentItem.prayer ||
                 '묵상을 나눕니다'}
              </p>
            </div>

            {/* QT 보기 버튼 */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => handleViewQTContent(currentItem)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-full transition-colors"
              >
                <BookOpen className="w-3 h-3" />
                QT VIEW
              </button>
            </div>
          </div>
        </Card>

        {/* 네비게이션 버튼 (아이템이 2개 이상일 때만) */}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-muted-foreground hover:bg-white hover:text-foreground transition-all hover:scale-105"
              aria-label="이전 QT"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-muted-foreground hover:bg-white hover:text-foreground transition-all hover:scale-105"
              aria-label="다음 QT"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* 심플 네비게이션 (아이템이 2개 이상일 때만) */}
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={goToPrev}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="이전"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{currentIndex + 1}</span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-sm text-muted-foreground">{items.length}</span>
          </div>
          <button
            type="button"
            onClick={goToNext}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="다음"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* QT 원문 모달 */}
      <Dialog open={qtModalOpen} onOpenChange={setQtModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              오늘의 QT 원문
            </DialogTitle>
          </DialogHeader>

          {loadingQt ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : qtContent ? (
            <div className="space-y-4 py-2">
              {/* QTViewer 컴포넌트 사용 */}
              <QTViewer qt={qtContent} autoLoadAudio={false} />

              {/* 구분선 - 사용자 답변 영역 */}
              {selectedItem && (selectedItem.oneSentence || selectedItem.questionAnswer || selectedItem.gratitude || selectedItem.prayer || selectedItem.dayReview) && (
                <>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-dashed border-border"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-background px-4 py-1 text-sm font-semibold text-foreground flex items-center gap-2 rounded-full border border-border">
                        <PenLine className="w-4 h-4" />
                        나의 묵상
                      </span>
                    </div>
                  </div>

                  {/* 작성자 정보 */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/60 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${selectedItem.isAnonymous ? 'bg-muted-foreground' : getAvatarColor(selectedItem.authorName)} flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className="text-white font-semibold text-sm">
                        {selectedItem.isAnonymous ? '?' : getInitials(selectedItem.authorName)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {selectedItem.isAnonymous ? '익명' : selectedItem.authorName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(selectedItem.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* 사용자 답변들 - 통합 컴포넌트 사용 */}
                  <QTContentRenderer
                    data={{
                      mySentence: selectedItem.oneSentence,
                      meditationAnswer: selectedItem.questionAnswer,
                      gratitude: selectedItem.gratitude,
                      myPrayer: selectedItem.prayer,
                      dayReview: selectedItem.dayReview,
                    }}
                    qtContent={qtContent}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground/70" />
              </div>
              <p className="text-muted-foreground mb-2">해당 날짜의 QT를 찾을 수 없습니다.</p>
              <p className="text-sm text-muted-foreground/70">
                QT 데이터가 아직 등록되지 않았거나<br />
                날짜 범위를 벗어났을 수 있습니다.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
