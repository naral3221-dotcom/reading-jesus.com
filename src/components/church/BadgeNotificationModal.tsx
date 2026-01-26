'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useUnnotifiedBadges,
  useMarkBadgeAsNotified,
} from '@/presentation/hooks/queries/useBadge';

interface BadgeNotificationModalProps {
  userId: string | null;
  onClose?: () => void;
}

export function BadgeNotificationModal({ userId, onClose }: BadgeNotificationModalProps) {
  const { data: newBadges = [] } = useUnnotifiedBadges(userId);
  const markAsNotifiedMutation = useMarkBadgeAsNotified();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // 새 배지가 있으면 모달 표시
  useEffect(() => {
    if (newBadges.length > 0) {
      setIsVisible(true);
    }
  }, [newBadges]);

  // 현재 배지 알림 처리
  const handleClose = () => {
    if (newBadges.length === 0 || !userId) return;

    const currentBadge = newBadges[currentIndex];

    markAsNotifiedMutation.mutate(
      { badgeId: currentBadge.id, userId },
      {
        onSuccess: () => {
          // 다음 배지가 있으면 표시
          if (currentIndex < newBadges.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            setIsVisible(false);
            setCurrentIndex(0);
            onClose?.();
          }
        },
        onError: () => {
          setIsVisible(false);
        },
      }
    );
  };

  const currentBadge = newBadges[currentIndex];

  if (!isVisible || !currentBadge) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative bg-background rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 배경 장식 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 컨텐츠 */}
        <div className="relative p-6 text-center">
          {/* 배지 아이콘 */}
          <div className="mb-4">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-primary/20 via-yellow-400/20 to-primary/20 animate-spin-slow" />
              <div className="relative text-6xl animate-pulse">
                {currentBadge.badge.icon}
              </div>
            </div>
          </div>

          {/* 축하 텍스트 */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-foreground" />
            <span className="text-sm font-medium text-primary">새 배지 획득!</span>
            <Sparkles className="w-5 h-5 text-foreground" />
          </div>

          <h2 className="text-xl font-bold mb-2">
            {currentBadge.badge.name}
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            {currentBadge.badge.description}
          </p>

          {/* 진행 표시 (여러 개일 때) */}
          {newBadges.length > 1 && (
            <div className="flex justify-center gap-1.5 mb-4">
              {newBadges.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          )}

          {/* 버튼 */}
          <Button onClick={handleClose} className="w-full">
            {currentIndex < newBadges.length - 1 ? '다음 배지 보기' : '확인'}
          </Button>
        </div>
      </div>
    </div>
  );
}
