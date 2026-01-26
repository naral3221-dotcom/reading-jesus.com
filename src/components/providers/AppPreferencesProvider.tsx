'use client';

/**
 * AppPreferencesProvider - 통합 사용자 설정 관리
 *
 * 테마(색상)와 폰트크기를 하나의 Context에서 관리합니다.
 * - 테마: next-themes 라이브러리 활용
 * - 폰트크기: 자체 Context + localStorage
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';

// ============================================
// 테마 관련 타입 및 상수
// ============================================

export const THEMES = ['light', 'dark', 'beige', 'sepia'] as const;
export type Theme = (typeof THEMES)[number] | 'system';

export const THEME_META: Record<Theme, { label: string; description: string; icon: string }> = {
  system: {
    label: '시스템 설정',
    description: '기기 설정을 따라갑니다',
    icon: '💻',
  },
  light: {
    label: '라이트',
    description: '밝고 깨끗한 화면',
    icon: '☀️',
  },
  dark: {
    label: '다크',
    description: '눈이 편안한 어두운 화면',
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

// ============================================
// 폰트 크기 관련 타입 및 상수
// ============================================

export type FontSizeLevel = 'xs' | 'sm' | 'base' | 'lg' | 'xl';

export const FONT_SIZE_LEVELS: { value: FontSizeLevel; label: string; scale: number }[] = [
  { value: 'xs', label: '아주 작게', scale: 0.85 },
  { value: 'sm', label: '작게', scale: 0.92 },
  { value: 'base', label: '보통', scale: 1 },
  { value: 'lg', label: '크게', scale: 1.1 },
  { value: 'xl', label: '아주 크게', scale: 1.2 },
];

const STORAGE_KEYS = {
  theme: 'reading-jesus-theme',
  fontSize: 'reading-jesus-font-size',
} as const;

// ============================================
// Context 타입 정의
// ============================================

interface AppPreferencesContextType {
  // 테마 관련
  theme: Theme;
  resolvedTheme: string | undefined;
  setTheme: (theme: Theme) => void;
  themes: readonly string[];

  // 폰트 크기 관련
  fontSize: FontSizeLevel;
  fontScale: number;
  setFontSize: (size: FontSizeLevel) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;

  // 공통
  mounted: boolean;
}

const AppPreferencesContext = createContext<AppPreferencesContextType | undefined>(undefined);

// ============================================
// 유틸리티 함수
// ============================================

function applyFontSize(level: FontSizeLevel) {
  const config = FONT_SIZE_LEVELS.find((f) => f.value === level);
  if (!config || typeof document === 'undefined') return;

  document.documentElement.style.setProperty('--font-scale', config.scale.toString());
  document.documentElement.setAttribute('data-font-size', level);
}

function getSavedFontSize(): FontSizeLevel {
  if (typeof window === 'undefined') return 'base';
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.fontSize);
    if (saved && FONT_SIZE_LEVELS.some((f) => f.value === saved)) {
      return saved as FontSizeLevel;
    }
  } catch {
    // localStorage 접근 실패
  }
  return 'base';
}

function saveFontSize(level: FontSizeLevel) {
  try {
    localStorage.setItem(STORAGE_KEYS.fontSize, level);
  } catch {
    // 저장 실패 무시
  }
}

// ============================================
// 내부 Provider 컴포넌트
// ============================================

function PreferencesContextWrapper({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme, setTheme, themes } = useNextTheme();

  const [fontSize, setFontSizeState] = useState<FontSizeLevel>('base');
  const [mounted, setMounted] = useState(false);

  // 초기화
  useEffect(() => {
    setMounted(true);
    const savedFontSize = getSavedFontSize();
    setFontSizeState(savedFontSize);
    applyFontSize(savedFontSize);
  }, []);

  // 폰트 크기 변경 핸들러
  const setFontSize = useCallback((level: FontSizeLevel) => {
    setFontSizeState(level);
    applyFontSize(level);
    saveFontSize(level);
  }, []);

  const currentFontIndex = FONT_SIZE_LEVELS.findIndex((f) => f.value === fontSize);

  const increaseFontSize = useCallback(() => {
    const nextIndex = currentFontIndex + 1;
    if (nextIndex < FONT_SIZE_LEVELS.length) {
      setFontSize(FONT_SIZE_LEVELS[nextIndex].value);
    }
  }, [currentFontIndex, setFontSize]);

  const decreaseFontSize = useCallback(() => {
    const prevIndex = currentFontIndex - 1;
    if (prevIndex >= 0) {
      setFontSize(FONT_SIZE_LEVELS[prevIndex].value);
    }
  }, [currentFontIndex, setFontSize]);

  const fontScale = useMemo(() => {
    const config = FONT_SIZE_LEVELS.find((f) => f.value === fontSize);
    return config?.scale ?? 1;
  }, [fontSize]);

  const contextValue = useMemo<AppPreferencesContextType>(
    () => ({
      // 테마
      theme: (theme as Theme) || 'system',
      resolvedTheme,
      setTheme: (t: Theme) => setTheme(t),
      themes,
      // 폰트 크기
      fontSize,
      fontScale,
      setFontSize,
      increaseFontSize,
      decreaseFontSize,
      // 공통
      mounted,
    }),
    [theme, resolvedTheme, setTheme, themes, fontSize, fontScale, setFontSize, increaseFontSize, decreaseFontSize, mounted]
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
      storageKey={STORAGE_KEYS.theme}
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
 * 통합 사용자 설정 훅
 * 테마와 폰트크기를 모두 관리
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

/**
 * 폰트 크기 전용 훅
 */
export function useFontSize() {
  const { fontSize, fontScale, setFontSize, increaseFontSize, decreaseFontSize, mounted } = useAppPreferences();
  return { fontSize, fontScale, setFontSize, increaseFontSize, decreaseFontSize, mounted };
}

// 기존 호환성을 위한 re-export
export { useTheme as useNextTheme } from 'next-themes';
