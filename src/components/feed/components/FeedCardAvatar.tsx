'use client';

/**
 * FeedCardAvatar - 피드 카드 아바타 컴포넌트
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FeedCardAvatarProps {
  avatarUrl?: string | null;
  avatarColor: string;
  initials: string;
  displayName: string;
  isAnonymous: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function FeedCardAvatar({
  avatarUrl,
  avatarColor,
  initials,
  displayName,
  isAnonymous,
  onClick,
  size = 'md',
  className,
}: FeedCardAvatarProps) {
  // 배경색이 없거나 빈 문자열인 경우 기본값 사용
  const bgColor = avatarColor && avatarColor.trim() ? avatarColor : 'bg-slate-600';

  const content = (
    <div
      className={cn(
        sizeClasses[size],
        "rounded-full flex items-center justify-center overflow-hidden",
        bgColor,
        className
      )}
    >
      {avatarUrl && !isAnonymous ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          width={size === 'lg' ? 48 : size === 'md' ? 40 : 32}
          height={size === 'lg' ? 48 : size === 'md' ? 40 : 32}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : (
        <span className={cn("text-white font-semibold", textSizeClasses[size])}>{initials || '?'}</span>
      )}
    </div>
  );

  if (onClick && !isAnonymous) {
    return (
      <button
        className="shrink-0 flex items-center justify-center"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className="shrink-0">{content}</div>;
}
