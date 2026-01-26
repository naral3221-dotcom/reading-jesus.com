'use client';

import { useSplitViewDnD } from '@/hooks/useSplitViewDnD';
import { useSplitViewContext } from '@/contexts/SplitViewContext';
import { Columns2, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function DropZoneOverlay() {
  const { state } = useSplitViewContext();
  const { handleDragOver, handleDrop } = useSplitViewDnD();
  const [hoveredZone, setHoveredZone] = useState<'left' | 'right' | null>(null);

  if (!state.isDraggingMenu) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:ml-20 pointer-events-auto"
      onDragOver={handleDragOver}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* 드롭 영역 컨테이너 */}
      <div className="absolute inset-0 flex">
        {/* 왼쪽 드롭 영역 */}
        <div
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-4 border-r-2 border-dashed transition-all duration-200',
            hoveredZone === 'left'
              ? 'bg-accent/30 border-accent'
              : 'bg-primary/10 border-border'
          )}
          onDragOver={(e) => {
            handleDragOver(e);
            setHoveredZone('left');
          }}
          onDragLeave={() => setHoveredZone(null)}
          onDrop={(e) => {
            handleDrop(e, 'left');
            setHoveredZone(null);
          }}
        >
          <div className={cn(
            'w-20 h-20 rounded-2xl flex items-center justify-center transition-colors',
            hoveredZone === 'left' ? 'bg-accent text-white' : 'bg-background/80 text-muted-foreground'
          )}>
            <ArrowLeft className="w-10 h-10" />
          </div>
          <div className="text-center">
            <p className={cn(
              'font-bold text-lg',
              hoveredZone === 'left' ? 'text-accent' : 'text-foreground'
            )}>
              왼쪽에 배치
            </p>
            <p className="text-sm text-muted-foreground">
              여기에 드롭하세요
            </p>
          </div>
        </div>

        {/* 중앙 안내 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-background rounded-full shadow-lg">
          <Columns2 className="w-5 h-5 text-accent" />
          <span className="font-medium text-foreground">Split View 활성화</span>
        </div>

        {/* 오른쪽 드롭 영역 */}
        <div
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-4 border-l-2 border-dashed transition-all duration-200',
            hoveredZone === 'right'
              ? 'bg-accent/30 border-accent'
              : 'bg-primary/10 border-border'
          )}
          onDragOver={(e) => {
            handleDragOver(e);
            setHoveredZone('right');
          }}
          onDragLeave={() => setHoveredZone(null)}
          onDrop={(e) => {
            handleDrop(e, 'right');
            setHoveredZone(null);
          }}
        >
          <div className={cn(
            'w-20 h-20 rounded-2xl flex items-center justify-center transition-colors',
            hoveredZone === 'right' ? 'bg-accent text-white' : 'bg-background/80 text-muted-foreground'
          )}>
            <ArrowRight className="w-10 h-10" />
          </div>
          <div className="text-center">
            <p className={cn(
              'font-bold text-lg',
              hoveredZone === 'right' ? 'text-accent' : 'text-foreground'
            )}>
              오른쪽에 배치
            </p>
            <p className="text-sm text-muted-foreground">
              여기에 드롭하세요
            </p>
          </div>
        </div>
      </div>

      {/* 하단 안내 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 text-white text-sm rounded-lg">
        ESC를 눌러 취소
      </div>
    </div>
  );
}
