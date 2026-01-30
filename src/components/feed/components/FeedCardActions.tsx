'use client';

/**
 * FeedCardActions - 피드 카드 인터랙션 버튼 컴포넌트
 */

import { Heart, MessageCircle } from 'lucide-react';

interface FeedCardActionsProps {
  isLiked: boolean;
  likesCount: number;
  repliesCount: number;
  onLike: (e: React.MouseEvent) => void;
  onComment: (e: React.MouseEvent) => void;
}

export function FeedCardActions({
  isLiked,
  likesCount,
  repliesCount,
  onLike,
  onComment,
}: FeedCardActionsProps) {
  return (
    <div className="space-y-2">
      {/* 아이콘 버튼 */}
      <div className="flex items-center gap-4 -ml-2">
        <button
          className="p-2 active:scale-90 transition-transform"
          onClick={onLike}
        >
          <Heart
            className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
          />
        </button>
        <button
          className="p-2 active:scale-90 transition-transform"
          onClick={onComment}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>

      {/* 좋아요/댓글 수 */}
      {(likesCount > 0 || repliesCount > 0) && (
        <div className="space-y-1">
          {likesCount > 0 && (
            <p className="font-semibold text-[14px]">좋아요 {likesCount}개</p>
          )}
          {repliesCount > 0 && (
            <button
              className="text-muted-foreground text-[14px]"
              onClick={onComment}
            >
              댓글 {repliesCount}개 모두 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
