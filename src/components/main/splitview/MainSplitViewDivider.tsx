'use client';

import { useCallback, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { useMainSplitViewContext } from '@/contexts/MainSplitViewContext';
import { cn } from '@/lib/utils';

interface MainSplitViewDividerProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export function MainSplitViewDivider({ containerRef }: MainSplitViewDividerProps) {
  const { state, actions } = useMainSplitViewContext();
  const dividerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    actions.setDraggingDivider(true);
  }, [actions]);

  // 마우스 이동 및 종료 이벤트 처리
  useEffect(() => {
    if (!state.isDraggingDivider) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      actions.setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      actions.setDraggingDivider(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [state.isDraggingDivider, containerRef, actions]);

  // 더블클릭으로 비율 초기화
  const handleDoubleClick = useCallback(() => {
    actions.resetRatio();
  }, [actions]);

  return (
    <div
      ref={dividerRef}
      className={cn(
        "w-2 cursor-col-resize flex items-center justify-center transition-colors relative group",
        "bg-border hover:bg-primary/20",
        state.isDraggingDivider && "bg-primary/30"
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      title="드래그하여 크기 조절 / 더블클릭으로 초기화"
    >
      {/* 드래그 힌트 핸들 */}
      <div className={cn(
        "absolute top-1/2 -translate-y-1/2 w-4 h-10 rounded-full flex items-center justify-center",
        "bg-muted text-muted-foreground",
        "group-hover:bg-primary/20 group-hover:text-primary",
        state.isDraggingDivider && "bg-primary/30 text-primary"
      )}>
        <GripVertical className="w-4 h-4" />
      </div>

      {/* 드래그 영역 확장 (터치 영역) */}
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}
