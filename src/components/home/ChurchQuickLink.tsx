'use client';

import Link from 'next/link';
import { Church as ChurchIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Church } from '@/domain/entities/Church';

interface ChurchQuickLinkProps {
  church: Church | null | undefined;
  className?: string;
}

/**
 * 소속 교회 바로가기 컴포넌트
 * 사용자가 소속 교회가 있을 때만 표시됩니다.
 */
export function ChurchQuickLink({ church, className }: ChurchQuickLinkProps) {
  if (!church) return null;

  return (
    <Link
      href={`/church/${church.code}`}
      className={cn(
        'flex items-center justify-between w-full px-4 py-3 rounded-xl',
        'bg-primary/10 hover:bg-primary/20 transition-colors duration-200',
        'border border-primary/20',
        'group',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <ChurchIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            {church.name}
          </span>
          <span className="text-xs text-muted-foreground">
            교회 페이지로 이동하기
          </span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
}
