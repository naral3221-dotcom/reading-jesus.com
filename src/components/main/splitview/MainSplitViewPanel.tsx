'use client';

import { useState } from 'react';
import { X, ArrowLeftRight, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMainSplitViewContext, MainMenuType, mainMenuLabelMap, mainMenuPathMap } from '@/contexts/MainSplitViewContext';
import { useMainSplitViewDnD } from '@/hooks/useMainSplitViewDnD';
import { cn } from '@/lib/utils';

interface MainSplitViewPanelProps {
  position: 'left' | 'right';
  menuType: MainMenuType | null;
  style?: React.CSSProperties;
}

export function MainSplitViewPanel({ position, menuType, style }: MainSplitViewPanelProps) {
  const { state, actions } = useMainSplitViewContext();
  const { handleDragOver, handleDrop } = useMainSplitViewDnD();
  const [isLoading, setIsLoading] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!menuType) return null;

  const label = mainMenuLabelMap[menuType];
  const iframeSrc = `${mainMenuPathMap[menuType]}?splitView=true`;
  const externalUrl = mainMenuPathMap[menuType];

  const onDragOver = (e: React.DragEvent) => {
    handleDragOver(e);
    if (!isDragOver) setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    handleDrop(e, position);
    setIsDragOver(false);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-hidden bg-background relative",
        state.isDraggingMenu && "ring-2 ring-inset ring-primary/30"
      )}
      style={style}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* 드래그 오버레이 */}
      {state.isDraggingMenu && (
        <div
          className={cn(
            "absolute inset-0 z-20 flex flex-col items-center justify-center transition-all duration-200",
            isDragOver
              ? "bg-primary/30 border-4 border-dashed border-primary"
              : "bg-primary/10 border-2 border-dashed border-primary/30"
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center mb-3 transition-colors pointer-events-none",
            isDragOver ? "bg-primary text-white" : "bg-white/80 text-primary"
          )}>
            <ArrowLeftRight className="w-8 h-8" />
          </div>
          <p className={cn(
            "font-bold text-base pointer-events-none",
            isDragOver ? "text-primary" : "text-primary/70"
          )}>
            {isDragOver ? "여기에 드롭" : "페이지 교체"}
          </p>
          <p className="text-sm text-muted-foreground mt-1 pointer-events-none">
            {position === 'left' ? '왼쪽' : '오른쪽'} 패널
          </p>
        </div>
      )}

      {/* 패널 헤더 */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2 border-b shrink-0',
        position === 'left'
          ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20'
          : 'bg-gradient-to-r from-muted to-muted/80/50 border-border dark:from-amber-950/30 dark:to-amber-900/20 dark:border-border'
      )}>
        <span className={cn(
          'font-semibold text-sm',
          position === 'left' ? 'text-primary' : 'text-foreground dark:text-accent'
        )}>
          {label}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => window.open(externalUrl, '_blank')}
            title="새 탭에서 열기"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={actions.swapPanels}
            title="패널 교체"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            onClick={actions.disableSplitView}
            title="Split View 닫기 (ESC)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 패널 콘텐츠 - iframe */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">페이지 로딩 중...</p>
            </div>
          </div>
        )}
        <iframe
          src={iframeSrc}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          title={`${label} 패널`}
        />
      </div>
    </div>
  );
}
