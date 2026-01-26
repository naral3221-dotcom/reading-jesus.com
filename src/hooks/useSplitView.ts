'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'meditation-split-ratio';
const DEFAULT_RATIO = 50;
const MIN_RATIO = 30;
const MAX_RATIO = 70;

export interface UseSplitViewReturn {
  // 분할 비율 (왼쪽 패널의 퍼센트)
  splitRatio: number;
  // 드래그 중인지 여부
  isDragging: boolean;
  // 드래그 시작 핸들러
  handleDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  // 비율 직접 설정
  setSplitRatio: (ratio: number) => void;
  // 기본값으로 리셋
  resetRatio: () => void;
}

export function useSplitView(): UseSplitViewReturn {
  const [splitRatio, setSplitRatioState] = useState(DEFAULT_RATIO);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  // localStorage에서 저장된 비율 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= MIN_RATIO && parsed <= MAX_RATIO) {
        setSplitRatioState(parsed);
      }
    }
  }, []);

  // 비율 설정 및 저장
  const setSplitRatio = useCallback((ratio: number) => {
    const clampedRatio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
    setSplitRatioState(clampedRatio);
    localStorage.setItem(STORAGE_KEY, clampedRatio.toString());
  }, []);

  // 기본값으로 리셋
  const resetRatio = useCallback(() => {
    setSplitRatioState(DEFAULT_RATIO);
    localStorage.setItem(STORAGE_KEY, DEFAULT_RATIO.toString());
  }, []);

  // 마우스/터치 이동 핸들러
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const newRatio = ((clientX - rect.left) / rect.width) * 100;
    setSplitRatio(newRatio);
  }, [setSplitRatio]);

  // 드래그 종료 핸들러
  const handleEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // 마우스 이동 핸들러
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  // 터치 이동 핸들러
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  // 이벤트 리스너 등록/해제
  useEffect(() => {
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
  }, [isDragging, handleMouseMove, handleTouchMove, handleEnd]);

  // 드래그 시작 핸들러
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    // 컨테이너 참조 저장
    const target = e.currentTarget as HTMLElement;
    containerRef.current = target.parentElement;
  }, []);

  return {
    splitRatio,
    isDragging,
    handleDragStart,
    setSplitRatio,
    resetRatio,
  };
}
