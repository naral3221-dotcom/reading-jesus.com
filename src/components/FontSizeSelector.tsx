'use client';

/**
 * 글꼴 크기 선택 컴포넌트
 * 접근성 개선을 위한 사용자 설정 가능한 폰트 크기
 *
 * useFontSize 훅을 통해 AppPreferencesProvider와 연동됩니다.
 */

import { Type, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useFontSize, FONT_SIZE_LEVELS, type FontSizeLevel } from '@/components/providers/ThemeProvider';

interface FontSizeSelectorProps {
  variant?: 'slider' | 'buttons' | 'compact';
  showPreview?: boolean;
  className?: string;
}

export function FontSizeSelector({
  variant = 'slider',
  showPreview = true,
  className,
}: FontSizeSelectorProps) {
  const { fontSize, fontScale, setFontSize, increaseFontSize, decreaseFontSize, mounted } = useFontSize();

  const currentIndex = FONT_SIZE_LEVELS.findIndex((f) => f.value === fontSize);
  const currentConfig = FONT_SIZE_LEVELS[currentIndex] ?? FONT_SIZE_LEVELS[2]; // fallback to 'base'

  const handleSliderChange = (value: number[]) => {
    const index = value[0];
    if (index >= 0 && index < FONT_SIZE_LEVELS.length) {
      setFontSize(FONT_SIZE_LEVELS[index].value);
    }
  };

  // Hydration 방지
  if (!mounted) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="h-10 bg-muted/50 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Slider Variant */}
      {variant === 'slider' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{currentConfig.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(fontScale * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={decreaseFontSize}
              disabled={currentIndex === 0}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Slider
              value={[currentIndex]}
              min={0}
              max={FONT_SIZE_LEVELS.length - 1}
              step={1}
              onValueChange={handleSliderChange}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={increaseFontSize}
              disabled={currentIndex === FONT_SIZE_LEVELS.length - 1}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Buttons Variant */}
      {variant === 'buttons' && (
        <div className="flex flex-wrap gap-2">
          {FONT_SIZE_LEVELS.map((level) => (
            <Button
              key={level.value}
              variant={fontSize === level.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFontSize(level.value)}
              className={cn(
                'transition-all',
                fontSize === level.value && 'ring-2 ring-primary/20'
              )}
            >
              <span style={{ fontSize: `${level.scale * 0.875}rem` }}>
                {level.label}
              </span>
            </Button>
          ))}
        </div>
      )}

      {/* Compact Variant */}
      {variant === 'compact' && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={decreaseFontSize}
            disabled={currentIndex === 0}
          >
            <Type className="w-3 h-3" />
          </Button>
          <span className="text-sm font-medium w-16 text-center">
            {currentConfig.label}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={increaseFontSize}
            disabled={currentIndex === FONT_SIZE_LEVELS.length - 1}
          >
            <Type className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div
          className="p-4 bg-muted/50 rounded-xl border border-border/60"
          style={{ fontSize: `calc(1rem * ${fontScale})` }}
        >
          <p className="text-sm text-muted-foreground mb-1">미리보기</p>
          <p className="leading-relaxed">
            오늘도 말씀과 함께하는 하루가 되길 바랍니다. 주님의 은혜가 함께하시기를.
          </p>
        </div>
      )}
    </div>
  );
}

// 타입 re-export
export type { FontSizeLevel };
