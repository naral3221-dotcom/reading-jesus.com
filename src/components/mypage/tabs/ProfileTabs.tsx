'use client';

import { Grid3x3, Heart, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProfileTabType = 'posts' | 'liked' | 'bookmarks';

interface ProfileTab {
  id: ProfileTabType;
  label: string;
  icon: typeof Grid3x3;
}

const PROFILE_TABS: ProfileTab[] = [
  { id: 'posts', label: '내 묵상', icon: Grid3x3 },
  { id: 'liked', label: '좋아요', icon: Heart },
  { id: 'bookmarks', label: '북마크', icon: Bookmark },
];

interface ProfileTabsProps {
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
  counts?: {
    posts: number;
    liked: number;
    bookmarks: number;
  };
  className?: string;
}

export function ProfileTabs({
  activeTab,
  onTabChange,
  counts,
  className,
}: ProfileTabsProps) {
  return (
    <div className={cn('border-t border-b bg-background', className)}>
      <div className="flex">
        {PROFILE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const count = counts?.[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 relative transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/70'
              )}
            >
              {/* 아이콘 */}
              <Icon
                className={cn(
                  'w-6 h-6',
                  isActive && tab.id === 'liked' && 'fill-current'
                )}
              />

              {/* 라벨 (선택적) */}
              <span className="text-[10px] mt-1 hidden sm:block">
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className="ml-1 text-muted-foreground">({count})</span>
                )}
              </span>

              {/* 활성 인디케이터 */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
