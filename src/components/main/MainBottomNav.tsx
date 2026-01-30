'use client';

/**
 * MainBottomNav - 메인 페이지 모바일 하단 네비게이션
 *
 * 공통 AppBottomNav 컴포넌트를 사용하여 스타일 일관성을 유지합니다.
 */

import { usePathname } from 'next/navigation';
import { Home, BookOpen, UsersRound, User } from 'lucide-react';
import { AppBottomNav, type NavItem } from '@/components/navigation';

export function MainBottomNav() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: '/home', icon: Home, label: '홈' },
    { href: '/bible', icon: BookOpen, label: '성경' },
    { href: '/group', icon: UsersRound, label: '그룹' },
    { href: '/mypage', icon: User, label: '마이' },
  ];

  const isActive = (href: string): boolean => pathname.startsWith(href);

  return (
    <AppBottomNav
      navItems={navItems}
      isActive={isActive}
      ariaLabel="메인 네비게이션"
    />
  );
}
