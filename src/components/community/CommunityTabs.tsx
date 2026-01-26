'use client'

/**
 * CommunityTabs - 커뮤니티 탭 네비게이션
 *
 * [전체] - 모든 공개 묵상 (그룹 + 교회 + 개인)
 * [팔로잉] - 팔로우한 사용자의 묵상
 * [그룹] - 내 그룹 묵상
 * [교회] - 내 교회 묵상
 */

import { cn } from '@/lib/utils'

export type CommunityTabType = 'all' | 'following' | 'group' | 'church'

interface CommunityTabsProps {
  activeTab: CommunityTabType
  onTabChange: (tab: CommunityTabType) => void
  hasGroup: boolean
  hasChurch: boolean
  className?: string
}

export function CommunityTabs({
  activeTab,
  onTabChange,
  hasGroup,
  hasChurch,
  className,
}: CommunityTabsProps) {
  const tabs = [
    { id: 'all' as const, label: '전체', always: true },
    { id: 'following' as const, label: '팔로잉', always: true },
    { id: 'group' as const, label: '그룹', always: false, show: hasGroup },
    { id: 'church' as const, label: '교회', always: false, show: hasChurch },
  ]

  const visibleTabs = tabs.filter((tab) => tab.always || tab.show)

  return (
    <div className={cn('flex border-b bg-background', className)}>
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
            activeTab === tab.id
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}
    </div>
  )
}
