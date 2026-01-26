'use client';

/**
 * FeedTabs 컴포넌트
 *
 * 통합 피드의 탭 네비게이션을 제공합니다.
 * 전체 / 팔로잉 / 그룹 / 교회 탭을 지원합니다.
 */

import { cn } from '@/lib/utils';

export type FeedTabType = 'all' | 'following' | 'group' | 'church';

interface FeedTab {
  id: FeedTabType;
  label: string;
  description?: string;
}

const FEED_TABS: FeedTab[] = [
  { id: 'all', label: '전체', description: '모든 공개 묵상' },
  { id: 'following', label: '팔로잉', description: '내가 팔로우한 사람들' },
  { id: 'group', label: '그룹', description: '내 그룹 묵상' },
  { id: 'church', label: '교회', description: '내 교회 묵상' },
];

interface FeedTabsProps {
  activeTab: FeedTabType;
  onTabChange: (tab: FeedTabType) => void;
  counts?: {
    all?: number;
    following?: number;
    group?: number;
    church?: number;
  };
  className?: string;
}

export function FeedTabs({ activeTab, onTabChange, counts, className }: FeedTabsProps) {
  return (
    <div className={cn('border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      <div className="flex">
        {FEED_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex-1 py-3 px-4 text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="flex items-center justify-center gap-1.5">
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className={cn(
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-semibold rounded-full',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </span>

              {/* Active indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 피드 빈 상태 컴포넌트
interface FeedEmptyStateProps {
  tab: FeedTabType;
  hasGroups?: boolean;
  hasChurch?: boolean;
}

export function FeedEmptyState({ tab, hasGroups, hasChurch }: FeedEmptyStateProps) {
  const getEmptyMessage = () => {
    switch (tab) {
      case 'all':
        return {
          title: '아직 공개된 묵상이 없습니다',
          description: '첫 번째로 묵상을 공개해보세요!',
          action: '묵상 작성하기',
        };
      case 'following':
        return {
          title: '팔로우한 사람이 없습니다',
          description: '다른 사람들의 묵상을 보고 팔로우해보세요.',
          action: '사용자 찾아보기',
        };
      case 'group':
        if (!hasGroups) {
          return {
            title: '소속된 그룹이 없습니다',
            description: '그룹에 가입하여 함께 묵상을 나눠보세요.',
            action: '그룹 찾아보기',
          };
        }
        return {
          title: '그룹에 공유된 묵상이 없습니다',
          description: '첫 번째로 그룹에 묵상을 공유해보세요!',
          action: '묵상 작성하기',
        };
      case 'church':
        if (!hasChurch) {
          return {
            title: '소속된 교회가 없습니다',
            description: '교회에 가입하여 함께 묵상을 나눠보세요.',
            action: '교회 찾아보기',
          };
        }
        return {
          title: '교회에 공유된 묵상이 없습니다',
          description: '첫 번째로 교회에 묵상을 공유해보세요!',
          action: '묵상 작성하기',
        };
    }
  };

  const message = getEmptyMessage();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {message.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">
        {message.description}
      </p>
    </div>
  );
}
