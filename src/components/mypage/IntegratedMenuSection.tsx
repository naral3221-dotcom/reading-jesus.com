'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  MessageSquare,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface IntegratedMenuSectionProps {
  isChurchContext: boolean;
  churchCode?: string;
  commentCount?: number;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}

export function IntegratedMenuSection({
  isChurchContext,
  churchCode,
  commentCount = 0,
}: IntegratedMenuSectionProps) {
  const router = useRouter();

  // 교회 전용 메뉴 (교회 컨텍스트에서만 표시)
  const churchMenuItems: MenuItem[] = isChurchContext && churchCode
    ? [
        { icon: BookOpen, label: '성경 읽기', href: `/church/${churchCode}/bible` },
        {
          icon: MessageSquare,
          label: '묵상 나눔',
          href: `/church/${churchCode}/sharing`,
          badge: commentCount > 0 ? `내 글 ${commentCount}개` : undefined,
        },
        { icon: Users, label: '교회 소그룹', href: `/church/${churchCode}/groups` },
      ]
    : [];

  // 공통 메뉴 (컨텍스트에 따라 경로 변경)
  const basePath = isChurchContext && churchCode ? `/church/${churchCode}/my` : '/mypage';

  const commonMenuItems: MenuItem[] = [
    { icon: User, label: '프로필 수정', href: `${basePath}/profile` },
    { icon: BookOpen, label: '내가 읽은 말씀', href: `${basePath}/readings` },
    { icon: MessageSquare, label: '내가 쓴 묵상', href: `${basePath}/comments` },
    // 내 그룹은 메인 컨텍스트에서만 표시 (교회 컨텍스트에서는 교회 소그룹 메뉴가 있음)
    ...(!isChurchContext ? [{ icon: Users, label: '내 그룹', href: '/mypage/groups' }] : []),
    { icon: Calendar, label: '통독 캘린더', href: `${basePath}/calendar` },
    { icon: Bell, label: '알림 설정', href: `${basePath}/notification-settings` },
    { icon: Settings, label: '설정', href: `${basePath}/settings` },
  ];

  const renderMenuItem = (item: MenuItem, index: number, isLast: boolean) => {
    const Icon = item.icon;
    return (
      <button
        key={item.label}
        onClick={() => router.push(item.href)}
        className={cn(
          'w-full flex items-center gap-3 p-4 hover:bg-accent active:bg-accent/80 transition-colors',
          !isLast && 'border-b'
        )}
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 text-left">
          <span className="font-medium">{item.label}</span>
          {item.badge && (
            <span className="ml-2 text-xs text-muted-foreground">
              {item.badge}
            </span>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* 교회 전용 메뉴 */}
      {churchMenuItems.length > 0 && (
        <Card>
          <CardContent className="p-0">
            {churchMenuItems.map((item, index) =>
              renderMenuItem(item, index, index === churchMenuItems.length - 1)
            )}
          </CardContent>
        </Card>
      )}

      {/* 공통 메뉴 */}
      <Card>
        <CardContent className="p-0">
          {commonMenuItems.map((item, index) =>
            renderMenuItem(item, index, index === commonMenuItems.length - 1)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
