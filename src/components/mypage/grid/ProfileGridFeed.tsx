'use client';

import { ProfileGridCell } from './ProfileGridCell';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';
import type { GridFeedItem } from '@/types';
import type { ReactNode } from 'react';

interface ProfileGridFeedProps {
  items: GridFeedItem[];
  isLoading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemClick: (item: GridFeedItem) => void;
  emptyMessage: string;
  emptyIcon?: ReactNode;
}

export function ProfileGridFeed({
  items,
  isLoading,
  hasMore = false,
  onLoadMore,
  onItemClick,
  emptyMessage,
  emptyIcon,
}: ProfileGridFeedProps) {
  // 로딩 스켈레톤
  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  // 빈 상태
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        {emptyIcon || <FileText className="w-12 h-12 mb-4 opacity-50" />}
        <p className="text-sm text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* 그리드 */}
      <div className="grid grid-cols-3 gap-0.5">
        {items.map((item) => (
          <ProfileGridCell
            key={`${item.source}-${item.id}`}
            item={item}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>

      {/* 더 불러오기 버튼 */}
      {hasMore && onLoadMore && (
        <Button
          variant="ghost"
          className="mt-4 mx-auto"
          onClick={onLoadMore}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          더 보기
        </Button>
      )}

      {/* 로딩 중 추가 스켈레톤 */}
      {isLoading && items.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
