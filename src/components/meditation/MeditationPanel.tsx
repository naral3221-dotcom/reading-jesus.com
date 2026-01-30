'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MeditationEditor, SelectedVerse, MeditationSubmitData } from './MeditationEditor';
import type { ContentVisibility } from '@/domain/entities/PublicMeditation';
import { VerseCardGenerator } from '@/components/church/VerseCardGenerator';
import { cn } from '@/lib/utils';
import {
  X,
  PenLine,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MeditationPanelProps {
  // 패널 상태
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;

  // 묵상 에디터 Props
  selectedVerses?: SelectedVerse[];
  onRemoveVerse?: (index: number) => void;
  onClearVerses?: () => void;
  onSubmit: (data: MeditationSubmitData) => Promise<void>;

  // 컨텍스트
  context: 'bible_reader' | 'church_bible' | 'church_sharing';
  identifier?: string;

  // 옵션
  showCardButton?: boolean;
  showDayPicker?: boolean;
  showAnonymous?: boolean;
  defaultAnonymous?: boolean;
  showVisibility?: boolean;
  defaultVisibility?: ContentVisibility;
  allowedVisibilityOptions?: ContentVisibility[];
  initialAuthorName?: string;
  churchName?: string; // 카드 생성용

  // 제출 상태
  isSubmitting?: boolean;

  // 스타일
  className?: string;
}

export function MeditationPanel({
  isOpen,
  onOpenChange,
  selectedVerses = [],
  onRemoveVerse,
  onClearVerses,
  onSubmit,
  context,
  identifier,
  showCardButton = true,
  showDayPicker = false,
  showAnonymous = false,
  defaultAnonymous = false,
  showVisibility = false,
  defaultVisibility = 'public',
  allowedVisibilityOptions = ['private', 'church', 'public'],
  initialAuthorName = '',
  churchName,
  isSubmitting = false,
  className,
}: MeditationPanelProps) {
  // 패널 확장 상태
  const [isExpanded, setIsExpanded] = useState(false);

  // 카드 생성 다이얼로그
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [cardVerse, setCardVerse] = useState<SelectedVerse | null>(null);
  // 카드 이미지 삽입용 상태
  const [cardImageToInsert, setCardImageToInsert] = useState<string>('');

  // 모바일 감지
  const [isMobile, setIsMobile] = useState(false);

  // 드래그 관련 상태
  const [sheetHeight, setSheetHeight] = useState(60); // vh 단위
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(60);
  const isDragging = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 드래그 시작
  const handleDragStart = useCallback((clientY: number) => {
    isDragging.current = true;
    dragStartY.current = clientY;
    dragStartHeight.current = sheetHeight;
  }, [sheetHeight]);

  // 드래그 중
  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging.current || dragStartY.current === null) return;

    const deltaY = dragStartY.current - clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.min(90, Math.max(30, dragStartHeight.current + deltaVh));
    setSheetHeight(newHeight);
  }, []);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    dragStartY.current = null;

    // 스냅 포인트: 30%, 60%, 90%
    if (sheetHeight < 45) {
      setSheetHeight(30);
      setIsExpanded(false);
    } else if (sheetHeight < 75) {
      setSheetHeight(60);
      setIsExpanded(false);
    } else {
      setSheetHeight(90);
      setIsExpanded(true);
    }
  }, [sheetHeight]);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // 카드 생성 핸들러
  const handleCreateCard = (verse: SelectedVerse) => {
    setCardVerse(verse);
    setCardDialogOpen(true);
  };

  // 카드 이미지가 생성되면 에디터에 삽입
  const handleCardImageCreated = useCallback((imageDataUrl: string) => {
    setCardImageToInsert(imageDataUrl);
  }, []);

  // 카드 이미지 삽입 후 상태 초기화
  const handleCardImageInserted = useCallback(() => {
    setCardImageToInsert('');
  }, []);

  // 패널 너비 계산
  const panelWidth = isExpanded ? 'w-[500px]' : 'w-[380px]';

  // 모바일: 바텀시트
  if (isMobile) {
    return (
      <>
        {/* 플로팅 버튼 */}
        {!isOpen && (
          <button
            onClick={() => onOpenChange(true)}
            className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <PenLine className="w-6 h-6" />
            {selectedVerses.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                {selectedVerses.length}
              </span>
            )}
          </button>
        )}

        {/* 바텀시트 */}
        {isOpen && (
          <>
            {/* 오버레이 - 투명하게 변경하여 배경 말씀 선택 가능 */}
            <div
              className="fixed inset-0 z-40 pointer-events-none"
              aria-hidden="true"
            />

            {/* 시트 */}
            <div
              className={cn(
                'fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl',
                'flex flex-col',
                isDragging.current ? '' : 'transition-[height] duration-300 ease-out'
              )}
              style={{ height: `${sheetHeight}vh` }}
            >
              {/* 드래그 핸들 영역 */}
              <div
                className="flex-shrink-0 flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="w-12 h-1.5 bg-muted-foreground/40 rounded-full" />
              </div>

              {/* 헤더 */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 pb-2 border-b">
                <h3 className="font-medium">묵상 작성</h3>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (sheetHeight < 75) {
                        setSheetHeight(90);
                        setIsExpanded(true);
                      } else {
                        setSheetHeight(60);
                        setIsExpanded(false);
                      }
                    }}
                  >
                    {sheetHeight >= 75 ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 에디터 - flex-1로 남은 공간 채우고 내부 스크롤, 스크롤바 숨김 */}
              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4 pb-safe">
                <MeditationEditor
                  onSubmit={onSubmit}
                  selectedVerses={selectedVerses}
                  onRemoveVerse={onRemoveVerse}
                  onClearVerses={onClearVerses}
                  onCreateCard={showCardButton ? handleCreateCard : undefined}
                  showCardButton={showCardButton}
                  showDayPicker={showDayPicker}
                  cardImageToInsert={cardImageToInsert}
                  onCardImageInserted={handleCardImageInserted}
                  context={context}
                  identifier={identifier}
                  showAnonymous={showAnonymous}
                  defaultAnonymous={defaultAnonymous}
                  showVisibility={showVisibility}
                  defaultVisibility={defaultVisibility}
                  allowedVisibilityOptions={allowedVisibilityOptions}
                  initialAuthorName={initialAuthorName}
                  isSubmitting={isSubmitting}
                  minHeight="150px"
                />
              </div>
            </div>
          </>
        )}

        {/* 카드 생성 다이얼로그 */}
        {cardVerse && (
          <VerseCardGenerator
            open={cardDialogOpen}
            onOpenChange={setCardDialogOpen}
            verse={cardVerse.text}
            reference={`${cardVerse.book} ${cardVerse.chapter}:${
              cardVerse.startVerse === cardVerse.endVerse
                ? cardVerse.startVerse
                : `${cardVerse.startVerse}-${cardVerse.endVerse}`
            }`}
            churchName={churchName}
            onCardCreated={handleCardImageCreated}
          />
        )}
      </>
    );
  }

  // 데스크톱: 사이드 패널
  return (
    <>
      {/* 사이드 패널 */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full bg-background border-l shadow-xl z-40',
          'transform transition-all duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          panelWidth,
          className
        )}
      >
        {/* 토글 버튼 (패널 왼쪽에 부착) */}
        <button
          onClick={() => onOpenChange(!isOpen)}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -left-10 z-50',
            'w-10 h-20 bg-primary text-primary-foreground rounded-l-lg shadow-lg',
            'flex flex-col items-center justify-center gap-1',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          {isOpen ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <PenLine className="w-5 h-5" />
              {selectedVerses.length > 0 && (
                <span className="text-xs font-medium">{selectedVerses.length}</span>
              )}
            </>
          )}
        </button>

        {/* 패널 콘텐츠 */}
        <div className="h-full flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium flex items-center gap-2">
              <PenLine className="w-4 h-4" />
              묵상 작성
            </h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? '패널 축소' : '패널 확장'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 에디터 - 스크롤바 숨김 */}
          <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
            <MeditationEditor
              onSubmit={onSubmit}
              selectedVerses={selectedVerses}
              onRemoveVerse={onRemoveVerse}
              onClearVerses={onClearVerses}
              onCreateCard={showCardButton ? handleCreateCard : undefined}
              showCardButton={showCardButton}
              showDayPicker={showDayPicker}
              cardImageToInsert={cardImageToInsert}
              onCardImageInserted={handleCardImageInserted}
              context={context}
              identifier={identifier}
              showAnonymous={showAnonymous}
              defaultAnonymous={defaultAnonymous}
              showVisibility={showVisibility}
              defaultVisibility={defaultVisibility}
              allowedVisibilityOptions={allowedVisibilityOptions}
              initialAuthorName={initialAuthorName}
              isSubmitting={isSubmitting}
              minHeight="300px"
            />
          </div>
        </div>
      </div>

      {/* 카드 생성 다이얼로그 */}
      {cardVerse && (
        <VerseCardGenerator
          open={cardDialogOpen}
          onOpenChange={setCardDialogOpen}
          verse={cardVerse.text}
          reference={`${cardVerse.book} ${cardVerse.chapter}:${
            cardVerse.startVerse === cardVerse.endVerse
              ? cardVerse.startVerse
              : `${cardVerse.startVerse}-${cardVerse.endVerse}`
          }`}
          churchName={churchName}
          onCardCreated={handleCardImageCreated}
        />
      )}
    </>
  );
}

// 플로팅 버튼만 있는 간단한 버전 (패널 없이 사용)
export function MeditationFloatingButton({
  onClick,
  badgeCount = 0,
  className,
}: {
  onClick: () => void;
  badgeCount?: number;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'flex items-center justify-center',
        'hover:bg-primary/90 transition-colors',
        className
      )}
    >
      <PenLine className="w-6 h-6" />
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
          {badgeCount}
        </span>
      )}
    </button>
  );
}
