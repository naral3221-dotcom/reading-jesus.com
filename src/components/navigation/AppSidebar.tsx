'use client';

/**
 * AppSidebar - 통합 PC 사이드바 컴포넌트
 *
 * 메인 페이지와 교회 페이지에서 공통으로 사용하는 PC 좌측 사이드바입니다.
 * 스타일은 navStyles.ts에서 통합 관리됩니다.
 */

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { sidebarStyles, getExpandedNavItemClasses, getCompactNavItemClasses } from './navStyles';

// 네비게이션 아이템 타입
export interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  menu?: string; // Split View용 메뉴 식별자
}

// 유틸리티 아이템 타입
export interface UtilityItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

interface AppSidebarProps {
  /** 네비게이션 아이템 목록 */
  navItems: NavItem[];
  /** 현재 활성 경로 판별 함수 */
  isActive: (href: string) => boolean;
  /** 확장형(가로) vs 컴팩트형(세로) */
  variant?: 'expanded' | 'compact';
  /** 로고 표시 여부 */
  showLogo?: boolean;
  /** 로고 클릭 시 이동할 경로 */
  logoHref?: string;
  /** 로고 텍스트 */
  logoText?: string;
  /** 하단 유틸리티 아이템들 */
  utilityItems?: UtilityItem[];
  /** 드래그 가능 여부 (Split View용) */
  draggable?: boolean;
  /** 드래그 시작 핸들러 */
  onDragStart?: (e: React.DragEvent, menu: string) => void;
  /** 드래그 종료 핸들러 */
  onDragEnd?: (e: React.DragEvent) => void;
  /** 현재 드래그 중인지 여부 */
  isDragging?: boolean;
  /** Split View에서 표시 중인 메뉴 확인 함수 */
  isInSplitView?: (menu: string) => boolean;
  /** 추가 클래스 */
  className?: string;
}

export function AppSidebar({
  navItems,
  isActive,
  variant = 'expanded',
  showLogo = true,
  logoHref = '/home',
  logoText = 'Reading Jesus',
  utilityItems = [],
  draggable = false,
  onDragStart,
  onDragEnd,
  isDragging = false,
  isInSplitView,
  className,
}: AppSidebarProps) {
  const styles = sidebarStyles;
  const isExpanded = variant === 'expanded';

  return (
    <nav
      className={cn(
        styles.container,
        isExpanded ? styles.width.expanded : styles.width.compact,
        className
      )}
      aria-label="메인 네비게이션"
      role="navigation"
    >
      {/* 로고 영역 */}
      {showLogo && isExpanded && (
        <div className={styles.logo.container}>
          <Link href={logoHref} className={styles.logo.link}>
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-md">
              <Image
                src="/logo.png"
                alt="리딩지저스"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div className={styles.logo.textContainer}>
              {logoText.split(' ').map((word, index) => (
                <span key={index} className={styles.logo.text}>{word}</span>
              ))}
            </div>
          </Link>
        </div>
      )}

      {/* 네비게이션 아이템들 */}
      <div className={isExpanded ? styles.navContainer.expanded : styles.navContainer.compact}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const inSplitView = isInSplitView?.(item.menu || '') ?? false;

          if (isExpanded) {
            // 확장형 (가로 배치)
            return (
              <div
                key={item.href}
                draggable={draggable}
                onDragStart={draggable && onDragStart ? (e) => onDragStart(e, item.menu || '') : undefined}
                onDragEnd={draggable && onDragEnd ? onDragEnd : undefined}
                className={cn(
                  styles.navItemExpanded.wrapper,
                  isDragging && 'opacity-50'
                )}
              >
                <Link
                  href={item.href}
                  className={getExpandedNavItemClasses(active, inSplitView)}
                >
                  {/* 활성 표시기 */}
                  {active && <span className={styles.navItemExpanded.indicator} />}
                  <Icon
                    className={cn(
                      styles.navItemExpanded.icon.base,
                      active && styles.navItemExpanded.icon.active
                    )}
                  />
                  <span
                    className={cn(
                      styles.navItemExpanded.label.base,
                      active && styles.navItemExpanded.label.active
                    )}
                  >
                    {item.label}
                  </span>
                </Link>

                {/* 드래그 힌트 툴팁 */}
                {draggable && (
                  <div className={styles.dragTooltip}>
                    드래그하여 Split View
                  </div>
                )}
              </div>
            );
          }

          // 컴팩트형 (세로 배치)
          return (
            <div
              key={item.href}
              draggable={draggable}
              onDragStart={draggable && onDragStart ? (e) => onDragStart(e, item.menu || '') : undefined}
              onDragEnd={draggable && onDragEnd ? onDragEnd : undefined}
              className={cn(
                styles.navItemCompact.wrapper,
                isDragging && 'opacity-50'
              )}
            >
              <Link
                href={item.href}
                className={getCompactNavItemClasses(active, inSplitView)}
              >
                {/* 활성 표시기 */}
                {active && <span className={styles.navItemCompact.indicator} />}
                <div
                  className={cn(
                    styles.navItemCompact.iconContainer.base,
                    active && styles.navItemCompact.iconContainer.active
                  )}
                >
                  <Icon
                    className={cn(
                      styles.navItemCompact.icon.base,
                      active && styles.navItemCompact.icon.active
                    )}
                  />
                </div>
                <span
                  className={cn(
                    styles.navItemCompact.label.base,
                    active && styles.navItemCompact.label.active
                  )}
                >
                  {item.label}
                </span>
              </Link>

              {/* 드래그 힌트 툴팁 */}
              {draggable && (
                <div className={styles.dragTooltip}>
                  드래그하여 Split View
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 유틸리티 영역 */}
      {utilityItems.length > 0 && isExpanded && (
        <div className={styles.utilityContainer}>
          {utilityItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={styles.utilityItem}>
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="text-[13px] font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={styles.utilityBadge}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
