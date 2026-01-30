/**
 * 네비게이션 공통 스타일
 *
 * 메인 페이지와 교회 페이지의 네비게이션 스타일을 통합 관리합니다.
 * 이 파일을 수정하면 모든 네비게이션에 일괄 적용됩니다.
 */

import { cn } from '@/lib/utils';

// ============================================
// PC 사이드바 스타일
// ============================================
export const sidebarStyles = {
  // 컨테이너 기본 스타일
  container: [
    'hidden lg:flex fixed left-0 top-0 bottom-0 z-50 flex-col items-stretch',
    'bg-background/80 backdrop-blur-xl border-r border-border/40',
    'shadow-sidebar dark:shadow-sidebar-dark',
  ].join(' '),

  // 너비 옵션
  width: {
    expanded: 'w-48 py-6 px-3',
    compact: 'w-20 py-6 px-2',
  },

  // 로고 영역
  logo: {
    container: 'mb-8 px-2',
    link: 'flex flex-col items-center gap-1 px-2 py-3 rounded-xl hover:bg-muted/60 transition-all duration-300',
    icon: 'flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-md shadow-primary/20',
    textContainer: 'flex flex-col items-center leading-none',
    text: 'text-[22px] font-logo tracking-tight text-foreground',
  },

  // 네비게이션 아이템 컨테이너
  navContainer: {
    expanded: 'flex flex-col gap-1 flex-1 px-2',
    compact: 'flex flex-col items-center gap-2 flex-1',
  },

  // 네비게이션 아이템 - 확장형 (가로 배치)
  navItemExpanded: {
    wrapper: 'relative group cursor-grab active:cursor-grabbing',
    link: {
      base: 'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
      active: 'text-primary bg-primary/10',
      inactive: 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
      splitView: 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background',
    },
    indicator: 'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary shadow-sm',
    icon: {
      base: 'w-[18px] h-[18px] transition-all duration-200 shrink-0',
      active: 'scale-105',
    },
    label: {
      base: 'text-[13px] font-medium transition-all duration-200',
      active: 'text-primary font-semibold',
    },
  },

  // 네비게이션 아이템 - 컴팩트형 (세로 배치)
  navItemCompact: {
    wrapper: 'relative group cursor-grab active:cursor-grabbing',
    link: {
      base: 'flex flex-col items-center justify-center w-16 h-16 gap-1 rounded-xl transition-all duration-200 relative',
      active: 'text-primary bg-primary/10',
      inactive: 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
      splitView: 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background',
    },
    indicator: 'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary shadow-sm',
    iconContainer: {
      base: 'p-2 rounded-xl transition-colors',
      active: 'bg-primary/15',
    },
    icon: {
      base: 'w-5 h-5 transition-transform',
      active: 'scale-110',
    },
    label: {
      base: 'text-[10px] font-medium',
      active: 'text-primary font-semibold',
    },
  },

  // 드래그 힌트 툴팁
  dragTooltip: [
    'absolute left-full ml-3 top-1/2 -translate-y-1/2',
    'px-3 py-1.5 bg-foreground/90 text-background text-xs rounded-lg whitespace-nowrap shadow-lg',
    'opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50',
    'translate-x-1 group-hover:translate-x-0',
  ].join(' '),

  // 하단 유틸리티 영역
  utilityContainer: 'flex flex-col gap-1 mt-auto px-2',
  utilityItem: 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all duration-200',
  utilityBadge: 'ml-auto min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1 shadow-sm',
} as const;


// ============================================
// 모바일 하단 네비게이션 스타일
// ============================================
export const bottomNavStyles = {
  // 컨테이너
  container: [
    'lg:hidden fixed bottom-0 left-0 right-0 z-50',
    'bg-background/80 backdrop-blur-xl border-t border-border/40',
    'shadow-[0_-4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]',
  ].join(' '),

  // 내부 컨테이너
  inner: 'flex items-center justify-around max-w-lg mx-auto',

  // 높이 (safe area 포함)
  height: 'calc(4rem + env(safe-area-inset-bottom))',
  paddingBottom: 'env(safe-area-inset-bottom)',

  // 네비게이션 아이템
  navItem: {
    link: {
      base: 'flex flex-col items-center justify-center w-full min-w-[64px] h-16 transition-all duration-300 relative group',
      active: 'text-primary',
      inactive: 'text-muted-foreground hover:text-foreground active:scale-95',
    },
    indicator: 'absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full shadow-sm',
    iconContainer: {
      base: 'flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all duration-200',
      active: 'bg-primary/10',
    },
    icon: {
      base: 'w-6 h-6 transition-all duration-200',
      active: 'scale-110',
    },
    label: {
      base: 'text-xs transition-all duration-200 -mt-1.5',
      active: 'font-semibold text-primary',
      inactive: 'font-medium',
    },
  },
} as const;


// ============================================
// 모바일 상단 헤더 스타일
// ============================================
export const mobileHeaderStyles = {
  container: [
    'lg:hidden fixed top-0 left-0 right-0 z-40',
    'bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm',
  ].join(' '),
  inner: 'flex items-center justify-end gap-1 px-4 h-12 max-w-lg mx-auto',
  iconButton: 'flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl hover:bg-muted/60 active:scale-95 transition-all duration-200',
  notificationBadge: 'absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5 shadow-sm',
} as const;


// ============================================
// 유틸리티 함수
// ============================================

/**
 * 네비게이션 아이템 클래스 생성 (확장형)
 */
export function getExpandedNavItemClasses(isActive: boolean, isInSplitView: boolean = false) {
  const styles = sidebarStyles.navItemExpanded;
  return cn(
    styles.link.base,
    isActive ? styles.link.active : styles.link.inactive,
    isInSplitView && styles.link.splitView
  );
}

/**
 * 네비게이션 아이템 클래스 생성 (컴팩트형)
 */
export function getCompactNavItemClasses(isActive: boolean, isInSplitView: boolean = false) {
  const styles = sidebarStyles.navItemCompact;
  return cn(
    styles.link.base,
    isActive ? styles.link.active : styles.link.inactive,
    isInSplitView && styles.link.splitView
  );
}

/**
 * 하단 네비게이션 아이템 클래스 생성
 */
export function getBottomNavItemClasses(isActive: boolean) {
  const styles = bottomNavStyles.navItem;
  return cn(
    styles.link.base,
    isActive ? styles.link.active : styles.link.inactive
  );
}
