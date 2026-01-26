'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Church,
  MessageSquare,
  Settings,
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: User, label: '프로필 수정', href: '/mypage/profile' },
  { icon: BookOpen, label: '내가 읽은 말씀', href: '/mypage/readings' },
  { icon: MessageSquare, label: '내가 쓴 묵상', href: '/mypage/comments' },
  { icon: Users, label: '내 그룹', href: '/mypage/groups' },
  { icon: Church, label: '새 교회 등록', href: '/church/register' },
  { icon: Calendar, label: '통독 캘린더', href: '/mypage/calendar' },
  { icon: Bell, label: '알림 설정', href: '/mypage/notification-settings' },
  { icon: Settings, label: '설정', href: '/mypage/settings' },
];

export function MainMenuSection() {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="p-0">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 p-4 hover:bg-accent active:bg-accent/80 transition-colors',
                index !== menuItems.length - 1 && 'border-b'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
