'use client';

/**
 * FeedTabs 컴포넌트
 *
 * 통합 피드의 탭 네비게이션을 제공합니다.
 * 전체 / 팔로잉 / 그룹 / 교회 탭을 지원합니다.
 */

import { cn } from '@/lib/utils';
import { Globe, Users, UsersRound, Church } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type FeedTabType = 'all' | 'following' | 'group' | 'church';
export type FeedContentType = 'all' | 'qt' | 'meditation';

interface FeedTab {
  id: FeedTabType;
  label: string;
  icon: React.ElementType;
  description?: string;
}

const FEED_TABS: FeedTab[] = [
  { id: 'all', label: '전체', icon: Globe, description: '모든 공개 묵상' },
  { id: 'following', label: '팔로잉', icon: Users, description: '내가 팔로우한 사람들' },
  { id: 'group', label: '그룹', icon: UsersRound, description: '내 그룹 묵상' },
  { id: 'church', label: '교회', icon: Church, description: '내 교회 묵상' },
];

interface FeedTabsProps {
  activeTab: FeedTabType;
  onTabChange: (tab: FeedTabType) => void;
  isLoggedIn?: boolean;
  counts?: {
    all?: number;
    following?: number;
    group?: number;
    church?: number;
  };
  className?: string;
}

export function FeedTabs({ activeTab, onTabChange, isLoggedIn = true, counts, className }: FeedTabsProps) {
  // 비로그인 시 전체 탭만 표시
  const visibleTabs = isLoggedIn ? FEED_TABS : FEED_TABS.filter(tab => tab.id === 'all');

  return (
    <div className={cn(
      'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
      'px-3 py-2',
      className
    )}>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
        {visibleTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id];
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
                'transition-all duration-200 ease-out',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'w-4 h-4 transition-transform',
                isActive && 'scale-110'
              )} />
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span className={cn(
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-primary/10 text-primary'
                )}>
                  {count > 99 ? '99+' : count}
                </span>
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

interface EmptyMessage {
  title: string;
  description: string;
  icon: React.ElementType;
  actions?: Array<{
    label: string;
    href: string;
    variant?: 'default' | 'outline';
  }>;
}

export function FeedEmptyState({ tab, hasGroups, hasChurch }: FeedEmptyStateProps) {
  const getEmptyMessage = (): EmptyMessage => {
    switch (tab) {
      case 'all':
        // 전체 탭 빈 상태 - 그룹/교회 미가입 시 가입 유도
        if (!hasGroups && !hasChurch) {
          return {
            title: '아직 공개된 묵상이 없습니다',
            description: '그룹이나 교회에 가입하여 함께 묵상을 나눠보세요!',
            icon: Globe,
            actions: [
              { label: '그룹 찾아보기', href: '/group', variant: 'default' },
              { label: '교회 찾기', href: '/church', variant: 'outline' },
            ],
          };
        }
        return {
          title: '아직 공개된 묵상이 없습니다',
          description: '첫 번째로 묵상을 공개해보세요!',
          icon: Globe,
        };
      case 'following':
        return {
          title: '팔로우한 사람이 없습니다',
          description: '다른 사람들의 묵상을 보고 팔로우해보세요.',
          icon: Users,
        };
      case 'group':
        if (!hasGroups) {
          return {
            title: '소속된 그룹이 없습니다',
            description: '그룹에 가입하여 함께 묵상을 나눠보세요.',
            icon: UsersRound,
            actions: [
              { label: '그룹 찾아보기', href: '/group', variant: 'default' },
            ],
          };
        }
        return {
          title: '그룹에 공유된 묵상이 없습니다',
          description: '첫 번째로 그룹에 묵상을 공유해보세요!',
          icon: UsersRound,
        };
      case 'church':
        if (!hasChurch) {
          return {
            title: '소속된 교회가 없습니다',
            description: '교회에 가입하여 함께 묵상을 나눠보세요.',
            icon: Church,
            actions: [
              { label: '교회 찾기', href: '/church', variant: 'default' },
              { label: '교회 등록하기', href: '/church/register', variant: 'outline' },
            ],
          };
        }
        return {
          title: '교회에 공유된 묵상이 없습니다',
          description: '첫 번째로 교회에 묵상을 공유해보세요!',
          icon: Church,
        };
    }
  };

  const message = getEmptyMessage();
  const Icon = message.icon;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-muted/30 border border-border/50 flex items-center justify-center mb-5 shadow-sm">
        <Icon className="w-10 h-10 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {message.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-4">
        {message.description}
      </p>
      {message.actions && message.actions.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {message.actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Button variant={action.variant || 'default'} size="sm">
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// 콘텐츠 타입 필터 탭 상수
const CONTENT_TYPE_TABS: { id: FeedContentType; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'qt', label: 'QT' },
  { id: 'meditation', label: '묵상' },
];

// 콘텐츠 타입 필터 컴포넌트
interface FeedTypeTabsProps {
  activeType: FeedContentType;
  onTypeChange: (type: FeedContentType) => void;
  className?: string;
}

export function FeedTypeTabs({ activeType, onTypeChange, className }: FeedTypeTabsProps) {
  return (
    <div className={cn('flex gap-2 px-3 py-2 justify-center', className)}>
      {CONTENT_TYPE_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTypeChange(tab.id)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
            activeType === tab.id
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
