'use client';

import { useCallback, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { useSplitViewContext } from '@/contexts/SplitViewContext';
import { cn } from '@/lib/utils';

interface SplitViewDividerProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

export function SplitViewDivider({ containerRef }: SplitViewDividerProps) {
  const { state, actions } = useSplitViewContext();
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    actions.setDraggingDivider(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      actions.setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      actions.setDraggingDivider(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [actions, containerRef]);

  // 더블클릭으로 비율 리셋
  const handleDoubleClick = useCallback(() => {
    actions.resetRatio();
  }, [actions]);

  return (
    <div
      className={cn(
        'relative w-1 bg-border cursor-col-resize group flex-shrink-0 transition-colors',
        state.isDraggingDivider && 'bg-accent'
      )}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={state.splitRatio}
      aria-valuemin={30}
      aria-valuemax={70}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          actions.setSplitRatio(state.splitRatio - 5);
        } else if (e.key === 'ArrowRight') {
          actions.setSplitRatio(state.splitRatio + 5);
        }
      }}
    >
      {/* 호버 시 확장되는 영역 */}
      <div className="absolute inset-y-0 -left-2 -right-2 group-hover:bg-accent/10 transition-colors" />

      {/* 드래그 핸들 아이콘 */}
      <div className={cn(
        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'w-6 h-12 rounded-full bg-background shadow-md border border-border',
        'flex items-center justify-center',
        'opacity-0 group-hover:opacity-100 transition-opacity',
        state.isDraggingDivider && 'opacity-100 bg-accent/10 border-accent'
      )}>
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* 툴팁 */}
      <div className={cn(
        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+40px)]',
        'px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap',
        'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'
      )}>
        드래그하여 비율 조절 · 더블클릭으로 초기화
      </div>
    </div>
  );
}
