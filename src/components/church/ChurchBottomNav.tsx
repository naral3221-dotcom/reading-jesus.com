'use client';

/**
 * ChurchBottomNav - 교회 페이지 모바일 하단 네비게이션
 *
 * 공통 AppBottomNav 컴포넌트를 사용하여 스타일 일관성을 유지합니다.
 */

import { usePathname } from 'next/navigation';
import { Home, BookOpen, MessageCircle, Users, User } from 'lucide-react';
import { AppBottomNav, type NavItem } from '@/components/navigation';

interface ChurchBottomNavProps {
  churchCode: string;
}

export function ChurchBottomNav({ churchCode }: ChurchBottomNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: `/church/${churchCode}`, icon: Home, label: '홈' },
    { href: `/church/${churchCode}/bible`, icon: BookOpen, label: '성경' },
    { href: `/church/${churchCode}/sharing`, icon: MessageCircle, label: '나눔' },
    { href: `/church/${churchCode}/groups`, icon: Users, label: '그룹' },
    { href: `/church/${churchCode}/my`, icon: User, label: '마이' },
  ];

  const isActive = (href: string): boolean => {
    if (href === `/church/${churchCode}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <AppBottomNav
      navItems={navItems}
      isActive={isActive}
      ariaLabel="교회 네비게이션"
    />
  );
}
