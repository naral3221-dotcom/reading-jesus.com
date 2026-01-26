'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, MessageCircle, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  const tabs: { menu: MenuType; href: string }[] = [
    { menu: 'home', href: `/church/${churchCode}` },
    { menu: 'bible', href: `/church/${churchCode}/bible` },
    { menu: 'sharing', href: `/church/${churchCode}/sharing` },
    { menu: 'groups', href: `/church/${churchCode}/groups` },
    { menu: 'my', href: `/church/${churchCode}/my` },
  ];

  const isActive = (menu: MenuType, href: string): boolean => {
    if (menu === 'home') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 bg-background/95 backdrop-blur-sm border-r border-border/60 z-50 flex-col items-center py-6 shadow-[4px_0_20px_rgba(0,0,0,0.03)]">
      <div className="flex flex-col items-center gap-2 flex-1">
        {tabs.map((tab) => {
          const Icon = menuIcons[tab.menu];
          const active = isActive(tab.menu, tab.href);
          const label = menuLabelMap[tab.menu];

          // Split View에서 현재 표시 중인지 확인
          const isInSplitView = state.isEnabled && (state.leftMenu === tab.menu || state.rightMenu === tab.menu);

          return (
            <div
              key={tab.menu}
              draggable
              onDragStart={(e) => handleDragStart(e, tab.menu)}
              onDragEnd={handleDragEnd}
              className={cn(
                'relative group cursor-grab active:cursor-grabbing',
                isDraggingMenu && 'opacity-50'
              )}
            >
              <Link
                href={tab.href}
                onClick={(e) => {
                  // Split View 활성화 상태에서는 클릭으로 해당 패널 교체
                  if (state.isEnabled) {
                    e.preventDefault();
                    // 기본 동작: 오른쪽 패널 교체
                  }
                }}
                className={cn(
                  'flex flex-col items-center justify-center w-16 h-16 gap-1 rounded-xl transition-all duration-200 relative',
                  active
                    ? 'text-foreground bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  isInSplitView && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-primary to-primary/80" />
                )}
                <div className={cn(
                  'p-2 rounded-xl transition-colors',
                  active && 'bg-primary/10'
                )}>
                  <Icon className={cn(
                    'w-5 h-5 transition-transform',
                    active && 'scale-110'
                  )} />
                </div>
                <span className={cn(
                  'text-[10px] font-medium',
                  active && 'text-foreground font-semibold'
                )}>{label}</span>
              </Link>

              {/* 드래그 힌트 툴팁 */}
              <div className={cn(
                'absolute left-full ml-2 top-1/2 -translate-y-1/2',
                'px-2 py-1 bg-slate-800 text-white text-xs rounded whitespace-nowrap',
                'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'
              )}>
                드래그하여 Split View
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
