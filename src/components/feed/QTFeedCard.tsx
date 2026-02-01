'use client';

/**
 * QTFeedCard 컴포넌트
 *
 * 인스타그램 피드 + 가로 캐러셀 스타일의 통합 QT 카드입니다.
 * 모든 QT 피드 페이지에서 일관된 UI를 제공합니다.
 *
 * 디자인 특징:
 * - 프로필 + QT 헤더 고정 (날짜, 제목, 통독범위, ONE WORD)
 * - 나머지 컨텐츠 가로 스와이프 캐러셀
 * - 각 카드별 고유 디자인
 * - 하단 도트 인디케이터
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Heart,
  MessageCircle,
  Link as LinkIcon,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/date-utils';
import { getQTByDate } from '@/lib/qt-content';
import { useIsBookmarked, useToggleBookmark } from '@/presentation/hooks/queries/useUserBookmarks';
import readingPlan from '@/data/reading_plan.json';
import type { ReadingPlan, QTDailyContent } from '@/types';
import type { FeedSource, UnifiedFeedItem } from './UnifiedFeedCard';

// Day 번호로 성경 정보 가져오기
const getPlanByDay = (day: number | null | undefined): ReadingPlan | null => {
  if (!day) return null;
  return (readingPlan as ReadingPlan[]).find(p => p.day === day) ?? null;
};

// 성경 범위를 "출애굽기 7-12장" 형식으로 포맷
const formatBibleTitle = (plan: ReadingPlan | null): string => {
  if (!plan) return '';
  const { book, range } = plan;
  return `${book} ${range}장`;
};

// 답변 문자열을 배열로 파싱 (JSON 또는 단일 문자열)
function parseAnswers(answer: string | null | undefined): string[] {
  if (!answer) return [];
  try {
    const parsed = JSON.parse(answer);
    if (Array.isArray(parsed)) return parsed;
    return [answer];
  } catch {
    return [answer];
  }
}

// 캐러셀 카드 타입 (감사/기도는 하단 고정이므로 제외)
type CarouselCardType = 'verses' | 'guide' | 'questions' | 'answers' | 'sentence' | 'review';

interface CarouselCard {
  type: CarouselCardType;
  title: string;
  icon: string;
  gradient: string;
  textColor: string;
}

interface QTFeedCardProps {
  item: UnifiedFeedItem;
  currentUserId?: string | null;
  showSource?: boolean;
  onLike: (id: string, source: FeedSource) => void;
  onComment: (id: string, source: FeedSource) => void;
  onEdit?: (item: UnifiedFeedItem) => void;
  onDelete?: (item: UnifiedFeedItem) => void;
  onViewDetail?: (item: UnifiedFeedItem) => void;
  onSourceClick?: (source: FeedSource, sourceId?: string) => void;
  onChurchClick?: (churchCode: string) => void;
  onAuthorClick?: (authorId: string) => void;
}

export function QTFeedCard({
  item,
  currentUserId,
  showSource = true,
  onLike,
  onComment,
  onEdit,
  onDelete,
  onSourceClick,
  onChurchClick,
  onAuthorClick,
}: QTFeedCardProps) {
  // 상태
  const [isLiked, setIsLiked] = useState(item.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [qtContent, setQtContent] = useState<QTDailyContent | null>(null);
  const [loadingQT, setLoadingQT] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUserId && item.authorId && currentUserId === item.authorId;

  // QT 원문 로드
  useEffect(() => {
    if (item.qtDate) {
      setLoadingQT(true);
      getQTByDate(item.qtDate)
        .then(setQtContent)
        .finally(() => setLoadingQT(false));
    }
  }, [item.qtDate]);

  // QT 타입일 때 성경 정보 가져오기
  const planInfo = useMemo(() => {
    if (!item.dayNumber) return null;
    return getPlanByDay(item.dayNumber);
  }, [item.dayNumber]);

  // 성경 타이틀 (출애굽기 7-12장)
  const bibleTitle = useMemo(() => {
    if (planInfo) return formatBibleTitle(planInfo);
    if (item.bibleRange) return item.bibleRange;
    return null;
  }, [planInfo, item.bibleRange]);

  // QT 날짜 포맷 (1월 27일 화요일)
  const formattedQtDate = useMemo(() => {
    if (!item.qtDate) return null;
    const date = new Date(item.qtDate);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]}요일)`;
  }, [item.qtDate]);

  // 작성자 정보
  const displayName = item.isAnonymous ? '익명' : item.authorName;
  const avatarColor = item.isAnonymous ? 'bg-muted-foreground' : getAvatarColor(item.authorName);
  const initials = item.isAnonymous ? '?' : getInitials(item.authorName);

  // 북마크 기능
  const { data: isBookmarked = false } = useIsBookmarked(item.id, currentUserId ?? null);
  const toggleBookmark = useToggleBookmark();

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;
    toggleBookmark.mutate({
      meditationId: item.id,
      userId: currentUserId,
      source: 'unified',
    });
  }, [currentUserId, item.id, toggleBookmark]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike(item.id, item.source);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment(item.id, item.source);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAnonymous) onAuthorClick?.(item.authorId);
  };

  // 소스 라벨 생성
  const getSourceLabel = () => {
    if (item.source === 'church') return item.churchName || item.sourceName;
    if (item.source === 'group') return item.sourceName;
    return '개인';
  };

  // 묵상 질문들과 답변들
  const meditationQuestions = qtContent?.meditation?.meditationQuestions || [];
  const answers = parseAnswers(item.meditationAnswer);

  // 캐러셀 카드 목록 생성 (감사/기도는 하단 고정이므로 제외)
  const carouselCards = useMemo(() => {
    const cards: CarouselCard[] = [];

    // 오늘의 말씀
    if (qtContent?.verses && qtContent.verses.length > 0) {
      cards.push({
        type: 'verses',
        title: '오늘의 말씀',
        icon: '📖',
        gradient: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
        textColor: 'text-amber-700 dark:text-amber-300',
      });
    }

    // 묵상 길잡이
    if (qtContent?.meditation?.meditationGuide) {
      cards.push({
        type: 'guide',
        title: '묵상 길잡이',
        icon: '💭',
        gradient: 'from-purple-50 to-pink-50 dark:from-purple-950/40 dark:to-pink-950/40',
        textColor: 'text-purple-700 dark:text-purple-300',
      });
    }

    // 묵상 질문 + 답변 (함께 표시)
    if (meditationQuestions.length > 0) {
      cards.push({
        type: 'questions',
        title: '묵상 질문',
        icon: '❓',
        gradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40',
        textColor: 'text-blue-700 dark:text-blue-300',
      });
    }

    // 내 말로 한 문장 (있을 때만 표시)
    if (item.mySentence) {
      cards.push({
        type: 'sentence',
        title: '내 말로 한 문장',
        icon: '✨',
        gradient: 'from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40',
        textColor: 'text-slate-700 dark:text-slate-300',
      });
    }

    // 하루 점검 (캐러셀에 포함)
    if (item.dayReview) {
      cards.push({
        type: 'review',
        title: '하루 점검',
        icon: '✦',
        gradient: 'from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
        textColor: 'text-violet-700 dark:text-violet-300',
      });
    }

    return cards;
  }, [qtContent, item.mySentence, answers.length, item.dayReview, meditationQuestions.length]);

  // 캐러셀 스크롤 핸들러
  const scrollToSlide = useCallback((index: number) => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth',
      });
      setCurrentSlide(index);
    }
  }, []);

  // 스크롤 이벤트로 현재 슬라이드 감지
  const handleScroll = useCallback(() => {
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.offsetWidth;
      const scrollLeft = carouselRef.current.scrollLeft;
      const newSlide = Math.round(scrollLeft / slideWidth);
      if (newSlide !== currentSlide) {
        setCurrentSlide(newSlide);
      }
    }
  }, [currentSlide]);

  // 카드 내용 렌더링
  const renderCardContent = (card: CarouselCard) => {
    switch (card.type) {
      case 'verses':
        return (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            <p className="text-xs text-muted-foreground mb-2">{qtContent?.verseReference}</p>
            {qtContent?.verses?.map((verse) => (
              <div key={verse.verse} className="flex gap-2">
                <span className="text-[11px] font-bold text-primary shrink-0 w-5">{verse.verse}</span>
                <p className="text-[13px] text-foreground/90 leading-relaxed">{verse.content}</p>
              </div>
            ))}
          </div>
        );

      case 'guide':
        return (
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
            <p className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {qtContent?.meditation?.meditationGuide}
            </p>
            {qtContent?.meditation?.jesusConnection && (
              <div className="p-2.5 bg-red-50/80 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-semibold text-red-700 dark:text-red-400">예수님 연결</span>
                </div>
                <p className="text-[12px] text-foreground/80">{qtContent.meditation.jesusConnection}</p>
              </div>
            )}
          </div>
        );

      case 'questions':
        return (
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
            {meditationQuestions.map((question, index) => (
              <div key={index} className="p-3 bg-background/50 rounded-lg border border-border/40">
                {/* 질문 */}
                <div className="flex items-start gap-2">
                  <span className="text-[13px] font-bold text-primary shrink-0">Q{meditationQuestions.length > 1 ? index + 1 : ''}.</span>
                  <p className="text-[13px] text-foreground leading-relaxed">
                    {question}
                  </p>
                </div>
                {/* 해당 질문에 대한 답변 */}
                {answers[index] && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="flex items-start gap-2">
                      <span className="text-[12px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">A.</span>
                      <p className="text-[13px] text-foreground/80 leading-relaxed">
                        {answers[index]}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'answers':
        // 질문 카드에서 답변을 함께 표시하므로 별도 렌더링 불필요
        return null;

      case 'sentence':
        return (
          <div className="max-h-[200px] overflow-y-auto pr-2">
            <blockquote className="text-[15px] text-foreground leading-relaxed font-medium pl-3 border-l-2 border-primary/40">
              "{item.mySentence}"
            </blockquote>
          </div>
        );

      case 'review':
        return (
          <p className="text-[14px] text-foreground leading-[1.8] whitespace-pre-wrap max-h-[200px] overflow-y-auto pr-2">
            {item.dayReview}
          </p>
        );

      default:
        return null;
    }
  };

  return (
    <article className="mx-3 my-4 lg:mx-0 overflow-hidden">
      <div className="bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden w-full">
        {/* ========== 프로필 헤더 (고정) ========== */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-3">
            {/* 아바타 */}
            <div
              className="cursor-pointer"
              onClick={handleUserClick}
            >
              {item.authorAvatarUrl && !item.isAnonymous ? (
                <img
                  src={item.authorAvatarUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-primary/20",
                  avatarColor
                )}>
                  <span className="text-white font-semibold text-sm">{initials}</span>
                </div>
              )}
            </div>

            {/* 이름 + 소스 + 시간 */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <button
                  className="text-[14px] font-bold hover:text-primary transition-colors"
                  onClick={handleUserClick}
                >
                  {displayName}
                </button>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold">
                  QT
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                {showSource && (
                  <>
                    <button
                      className="hover:text-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.source === 'church' && item.churchCode) {
                          onChurchClick?.(item.churchCode);
                        } else if (item.source === 'group') {
                          onSourceClick?.(item.source, item.sourceId);
                        }
                      }}
                    >
                      {getSourceLabel()}
                    </button>
                    <span className="text-border">·</span>
                  </>
                )}
                <span>{formatRelativeTime(item.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* 더보기 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-muted transition-colors" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {isOwner ? (
                <>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(item)} className="gap-2">
                      <Pencil className="w-4 h-4" />
                      수정
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(item)}
                      className="text-destructive focus:text-destructive gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </DropdownMenuItem>
                  )}
                </>
              ) : (
                <DropdownMenuItem className="gap-2">
                  <LinkIcon className="w-4 h-4" />
                  링크 복사
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ========== QT 헤더 (통독일정 - 고정) ========== */}
        <div className="px-4 py-3 bg-muted/20 border-b border-border/40 overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 overflow-hidden">
              {/* 날짜 */}
              {formattedQtDate && (
                <p className="text-xs text-muted-foreground font-medium mb-1 truncate">
                  {formattedQtDate}
                </p>
              )}
              {/* QT 제목 */}
              {qtContent?.title && (
                <h2 className="text-base font-bold text-foreground mb-1.5 line-clamp-2 break-words">
                  {qtContent.title}
                </h2>
              )}
              {/* 통독 범위 */}
              {bibleTitle && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                  <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">통독: {bibleTitle}</span>
                </p>
              )}
            </div>

            {/* ONE WORD 배지 */}
            {qtContent?.meditation?.oneWord && (
              <div className="shrink-0 max-w-[140px] bg-card rounded-lg px-2.5 py-1.5 shadow-sm border border-border text-right overflow-hidden">
                <div className="flex items-center gap-1 justify-end mb-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-accent-warm shrink-0" />
                  <p className="text-[9px] text-accent-warm font-bold uppercase tracking-wide whitespace-nowrap">ONE WORD</p>
                </div>
                <p className="text-sm font-bold text-foreground truncate">{qtContent.meditation.oneWord}</p>
              </div>
            )}
          </div>
        </div>

        {/* ========== 가로 캐러셀 ========== */}
        {loadingQT ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : carouselCards.length > 0 ? (
          <div className="relative overflow-hidden">
            {/* 캐러셀 컨테이너 */}
            <div
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              onScroll={handleScroll}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {carouselCards.map((card, index) => (
                <div
                  key={card.type}
                  className="flex-shrink-0 w-full snap-center px-4 py-4"
                >
                  <div className={cn(
                    "rounded-2xl p-4 min-h-[240px] bg-gradient-to-br shadow-sm border border-border/40",
                    card.gradient
                  )}>
                    {/* 카드 헤더 */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{card.icon}</span>
                      <h3 className={cn("text-sm font-bold", card.textColor)}>{card.title}</h3>
                      <span className="ml-auto text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                        {index + 1} / {carouselCards.length}
                      </span>
                    </div>
                    {/* 카드 내용 */}
                    <div>
                      {renderCardContent(card)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 좌우 화살표 (데스크톱) */}
            {carouselCards.length > 1 && (
              <div className="hidden md:block">
                {currentSlide > 0 && (
                  <button
                    onClick={() => scrollToSlide(currentSlide - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/90 rounded-full shadow-lg flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                )}
                {currentSlide < carouselCards.length - 1 && (
                  <button
                    onClick={() => scrollToSlide(currentSlide + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/90 rounded-full shadow-lg flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                )}
              </div>
            )}

            {/* 도트 인디케이터 */}
            {carouselCards.length > 1 && (
              <div className="flex justify-center gap-1.5 pb-3 pt-1">
                {carouselCards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToSlide(index)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      index === currentSlide
                        ? "bg-primary w-4"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            아직 작성된 묵상이 없습니다.
          </div>
        )}

        {/* ========== 하단 고정: 감사와 적용 + 나의 기도 ========== */}
        {(item.gratitude || item.myPrayer) && (
          <div className="px-4 pb-4 space-y-3 overflow-hidden">
            {/* 감사와 적용 */}
            {item.gratitude && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-4 shadow-sm border border-emerald-100/50 dark:border-emerald-900/30 overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg shrink-0">💚</span>
                  <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">감사와 적용</h4>
                </div>
                <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed break-words">
                  {item.gratitude}
                </p>
              </div>
            )}

            {/* 나의 기도 */}
            {item.myPrayer && (
              <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 p-4 shadow-sm border border-sky-100/50 dark:border-sky-900/30 overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg shrink-0">🙏</span>
                  <h4 className="text-sm font-bold text-sky-700 dark:text-sky-300">나의 기도</h4>
                </div>
                <p className="text-base text-foreground whitespace-pre-wrap italic leading-relaxed break-words">
                  {item.myPrayer}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========== 액션 바 ========== */}
        <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* 좋아요 */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 px-3 rounded-full transition-all",
                isLiked && "text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
              )}
              onClick={handleLike}
            >
              <Heart className={cn(
                "w-5 h-5 transition-all",
                isLiked && "fill-current scale-110"
              )} />
              {likesCount > 0 && <span className="text-sm font-medium">{likesCount}</span>}
            </Button>

            {/* 댓글 */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-3 rounded-full"
              onClick={handleComment}
            >
              <MessageCircle className="w-5 h-5" />
              {item.repliesCount > 0 && <span className="text-sm font-medium">{item.repliesCount}</span>}
            </Button>
          </div>

          {/* 북마크 */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full transition-all",
              isBookmarked && "text-primary"
            )}
            onClick={handleBookmark}
            disabled={toggleBookmark.isPending || !currentUserId}
          >
            {toggleBookmark.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isBookmarked ? (
              <BookmarkCheck className="w-5 h-5 fill-current" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
