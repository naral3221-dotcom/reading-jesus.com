'use client';

/**
 * AppPreferencesProvider - 사용자 설정 관리
 *
 * 테마(색상)를 관리합니다.
 * - 테마: next-themes 라이브러리 활용
 */

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

// ============================================
// 테마 관련 타입 및 상수
// ============================================

export const THEMES = ['minimal', 'dark', 'beige', 'sepia'] as const;
export type Theme = (typeof THEMES)[number] | 'system';

export const THEME_META: Record<Theme, { label: string; description: string; icon: string }> = {
  system: {
    label: '시스템 설정',
    description: 'Warm Sage 브랜드 테마 (기본)',
    icon: '🌿',
  },
  minimal: {
    label: '미니멀',
    description: '깔끔한 무채색 테마',
    icon: '⚪',
  },
  dark: {
    label: '다크',
    description: 'Warm Sage 다크 테마',
    icon: '🌙',
  },
  beige: {
    label: '베이지',
    description: '따뜻하고 부드러운 톤',
    icon: '🍂',
  },
  sepia: {
    label: '세피아',
    description: '눈 보호용 따뜻한 톤',
    icon: '📜',
  },
};

const STORAGE_KEY_THEME = 'reading-jesus-theme';

// ============================================
// Context 타입 정의
// ============================================

interface AppPreferencesContextType {
  // 테마 관련
  theme: Theme;
  resolvedTheme: string | undefined;
  setTheme: (theme: Theme) => void;
  themes: readonly string[];

  // 공통
  mounted: boolean;
}

const AppPreferencesContext = createContext<AppPreferencesContextType | undefined>(undefined);

// ============================================
// 내부 Provider 컴포넌트
// ============================================

function PreferencesContextWrapper({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme, setTheme, themes } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const contextValue = useMemo<AppPreferencesContextType>(
    () => ({
      theme: (theme as Theme) || 'system',
      resolvedTheme,
      setTheme: (t: Theme) => setTheme(t),
      themes,
      mounted,
    }),
    [theme, resolvedTheme, setTheme, themes, mounted]
  );

  return (
    <AppPreferencesContext.Provider value={contextValue}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

// ============================================
// 메인 Provider
// ============================================

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={[...THEMES]}
      storageKey={STORAGE_KEY_THEME}
      disableTransitionOnChange={false}
    >
      <PreferencesContextWrapper>{children}</PreferencesContextWrapper>
    </NextThemesProvider>
  );
}

// ============================================
// 커스텀 훅
// ============================================

/**
 * 사용자 설정 훅
 */
export function useAppPreferences(): AppPreferencesContextType {
  const context = useContext(AppPreferencesContext);
  if (context === undefined) {
    throw new Error('useAppPreferences must be used within an AppPreferencesProvider');
  }
  return context;
}

/**
 * 테마 전용 훅 (기존 useTheme 호환)
 */
export function useTheme() {
  const { theme, resolvedTheme, setTheme, themes, mounted } = useAppPreferences();
  return { theme, resolvedTheme, setTheme, themes, mounted };
}

// 기존 호환성을 위한 re-export
export { useTheme as useNextTheme } from 'next-themes';
