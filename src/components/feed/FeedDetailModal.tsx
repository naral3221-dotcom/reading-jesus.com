'use client'

/**
 * FeedDetailModal - 피드 상세 보기 모달
 *
 * 피드 카드 클릭 시 표시되는 상세 모달입니다.
 * QT 타입: QTFeedCard와 동일한 캐러셀 스타일 UI
 * 묵상 타입: 기존 스타일 유지
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Heart,
  MessageCircle,
  X,
  Lock,
  BookOpen,
  PenLine,
  Users,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/date-utils'
import { CommentSection } from '@/components/comment'
import { RichViewerWithEmbed } from '@/components/ui/rich-editor'
import { getQTByDate } from '@/lib/qt-content'
import readingPlan from '@/data/reading_plan.json'
import type { UnifiedFeedItem, FeedSource } from './UnifiedFeedCard'
import type { MeditationType } from '@/domain/entities/PublicMeditationComment'
import type { QTDailyContent, ReadingPlan } from '@/types'

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

// 캐러셀 카드 타입
type CarouselCardType = 'verses' | 'guide' | 'questions' | 'sentence-qa' | 'review';

interface CarouselCard {
  type: CarouselCardType;
  title: string;
  icon: string;
  gradient: string;
  textColor: string;
}

interface FeedDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: UnifiedFeedItem | null
  currentUserId: string | null
  onLike?: (id: string, source: FeedSource) => void
  onAuthorClick?: (authorId: string) => void
}

export function FeedDetailModal({
  open,
  onOpenChange,
  item,
  currentUserId,
  onLike,
  onAuthorClick,
}: FeedDetailModalProps) {
  // QT 원문 데이터 상태
  const [qtContent, setQtContent] = useState<QTDailyContent | null>(null)
  const [loadingQT, setLoadingQT] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  // QT 날짜가 있으면 원문 데이터 로드
  useEffect(() => {
    if (item?.type === 'qt' && item.qtDate) {
      setLoadingQT(true)
      getQTByDate(item.qtDate)
        .then(setQtContent)
        .finally(() => setLoadingQT(false))
    } else {
      setQtContent(null)
    }
  }, [item?.type, item?.qtDate])

  // QT 타입일 때 성경 정보 가져오기
  const planInfo = useMemo(() => {
    if (!item?.dayNumber) return null;
    return getPlanByDay(item.dayNumber);
  }, [item?.dayNumber]);

  // 성경 타이틀 (출애굽기 7-12장)
  const bibleTitle = useMemo(() => {
    if (planInfo) return formatBibleTitle(planInfo);
    if (item?.bibleRange) return item.bibleRange;
    return null;
  }, [planInfo, item?.bibleRange]);

  // QT 날짜 포맷 (1월 27일 화요일)
  const formattedQtDate = useMemo(() => {
    if (!item?.qtDate) return null;
    const date = new Date(item.qtDate);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]}요일)`;
  }, [item?.qtDate]);

  // 묵상 질문들과 답변들
  const meditationQuestions = qtContent?.meditation?.meditationQuestions || [];
  const answers = useMemo(() => parseAnswers(item?.meditationAnswer), [item?.meditationAnswer]);

  // 캐러셀 카드 목록 생성
  const carouselCards = useMemo(() => {
    if (item?.type !== 'qt') return [];
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

    // 묵상 질문 (별도 카드로 분리 - 답변 여부와 무관하게 표시)
    if (meditationQuestions.length > 0) {
      cards.push({
        type: 'questions',
        title: '묵상 질문',
        icon: '❓',
        gradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40',
        textColor: 'text-blue-700 dark:text-blue-300',
      });
    }

    // 한 문장 + 답변 (합쳐서 하나의 카드)
    if (item?.mySentence || answers.length > 0) {
      cards.push({
        type: 'sentence-qa',
        title: '나의 묵상',
        icon: '✨',
        gradient: 'from-slate-50 to-zinc-50 dark:from-slate-950/40 dark:to-zinc-950/40',
        textColor: 'text-slate-700 dark:text-slate-300',
      });
    }

    // 하루 점검
    if (item?.dayReview) {
      cards.push({
        type: 'review',
        title: '하루 점검',
        icon: '✦',
        gradient: 'from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
        textColor: 'text-violet-700 dark:text-violet-300',
      });
    }

    return cards;
  }, [qtContent, item?.type, item?.mySentence, answers.length, item?.dayReview, meditationQuestions.length]);

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
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
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
          <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
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
          <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
            {meditationQuestions.map((question, index) => (
              <div key={index} className="p-3 bg-background/50 rounded-lg border border-border/40">
                <div className="flex items-start gap-2">
                  <span className="text-[13px] font-bold text-primary shrink-0">Q{meditationQuestions.length > 1 ? index + 1 : ''}.</span>
                  <p className="text-[13px] text-foreground leading-relaxed">
                    {question}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'sentence-qa':
        return (
          <div className="space-y-4 max-h-[240px] overflow-y-auto pr-2">
            {item?.mySentence && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5 tracking-wide">
                  ✦ 내 말로 한 문장
                </p>
                <blockquote className="text-[15px] text-foreground leading-relaxed font-medium pl-3 border-l-2 border-primary/40">
                  "{item.mySentence}"
                </blockquote>
              </div>
            )}
            {answers.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-medium text-muted-foreground tracking-wide">
                  ✦ 나의 답변
                </p>
                {answers.map((answer, index) => (
                  <div key={index} className="pl-3 border-l-2 border-primary/20">
                    <p className="text-[13px] text-foreground/90 leading-relaxed">
                      {answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <p className="text-[14px] text-foreground leading-[1.8] whitespace-pre-wrap max-h-[240px] overflow-y-auto pr-2">
            {item?.dayReview}
          </p>
        );

      default:
        return null;
    }
  };

  if (!item) return null

  const displayName = item.isAnonymous ? '익명' : item.authorName
  const avatarColor = item.isAnonymous ? 'bg-gray-400' : getAvatarColor(item.authorName)
  const initials = item.isAnonymous ? '?' : getInitials(item.authorName)

  // 댓글 시스템용 타입 변환
  const meditationType: MeditationType = item.source

  const handleAuthorClick = () => {
    if (!item.isAnonymous && onAuthorClick) {
      onAuthorClick(item.authorId)
    }
  }

  const handleLike = () => {
    if (onLike) {
      onLike(item.id, item.source)
    }
  }

  // 소스 표시 텍스트
  const getSourceLabel = () => {
    switch (item.source) {
      case 'group':
        return item.sourceName ? `${item.sourceName} 그룹` : '그룹'
      case 'church':
        return item.sourceName ? `${item.sourceName}` : '교회'
      case 'personal':
        return '개인 묵상'
      default:
        return ''
    }
  }

  const getSourceIcon = () => {
    switch (item.source) {
      case 'group':
        return <Users className="w-4 h-4" />
      case 'church':
        return <BookOpen className="w-4 h-4" />
      case 'personal':
        return <User className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* 헤더 */}
        <DialogHeader className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              {getSourceIcon()}
              <span>{getSourceLabel()}</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="hidden lg:flex"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* 작성자 정보 */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handleAuthorClick}
              disabled={item.isAnonymous}
              className={cn(
                'relative shrink-0 ring-2 ring-background overflow-hidden rounded-full',
                !item.isAnonymous && 'cursor-pointer hover:ring-primary/50 transition-all'
              )}
            >
              {item.authorAvatarUrl && !item.isAnonymous ? (
                <Avatar className="w-12 h-12">
                  <AvatarImage src={item.authorAvatarUrl} />
                  <AvatarFallback className={avatarColor}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', avatarColor)}>
                  <span className="text-white font-medium">{initials}</span>
                </div>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAuthorClick}
                  disabled={item.isAnonymous}
                  className={cn(
                    'font-semibold',
                    !item.isAnonymous && 'hover:text-primary hover:underline transition-colors'
                  )}
                >
                  {displayName}
                </button>
                {item.isAnonymous && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm',
                  item.type === 'qt'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-accent/10 text-accent border border-accent/20'
                )}>
                  {item.type === 'qt' ? (
                    <><BookOpen className="w-2.5 h-2.5" /> QT</>
                  ) : (
                    <><PenLine className="w-2.5 h-2.5" /> 묵상</>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{formatRelativeTime(item.createdAt)}</span>
                {item.dayNumber && (
                  <>
                    <span>·</span>
                    <span className="text-primary font-medium">
                      {item.dayNumber}일차
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 내용 */}
          <div className="space-y-4">
            {/* QT 타입인 경우 - 캐러셀 스타일 */}
            {item.type === 'qt' && (
              <>
                {/* QT 헤더 (통독일정) */}
                <div className="bg-muted/20 rounded-xl p-4 border border-border/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* 날짜 */}
                      {formattedQtDate && (
                        <p className="text-xs text-muted-foreground font-medium mb-1">
                          {formattedQtDate}
                        </p>
                      )}
                      {/* QT 제목 */}
                      {qtContent?.title && (
                        <h2 className="text-base font-bold text-foreground mb-1.5 line-clamp-2">
                          {qtContent.title}
                        </h2>
                      )}
                      {/* 통독 범위 */}
                      {bibleTitle && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-primary" />
                          통독: {bibleTitle}
                        </p>
                      )}
                    </div>

                    {/* ONE WORD 배지 */}
                    {qtContent?.meditation?.oneWord && (
                      <div className="shrink-0 bg-card rounded-lg px-2.5 py-1.5 shadow-sm border border-border text-right">
                        <div className="flex items-center gap-1 justify-end mb-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-accent-warm" />
                          <p className="text-[9px] text-accent-warm font-bold uppercase tracking-wide">ONE WORD</p>
                        </div>
                        <p className="text-sm font-bold text-foreground">{qtContent.meditation.oneWord}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 가로 캐러셀 */}
                {loadingQT ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : carouselCards.length > 0 ? (
                  <div className="relative -mx-4">
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
                          className="flex-shrink-0 w-full snap-center px-4 py-2"
                        >
                          <div className={cn(
                            "rounded-2xl p-4 min-h-[280px] bg-gradient-to-br shadow-sm border border-border/40",
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
                      <div className="flex justify-center gap-1.5 pb-2 pt-1">
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

                {/* 하단 고정: 감사와 적용 + 나의 기도 */}
                {(item.gratitude || item.myPrayer) && (
                  <div className="space-y-3">
                    {/* 감사와 적용 */}
                    {item.gratitude && (
                      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-4 shadow-sm border border-emerald-100/50 dark:border-emerald-900/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">💚</span>
                          <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">감사와 적용</h4>
                        </div>
                        <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">
                          {item.gratitude}
                        </p>
                      </div>
                    )}

                    {/* 나의 기도 */}
                    {item.myPrayer && (
                      <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 p-4 shadow-sm border border-sky-100/50 dark:border-sky-900/30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">🙏</span>
                          <h4 className="text-sm font-bold text-sky-700 dark:text-sky-300">나의 기도</h4>
                        </div>
                        <p className="text-base text-foreground whitespace-pre-wrap italic leading-relaxed">
                          {item.myPrayer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* 묵상 타입인 경우 (일반 묵상 내용) */}
            {item.type === 'meditation' && item.content && (
              <div className="bg-muted/30 rounded-xl p-4 border">
                <RichViewerWithEmbed content={item.content} className="text-sm" />
              </div>
            )}
          </div>

          {/* 인터랙션 */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                'h-9 px-4 gap-2 rounded-full',
                item.isLiked
                  ? 'text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
                  : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
              )}
            >
              <Heart className={cn('w-4 h-4', item.isLiked && 'fill-current')} />
              <span className="text-sm font-medium">{item.likesCount}</span>
            </Button>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{item.repliesCount}</span>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              댓글
            </h3>
            <CommentSection
              meditationId={item.id}
              meditationType={meditationType}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
