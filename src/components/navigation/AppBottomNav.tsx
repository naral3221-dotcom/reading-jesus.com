'use client';

/**
 * AppBottomNav - 통합 모바일 하단 네비게이션 컴포넌트
 *
 * 메인 페이지와 교회 페이지에서 공통으로 사용하는 모바일 하단 탭바입니다.
 * 스타일은 navStyles.ts에서 통합 관리됩니다.
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { bottomNavStyles, getBottomNavItemClasses } from './navStyles';
import type { NavItem } from './AppSidebar';

interface AppBottomNavProps {
  /** 네비게이션 아이템 목록 */
  navItems: NavItem[];
  /** 현재 활성 경로 판별 함수 */
  isActive: (href: string) => boolean;
  /** 네비게이션 라벨 (접근성용) */
  ariaLabel?: string;
  /** 추가 클래스 */
  className?: string;
}

export function AppBottomNav({
  navItems,
  isActive,
  ariaLabel = '메인 네비게이션',
  className,
}: AppBottomNavProps) {
  const styles = bottomNavStyles;

  return (
    <nav
      className={cn(styles.container, className)}
      aria-label={ariaLabel}
      role="navigation"
    >
      <div
        className={styles.inner}
        style={{
          height: styles.height,
          paddingBottom: styles.paddingBottom,
        }}
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={getBottomNavItemClasses(active)}
            >
              {/* 활성 표시기 */}
              {active && <span className={styles.navItem.indicator} />}

              {/* 아이콘 컨테이너 */}
              <div
                className={cn(
                  styles.navItem.iconContainer.base,
                  active && styles.navItem.iconContainer.active
                )}
              >
                <Icon
                  className={cn(
                    styles.navItem.icon.base,
                    active && styles.navItem.icon.active
                  )}
                  aria-hidden="true"
                />
              </div>

              {/* 라벨 */}
              <span
                className={cn(
                  styles.navItem.label.base,
                  active ? styles.navItem.label.active : styles.navItem.label.inactive
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
