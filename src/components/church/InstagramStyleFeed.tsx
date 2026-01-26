'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Heart,
  MessageCircle,
  Share2,
  Lock,
  BookOpen,
  PenLine,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/date-utils';
import { extractImagesFromHtml, removeImagesFromHtml } from '@/components/ui/rich-editor';
import { hasQTContent } from './QTContentRenderer';
import { FeedItem, FeedItemType } from './FeedCard';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const RichViewerWithEmbed = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichViewerWithEmbed),
  { ssr: false }
);

// 확장된 그라데이션 배경 색상들 (20가지 이상)
const GRADIENT_BACKGROUNDS = [
  // 기본 그라데이션 (대각선)
  'from-violet-500/90 via-purple-500/90 to-fuchsia-500/90',
  'from-muted0/90 via-cyan-500/90 to-teal-500/90',
  'from-muted0/90 via-amber-500/90 to-yellow-500/90',
  'from-rose-500/90 via-pink-500/90 to-fuchsia-500/90',
  'from-emerald-500/90 via-green-500/90 to-lime-500/90',
  'from-indigo-500/90 via-blue-500/90 to-cyan-500/90',
  'from-slate-600/90 via-slate-500/90 to-gray-500/90',
  'from-red-500/90 via-rose-500/90 to-pink-500/90',
  // 새로운 그라데이션 - 더 풍부한 색상
  'from-purple-600/90 via-pink-500/90 to-orange-400/90',
  'from-teal-500/90 via-emerald-500/90 to-green-400/90',
  'from-fuchsia-600/90 via-purple-500/90 to-indigo-500/90',
  'from-muted0/90 via-orange-500/90 to-red-500/90',
  'from-cyan-500/90 via-blue-500/90 to-indigo-500/90',
  'from-lime-500/90 via-green-500/90 to-emerald-500/90',
  'from-pink-500/90 via-rose-500/90 to-red-400/90',
  'from-sky-500/90 via-blue-500/90 to-violet-500/90',
  // 다크 톤 그라데이션
  'from-slate-800/95 via-slate-700/95 to-slate-600/95',
  'from-zinc-800/95 via-neutral-700/95 to-stone-600/95',
  // 파스텔 톤
  'from-rose-400/85 via-pink-400/85 to-fuchsia-400/85',
  'from-sky-400/85 via-cyan-400/85 to-teal-400/85',
  // 비비드 그라데이션
  'from-yellow-500/90 via-amber-500/90 to-orange-600/90',
  'from-violet-600/90 via-purple-600/90 to-fuchsia-600/90',
];

// QT 전용 따뜻한 그라데이션
const QT_GRADIENTS = [
  'from-amber-600/90 via-orange-500/90 to-rose-500/90',
  'from-muted0/90 via-amber-500/90 to-yellow-400/90',
  'from-rose-500/90 via-orange-500/90 to-muted0/90',
  'from-yellow-600/90 via-amber-500/90 to-muted0/90',
];

// 묵상 전용 차분한 그라데이션
const MEDITATION_GRADIENTS = [
  'from-blue-600/90 via-indigo-500/90 to-muted0/90',
  'from-indigo-600/90 via-violet-500/90 to-muted0/90',
  'from-slate-700/90 via-blue-700/90 to-indigo-600/90',
  'from-cyan-600/90 via-blue-600/90 to-indigo-500/90',
];

// 패턴 오버레이 종류
const PATTERN_OVERLAYS = [
  'bg-pattern-dots',
  'bg-pattern-lines',
  'bg-pattern-cross',
  '',  // 패턴 없음
];

// 이름 기반으로 일관된 그라데이션 반환
function getGradientByName(name: string, type?: 'qt' | 'meditation'): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 타입에 따라 다른 그라데이션 배열 사용
  if (type === 'qt') {
    const index = Math.abs(hash) % QT_GRADIENTS.length;
    return QT_GRADIENTS[index];
  } else if (type === 'meditation') {
    const index = Math.abs(hash) % MEDITATION_GRADIENTS.length;
    return MEDITATION_GRADIENTS[index];
  }

  const index = Math.abs(hash) % GRADIENT_BACKGROUNDS.length;
  return GRADIENT_BACKGROUNDS[index];
}

