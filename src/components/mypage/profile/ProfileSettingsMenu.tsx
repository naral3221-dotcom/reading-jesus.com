'use client';

import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Settings,
  User,
  BookOpen,
  Calendar,
  Bell,
  Palette,
  LogOut,
  Church,
  HelpCircle,
} from 'lucide-react';

interface ProfileSettingsMenuProps {
  isChurchContext?: boolean;
  churchCode?: string;
  isAnonymous?: boolean;
  onLogout?: () => void;
}

export function ProfileSettingsMenu({
  isChurchContext = false,
  churchCode,
  isAnonymous = false,
  onLogout,
}: ProfileSettingsMenuProps) {
  const router = useRouter();

  const basePath = isChurchContext && churchCode
    ? `/church/${churchCode}/my`
    : '/mypage';

  const handleNavigate = (path: string) => {
    router.push(`${basePath}${path}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* 프로필 관련 */}
        <DropdownMenuItem onClick={() => handleNavigate('/profile')}>
          <User className="w-4 h-4 mr-2" />
          프로필 수정
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 읽기 관련 */}
        <DropdownMenuItem onClick={() => handleNavigate('/readings')}>
          <BookOpen className="w-4 h-4 mr-2" />
          읽은 말씀
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigate('/calendar')}>
          <Calendar className="w-4 h-4 mr-2" />
          통독 캘린더
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 설정 */}
        <DropdownMenuItem onClick={() => handleNavigate('/notification-settings')}>
          <Bell className="w-4 h-4 mr-2" />
          알림 설정
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleNavigate('/settings')}>
          <Palette className="w-4 h-4 mr-2" />
          앱 설정
        </DropdownMenuItem>

        {/* 메인 컨텍스트에서만 교회 메뉴 */}
        {!isChurchContext && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigate('/church')}>
              <Church className="w-4 h-4 mr-2" />
              내 교회
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* 도움말 */}
        <DropdownMenuItem onClick={() => router.push('/help')}>
          <HelpCircle className="w-4 h-4 mr-2" />
          도움말
        </DropdownMenuItem>

        {/* 로그아웃 */}
        {!isAnonymous && onLogout && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
