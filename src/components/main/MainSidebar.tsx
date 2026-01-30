'use client';

/**
 * MainSidebar - 메인 페이지 PC 좌측 사이드바
 *
 * 공통 AppSidebar 컴포넌트를 사용하여 스타일 일관성을 유지합니다.
 * Split View 및 드래그 기능을 지원합니다.
 */

import { usePathname } from 'next/navigation';
import { Home, BookOpen, UsersRound, User, Bell, Search } from 'lucide-react';
import { AppSidebar, type NavItem, type UtilityItem } from '@/components/navigation';
import { useUnreadNotificationCount } from '@/presentation/hooks/queries/useNotification';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useMainSplitViewContext, MainMenuType } from '@/contexts/MainSplitViewContext';
import { useMainSplitViewDnD } from '@/hooks/useMainSplitViewDnD';

interface MainSidebarProps {
  className?: string;
}

export function MainSidebar({ className }: MainSidebarProps) {
  const pathname = usePathname();
  const { handleDragStart, handleDragEnd, isDraggingMenu } = useMainSplitViewDnD();
  const { state } = useMainSplitViewContext();

  // 사용자 정보 및 알림 개수
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id ?? null;
  const { data: countData } = useUnreadNotificationCount(userId);
  const unreadCount = countData?.count || 0;

  const navItems: NavItem[] = [
    { href: '/home', icon: Home, label: '홈', menu: 'home' },
    { href: '/bible', icon: BookOpen, label: '성경', menu: 'bible' },
    { href: '/group', icon: UsersRound, label: '그룹', menu: 'group' },
    { href: '/mypage', icon: User, label: '마이', menu: 'mypage' },
  ];

  const utilityItems: UtilityItem[] = [
    { href: '/search', icon: Search, label: '검색' },
    { href: '/notifications', icon: Bell, label: '알림', badge: unreadCount },
  ];

  const isActive = (href: string): boolean => pathname.startsWith(href);

  const isInSplitView = (menu: string): boolean => {
    return state.isEnabled && (state.leftMenu === menu || state.rightMenu === menu);
  };

  return (
    <AppSidebar
      navItems={navItems}
      isActive={isActive}
      variant="expanded"
      showLogo={true}
      logoHref="/home"
      logoText="Reading Jesus"
      utilityItems={utilityItems}
      draggable={true}
      onDragStart={handleDragStart as (e: React.DragEvent, menu: string) => void}
      onDragEnd={handleDragEnd}
      isDragging={isDraggingMenu}
      isInSplitView={isInSplitView}
      className={className}
    />
  );
}
