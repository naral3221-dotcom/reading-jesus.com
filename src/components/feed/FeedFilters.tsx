'use client';

import { useState } from 'react';
import { BookOpen, PenLine, Calendar, Building2, Filter } from 'lucide-react';
import type { PublicFeedFilters } from '@/types';
import { usePopularChurches } from '@/hooks/usePublicFeed';
import { cn } from '@/lib/utils';

interface FeedFiltersProps {
  filters: PublicFeedFilters;
  onFilterChange: (filters: PublicFeedFilters) => void;
}

export function FeedFilters({ filters, onFilterChange }: FeedFiltersProps) {
  const [showChurches, setShowChurches] = useState(false);
  const { churches, isLoading: churchesLoading } = usePopularChurches(8);

  const handleTypeChange = (type: 'all' | 'qt' | 'meditation') => {
    onFilterChange({ ...filters, type: type === filters.type ? 'all' : type });
  };

  const handlePeriodChange = (period: 'today' | 'week' | 'all') => {
    onFilterChange({ ...filters, period: period === filters.period ? 'all' : period });
  };

  const handleChurchChange = (churchId: string | undefined) => {
    onFilterChange({ ...filters, churchId: churchId === filters.churchId ? undefined : churchId });
  };

  const activeChurch = churches.find(c => c.id === filters.churchId);

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
      {/* 메인 필터 */}
      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {/* 기간 필터 */}
          <FilterChip
            active={filters.period === 'today'}
            onClick={() => handlePeriodChange('today')}
            icon={<Calendar className="w-3.5 h-3.5" />}
          >
            오늘
          </FilterChip>
          <FilterChip
            active={filters.period === 'week'}
            onClick={() => handlePeriodChange('week')}
          >
            이번 주
          </FilterChip>

          <div className="w-px bg-border mx-1 shrink-0" />

          {/* 타입 필터 */}
          <FilterChip
            active={filters.type === 'qt'}
            onClick={() => handleTypeChange('qt')}
            icon={<BookOpen className="w-3.5 h-3.5" />}
          >
            QT
          </FilterChip>
          <FilterChip
            active={filters.type === 'meditation'}
            onClick={() => handleTypeChange('meditation')}
            icon={<PenLine className="w-3.5 h-3.5" />}
          >
            묵상
          </FilterChip>

          <div className="w-px bg-border mx-1 shrink-0" />

          {/* 교회 필터 토글 */}
          <FilterChip
            active={showChurches || !!filters.churchId}
            onClick={() => setShowChurches(!showChurches)}
            icon={<Building2 className="w-3.5 h-3.5" />}
          >
            {activeChurch ? activeChurch.name : '교회'}
          </FilterChip>
        </div>
      </div>

      {/* 교회 선택 패널 */}
      {showChurches && (
        <div className="px-4 py-2 border-t bg-muted/30">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <FilterChip
              active={!filters.churchId}
              onClick={() => handleChurchChange(undefined)}
              size="sm"
            >
              전체
            </FilterChip>
            {churchesLoading ? (
              <div className="text-xs text-muted-foreground py-1">로딩 중...</div>
            ) : (
              churches.map((church) => (
                <FilterChip
                  key={church.id}
                  active={filters.churchId === church.id}
                  onClick={() => handleChurchChange(church.id)}
                  size="sm"
                >
                  {church.name}
                  <span className="ml-1 text-[10px] opacity-60">({church.postCount})</span>
                </FilterChip>
              ))
            )}
          </div>
        </div>
      )}

      {/* 활성 필터 표시 */}
      {(filters.type !== 'all' || filters.period !== 'all' || filters.churchId) && (
        <div className="px-4 py-1.5 border-t bg-muted/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="w-3 h-3" />
            <span>
              {[
                filters.period === 'today' && '오늘',
                filters.period === 'week' && '이번 주',
                filters.type === 'qt' && 'QT만',
                filters.type === 'meditation' && '묵상만',
                activeChurch?.name,
              ].filter(Boolean).join(' · ')}
            </span>
            <button
              className="ml-auto text-primary hover:underline"
              onClick={() => onFilterChange({})}
            >
              초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 필터 칩 컴포넌트
interface FilterChipProps {
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'default';
}

function FilterChip({ active, onClick, icon, children, size = 'default' }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border whitespace-nowrap transition-colors shrink-0',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background hover:bg-accent border-border'
      )}
    >
      {icon}
      {children}
    </button>
  );
}
