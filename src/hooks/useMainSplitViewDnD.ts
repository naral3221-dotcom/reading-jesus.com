'use client';

import { useCallback, useRef } from 'react';
import { useMainSplitViewContext, MainMenuType } from '@/contexts/MainSplitViewContext';

interface UseMainSplitViewDnDReturn {
  handleDragStart: (e: React.DragEvent, menuType: MainMenuType) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, position: 'left' | 'right') => void;
  isDraggingMenu: boolean;
}

export function useMainSplitViewDnD(): UseMainSplitViewDnDReturn {
  const { state, actions } = useMainSplitViewContext();
  const draggedMenuRef = useRef<MainMenuType | null>(null);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.DragEvent, menuType: MainMenuType) => {
    e.dataTransfer.setData('mainMenuType', menuType);
    e.dataTransfer.effectAllowed = 'move';
    draggedMenuRef.current = menuType;
    actions.setDraggingMenu(true);

    // 드래그 미리보기 이미지 커스텀
    const dragImage = document.createElement('div');
    dragImage.className = 'w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg';
    dragImage.textContent = menuType.charAt(0).toUpperCase();
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 24, 24);

    // 드래그 이미지 제거
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  }, [actions]);

  // 드래그 종료
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    draggedMenuRef.current = null;
    actions.setDraggingMenu(false);
  }, [actions]);

  // 드래그 오버 (드롭 허용)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 드롭
  const handleDrop = useCallback((e: React.DragEvent, position: 'left' | 'right') => {
    e.preventDefault();

    const menuType = e.dataTransfer.getData('mainMenuType') as MainMenuType;
    if (!menuType) return;

    actions.setDraggingMenu(false);

    // Split View가 이미 활성화된 경우
    if (state.isEnabled) {
      if (position === 'left') {
        if (menuType === state.rightMenu) {
          actions.swapPanels();
        } else {
          actions.setLeftMenu(menuType);
        }
      } else {
        if (menuType === state.leftMenu) {
          actions.swapPanels();
        } else {
          actions.setRightMenu(menuType);
        }
      }
    } else {
      // Split View 새로 활성화
      const currentMenu = getCurrentMenuFromPath();

      if (position === 'left') {
        actions.enableSplitView(menuType, currentMenu);
      } else {
        actions.enableSplitView(currentMenu, menuType);
      }
    }
  }, [state, actions]);

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    isDraggingMenu: state.isDraggingMenu,
  };
}

// 현재 URL에서 메뉴 타입 추출
function getCurrentMenuFromPath(): MainMenuType {
  if (typeof window === 'undefined') return 'home';

  const path = window.location.pathname;

  if (path.includes('/bible')) return 'bible';
  if (path.includes('/community')) return 'community';
  if (path.includes('/group')) return 'group';
  if (path.includes('/mypage')) return 'mypage';

  return 'home';
}
