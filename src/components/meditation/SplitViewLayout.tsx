'use client';

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'meditation-split-ratio';
const DEFAULT_RATIO = 50;
const MIN_RATIO = 30;
const MAX_RATIO = 70;

interface SplitViewLayoutProps {
  // 왼쪽 패널 (성경 본문)
  leftPanel: ReactNode;
  // 오른쪽 패널 (에디터)
  rightPanel: ReactNode;
  // 오른쪽 패널 표시 여부
  isRightPanelOpen: boolean;
  // 오른쪽 패널 닫기 핸들러
  onRightPanelClose: () => void;
  // 오른쪽 패널 제목
  rightPanelTitle?: string;
  // 클래스명
  className?: string;
}

export function SplitViewLayout({
  leftPanel,
  rightPanel,
  isRightPanelOpen,
  onRightPanelClose,
  rightPanelTitle = '묵상 작성',
  className,
}: SplitViewLayoutProps) {
  const [splitRatio, setSplitRatio] = useState(DEFAULT_RATIO);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // localStorage에서 저장된 비율 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_RATIO && parsed <= MAX_RATIO) {
        setSplitRatio(parsed);
      }
    }
  }, []);

  // 비율 설정 및 저장
  const updateSplitRatio = useCallback((ratio: number) => {
    const clampedRatio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
    setSplitRatio(clampedRatio);
    localStorage.setItem(STORAGE_KEY, clampedRatio.toString());
  }, []);

  // 마우스/터치 이동 핸들러
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = ((clientX - rect.left) / rect.width) * 100;
    updateSplitRatio(newRatio);
  }, [updateSplitRatio]);

  // 드래그 종료 핸들러
  const handleEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // 전역 이벤트 핸들러
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  // 드래그 시작 핸들러
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  // 에디터 확장 토글
  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // 비율 리셋 (더블클릭)
  const handleResetRatio = useCallback(() => {
    updateSplitRatio(DEFAULT_RATIO);
  }, [updateSplitRatio]);

  // 오른쪽 패널이 열려있지 않으면 단일 컬럼
  if (!isRightPanelOpen) {
    return (
      <div className={cn('h-full', className)}>
        {leftPanel}
      </div>
    );
  }

  // 확장 모드 (에디터만)
  if (isExpanded) {
    return (
      <div className={cn('h-full flex flex-col', className)}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <h3 className="font-medium">{rightPanelTitle}</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleExpand}
              title="패널 축소"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRightPanelClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* 에디터 */}
        <div className="flex-1 overflow-y-auto">
          {rightPanel}
        </div>
      </div>
    );
  }

  // 분할 뷰
  return (
    <div
      ref={containerRef}
      className={cn('h-full flex', className)}
    >
      {/* 왼쪽 패널 (성경) */}
      <div
        className="h-full overflow-y-auto"
        style={{ width: `${splitRatio}%` }}
      >
        {leftPanel}
      </div>

      {/* 분할 조절 핸들 */}
      <div
        className={cn(
          'relative w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize flex-shrink-0',
          isDragging && 'bg-primary'
        )}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onDoubleClick={handleResetRatio}
        title="드래그로 비율 조절, 더블클릭으로 초기화"
      >
        {/* 드래그 핸들 아이콘 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-muted rounded flex items-center justify-center border">
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* 오른쪽 패널 (에디터) */}
      <div
        className="h-full flex flex-col bg-background"
        style={{ width: `${100 - splitRatio}%` }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
          <h3 className="font-medium">{rightPanelTitle}</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleExpand}
              title="패널 확장"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRightPanelClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* 에디터 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
