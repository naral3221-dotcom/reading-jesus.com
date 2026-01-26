'use client';

import { Info, Calendar, BookOpen, Gift, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ReadingJesusPlanInfoProps {
  trigger?: 'icon' | 'button';
  className?: string;
}

export function ReadingJesusPlanInfo({ trigger = 'icon', className }: ReadingJesusPlanInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 마운트
  useEffect(() => {
    setMounted(true);
  }, []);

  const modalContent = isOpen ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-background rounded-2xl w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            📖 리딩지저스 2026 플랜
          </h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            리딩지저스는 1년 365일 동안 성경 전체를 통독하는
            체계적인 성경 읽기 프로그램입니다.
          </p>

          {/* 일정 */}
          <div className="bg-accent/10 dark:bg-accent/20/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium text-accent dark:text-accent-foreground">
              <Calendar className="w-4 h-4" />
              일정
            </div>
            <ul className="text-sm space-y-1 ml-6">
              <li>시작일: 2026년 1월 12일 (월요일)</li>
              <li>종료일: 2027년 1월 11일</li>
              <li>휴식일: 매주 일요일</li>
            </ul>
          </div>

          {/* 구성 */}
          <div className="bg-accent/10 dark:bg-accent/20/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium text-accent dark:text-accent-foreground">
              <BookOpen className="w-4 h-4" />
              구성
            </div>
            <ul className="text-sm space-y-1 ml-6">
              <li>총 313일 (일요일 52일 휴식)</li>
              <li>매일 구약 + 신약 병행 읽기</li>
              <li>하루 평균 3-4장</li>
            </ul>
          </div>

          {/* 특전 */}
          <div className="bg-accent/10 dark:bg-accent/20/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-medium text-accent dark:text-accent-foreground">
              <Gift className="w-4 h-4" />
              특전
            </div>
            <ul className="text-sm space-y-1 ml-6">
              <li>전용 QT 가이드 제공</li>
              <li>매일 묵상 질문</li>
              <li>함께 나누는 커뮤니티</li>
            </ul>
          </div>

          {/* 안내 */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            이 플랜은 2026년 1월 12일부터 시작되며,<br />
            그 전에는 Day 1부터 순차적으로 진행됩니다.
          </p>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-background border-t p-4">
          <Button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full"
          >
            확인
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* 트리거 버튼 */}
      {trigger === 'icon' ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(true);
          }}
          className={`p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10 relative ${className}`}
          title="리딩지저스 플랜 상세 정보"
        >
          <Info className="w-4 h-4" />
        </button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(true);
          }}
          className={className}
        >
          <Info className="w-4 h-4 mr-1" />
          자세히 보기
        </Button>
      )}

      {/* Portal을 사용하여 body에 직접 렌더링 (z-index 충돌 방지) */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
