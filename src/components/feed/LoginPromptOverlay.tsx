'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

interface LoginPromptOverlayProps {
  itemIndex: number;
  previewLimit?: number;
}

export function LoginPromptOverlay({ itemIndex, previewLimit = 5 }: LoginPromptOverlayProps) {
  // 미리보기 제한 이내면 표시 안함
  if (itemIndex < previewLimit) {
    return null;
  }

  // 첫 번째 블러 아이템에만 오버레이 표시
  if (itemIndex > previewLimit) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-background via-background/95 to-background/80 p-6 text-center">
      <div className="max-w-sm space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold">더 많은 묵상을 보려면</h3>
        <p className="text-muted-foreground text-sm">
          로그인하고 전국의 성도들과 함께 말씀을 나눠보세요
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              <LogIn className="w-4 h-4 mr-2" />
              로그인
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              회원가입
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// 로그인 필요 모달 (좋아요/댓글 클릭 시)
interface LoginRequiredModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginRequiredModal({ open, onClose }: LoginRequiredModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold">로그인이 필요합니다</h3>
          <p className="text-muted-foreground text-sm">
            좋아요와 댓글은 로그인 후 이용할 수 있어요
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/login" className="w-full">
              <Button size="lg" className="w-full">
                로그인하기
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={onClose}
            >
              나중에 하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
