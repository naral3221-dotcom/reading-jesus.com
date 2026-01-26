'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Main section error:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-destructive" />
        </div>

        <h2 className="text-xl font-bold mb-2">페이지 로딩 오류</h2>
        <p className="text-sm text-muted-foreground mb-4">
          일시적인 오류가 발생했습니다.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-3 bg-muted rounded-lg text-left">
            <p className="text-xs font-mono text-destructive break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <Button onClick={reset} size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            다시 시도
          </Button>
          <Link href="/home">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 mr-1" />
              홈으로
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
