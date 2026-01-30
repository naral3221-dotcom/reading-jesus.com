'use client';

import Link from 'next/link';
import { BookOpen, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuickActionButtonsProps {
  className?: string;
}

/**
 * 빠른 액션 버튼 컴포넌트
 * - 오늘의 말씀읽기 → /bible
 * - 오늘의 QT 작성하기 → /qt/오늘날짜
 */
export function QuickActionButtons({ className }: QuickActionButtonsProps) {
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {/* 오늘의 말씀읽기 */}
      <Link
        href="/bible"
        className={cn(
          'flex flex-col items-center justify-center gap-2 p-4 rounded-xl',
          'bg-gradient-to-br from-primary/10 to-primary/5',
          'border border-primary/20 hover:border-primary/40',
          'hover:shadow-md transition-all duration-200',
          'min-h-[100px]'
        )}
      >
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground text-center">
          오늘의 말씀읽기
        </span>
      </Link>

      {/* 오늘의 QT 작성하기 */}
      <Link
        href={`/qt/${today}`}
        className={cn(
          'flex flex-col items-center justify-center gap-2 p-4 rounded-xl',
          'bg-gradient-to-br from-accent-warm/10 to-accent-warm/5',
          'border border-accent-warm/20 hover:border-accent-warm/40',
          'hover:shadow-md transition-all duration-200',
          'min-h-[100px]'
        )}
      >
        <div className="w-12 h-12 rounded-full bg-accent-warm/20 flex items-center justify-center">
          <PenLine className="w-6 h-6 text-accent-warm" />
        </div>
        <span className="text-sm font-medium text-foreground text-center">
          오늘의 QT 작성하기
        </span>
      </Link>
    </div>
  );
}
