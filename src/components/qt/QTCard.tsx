'use client';

import Link from 'next/link';
import { useState } from 'react';
import { QTDailyContent } from '@/types';
import { BookOpen, ChevronRight, Link as LinkIcon, Check } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface QTCardProps {
  qt: QTDailyContent;
  href?: string;
  churchCode?: string;
  isToday?: boolean;
}

export default function QTCard({ qt, href, churchCode, isToday = false }: QTCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!churchCode) return;

    const fullUrl = `${window.location.origin}/church/${churchCode}/qt/${qt.date}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast({ title: '링크가 복사되었습니다', variant: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: '링크 복사에 실패했습니다', variant: 'error' });
    }
  };
  const content = (
    <div
      className={`
        bg-card rounded-xl border p-4 transition-all
        ${isToday
          ? 'border-primary/30 shadow-lg shadow-primary/10 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/20 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* 날짜 */}
          <div className="flex items-center gap-2 mb-2">
            {isToday && (
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                TODAY
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {qt.month}/{qt.day} ({qt.dayOfWeek})
            </span>
          </div>

          {/* 제목 */}
          <h3 className="font-bold text-foreground mb-1">
            {qt.title || '오늘의 QT'}
          </h3>

          {/* 통독 범위 */}
          {qt.bibleRange && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              {qt.bibleRange}
            </p>
          )}

          {/* ONE WORD */}
          {qt.meditation?.oneWord && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-accent/10 rounded-md">
              <span className="text-xs text-accent-foreground/70 font-medium">ONE WORD</span>
              <span className="text-sm font-bold text-accent-foreground">{qt.meditation.oneWord}</span>
            </div>
          )}
        </div>

        {/* 우측 버튼 영역 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 링크 복사 버튼 */}
          {churchCode && (
            <button
              onClick={handleCopyLink}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="링크 복사"
            >
              {copied ? (
                <Check className="w-4 h-4 text-accent" />
              ) : (
                <LinkIcon className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}

          {/* 화살표 */}
          {href && (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
