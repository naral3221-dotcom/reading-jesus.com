'use client';

import { useState } from 'react';
import { X, ArrowLeftRight, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSplitViewContext, MenuType, menuLabelMap } from '@/contexts/SplitViewContext';
import { useSplitViewDnD } from '@/hooks/useSplitViewDnD';
import { cn } from '@/lib/utils';

// 메뉴 타입별 URL 경로 매핑
const menuPathMap: Record<MenuType, string> = {
  home: '',
  bible: '/bible',
  sharing: '/sharing',
  groups: '/groups',
  my: '/my',
};

interface SplitViewPanelProps {
  position: 'left' | 'right';
  menuType: MenuType | null;
  churchCode: string;
  style?: React.CSSProperties;
}

export function SplitViewPanel({ position, menuType, churchCode, style }: SplitViewPanelProps) {
  const { state, actions } = useSplitViewContext();
  const { handleDragOver, handleDrop } = useSplitViewDnD();
  const [isLoading, setIsLoading] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!menuType) return null;

  const label = menuLabelMap[menuType];
  // iframe에서 로드할 URL 생성 (Split View 내부임을 표시하는 파라미터 추가)
  const iframeSrc = `/church/${churchCode}${menuPathMap[menuType]}?splitView=true`;
  // 새 탭에서 열 URL (splitView 파라미터 없음)
  const externalUrl = `/church/${churchCode}${menuPathMap[menuType]}`;

  // 드래그 중일 때 드롭 핸들러
  const onDragOver = (e: React.DragEvent) => {
    handleDragOver(e);
    if (!isDragOver) setIsDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    // 자식 요소로 이동하는 경우 무시
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
      {/* 드래그 오버레이 - 메뉴 드래그 중일 때 표시 (iframe 위에 투명 레이어로 이벤트 캡처) */}
      {state.isDraggingMenu && (
        <div
          className={cn(
            "absolute inset-0 z-20 flex flex-col items-center justify-center transition-all duration-200",
            isDragOver
              ? "bg-accent/30 border-4 border-dashed border-accent"
              : "bg-primary/10 border-2 border-dashed border-border"
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className={cn(
            "w-16 h-16 rounded-xl flex items-center justify-center mb-3 transition-colors pointer-events-none",
            isDragOver ? "bg-accent text-white" : "bg-background/80 text-muted-foreground"
          )}>
            <ArrowLeftRight className="w-8 h-8" />
          </div>
          <p className={cn(
            "font-bold text-base pointer-events-none",
            isDragOver ? "text-accent" : "text-foreground"
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
        'flex items-center justify-between px-3 py-2 border-b bg-gradient-to-r shrink-0',
        position === 'left'
          ? 'from-muted/50 to-muted/30 border-border/60'
          : 'from-accent/10 to-accent/20 border-accent/30'
      )}>
        <span className={cn(
          'font-semibold text-sm',
          position === 'left' ? 'text-foreground' : 'text-accent'
        )}>
          {label}
        </span>

        <div className="flex items-center gap-1">
          {/* 새 탭에서 열기 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => window.open(externalUrl, '_blank')}
            title="새 탭에서 열기"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>

          {/* 교체 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={actions.swapPanels}
            title="패널 교체"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </Button>

          {/* 닫기 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            onClick={actions.disableSplitView}
            title="Split View 닫기"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 패널 콘텐츠 - iframe */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