// 이름 기반으로 패턴 오버레이 반환
function getPatternByName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 3) - hash);
  }
  const index = Math.abs(hash) % PATTERN_OVERLAYS.length;
  return PATTERN_OVERLAYS[index];
}

interface InstagramStyleFeedProps {
  items: FeedItem[];
  currentUserId?: string | null;
  onLike: (id: string, type: FeedItemType) => void;
  onComment: (id: string, type: FeedItemType) => void;
  onShare?: (item: FeedItem) => void;
  onWrite?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
}

// 개별 스토리 카드 컴포넌트
function StoryCard({
  item,
  onLike,
  onComment,
  onShare,
  isActive,
}: {
  item: FeedItem;
  currentUserId?: string | null;
  onLike: (id: string, type: FeedItemType) => void;
  onComment: (id: string, type: FeedItemType) => void;
  onShare?: (item: FeedItem) => void;
  isActive: boolean;
}) {
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likesCount, setLikesCount] = useState(item.likesCount);
  const [expanded, setExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const lastTapRef = useRef<number>(0);

  const displayName = item.isAnonymous ? '익명' : item.authorName;
  const avatarColor = item.isAnonymous ? 'bg-gray-400' : getAvatarColor(item.authorName);
  const initials = item.isAnonymous ? '?' : getInitials(item.authorName);
  // 타입에 따라 다른 그라데이션 적용
  const gradient = getGradientByName(item.authorName, item.type);
  const pattern = getPatternByName(item.authorName);

  // 콘텐츠에서 이미지 분리
  const { contentWithoutImages, images } = useMemo(() => {
    if (item.type === 'meditation' && item.content?.startsWith('<')) {
      return {
        contentWithoutImages: removeImagesFromHtml(item.content),
        images: extractImagesFromHtml(item.content),
      };
    }
    return { contentWithoutImages: item.content || '', images: [] };
  }, [item.type, item.content]);

  const handleLike = () => {
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    onLike(item.id, item.type);
  };

  // 더블 탭 좋아요
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // 더블 탭 감지 - 좋아요가 안 되어 있을 때만
      if (!isLiked) {
        setShowHeartOverlay(true);
        handleLike();
        setTimeout(() => setShowHeartOverlay(false), 1000);
      }
    }
    lastTapRef.current = now;
  };

  const handleShare = async () => {
    if (onShare) {
      onShare(item);
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}님의 ${item.type === 'qt' ? 'QT' : '묵상'} 나눔`,
          text: item.type === 'meditation'
            ? item.content?.replace(/<[^>]*>/g, '').slice(0, 100)
            : item.mySentence?.slice(0, 100),
          url: window.location.href,
        });
      } catch {
        // Share cancelled
      }
    }
  };

  // QT 컨텐츠가 있는지 확인
  const hasQtContent = item.type === 'qt' && hasQTContent(item);

  // 메인 컨텐츠 렌더링 - 명암비 5:1 이상 보장
  const renderMainContent = () => {
    // 강화된 텍스트 그림자 (어떤 배경에서도 가독성 보장)
    const labelShadow = 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]';
    const textShadow = 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]';

    if (item.type === 'meditation') {
      if (item.content?.startsWith('<')) {
        return (
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20">
            <RichViewerWithEmbed
              content={contentWithoutImages}
              className="text-white text-lg leading-loose tracking-wide story-readable-text"
            />
          </div>
        );
      }
      return (
        <div className="bg-black/70 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20">
          <p className={cn(
            'text-white text-lg leading-loose tracking-wide whitespace-pre-wrap',
            textShadow
          )}>
            {item.content}
          </p>
        </div>
      );
    }

    // QT 타입
    if (!expanded) {
      return (
        <div className="space-y-4">
          {item.mySentence && (
            <div className="bg-black/70 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 bg-gradient-to-b from-amber-400 to-muted0 rounded-full shadow-lg shadow-amber-500/50" />
                <p className={cn('text-white text-sm font-bold tracking-wide', labelShadow)}>
                  내 말로 한 문장
                </p>
              </div>
              <p className={cn(
                'text-white text-lg leading-loose font-medium tracking-wide',
                textShadow
              )}>
                {item.mySentence}
              </p>
            </div>
          )}
          {hasQtContent && (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-white/30 gap-1 font-bold backdrop-blur-sm border border-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
            >
              더보기 <ChevronDown className="w-4 h-4" />
            </Button>
          )}
        </div>
      );
    }

    // 전체 QT 콘텐츠 표시 (확장된 상태) - 모든 카드 bg-black/70으로 통일
    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 story-scroll">
        {/* 내 말로 한 문장 */}
        {item.mySentence && (
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 bg-gradient-to-b from-amber-400 to-muted0 rounded-full shadow-lg shadow-amber-500/50" />
              <p className={cn('text-white text-sm font-bold tracking-wide', labelShadow)}>
                내 말로 한 문장
              </p>
            </div>
            <p className={cn('text-white text-base leading-loose tracking-wide', textShadow)}>
              {item.mySentence}
            </p>
          </div>
        )}

        {/* 묵상 질문 답변 */}
        {item.meditationAnswer && (
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 bg-gradient-to-b from-purple-400 to-violet-500 rounded-full shadow-lg shadow-purple-500/50" />
              <p className={cn('text-white text-sm font-bold tracking-wide', labelShadow)}>
                묵상 질문 답변
              </p>
            </div>
            {item.meditationQuestion && (
              <p className={cn('text-white/90 text-sm italic mb-3 pl-3 border-l-2 border-white/40', labelShadow)}>
                Q. {item.meditationQuestion}
              </p>
            )}
            <p className={cn('text-white text-base leading-loose tracking-wide', textShadow)}>
              {item.meditationAnswer}
            </p>
          </div>
        )}

        {/* 감사와 적용 */}
        {item.gratitude && (
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full shadow-lg shadow-emerald-500/50" />
              <p className={cn('text-white text-sm font-bold tracking-wide', labelShadow)}>
                감사와 적용
              </p>
            </div>
            <p className={cn('text-white text-base leading-loose tracking-wide', textShadow)}>
              {item.gratitude}
            </p>
          </div>
        )}

        {/* 나의 기도 */}
        {item.myPrayer && (
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 bg-gradient-to-b from-sky-400 to-muted0 rounded-full shadow-lg shadow-sky-500/50" />
              <p className={cn('text-white text-sm font-bold tracking-wide', labelShadow)}>
                나의 기도
              </p>
            </div>
            <p className={cn('text-white text-base leading-loose tracking-wide italic', textShadow)}>
              {item.myPrayer}
            </p>
          </div>
        )}

        {/* 하루 점검 */}
        {item.dayReview && (
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-5 bg-gradient-to-b from-indigo-400 to-violet-500 rounded-full shadow-lg shadow-indigo-500/50" />
              <p className={cn('text-white text-sm font-bold tracking-wide', labelShadow)}>
                하루 점검
              </p>
            </div>
            <p className={cn('text-white text-base leading-loose tracking-wide', textShadow)}>
              {item.dayReview}
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-white/30 gap-1 font-bold backdrop-blur-sm border border-white/20"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(false);
          }}
        >
          접기 <ChevronUp className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  return (
    <div
      className="relative h-full w-full snap-start snap-always"
      onClick={handleDoubleTap}
    >
      {/* 배경 - 이미지가 있으면 이미지 배경, 없으면 그라데이션 + 패턴 */}
      <div className="absolute inset-0">
        {images.length > 0 ? (
          <>
            <Image
              src={images[0]}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />
          </>
        ) : (
          <>
            {/* 그라데이션 배경 (타입별 색상) */}
            <div className={cn(
              'w-full h-full bg-gradient-to-br animate-gradient-flow',
              gradient
            )} />
            {/* 패턴 오버레이 */}
            {pattern && <div className={cn('absolute inset-0 opacity-20', pattern)} />}
          </>
        )}
      </div>

      {/* 더블탭 하트 오버레이 */}
      {showHeartOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <Heart
            className="w-28 h-28 text-white fill-white animate-heart-beat drop-shadow-[0_0_30px_rgba(255,255,255,0.8)]"
          />
        </div>
      )}

      {/* 상단 영역 - 작성자 정보 (애니메이션 적용) */}
      <div className={cn(
        'absolute top-0 left-0 right-0 p-4 pl-16 z-10 bg-gradient-to-b from-black/40 to-transparent',
        'transition-all duration-500',
        isActive ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      )}>
        <div className="flex items-center gap-3">
          {/* 아바타 with animated ring */}
          <div className="relative">
            <div className={cn(
              'absolute -inset-0.5 rounded-full',
              item.type === 'qt'
                ? 'bg-gradient-to-tr from-amber-400 to-muted0'
                : 'bg-gradient-to-tr from-blue-400 to-muted0',
              isActive && 'animate-pulse-glow'
            )} />
            <div className={cn('relative w-11 h-11 rounded-full flex items-center justify-center ring-2 ring-black', avatarColor)}>
              <span className="text-white font-semibold text-sm">{initials}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm">{displayName}</p>
              {item.isAnonymous && (
                <Lock className="w-3 h-3 text-white/70" />
              )}
              {/* 타입 뱃지 - 개선된 스타일 */}
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                item.type === 'qt'
                  ? 'bg-gradient-to-r from-muted0 to-muted0 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-gradient-to-r from-muted0 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
              )}>
                {item.type === 'qt' ? 'QT' : '묵상'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-xs">
              <span>{formatRelativeTime(item.createdAt)}</span>
              {item.dayNumber && (
                <>
                  <span className="text-white/50">·</span>
                  <span>{item.dayNumber}일차</span>
                </>
              )}
              {item.bibleRange && (
                <>
                  <span className="text-white/50">·</span>
                  <span>{item.bibleRange}</span>
                </>
              )}
            </div>
          </div>

          {/* 음소거 버튼 */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-all"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white/80" />
            ) : (
              <Volume2 className="w-4 h-4 text-white/80" />
            )}
          </button>
        </div>
      </div>

      {/* 중앙 컨텐츠 영역 (애니메이션 적용) */}
      <div className="absolute inset-0 flex items-center justify-center px-4 py-24 overflow-y-auto">
        <div className={cn(
          'max-w-lg w-full transition-all duration-700',
          isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}>
          {/* 성경 구절 뱃지 - 개선된 스타일 */}
          {(item.bibleRange || item.qtDate) && (
            <div className={cn(
              'inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-2 mb-5 border border-white/20',
              isActive && 'animate-story-slide-down story-delay-100'
            )}>
              <BookOpen className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-semibold">
                {item.bibleRange || item.qtDate}
              </span>
            </div>
          )}

          {/* 메인 컨텐츠 - 타입별 스타일 적용 */}
          <div className={cn(
            isActive && 'animate-story-slide-up story-delay-200'
          )}>
            {renderMainContent()}
          </div>
        </div>
      </div>

      {/* 우측 액션 버튼들 (애니메이션 적용) */}
      <div className={cn(
        'absolute right-3 bottom-28 flex flex-col items-center gap-5 z-10',
        'transition-all duration-500 delay-300',
        isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      )}>
        {/* 좋아요 - 개선된 애니메이션 */}
        <button
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-col items-center gap-1 group"
        >
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
            isLiked
              ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/40'
              : 'bg-black/30 backdrop-blur-sm group-hover:bg-black/50 group-hover:scale-105'
          )}>
            <Heart className={cn(
              'w-6 h-6 transition-all',
              isLiked ? 'text-white fill-white animate-heart-beat' : 'text-white group-hover:scale-110'
            )} />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-md">
            {likesCount > 0 ? likesCount : '좋아요'}
          </span>
        </button>

        {/* 댓글 */}
        <button
          onClick={(e) => { e.stopPropagation(); onComment(item.id, item.type); }}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/50 group-hover:scale-105 transition-all duration-300">
            <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-md">
            {item.repliesCount > 0 ? item.repliesCount : '댓글'}
          </span>
        </button>

        {/* 공유 */}
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center group-hover:bg-black/50 group-hover:scale-105 transition-all duration-300">
            <Share2 className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-white text-xs font-medium drop-shadow-md">공유</span>
        </button>
      </div>

      {/* 하단 정보 영역 */}
      <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-black/60 to-transparent">
        {/* 여러 이미지가 있을 경우 인디케이터 */}
        {images.length > 1 && (
          <div className="flex gap-1 justify-center mb-3">
            {images.slice(0, 5).map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  idx === 0 ? 'bg-white' : 'bg-white/50'
                )}
              />
            ))}
            {images.length > 5 && (
              <span className="text-white/50 text-[10px]">+{images.length - 5}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 메인 InstagramStyleFeed 컴포넌트
export function InstagramStyleFeed({
  items,
  currentUserId,
  onLike,
  onComment,
  onShare,
  onWrite,
  hasMore,
  onLoadMore,
  loading,
}: InstagramStyleFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // 스크롤 위치로 현재 활성 카드 감지
  useEffect(() => {
    if (!containerRef.current) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const cardHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / cardHeight);

      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < items.length) {
        setActiveIndex(newIndex);
      }

      // 마지막 카드 근처에서 더 로드
      if (hasMore && onLoadMore && newIndex >= items.length - 2) {
        onLoadMore();
      }
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [activeIndex, items.length, hasMore, onLoadMore]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const cardHeight = containerRef.current.clientHeight;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        containerRef.current.scrollTo({
          top: (activeIndex + 1) * cardHeight,
          behavior: 'smooth',
        });
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        containerRef.current.scrollTo({
          top: Math.max(0, (activeIndex - 1) * cardHeight),
          behavior: 'smooth',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  // 빈 피드
  if (items.length === 0 && !loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <MessageCircle className="w-10 h-10 text-white/50" />
        </div>
        <h2 className="text-xl font-bold mb-2">아직 나눔이 없습니다</h2>
        <p className="text-white/60 text-center mb-6">
          첫 번째 묵상을 나눠보세요!
        </p>
        {onWrite && (
          <Button
            onClick={onWrite}
            className="bg-white text-foreground hover:bg-white/90"
          >
            <PenLine className="w-4 h-4 mr-2" />
            나눔 작성하기
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-black">
      {/* 스크롤 컨테이너 */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {items.map((item, index) => (
          <div
            key={`${item.type}-${item.id}`}
            className="h-screen w-full"
          >
            <StoryCard
              item={item}
              currentUserId={currentUserId}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              isActive={index === activeIndex}
            />
          </div>
        ))}

        {/* 로딩 인디케이터 */}
        {loading && (
          <div className="h-screen w-full snap-start flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 진행 인디케이터 (좌측) - 개선된 스타일 */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
        {items.slice(0, 10).map((item, idx) => (
          <div
            key={idx}
            className={cn(
              'rounded-full transition-all duration-500 ease-out',
              idx === activeIndex
                ? 'w-1.5 h-8 animate-pulse-glow'
                : idx < activeIndex
                ? 'w-1 h-2 bg-white/60'  // 지난 항목
                : 'w-1 h-2 bg-white/25'  // 다음 항목
            )}
            style={{
              background: idx === activeIndex
                ? item.type === 'qt'
                  ? 'linear-gradient(to bottom, #f59e0b, #ea580c)'  // amber-orange
                  : 'linear-gradient(to bottom, #3b82f6, #8b5cf6)'  // blue-violet
                : undefined
            }}
          />
        ))}
        {items.length > 10 && (
          <span className="text-white/50 text-[8px] mt-1">+{items.length - 10}</span>
        )}
      </div>

      {/* FAB 글쓰기 버튼 - 개선된 스타일 */}
      {onWrite && (
        <button
          onClick={onWrite}
          className="absolute bottom-6 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-muted0 to-muted0 shadow-xl shadow-orange-500/30 flex items-center justify-center z-20 hover:scale-110 hover:shadow-orange-500/50 transition-all duration-300 active:scale-95"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      )}

      {/* 스와이프 힌트 (첫 번째 카드에서만) - 개선된 애니메이션 */}
      {activeIndex === 0 && items.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10">
          <div className="animate-swipe-hint">
            <ChevronUp className="w-6 h-6 text-white/70" />
          </div>
          <span className="text-white/60 text-xs font-medium">스와이프</span>
        </div>
      )}
    </div>
  );
}

// 기존 리스트 뷰와 전환할 수 있는 래퍼 컴포넌트
export function FeedViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: 'list' | 'story';
  onViewModeChange: (mode: 'list' | 'story') => void;
}) {
  return (
    <div className="flex bg-muted rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('list')}
        className={cn(
          'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          viewMode === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        목록
      </button>
      <button
        onClick={() => onViewModeChange('story')}
        className={cn(
          'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          viewMode === 'story'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        스토리
      </button>
    </div>
  );
}

export default InstagramStyleFeed;
