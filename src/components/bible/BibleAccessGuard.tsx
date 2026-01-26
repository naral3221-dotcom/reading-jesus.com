'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, LogIn, QrCode, BookOpen, Loader2 } from 'lucide-react';
import { useBibleAccess } from '@/hooks/useBibleAccess';

interface BibleAccessGuardProps {
  children: ReactNode;
  churchCode?: string;
  redirectUrl?: string;
}

/**
 * 성경 접근 제한 가드 컴포넌트
 * 저작권 보호를 위해 로그인하거나 QR 토큰이 있어야 성경 콘텐츠를 볼 수 있음
 */
export function BibleAccessGuard({
  children,
  churchCode,
  redirectUrl,
}: BibleAccessGuardProps) {
  const router = useRouter();
  const { hasAccess, isLoading } = useBibleAccess({ churchCode });

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <BookOpen className="w-8 h-8 text-white animate-pulse" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">접근 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 접근 권한 있음
  if (hasAccess) {
    return <>{children}</>;
  }

  // 접근 권한 없음 - 로그인 또는 QR 스캔 안내
  const loginRedirect = redirectUrl || (typeof window !== 'undefined' ? window.location.href : '/');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-background to-muted/30 p-4">
      <Card className="max-w-md w-full shadow-lg border-border/60">
        <CardContent className="pt-8 pb-6 text-center">
          {/* 아이콘 */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center shadow-inner">
            <Lock className="w-10 h-10 text-slate-400" />
          </div>

          {/* 제목 */}
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            로그인이 필요합니다
          </h1>

          {/* 설명 */}
          <p className="text-sm text-muted-foreground mb-6">
            성경 본문은 저작권 보호를 위해<br />
            로그인한 사용자만 열람할 수 있습니다.
          </p>

          {/* 안내 박스 */}
          <div className="bg-muted/80 border border-border/50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-foreground font-medium mb-2">
              성경을 읽으려면:
            </p>
            <ul className="text-sm text-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <LogIn className="w-4 h-4 mt-0.5 shrink-0" />
                <span>카카오/구글 계정으로 로그인</span>
              </li>
              {churchCode && (
                <li className="flex items-start gap-2">
                  <QrCode className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>교회에서 제공하는 QR 코드 스캔</span>
                </li>
              )}
            </ul>
          </div>

          {/* 버튼 */}
          <div className="space-y-3">
            <Button
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/25"
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`)}
            >
              <LogIn className="w-5 h-5 mr-2" />
              로그인하기
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.back()}
            >
              이전으로 돌아가기
            </Button>
          </div>

          {/* 저작권 안내 */}
          <p className="text-xs text-muted-foreground mt-6">
            본 서비스의 성경 본문은 대한성서공회의 저작권 정책을 준수합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default BibleAccessGuard;
