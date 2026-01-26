'use client';

import { useCallback, useRef } from 'react';
import { useSplitViewContext, MenuType } from '@/contexts/SplitViewContext';

interface UseSplitViewDnDReturn {
  // 드래그 시작 핸들러 (사이드바 아이템용)
  handleDragStart: (e: React.DragEvent, menuType: MenuType) => void;
  // 드래그 종료 핸들러
  handleDragEnd: (e: React.DragEvent) => void;
  // 드롭 영역 핸들러
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, position: 'left' | 'right') => void;
  // 드래그 상태
  isDraggingMenu: boolean;
}

export function useSplitViewDnD(): UseSplitViewDnDReturn {
  const { state, actions } = useSplitViewContext();
  const draggedMenuRef = useRef<MenuType | null>(null);

  // 드래그 시작
  const handleDragStart = useCallback((e: React.DragEvent, menuType: MenuType) => {
    e.dataTransfer.setData('menuType', menuType);
    e.dataTransfer.effectAllowed = 'move';
    draggedMenuRef.current = menuType;
    actions.setDraggingMenu(true);

    // 드래그 미리보기 이미지 커스텀 (선택적)
    const dragImage = document.createElement('div');
    dragImage.className = 'w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg';
    dragImage.textContent = menuType.charAt(0).toUpperCase();
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 24, 24);

    // 드래그 이미지 제거 (약간의 지연 후)
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

    const menuType = e.dataTransfer.getData('menuType') as MenuType;
    if (!menuType) return;

    actions.setDraggingMenu(false);

    // Split View가 이미 활성화된 경우
    if (state.isEnabled) {
      if (position === 'left') {
        // 같은 메뉴를 양쪽에 배치하지 않음
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
      // 현재 페이지를 반대편에 배치
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
function getCurrentMenuFromPath(): MenuType {
  if (typeof window === 'undefined') return 'home';

  const path = window.location.pathname;

  if (path.includes('/bible')) return 'bible';
  if (path.includes('/sharing')) return 'sharing';
  if (path.includes('/groups')) return 'groups';
  if (path.includes('/my')) return 'my';

  return 'home';
}
