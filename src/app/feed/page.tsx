'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * /feed 레거시 URL 리다이렉트 페이지
 * 기존에 공유된 /feed?post=ID URL을 /home?post=ID로 리다이렉트합니다.
 */

function FeedRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId) {
      router.replace(`/home?post=${postId}`);
    } else {
      router.replace('/home');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
}

export default function FeedRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">잠시만 기다려주세요...</p>
          </div>
        </div>
      }
    >
      <FeedRedirectContent />
    </Suspense>
  );
}
