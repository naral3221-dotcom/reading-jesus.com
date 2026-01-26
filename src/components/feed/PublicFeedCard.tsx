'use client';

/**
 * PublicFeedCard 컴포넌트
 *
 * Instagram/Threads 스타일의 공개 피드 카드입니다.
 * 로그인 체크, 블러 효과 등의 기능을 포함합니다.
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, BookOpen, Church } from 'lucide-react';
import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/date-utils';
import { extractImagesFromHtml, removeImagesFromHtml } from '@/components/ui/rich-editor';
import type { PublicFeedItem } from '@/types';
import dynamic from 'next/dynamic';

const RichViewerWithEmbed = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichViewerWithEmbed),
  { ssr: false }
);

interface PublicFeedCardProps {
  item: PublicFeedItem;
  onLike?: (id: string, type: 'meditation' | 'qt') => void;
  onComment?: (id: string, type: 'meditation' | 'qt') => void;
  onLoginRequired?: () => void;
  isLoggedIn?: boolean;
  showBlur?: boolean;
}

export function PublicFeedCard({
  item,
  onLike,
  onComment,
  onLoginRequired,
  isLoggedIn = false,
  showBlur = false,
}: PublicFeedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likesCount);

  const displayName = item.isAnonymous ? '익명' : item.authorName;
  const avatarColor = item.isAnonymous ? 'bg-gray-400' : getAvatarColor(item.authorName);
  const initials = item.isAnonymous ? '?' : getInitials(item.authorName);

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

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(item.id, item.type);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      onLoginRequired?.();
      return;
    }
    onComment?.(item.id, item.type);
  };

  // QT 콘텐츠 렌더링 - 심플하게
  const renderQTContent = () => {
    const sections = [];

    if (item.mySentence) {
      sections.push(
        <p key="sentence" className="text-[15px] leading-relaxed">
          <span className="font-semibold">한 문장</span>{' '}
          {item.mySentence}
        </p>
      );
    }

    if (item.meditationAnswer) {
      sections.push(
        <p key="answer" className="text-[15px] leading-relaxed">
          <span className="font-semibold">묵상</span>{' '}
          {item.meditationAnswer}
        </p>
      );
    }

    if (item.gratitude) {
      sections.push(
        <p key="gratitude" className="text-[15px] leading-relaxed">
          <span className="font-semibold">감사</span>{' '}
          {item.gratitude}
        </p>
      );
    }

    if (item.myPrayer) {
      sections.push(
        <p key="prayer" className="text-[15px] leading-relaxed">
          <span className="font-semibold">기도</span>{' '}
          {item.myPrayer}
        </p>
      );
    }

    if (item.dayReview) {
      sections.push(
        <p key="review" className="text-[15px] leading-relaxed">
          <span className="font-semibold">하루 점검</span>{' '}
          {item.dayReview}
        </p>
      );
    }

    return sections.length > 0 ? (
      <div className="space-y-3">{sections}</div>
    ) : null;
  };

  // 콘텐츠 렌더링
  const renderContent = () => {
    if (item.type === 'meditation') {
      if (item.content?.startsWith('<')) {
        return <RichViewerWithEmbed content={contentWithoutImages} className="text-[15px] leading-relaxed" />;
      }
      return <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{item.content}</p>;
    }
    return renderQTContent();
  };

  return (
    <article className={`bg-background border-b border-border/50 ${showBlur ? 'blur-sm pointer-events-none' : ''}`}>
      <div className="px-4 py-3">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-3">
          {/* 아바타 - 심플한 원형 */}
          <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center shrink-0`}>
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>

          {/* 사용자 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[14px]">{displayName}</span>
              <span className="text-muted-foreground text-[13px]">
                · {formatRelativeTime(item.createdAt)}
              </span>
            </div>

            {/* 소스 정보 - 미니멀 */}
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Link
                href={`/church/${item.churchCode}`}
                className="flex items-center gap-1 hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <Church className="w-3 h-3" />
                {item.churchName}
              </Link>
              {item.dayNumber && (
                <>
                  <span>·</span>
                  <span>{item.dayNumber}일차</span>
                </>
              )}
              {item.type === 'qt' && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <BookOpen className="w-3 h-3" />
                    QT
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="mb-3">
          {renderContent()}
        </div>

        {/* 이미지 */}
        {images.length > 0 && (
          <div className="-mx-4 mb-3">
            {images.length === 1 ? (
              <div className="relative aspect-square max-h-[500px]">
                <Image
                  src={images[0]}
                  alt="첨부 이미지"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-0.5">
                {images.slice(0, 4).map((src, index) => (
                  <div key={index} className="relative aspect-square">
                    <Image
                      src={src}
                      alt={`이미지 ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {index === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-lg font-semibold">+{images.length - 4}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 인터랙션 - Instagram 스타일 */}
        <div className="space-y-2">
          {/* 아이콘 버튼 */}
          <div className="flex items-center gap-4 -ml-2">
            <button
              className="p-2 active:scale-90 transition-transform"
              onClick={handleLike}
            >
              <Heart
                className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
              />
            </button>
            <button
              className="p-2 active:scale-90 transition-transform"
              onClick={handleComment}
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          </div>

          {/* 좋아요/댓글 수 */}
          {(likesCount > 0 || item.repliesCount > 0) && (
            <div className="space-y-1">
              {likesCount > 0 && (
                <p className="font-semibold text-[14px]">좋아요 {likesCount}개</p>
              )}
              {item.repliesCount > 0 && (
                <button
                  className="text-muted-foreground text-[14px]"
                  onClick={handleComment}
                >
                  댓글 {item.repliesCount}개 모두 보기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
