'use client';

import { useState, useEffect } from 'react';
import { X, Bell, ChevronLeft, ChevronRight, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useActiveChurchNotices } from '@/presentation/hooks/queries/useChurchNotice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ChurchNotice } from '@/domain/entities/ChurchNotice';

interface NoticeBannerProps {
  churchId: string;
}

export default function NoticeBanner({ churchId }: NoticeBannerProps) {
  const { data, isLoading } = useActiveChurchNotices(churchId);
  const notices = data?.notices || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<ChurchNotice | null>(null);

  // 자동 슬라이드 (5초마다)
  useEffect(() => {
    if (notices.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [notices.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + notices.length) % notices.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notices.length);
  };

  const handleDismiss = () => {
    setDismissed(true);
    // 세션 동안만 숨김 (세션스토리지 사용)
    sessionStorage.setItem(`notice_dismissed_${churchId}`, 'true');
  };

  const handleNoticeClick = (notice: ChurchNotice) => {
    setSelectedNotice(notice);
    setDialogOpen(true);
  };

  // 세션 동안 숨김 상태 확인
  useEffect(() => {
    const isDismissed = sessionStorage.getItem(`notice_dismissed_${churchId}`);
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, [churchId]);

  if (isLoading || dismissed || notices.length === 0) {
    return null;
  }

  const currentNotice = notices[currentIndex];

  return (
    <>
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2">
          {/* 왼쪽: 아이콘 + 내용 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              {currentNotice.isPinned ? (
                <Pin className="w-4 h-4 text-primary" />
              ) : (
                <Bell className="w-4 h-4 text-primary" />
              )}
            </div>
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => handleNoticeClick(currentNotice)}
            >
              <div className="flex items-center gap-2">
                {currentNotice.isPinned && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full shrink-0">
                    고정
                  </span>
                )}
                <span className="font-medium text-sm truncate">
                  {currentNotice.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {currentNotice.content}
              </p>
            </div>
          </div>

          {/* 오른쪽: 네비게이션 + 닫기 */}
          <div className="flex items-center gap-1 shrink-0">
            {notices.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                  {currentIndex + 1}/{notices.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-1"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 전체 내용 모달 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotice?.isPinned && (
                <Pin className="w-4 h-4 text-primary" />
              )}
              {selectedNotice?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedNotice?.createdAt &&
                new Date(selectedNotice.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm whitespace-pre-wrap">{selectedNotice?.content}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
