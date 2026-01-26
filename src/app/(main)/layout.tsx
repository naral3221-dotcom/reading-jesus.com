'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, BookOpen, User, UsersRound, Bell, Search, Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useUnreadNotificationCount, notificationKeys } from '@/presentation/hooks/queries/useNotification';
import { useQueryClient } from '@tanstack/react-query';
import { MainSidebar, MainSidePanel, MainSplitViewContainer, MainSplitViewDropZone } from '@/components/main';
import { MainSplitViewProvider } from '@/contexts/MainSplitViewContext';
import { MainDataProvider } from '@/contexts/MainDataContext';

const navItems = [
  { href: '/home', icon: Home, label: '홈' },
  { href: '/bible', icon: BookOpen, label: '성경' },
  { href: '/group', icon: UsersRound, label: '그룹' },
  { href: '/mypage', icon: User, label: '마이' },
];

// 실제 레이아웃 컴포넌트 (useSearchParams 사용)
function MainLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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

          {/* 모바일: 상단 검색/알림 버튼 - Apple 스타일 */}
          <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm">
            <div className="flex items-center justify-end gap-1 px-4 h-12 max-w-lg mx-auto">
              <Link
                href="/search"
                aria-label="검색"
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl hover:bg-muted/60 active:scale-95 transition-all duration-200"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link
                href="/notifications"
                aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : '알림'}
                className="relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl hover:bg-muted/60 active:scale-95 transition-all duration-200"
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-[20px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1.5 shadow-sm">
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

          {/* 모바일: 하단 탭바 - Apple 스타일 */}
          <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/40 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
            aria-label="메인 네비게이션"
            role="navigation"
          >
            <div
              className="flex items-center justify-around max-w-lg mx-auto"
              style={{
                height: 'calc(4rem + env(safe-area-inset-bottom))',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      "flex flex-col items-center justify-center w-full min-w-[64px] h-16 transition-all duration-300 relative group",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground active:scale-95"
                    )}
                  >
                    {/* Active Indicator - Apple 스타일 pill */}
                    {isActive && (
                      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full shadow-sm" />
                    )}
                    {/* 아이콘 컨테이너 - 부드러운 배경 효과 */}
                    <div className={cn(
                      "flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-all duration-200",
                      isActive && "bg-primary/10"
                    )}>
                      <Icon
                        className={cn(
                          "w-6 h-6 transition-all duration-200",
                          isActive && "scale-110"
                        )}
                        aria-hidden="true"
                      />
                    </div>
                    <span className={cn(
                      "text-xs transition-all duration-200 -mt-1.5",
                      isActive ? "font-semibold text-primary" : "font-medium"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

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
