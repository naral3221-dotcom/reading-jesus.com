'use client';

/**
 * ThemeProvider - 하위 호환성을 위한 래퍼
 *
 * @deprecated AppPreferencesProvider를 직접 사용하세요.
 * 이 파일은 기존 코드와의 호환성을 위해 유지됩니다.
 */

// 모든 export를 AppPreferencesProvider에서 가져옴
export {
  AppPreferencesProvider as ThemeProvider,
  useTheme,
  useAppPreferences,
  useNextTheme,
  THEMES,
  THEME_META,
} from './AppPreferencesProvider';

export type { Theme } from './AppPreferencesProvider';
