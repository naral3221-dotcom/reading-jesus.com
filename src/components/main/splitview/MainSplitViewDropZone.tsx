'use client';

/**
 * MainSplitViewDropZone - Split View 드롭 영역
 *
 * 사이드바에서 메뉴를 드래그할 때 나타나는 드롭 영역입니다.
 * 왼쪽/오른쪽으로 드롭하여 Split View를 활성화합니다.
 */

import { useState } from 'react';
import { useMainSplitViewContext, mainMenuLabelMap, MainMenuType } from '@/contexts/MainSplitViewContext';
import { useMainSplitViewDnD } from '@/hooks/useMainSplitViewDnD';
import { PanelLeft, PanelRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MainSplitViewDropZone() {
  const { state } = useMainSplitViewContext();
  const { handleDragOver, handleDrop } = useMainSplitViewDnD();
  const [hoverPosition, setHoverPosition] = useState<'left' | 'right' | null>(null);

  // 드래그 중이 아니면 표시하지 않음
  if (!state.isDraggingMenu) {
    return null;
  }

  // 현재 URL에서 메뉴 타입 추출
  const getCurrentMenuFromPath = (): MainMenuType => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    if (path.includes('/bible')) return 'bible';
    if (path.includes('/community')) return 'community';
    if (path.includes('/group')) return 'group';
    if (path.includes('/mypage')) return 'mypage';
    return 'home';
  };

  const currentMenu = getCurrentMenuFromPath();

  return (
    <div className="fixed inset-0 z-40 lg:left-48 pointer-events-none">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto" />

      {/* 드롭 영역 컨테이너 */}
      <div className="relative h-full flex items-center justify-center gap-8 p-8 pointer-events-auto">
        {/* 왼쪽 드롭 영역 */}
        <div
          className={cn(
            'flex-1 h-full max-w-md rounded-2xl border-4 border-dashed transition-all duration-200',
            'flex flex-col items-center justify-center gap-4',
            hoverPosition === 'left'
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : 'border-muted-foreground/30 bg-muted/30 hover:border-primary/50'
          )}
          onDragOver={(e) => {
            handleDragOver(e);
            setHoverPosition('left');
          }}
          onDragLeave={() => setHoverPosition(null)}
          onDrop={(e) => {
            handleDrop(e, 'left');
            setHoverPosition(null);
          }}
        >
          <PanelLeft className={cn(
            'w-16 h-16 transition-colors',
            hoverPosition === 'left' ? 'text-primary' : 'text-muted-foreground'
          )} />
          <div className="text-center">
            <p className={cn(
              'text-lg font-semibold transition-colors',
              hoverPosition === 'left' ? 'text-primary' : 'text-muted-foreground'
            )}>
              왼쪽에 배치
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              드래그한 메뉴가 왼쪽에 표시됩니다
            </p>
          </div>
        </div>

        {/* 현재 페이지 표시 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-muted rounded-full">
          <p className="text-sm text-muted-foreground">
            현재 페이지: <span className="font-semibold text-foreground">{mainMenuLabelMap[currentMenu]}</span>
          </p>
        </div>

        {/* 오른쪽 드롭 영역 */}
        <div
          className={cn(
            'flex-1 h-full max-w-md rounded-2xl border-4 border-dashed transition-all duration-200',
            'flex flex-col items-center justify-center gap-4',
            hoverPosition === 'right'
              ? 'border-primary bg-primary/10 scale-[1.02]'
              : 'border-muted-foreground/30 bg-muted/30 hover:border-primary/50'
          )}
          onDragOver={(e) => {
            handleDragOver(e);
            setHoverPosition('right');
          }}
          onDragLeave={() => setHoverPosition(null)}
          onDrop={(e) => {
            handleDrop(e, 'right');
            setHoverPosition(null);
          }}
        >
          <PanelRight className={cn(
            'w-16 h-16 transition-colors',
            hoverPosition === 'right' ? 'text-primary' : 'text-muted-foreground'
          )} />
          <div className="text-center">
            <p className={cn(
              'text-lg font-semibold transition-colors',
              hoverPosition === 'right' ? 'text-primary' : 'text-muted-foreground'
            )}>
              오른쪽에 배치
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              드래그한 메뉴가 오른쪽에 표시됩니다
            </p>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-muted rounded-full">
          <p className="text-sm text-muted-foreground">
            원하는 영역에 드롭하여 <span className="font-semibold text-foreground">Split View</span>를 활성화하세요
          </p>
        </div>
      </div>
    </div>
  );
}
