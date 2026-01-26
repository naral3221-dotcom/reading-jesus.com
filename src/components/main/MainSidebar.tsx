'use client';

/**
 * MainSidebar - 메인 페이지 PC 좌측 사이드바
 *
 * PC 화면(lg 이상)에서만 표시되는 고정 사이드바입니다.
 * 드래그하여 Split View를 활성화할 수 있습니다.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, UsersRound, User, Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadNotificationCount } from '@/presentation/hooks/queries/useNotification';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useMainSplitViewContext, MainMenuType } from '@/contexts/MainSplitViewContext';
import { useMainSplitViewDnD } from '@/hooks/useMainSplitViewDnD';

interface MainSidebarProps {
  className?: string;
}

const navItems: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; menu: MainMenuType }[] = [
  { href: '/home', icon: Home, label: '홈', menu: 'home' },
  { href: '/bible', icon: BookOpen, label: '성경', menu: 'bible' },
  { href: '/group', icon: UsersRound, label: '그룹', menu: 'group' },
  { href: '/mypage', icon: User, label: '마이', menu: 'mypage' },
];

export function MainSidebar({ className }: MainSidebarProps) {
  const pathname = usePathname();
  const { handleDragStart, handleDragEnd, isDraggingMenu } = useMainSplitViewDnD();
  const { state } = useMainSplitViewContext();

  // 사용자 정보 및 알림 개수
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id ?? null;
  const { data: countData } = useUnreadNotificationCount(userId);
  const unreadCount = countData?.count || 0;

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav className={cn(
      // Apple 스타일: 글래스모피즘, 부드러운 그림자
      'hidden lg:flex fixed left-0 top-0 bottom-0 w-48 z-50 flex-col items-stretch py-6 px-3',
      'bg-background/80 backdrop-blur-xl border-r border-border/40',
      'shadow-[4px_0_24px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)]',
      className
    )}>
      {/* 로고 영역 - Apple 스타일 */}
      <div className="mb-8 px-2">
        <Link
          href="/home"
          className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-muted/60 transition-all duration-300"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-md shadow-primary/20">
            R
          </div>
          <span className="text-sm font-semibold text-foreground">Reading Jesus</span>
        </Link>
      </div>

      {/* 네비게이션 아이템들 */}
      <div className="flex flex-col gap-1 flex-1 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          // Split View에서 현재 표시 중인지 확인
          const isInSplitView = state.isEnabled && (state.leftMenu === item.menu || state.rightMenu === item.menu);

          return (
            <div
              key={item.href}
              draggable
              onDragStart={(e) => handleDragStart(e, item.menu)}
              onDragEnd={handleDragEnd}
              className={cn(
                'relative group cursor-grab active:cursor-grabbing',
                isDraggingMenu && 'opacity-50'
              )}
            >
              <Link
                href={item.href}
                className={cn(
                  // Apple 스타일: 가로 배치, 부드러운 전환
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative',
                  active
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                  isInSplitView && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background'
                )}
              >
                {/* 활성 표시기 - Apple 스타일 pill */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary shadow-sm" />
                )}
                <Icon className={cn(
                  'w-[18px] h-[18px] transition-all duration-200 shrink-0',
                  active && 'scale-105'
                )} />
                <span className={cn(
                  'text-[13px] font-medium transition-all duration-200',
                  active && 'text-primary font-semibold'
                )}>
                  {item.label}
                </span>
              </Link>

              {/* 드래그 힌트 툴팁 - Apple 스타일 */}
              <div className={cn(
                'absolute left-full ml-3 top-1/2 -translate-y-1/2',
                'px-3 py-1.5 bg-foreground/90 text-background text-xs rounded-lg whitespace-nowrap shadow-lg',
                'opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50',
                'translate-x-1 group-hover:translate-x-0'
              )}>
                드래그하여 Split View
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 유틸리티 버튼 - Apple 스타일 */}
      <div className="flex flex-col gap-1 mt-auto px-2">
        {/* 검색 */}
        <Link
          href="/search"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all duration-200"
        >
          <Search className="w-[18px] h-[18px] shrink-0" />
          <span className="text-[13px] font-medium">검색</span>
        </Link>

        {/* 알림 */}
        <Link
          href="/notifications"
          className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all duration-200"
        >
          <Bell className="w-[18px] h-[18px] shrink-0" />
          <span className="text-[13px] font-medium">알림</span>
          {unreadCount > 0 && (
            <span className="ml-auto min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1 shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
