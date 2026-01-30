'use client';

/**
 * DraggableSidebar - 교회 페이지 PC 사이드바
 *
 * 공통 AppSidebar 컴포넌트를 사용하여 스타일 일관성을 유지합니다.
 * Split View 기능을 지원합니다.
 */

import { usePathname } from 'next/navigation';
import { Home, BookOpen, MessageCircle, Users, User, LayoutGrid } from 'lucide-react';
import { AppSidebar, type NavItem, type UtilityItem } from '@/components/navigation';
import { useSplitViewDnD } from '@/hooks/useSplitViewDnD';
import { MenuType, menuLabelMap, useSplitViewContext } from '@/contexts/SplitViewContext';

interface DraggableSidebarProps {
  churchCode: string;
}

const menuIcons: Record<MenuType, React.ComponentType<{ className?: string }>> = {
  home: Home,
  bible: BookOpen,
  sharing: MessageCircle,
  groups: Users,
  my: User,
};

export function DraggableSidebar({ churchCode }: DraggableSidebarProps) {
  const pathname = usePathname();
  const { handleDragStart, handleDragEnd, isDraggingMenu } = useSplitViewDnD();
  const { state } = useSplitViewContext();

  const navItems: NavItem[] = [
    { href: `/church/${churchCode}`, icon: menuIcons.home, label: menuLabelMap.home, menu: 'home' },
    { href: `/church/${churchCode}/bible`, icon: menuIcons.bible, label: menuLabelMap.bible, menu: 'bible' },
    { href: `/church/${churchCode}/sharing`, icon: menuIcons.sharing, label: menuLabelMap.sharing, menu: 'sharing' },
    { href: `/church/${churchCode}/groups`, icon: menuIcons.groups, label: menuLabelMap.groups, menu: 'groups' },
    { href: `/church/${churchCode}/my`, icon: menuIcons.my, label: menuLabelMap.my, menu: 'my' },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/church/${churchCode}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const isInSplitView = (menu: string): boolean => {
    return state.isEnabled && (state.leftMenu === menu || state.rightMenu === menu);
  };

  const utilityItems: UtilityItem[] = [
    { href: '/home', icon: LayoutGrid, label: '메인으로' },
  ];

  // 타입 변환을 위한 래퍼 함수
  const handleDragStartWrapper = (e: React.DragEvent, menu: string) => {
    handleDragStart(e, menu as MenuType);
  };

  return (
    <AppSidebar
      navItems={navItems}
      isActive={isActive}
      variant="expanded"
      showLogo={true}
      logoHref={`/church/${churchCode}`}
      logoText="Reading Jesus"
      utilityItems={utilityItems}
      draggable={true}
      onDragStart={handleDragStartWrapper}
      onDragEnd={handleDragEnd}
      isDragging={isDraggingMenu}
      isInSplitView={isInSplitView}
    />
  );
}
