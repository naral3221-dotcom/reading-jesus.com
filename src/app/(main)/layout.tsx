'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Bell, Search, Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useUnreadNotificationCount, notificationKeys } from '@/presentation/hooks/queries/useNotification';
import { useQueryClient } from '@tanstack/react-query';
import { MainSidebar, MainBottomNav, MainSidePanel, MainSplitViewContainer, MainSplitViewDropZone } from '@/components/main';
import { mobileHeaderStyles } from '@/components/navigation';
import { MainSplitViewProvider } from '@/contexts/MainSplitViewContext';
import { MainDataProvider } from '@/contexts/MainDataContext';

// 실제 레이아웃 컴포넌트 (useSearchParams 사용)
function MainLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Split View 내부에서 로드된 경우 (iframe에서 로드)
  const isSplitViewMode = searchParams.get('splitView') === 'true';

  // 사용자 정보 조회
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  // 읽지 않은 알림 개수 조회 (React Query 훅 사용)
  const { data: countData } = useUnreadNotificationCount(userId);
  const unreadCount = countData?.count || 0;

  // 실시간 구독 (알림 테이블 변경 감지)
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel('notifications_count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            // 캐시 무효화하여 React Query가 자동으로 리페치하도록 함
            queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount(userId) });
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Realtime subscription failed - notifications will update on page refresh');
          }
        });
    } catch {
      console.warn('Failed to setup realtime subscription');
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, queryClient]);

  // Split View 모드에서는 간소화된 레이아웃 렌더링 (MainDataProvider는 유지)
  if (isSplitViewMode) {
    return (
      <MainDataProvider>
        <div className="min-h-screen bg-background">
          <main className="pb-0 overflow-y-auto">
            <div className="animate-in fade-in-0 duration-300">
              {children}
            </div>
          </main>
        </div>
      </MainDataProvider>
    );
  }

  return (
    <MainDataProvider>
      <MainSplitViewProvider>
        <div className="flex flex-col min-h-screen bg-background">
          {/* PC: 좌측 사이드바 */}
          <MainSidebar />

          {/* 모바일: 상단 검색/알림 버튼 */}
          <header className={mobileHeaderStyles.container}>
            <div className={mobileHeaderStyles.inner}>
              <Link
                href="/search"
                aria-label="검색"
                className={mobileHeaderStyles.iconButton}
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link
                href="/notifications"
                aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : '알림'}
                className={`relative ${mobileHeaderStyles.iconButton}`}
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className={mobileHeaderStyles.notificationBadge}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </header>

          {/* 메인 컨텐츠 영역 - 교회 레이아웃과 동일한 구조 */}
          <div className="min-h-screen flex lg:ml-48">
            {/* 메인 콘텐츠 */}
            <main className="flex-1 min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-12 lg:pt-0 lg:pb-0">
              <div className="animate-in fade-in-0 duration-300">
                {children}
              </div>
            </main>

            {/* PC: 우측 사이드 패널 (XL 이상) */}
            <MainSidePanel />
          </div>

          {/* 모바일: 하단 탭바 - 공통 컴포넌트 사용 */}
          <MainBottomNav />

          {/* PC: Split View 드롭 영역 (드래그 중에만 표시) */}
          <MainSplitViewDropZone />

          {/* PC: Split View Container */}
          <MainSplitViewContainer />
        </div>
      </MainSplitViewProvider>
    </MainDataProvider>
  );
}

// 로딩 fallback
function LayoutLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// 메인 레이아웃 (Suspense로 래핑)
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LayoutLoading />}>
      <MainLayoutContent>{children}</MainLayoutContent>
    </Suspense>
  );
}
