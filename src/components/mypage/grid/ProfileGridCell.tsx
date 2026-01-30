'use client';

import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GridFeedItem } from '@/types';

interface ProfileGridCellProps {
  item: GridFeedItem;
  onClick: () => void;
}

export function ProfileGridCell({ item, onClick }: ProfileGridCellProps) {
  const hasImage = !!item.thumbnailUrl;

  return (
    <button
      onClick={onClick}
      className="relative aspect-square w-full overflow-hidden bg-muted group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
    >
      {hasImage ? (
        <Image
          src={item.thumbnailUrl!}
          alt=""
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 33vw, 200px"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-3 bg-card">
          <p className="text-xs text-center line-clamp-5 text-foreground/80 leading-relaxed font-medium">
            {item.textPreview}
          </p>
        </div>
      )}

      {/* 호버 오버레이 - 좋아요/댓글 수 */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center gap-4">
        <span className="flex items-center gap-1 text-white text-sm font-semibold">
          <Heart className="w-4 h-4 fill-white" />
          {item.likesCount}
        </span>
        <span className="flex items-center gap-1 text-white text-sm font-semibold">
          <MessageCircle className="w-4 h-4 fill-white" />
          {item.repliesCount}
        </span>
      </div>

      {/* 성경 구절 뱃지 */}
      {(item.bibleRange || item.dayNumber) && (
        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium max-w-[70%] truncate">
          {item.bibleRange || `D${item.dayNumber}`}
        </div>
      )}

      {/* 타입 뱃지 */}
      <div
        className={cn(
          'absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
          item.type === 'qt'
            ? 'bg-blue-500/80 text-white'
            : 'bg-amber-500/80 text-white'
        )}
      >
        {item.type === 'qt' ? 'QT' : '묵상'}
      </div>
    </button>
  );
}
