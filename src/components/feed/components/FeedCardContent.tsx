'use client';

/**
 * FeedCardContent - 피드 카드 콘텐츠 렌더링 컴포넌트
 *
 * 섹션 구분형 디자인으로 묵상/QT 콘텐츠를 표시합니다.
 */

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const RichViewerWithEmbed = dynamic(
  () => import('@/components/ui/rich-editor').then((mod) => mod.RichViewerWithEmbed),
  { ssr: false }
);

interface QtSection {
  key: string;
  label: string;
  value: string;
}

interface FeedCardContentProps {
  type: 'meditation' | 'qt';
  isHtmlContent: boolean;
  contentWithoutImages: string;
  plainContent?: string;
  qtSections: QtSection[];
  variant?: 'default' | 'compact';
}

// 섹션별 스타일 매핑
const SECTION_STYLES: Record<string, { bg: string; border: string; icon?: string }> = {
  mySentence: {
    bg: 'bg-primary/5',
    border: 'border-l-primary/40',
  },
  meditationAnswer: {
    bg: 'bg-muted/30',
    border: 'border-l-muted-foreground/30',
  },
  gratitude: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-l-amber-400/50',
  },
  myPrayer: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-l-blue-400/50',
  },
  dayReview: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-l-green-400/50',
  },
};

// 섹션 레이블 한글화
const SECTION_LABELS: Record<string, string> = {
  mySentence: '오늘의 한 문장',
  meditationAnswer: '묵상',
  meditationQuestion: '질문',
  gratitude: '감사',
  myPrayer: '기도',
  dayReview: '하루 돌아보기',
};

export function FeedCardContent({
  type,
  isHtmlContent,
  contentWithoutImages,
  plainContent,
  qtSections,
  variant = 'default',
}: FeedCardContentProps) {
  // 묵상 콘텐츠 렌더링
  if (type === 'meditation') {
    if (isHtmlContent) {
      return (
        <RichViewerWithEmbed
          content={contentWithoutImages}
          className="text-[15px] leading-relaxed text-foreground/90"
        />
      );
    }
    return (
      <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
        {plainContent || contentWithoutImages}
      </p>
    );
  }

  // QT 콘텐츠 렌더링 - 섹션 구분형
  if (qtSections.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "space-y-4",
      variant === 'compact' && "space-y-3"
    )}>
      {qtSections.map((section) => {
        const style = SECTION_STYLES[section.key] || { bg: 'bg-muted/20', border: 'border-l-border' };
        const label = SECTION_LABELS[section.key] || section.label;
        const isQuote = section.key === 'mySentence';

        return (
          <div
            key={section.key}
            className={cn(
              "relative pl-4 py-3 border-l-4 rounded-r-lg transition-colors",
              style.bg,
              style.border,
              variant === 'compact' && "py-2 pl-3"
            )}
          >
            {/* 섹션 레이블 */}
            <span className={cn(
              "block text-[11px] font-semibold uppercase tracking-wider mb-1.5",
              "text-muted-foreground"
            )}>
              {label}
            </span>

            {/* 섹션 내용 */}
            <p className={cn(
              "text-[14px] leading-relaxed text-foreground/85",
              isQuote && "italic text-[15px]",
              variant === 'compact' && "text-[13px]"
            )}>
              {isQuote ? `"${section.value}"` : section.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
