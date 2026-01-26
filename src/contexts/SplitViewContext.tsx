'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type MenuType = 'home' | 'bible' | 'sharing' | 'groups' | 'my';

interface SplitViewState {
  isEnabled: boolean;
  leftMenu: MenuType | null;
  rightMenu: MenuType | null;
  splitRatio: number;
  isDraggingMenu: boolean;
  isDraggingDivider: boolean;
}

interface SplitViewContextValue {
  state: SplitViewState;
  actions: {
    enableSplitView: (leftMenu: MenuType, rightMenu: MenuType) => void;
    disableSplitView: () => void;
    setLeftMenu: (menu: MenuType) => void;
    setRightMenu: (menu: MenuType) => void;
    swapPanels: () => void;
    setSplitRatio: (ratio: number) => void;
    resetRatio: () => void;
    setDraggingMenu: (isDragging: boolean) => void;
    setDraggingDivider: (isDragging: boolean) => void;
  };
}

const STORAGE_KEY = 'church-split-view';
const DEFAULT_RATIO = 50;
const MIN_RATIO = 30;
const MAX_RATIO = 70;

const defaultState: SplitViewState = {
  isEnabled: false,
  leftMenu: null,
  rightMenu: null,
  splitRatio: DEFAULT_RATIO,
  isDraggingMenu: false,
  isDraggingDivider: false,
};

const SplitViewContext = createContext<SplitViewContextValue | null>(null);

export function SplitViewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SplitViewState>(defaultState);

  // localStorage에서 설정 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...prev,
          splitRatio: parsed.splitRatio || DEFAULT_RATIO,
          // isEnabled, leftMenu, rightMenu는 세션마다 새로 시작
        }));
      }
    } catch (error) {
      console.error('Split view 설정 로드 에러:', error);
    }
  }, []);

  // 설정 저장
  const saveSettings = useCallback((ratio: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ splitRatio: ratio }));
    } catch (error) {
      console.error('Split view 설정 저장 에러:', error);
    }
  }, []);

  // Split View 활성화
  const enableSplitView = useCallback((leftMenu: MenuType, rightMenu: MenuType) => {
    setState(prev => ({
      ...prev,
      isEnabled: true,
      leftMenu,
      rightMenu,
    }));
  }, []);

  // Split View 비활성화
  const disableSplitView = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEnabled: false,
      leftMenu: null,
      rightMenu: null,
    }));
  }, []);

  // 왼쪽 패널 메뉴 변경
  const setLeftMenu = useCallback((menu: MenuType) => {
    setState(prev => ({ ...prev, leftMenu: menu }));
  }, []);

  // 오른쪽 패널 메뉴 변경
  const setRightMenu = useCallback((menu: MenuType) => {
    setState(prev => ({ ...prev, rightMenu: menu }));
  }, []);

  // 패널 교체
  const swapPanels = useCallback(() => {
    setState(prev => ({
      ...prev,
      leftMenu: prev.rightMenu,
      rightMenu: prev.leftMenu,
    }));
  }, []);

  // 분할 비율 설정
  const setSplitRatio = useCallback((ratio: number) => {
    const clampedRatio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
    setState(prev => ({ ...prev, splitRatio: clampedRatio }));
    saveSettings(clampedRatio);
  }, [saveSettings]);

  // 비율 초기화
  const resetRatio = useCallback(() => {
    setState(prev => ({ ...prev, splitRatio: DEFAULT_RATIO }));
    saveSettings(DEFAULT_RATIO);
  }, [saveSettings]);

  // 메뉴 드래그 상태
  const setDraggingMenu = useCallback((isDragging: boolean) => {
    setState(prev => ({ ...prev, isDraggingMenu: isDragging }));
  }, []);

  // Divider 드래그 상태
  const setDraggingDivider = useCallback((isDragging: boolean) => {
    setState(prev => ({ ...prev, isDraggingDivider: isDragging }));
  }, []);

  // ESC 키로 Split View 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isEnabled) {
        disableSplitView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isEnabled, disableSplitView]);

  const value: SplitViewContextValue = {
    state,
    actions: {
      enableSplitView,
      disableSplitView,
      setLeftMenu,
      setRightMenu,
      swapPanels,
      setSplitRatio,
      resetRatio,
      setDraggingMenu,
      setDraggingDivider,
    },
  };

  return (
    <SplitViewContext.Provider value={value}>
      {children}
    </SplitViewContext.Provider>
  );
}

export function useSplitViewContext() {
  const context = useContext(SplitViewContext);
  if (!context) {
    throw new Error('useSplitViewContext must be used within a SplitViewProvider');
  }
  return context;
}

// 메뉴 타입과 경로 매핑
export const menuPathMap: Record<MenuType, string> = {
  home: '',
  bible: '/bible',
  sharing: '/sharing',
  groups: '/groups',
  my: '/my',
};

// 메뉴 타입과 레이블 매핑
export const menuLabelMap: Record<MenuType, string> = {
  home: '홈',
  bible: '성경',
  sharing: '나눔',
  groups: '그룹',
  my: '마이',
};
