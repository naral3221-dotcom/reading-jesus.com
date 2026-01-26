'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Loader2, PenLine, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BIBLE_BOOKS, getBibleBook } from '@/data/bibleBooks';
import { getChapter, type BibleVersion } from '@/lib/bibleLoader';
import { MeditationPanel, SelectedVerse, MeditationSubmitData } from '@/components/meditation';
import { useToast } from '@/components/ui/toast';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useCreateComment } from '@/presentation/hooks/queries/useComment';
import { useGroupCompat } from '@/presentation/hooks/stores/useGroupStore';
import { cn } from '@/lib/utils';
import { BibleAccessGuard } from '@/components/bible/BibleAccessGuard';

function BibleReaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { activeGroup } = useGroupCompat();

  const [selectedBook, setSelectedBook] = useState<string>(
    searchParams.get('book') || '창세기'
  );
  const [selectedChapter, setSelectedChapter] = useState<number>(
    parseInt(searchParams.get('chapter') || '1')
  );
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>('revised');
  const [verses, setVerses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  // 페이지 넘김 애니메이션 상태
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // 스와이프 관련 상태
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  // 사용자 정보 (React Query)
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  // 댓글 생성 mutation
  const createComment = useCreateComment();

  // 구절 선택 관련 상태
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const versesContainerRef = useRef<HTMLDivElement>(null);

  // 묵상 패널 관련 상태
  const [meditationPanelOpen, setMeditationPanelOpen] = useState(false);
  const [meditationVerses, setMeditationVerses] = useState<SelectedVerse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const book = getBibleBook(selectedBook);
  const chapters = book ? Array.from({ length: book.chapters }, (_, i) => i + 1) : [];

  // 애니메이션과 함께 장 변경
  const animateAndChangeChapter = useCallback((direction: 'left' | 'right', changeFunc: () => void) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDirection(direction);

    // 애니메이션 후 실제 변경
    setTimeout(() => {
      changeFunc();
      setSlideDirection(null);
      setIsAnimating(false);
    }, 300);
  }, [isAnimating]);

  // 성경 본문 로드
  useEffect(() => {
    async function loadVerses() {
      setLoading(true);
      const chapterData = await getChapter(selectedBook, selectedChapter, selectedVersion);
      setVerses(chapterData);
      setLoading(false);
      // 장 변경 시 선택 초기화
      setSelectedVerses(new Set());
    }
    loadVerses();
  }, [selectedBook, selectedChapter, selectedVersion]);

  const handlePrevChapter = useCallback(() => {
    const doChange = () => {
      if (selectedChapter > 1) {
        setSelectedChapter(selectedChapter - 1);
      } else if (book) {
        const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook);
        if (currentIndex > 0) {
          const prevBook = BIBLE_BOOKS[currentIndex - 1];
          setSelectedBook(prevBook.name);
          setSelectedChapter(prevBook.chapters);
        }
      }
    };
    animateAndChangeChapter('right', doChange);
  }, [selectedChapter, book, selectedBook, animateAndChangeChapter]);

  const handleNextChapter = useCallback(() => {
    const doChange = () => {
      if (book && selectedChapter < book.chapters) {
        setSelectedChapter(selectedChapter + 1);
      } else {
        const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook);
        if (currentIndex < BIBLE_BOOKS.length - 1) {
          const nextBook = BIBLE_BOOKS[currentIndex + 1];
          setSelectedBook(nextBook.name);
          setSelectedChapter(1);
        }
      }
    };
    animateAndChangeChapter('left', doChange);
  }, [book, selectedChapter, selectedBook, animateAndChangeChapter]);

  // 스와이프용 - 애니메이션 포함
  const handleSwipePrev = useCallback(() => {
    const doChange = () => {
      if (selectedChapter > 1) {
        setSelectedChapter(selectedChapter - 1);
      } else if (book) {
        const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook);
        if (currentIndex > 0) {
          const prevBook = BIBLE_BOOKS[currentIndex - 1];
          setSelectedBook(prevBook.name);
          setSelectedChapter(prevBook.chapters);
        }
      }
    };
    animateAndChangeChapter('right', doChange);
  }, [book, selectedChapter, selectedBook, animateAndChangeChapter]);

  const handleSwipeNext = useCallback(() => {
    const doChange = () => {
      if (book && selectedChapter < book.chapters) {
        setSelectedChapter(selectedChapter + 1);
      } else {
        const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook);
        if (currentIndex < BIBLE_BOOKS.length - 1) {
          const nextBook = BIBLE_BOOKS[currentIndex + 1];
          setSelectedBook(nextBook.name);
          setSelectedChapter(1);
        }
      }
    };
    animateAndChangeChapter('left', doChange);
  }, [book, selectedChapter, selectedBook, animateAndChangeChapter]);

  // 스와이프 핸들러 (패널이 열려있지 않을 때만)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (meditationPanelOpen) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (meditationPanelOpen) return;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (meditationPanelOpen) return;
    if (isAnimating) return;

    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 80;

    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        handleSwipeNext();
      } else {
        handleSwipePrev();
      }
    }
  };

  // ============================================
  // 구절 선택 로직
  // ============================================

  // 구절 선택 텍스트 생성
  const getSelectedVersesText = useCallback(() => {
    if (selectedVerses.size === 0) return '';

    const sortedVerses = Array.from(selectedVerses).sort((a, b) => a - b);
    const firstVerse = sortedVerses[0];
    const lastVerse = sortedVerses[sortedVerses.length - 1];

    // 범위 표시
    const rangeStr = firstVerse === lastVerse
      ? `${selectedBook} ${selectedChapter}:${firstVerse}`
      : `${selectedBook} ${selectedChapter}:${firstVerse}-${lastVerse}`;

    // 본문 텍스트
    const textContent = sortedVerses
      .map(v => `${v}. ${verses[v]}`)
      .join('\n');

    return `> ${rangeStr}\n> ${textContent.split('\n').join('\n> ')}`;
  }, [selectedVerses, selectedBook, selectedChapter, verses]);

  // 단일 구절 클릭 (짧은 클릭)
  const handleVerseClick = useCallback((verseNum: number) => {
    // 선택 모드 중이면 범위에 추가
    if (isSelecting && selectionStart !== null) {
      const start = Math.min(selectionStart, verseNum);
      const end = Math.max(selectionStart, verseNum);
      const newSelection = new Set<number>();
      for (let i = start; i <= end; i++) {
        newSelection.add(i);
      }
      setSelectedVerses(newSelection);
      setIsSelecting(false);
      setSelectionStart(null);
      return;
    }

    // 패널이 열려있으면 묵상 구절에 추가, 아니면 복사
    if (meditationPanelOpen) {
      // 묵상에 구절 추가
      const newVerse: SelectedVerse = {
        book: selectedBook,
        chapter: selectedChapter,
        startVerse: verseNum,
        endVerse: verseNum,
        text: verses[verseNum],
      };
      setMeditationVerses(prev => [...prev, newVerse]);
    } else {
      // 이미 선택된 구절이면 해제
      if (selectedVerses.has(verseNum)) {
        const newSelection = new Set(selectedVerses);
        newSelection.delete(verseNum);
        setSelectedVerses(newSelection);
        return;
      }

      // 새 구절 선택 + 클립보드 복사
      const newSelection = new Set(selectedVerses);
      newSelection.add(verseNum);
      setSelectedVerses(newSelection);

      const verseText = `${selectedBook} ${selectedChapter}:${verseNum} ${verses[verseNum]}`;
      navigator.clipboard.writeText(verseText);
      toast({ title: '구절이 복사되었습니다' });
    }
  }, [isSelecting, selectionStart, selectedVerses, meditationPanelOpen, selectedBook, selectedChapter, verses, toast]);

  // 꾹 누르기 시작 (범위 선택 모드)
  const handleVerseLongPressStart = useCallback((verseNum: number) => {
    longPressTimer.current = setTimeout(() => {
      setIsSelecting(true);
      setIsDraggingSelection(true);
      setSelectionStart(verseNum);
      setSelectedVerses(new Set([verseNum]));
      // 진동 피드백 (모바일)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  }, []);

  // 드래그 중 구절 위로 이동 시 범위 확장
  const handleVerseHover = useCallback((verseNum: number) => {
    if (!isDraggingSelection || selectionStart === null) return;

    const start = Math.min(selectionStart, verseNum);
    const end = Math.max(selectionStart, verseNum);
    const newSelection = new Set<number>();
    for (let i = start; i <= end; i++) {
      newSelection.add(i);
    }
    setSelectedVerses(newSelection);
  }, [isDraggingSelection, selectionStart]);

  // 터치 이동 핸들러 (드래그 선택용)
  const handleTouchMoveOnVerses = useCallback((e: React.TouchEvent) => {
    if (!isDraggingSelection) return;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const verseElement = element?.closest('[data-verse]');
    if (verseElement) {
      const verseNum = parseInt(verseElement.getAttribute('data-verse') || '0');
      if (verseNum > 0) {
        handleVerseHover(verseNum);
      }
    }
  }, [isDraggingSelection, handleVerseHover]);

  // 마우스 이동 핸들러 (드래그 선택용)
  const handleMouseMoveOnVerses = useCallback((e: React.MouseEvent) => {
    if (!isDraggingSelection) return;

    const element = document.elementFromPoint(e.clientX, e.clientY);
    const verseElement = element?.closest('[data-verse]');
    if (verseElement) {
      const verseNum = parseInt(verseElement.getAttribute('data-verse') || '0');
      if (verseNum > 0) {
        handleVerseHover(verseNum);
      }
    }
  }, [isDraggingSelection, handleVerseHover]);

  // 선택 완료 (복사 또는 묵상에 추가)
  const handleSelectionComplete = useCallback(() => {
    if (selectedVerses.size === 0) return;

    const versesText = getSelectedVersesText();
    const sortedVerses = Array.from(selectedVerses).sort((a, b) => a - b);
    const firstVerse = sortedVerses[0];
    const lastVerse = sortedVerses[sortedVerses.length - 1];

    if (meditationPanelOpen) {
      // 묵상에 구절 추가
      const newVerse: SelectedVerse = {
        book: selectedBook,
        chapter: selectedChapter,
        startVerse: firstVerse,
        endVerse: lastVerse,
        text: sortedVerses.map(v => `${v}. ${verses[v]}`).join(' '),
      };
      setMeditationVerses(prev => [...prev, newVerse]);
    } else {
      // 클립보드 복사
      navigator.clipboard.writeText(versesText.replace(/^> /gm, ''));
      toast({ title: '선택한 구절이 복사되었습니다' });
    }

    setSelectedVerses(new Set());
    setIsSelecting(false);
    setSelectionStart(null);
  }, [selectedVerses, getSelectedVersesText, meditationPanelOpen, selectedBook, selectedChapter, verses, toast]);

  // 꾹 누르기 취소 (드래그 종료)
  const handleVerseLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // 드래그 선택 중이었으면 선택 완료 처리
    if (isDraggingSelection && selectedVerses.size > 0) {
      setIsDraggingSelection(false);
      // 선택된 구절이 있으면 자동으로 삽입/복사
      handleSelectionComplete();
    }
    setIsDraggingSelection(false);
  }, [isDraggingSelection, selectedVerses.size, handleSelectionComplete]);

  // ============================================
  // 묵상 패널 로직
  // ============================================

  // 묵상 구절 제거
  const handleRemoveMeditationVerse = useCallback((index: number) => {
    setMeditationVerses(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 묵상 구절 전체 삭제
  const handleClearMeditationVerses = useCallback(() => {
    setMeditationVerses([]);
  }, []);

  // 선택된 구절을 묵상에 추가
  const handleAddVerseToMeditation = useCallback(() => {
    if (selectedVerses.size === 0) return;

    const sortedVerses = Array.from(selectedVerses).sort((a, b) => a - b);
    const firstVerse = sortedVerses[0];
    const lastVerse = sortedVerses[sortedVerses.length - 1];

    const newVerse: SelectedVerse = {
      book: selectedBook,
      chapter: selectedChapter,
      startVerse: firstVerse,
      endVerse: lastVerse,
      text: sortedVerses.map(v => `${v}. ${verses[v]}`).join(' '),
    };

    setMeditationVerses(prev => [...prev, newVerse]);
    setMeditationPanelOpen(true);
    setSelectedVerses(new Set());
  }, [selectedVerses, selectedBook, selectedChapter, verses]);

  // 묵상 발행
  const handleMeditationSubmit = useCallback(async (data: MeditationSubmitData) => {
    if (!userId) {
      toast({
        variant: 'error',
        title: '로그인이 필요합니다',
      });
      return;
    }
    if (!activeGroup) {
      toast({
        variant: 'error',
        title: '활성 그룹이 필요합니다',
        description: '먼저 그룹에 가입해주세요',
      });
      return;
    }

    setSubmitting(true);

    try {
      const dayNumber = parseInt(searchParams.get('day') || '1');

      // useCreateComment mutation 사용
      await createComment.mutateAsync({
        userId,
        groupId: activeGroup.id,
        dayNumber,
        content: data.content,
        bibleRange: data.bibleRange || undefined,
        isAnonymous: data.isAnonymous,
      });

      toast({
        variant: 'success',
        title: '묵상이 발행되었습니다',
      });

      // 상태 초기화
      setMeditationVerses([]);
      setMeditationPanelOpen(false);

    } catch (err) {
      console.error('발행 에러:', err);
      toast({
        variant: 'error',
        title: '발행에 실패했습니다',
      });
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [userId, activeGroup, searchParams, toast, createComment]);

  return (
    <div className={cn(
      "flex flex-col p-4 space-y-4 pb-24"
    )}>
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <h1 className="text-xl font-bold">성경 읽기</h1>
        </div>
      </div>

      {/* 번역본 선택 */}
      <div className="flex gap-2">
        <Select value={selectedVersion} onValueChange={(v) => setSelectedVersion(v as BibleVersion)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revised">개역개정</SelectItem>
            <SelectItem value="klb">현대인의성경</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 책/장 선택 */}
      <div className="flex gap-2">
        <Select value={selectedBook} onValueChange={setSelectedBook}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              구약
            </div>
            {BIBLE_BOOKS.filter(b => b.testament === 'old').map(book => (
              <SelectItem key={book.name} value={book.name}>
                {book.name}
              </SelectItem>
            ))}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
              신약
            </div>
            {BIBLE_BOOKS.filter(b => b.testament === 'new').map(book => (
              <SelectItem key={book.name} value={book.name}>
                {book.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedChapter.toString()}
          onValueChange={(v) => setSelectedChapter(parseInt(v))}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {chapters.map(ch => (
              <SelectItem key={ch} value={ch.toString()}>
                {ch}장
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevChapter}
          disabled={selectedBook === '창세기' && selectedChapter === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          이전 장
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextChapter}
          disabled={selectedBook === '요한계시록' && selectedChapter === 22}
        >
          다음 장
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* 선택 모드 안내 */}
      {isSelecting && (
        <div className="bg-primary/10 text-primary text-sm px-3 py-2 rounded-lg flex items-center justify-between">
          <span>구절을 선택하세요 (클릭으로 범위 끝 지정)</span>
          <Button size="sm" variant="ghost" onClick={() => {
            setIsSelecting(false);
            setSelectionStart(null);
            setSelectedVerses(new Set());
          }}>
            취소
          </Button>
        </div>
      )}

      {/* 선택된 구절 있을 때 액션 바 */}
      {selectedVerses.size > 0 && !isSelecting && (
        <div className="bg-primary text-primary-foreground text-sm px-3 py-2 rounded-lg flex items-center justify-between">
          <span>{selectedVerses.size}개 구절 선택됨</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleAddVerseToMeditation}>
              <PenLine className="w-4 h-4 mr-1" />
              묵상
            </Button>
            <Button size="sm" variant="secondary" onClick={handleSelectionComplete}>
              <Check className="w-4 h-4 mr-1" />
              {meditationPanelOpen ? '추가' : '복사'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedVerses(new Set())}>
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 본문 카드 - 스와이프 영역 */}
      <Card
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`touch-pan-y transition-all duration-300 ease-out overflow-hidden ${
          slideDirection === 'left'
            ? 'animate-slide-out-left'
            : slideDirection === 'right'
            ? 'animate-slide-out-right'
            : ''
        }`}
        style={{
          transform: slideDirection === 'left'
            ? 'translateX(-100%) rotateY(-15deg)'
            : slideDirection === 'right'
            ? 'translateX(100%) rotateY(15deg)'
            : 'translateX(0)',
          opacity: slideDirection ? 0 : 1,
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
        }}
      >
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedBook} {selectedChapter}장
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {selectedVersion === 'klb' ? '현대인의성경' : '개역개정'}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">불러오는 중...</span>
            </div>
          ) : Object.keys(verses).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>해당 장의 본문을 찾을 수 없습니다.</p>
            </div>
          ) : (
            <div
              ref={versesContainerRef}
              className="space-y-4 text-sm leading-relaxed"
              onTouchMove={handleTouchMoveOnVerses}
              onMouseMove={handleMouseMoveOnVerses}
              onMouseUp={handleVerseLongPressEnd}
              onMouseLeave={handleVerseLongPressEnd}
            >
              {Object.entries(verses)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([verseNum, text]) => {
                  const num = Number(verseNum);
                  const isSelected = selectedVerses.has(num);
                  const isRangeStart = selectionStart === num;

                  return (
                    <div
                      key={verseNum}
                      data-verse={num}
                      className={cn(
                        "flex gap-3 py-1 px-2 -mx-2 rounded-md transition-colors cursor-pointer select-none",
                        isSelected && "bg-primary/10 border-l-2 border-primary",
                        isRangeStart && "bg-primary/20",
                        !isSelected && !isDraggingSelection && "hover:bg-muted/50 active:bg-muted"
                      )}
                      onClick={() => !isDraggingSelection && handleVerseClick(num)}
                      onTouchStart={() => handleVerseLongPressStart(num)}
                      onTouchEnd={handleVerseLongPressEnd}
                      onTouchCancel={handleVerseLongPressEnd}
                      onMouseDown={() => handleVerseLongPressStart(num)}
                    >
                      <span className={cn(
                        "font-semibold shrink-0 w-6",
                        isSelected ? "text-primary" : "text-primary/70"
                      )}>
                        {verseNum}
                      </span>
                      <p className="text-foreground">{text}</p>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 하단 안내 및 묵상 작성 버튼 */}
      <div className="space-y-3 pb-4">
        <p className="text-xs text-muted-foreground text-center">
          좌우 스와이프로 이동할 수 있습니다
        </p>
        <p className="text-xs text-muted-foreground text-center">
          구절을 꾹 눌러 여러 구절을 선택할 수 있습니다
        </p>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => setMeditationPanelOpen(true)}
        >
          <PenLine className="w-4 h-4 mr-2" />
          묵상 작성하기
        </Button>
      </div>

      {/* 묵상 패널 (데스크톱: 사이드, 모바일: 바텀시트) */}
      <MeditationPanel
        isOpen={meditationPanelOpen}
        onOpenChange={setMeditationPanelOpen}
        selectedVerses={meditationVerses}
        onRemoveVerse={handleRemoveMeditationVerse}
        onClearVerses={handleClearMeditationVerses}
        onSubmit={handleMeditationSubmit}
        context="bible_reader"
        identifier={activeGroup?.id || ''}
        showCardButton={false}
        showAnonymous={true}
        isSubmitting={submitting}
      />
    </div>
  );
}

export default function BibleReaderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <BibleAccessGuard>
        <BibleReaderContent />
      </BibleAccessGuard>
    </Suspense>
  );
}
