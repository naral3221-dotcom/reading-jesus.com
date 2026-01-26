'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type SnapPoint = 'quarter' | 'third' | 'half' | 'threeQuarter';

const SNAP_POINTS: Record<SnapPoint, number> = {
  quarter: 25,
  third: 33,
  half: 50,
  threeQuarter: 75,
};

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  defaultHeight?: SnapPoint;
  title?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  defaultHeight = 'third',
  title,
  showCloseButton = true,
  closeOnOverlayClick: _closeOnOverlayClick = true,
  className,
}: BottomSheetProps) {
  // closeOnOverlayClick은 현재 사용하지 않음 (배경 스크롤 허용을 위해)
  void _closeOnOverlayClick;
  const [height, setHeight] = useState(SNAP_POINTS[defaultHeight]);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartHeight = useRef<number>(0);

  // 열릴 때 기본 높이로 설정
  useEffect(() => {
    if (isOpen) {
      setHeight(SNAP_POINTS[defaultHeight]);
    }
  }, [isOpen, defaultHeight]);

  // 가장 가까운 스냅 포인트 찾기
  const findNearestSnapPoint = useCallback((currentHeight: number): number => {
    const snapValues = Object.values(SNAP_POINTS);
    let nearest = snapValues[0];
    let minDiff = Math.abs(currentHeight - snapValues[0]);

    for (const snap of snapValues) {
      const diff = Math.abs(currentHeight - snap);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = snap;
      }
    }
    return nearest;
  }, []);

  // 드래그 시작
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    dragStartY.current = clientY;
    dragStartHeight.current = height;
  }, [height]);

  // 드래그 중
  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;

    const deltaY = dragStartY.current - clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = Math.max(15, Math.min(85, dragStartHeight.current + deltaPercent));
    setHeight(newHeight);
  }, [isDragging]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    // 너무 작으면 닫기
    if (height < 20) {
      onClose();
      return;
    }

    // 가장 가까운 스냅 포인트로 이동
    const snappedHeight = findNearestSnapPoint(height);
    setHeight(snappedHeight);
  }, [isDragging, height, findNearestSnapPoint, onClose]);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // 마우스 이벤트 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  }, [handleDragStart]);

  // 전역 마우스 이벤트 (드래그 중)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 배경 스크롤 방지 - allowBackgroundScroll이 true면 스크롤 허용
  // bible-reader에서는 배경 스크롤이 필요하므로 이 기능 비활성화

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 - 시각적 효과만, 클릭은 통과 */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity pointer-events-none"
        style={{
          opacity: isDragging ? 0.4 : 1,
          bottom: `${height}vh` // 시트 위 영역만 어둡게
        }}
      />

      {/* 바텀시트 */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl",
          "transition-[height] ease-out",
          isDragging ? "duration-0" : "duration-200",
          className
        )}
        style={{ height: `${height}vh` }}
      >
        {/* 드래그 핸들 영역 */}
        <div
          className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          {/* 핸들 바 */}
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* 헤더 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h3 className="font-semibold text-sm">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ maxHeight: `calc(${height}vh - 60px)` }}>
          {children}
        </div>
      </div>
    </>
  );
}
