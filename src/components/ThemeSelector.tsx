'use client';

/**
 * 테마 선택 컴포넌트
 *
 * useTheme 훅을 통해 AppPreferencesProvider와 연동됩니다.
 */

import { useTheme, THEMES, THEME_META, type Theme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ThemeSelectorProps {
  variant?: 'list' | 'grid';
  showDescription?: boolean;
  className?: string;
}

export function ThemeSelector({
  variant = 'list',
  showDescription = true,
  className,
}: ThemeSelectorProps) {
  const { theme, setTheme, mounted } = useTheme();

  // Hydration 방지 - 훅에서 제공하는 mounted 상태 사용
  if (!mounted) {
    return (
      <div className={cn('space-y-2', className)}>
        {['system', ...THEMES].map((t) => (
          <div
            key={t}
            className="h-14 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  const allThemes: Theme[] = ['system', ...THEMES];

  if (variant === 'grid') {
    return (
      <div className={cn('grid grid-cols-2 gap-3', className)}>
        {allThemes.map((t) => {
          const meta = THEME_META[t];
          const isSelected = theme === t;

          return (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={cn(
                'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200',
                'hover:bg-muted/50 active:scale-[0.98]',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-muted-foreground/30'
              )}
            >
              <span className="text-2xl mb-2">{meta.icon}</span>
              <span className={cn(
                'text-sm font-medium',
                isSelected && 'text-primary'
              )}>
                {meta.label}
              </span>
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {allThemes.map((t) => {
        const meta = THEME_META[t];
        const isSelected = theme === t;

        return (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200',
              'hover:bg-muted/50 active:scale-[0.99]',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-muted-foreground/30'
            )}
          >
            <span className="text-2xl">{meta.icon}</span>
            <div className="flex-1 text-left">
              <p className={cn(
                'font-medium',
                isSelected && 'text-primary'
              )}>
                {meta.label}
              </p>
              {showDescription && (
                <p className="text-sm text-muted-foreground">
                  {meta.description}
                </p>
              )}
            </div>
            {isSelected && (
              <Check className="w-5 h-5 text-primary flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 간단한 테마 토글 버튼 (헤더/사이드바용)
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, mounted } = useTheme();

  // Hydration 방지
  if (!mounted) {
    return (
      <div className={cn('w-10 h-10 rounded-full bg-muted animate-pulse', className)} />
    );
  }

  // 다음 테마로 순환
  const cycleTheme = () => {
    const allThemes: Theme[] = ['system', ...THEMES];
    const currentIndex = allThemes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % allThemes.length;
    setTheme(allThemes[nextIndex]);
  };

  const icon = THEME_META[theme]?.icon || '🎨';

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-full',
        'bg-muted hover:bg-muted/80 transition-colors',
        'active:scale-95',
        className
      )}
      title={`현재: ${THEME_META[theme]?.label || theme}`}
    >
      <span className="text-lg">{icon}</span>
    </button>
  );
}
