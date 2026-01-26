'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/toast';
import {
  ChevronLeft,
  Bell,
  Palette,
  Trash2,
  LogOut,
  Shield,
  Info,
  Type,
} from 'lucide-react';
import { signOut } from '@/lib/supabase';  // Auth 헬퍼는 그대로 사용
import { useCurrentUser, useDeleteAccount } from '@/presentation/hooks/queries/useUser';
import { cn } from '@/lib/utils';
import { ThemeSelector } from '@/components/ThemeSelector';
import { FontSizeSelector } from '@/components/FontSizeSelector';

interface UserSettings {
  notifications: {
    comments: boolean;
    likes: boolean;
    groupUpdates: boolean;
    dailyReminder: boolean;
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    comments: true,
    likes: true,
    groupUpdates: true,
    dailyReminder: true,
  },
};

const SETTINGS_KEY = 'reading-jesus-settings';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // React Query 훅 사용
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  // 계정 삭제 mutation
  const deleteAccountMutation = useDeleteAccount();

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch {
      // 로컬스토리지 접근 실패 시 기본값 사용
    }
  };

  const saveSettings = useCallback((newSettings: UserSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch {
      // 저장 실패 무시
    }
  }, []);

  const toggleNotification = (key: keyof UserSettings['notifications']) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };
    saveSettings(newSettings);
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: '로그아웃되었습니다',
    });
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== '계정삭제') {
      toast({
        variant: 'error',
        title: '확인 텍스트가 일치하지 않습니다',
      });
      return;
    }

    if (!userId) return;

    try {
      // useDeleteAccount mutation 사용
      await deleteAccountMutation.mutateAsync({ userId });

      // 로그아웃
      await signOut();

      toast({
        title: '계정이 삭제되었습니다',
      });

      router.push('/login');
    } catch (error) {
      console.error('Account deletion error:', error);
      toast({
        variant: 'error',
        title: '계정 삭제에 실패했습니다',
        description: '잠시 후 다시 시도해주세요',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">설정</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {/* 테마 설정 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-5 h-5" />
              테마
            </CardTitle>
            <CardDescription>앱 테마를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSelector variant="grid" showDescription={false} />
          </CardContent>
        </Card>

        {/* 글꼴 크기 설정 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Type className="w-5 h-5" />
              글꼴 크기
            </CardTitle>
            <CardDescription>읽기 편한 글꼴 크기를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <FontSizeSelector variant="slider" showPreview={true} />
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5" />
              알림
            </CardTitle>
            <CardDescription>알림 수신 설정을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-comments">댓글 알림</Label>
                <p className="text-sm text-muted-foreground">내 묵상에 댓글이 달리면 알림</p>
              </div>
              <Switch
                id="notif-comments"
                checked={settings.notifications.comments}
                onCheckedChange={() => toggleNotification('comments')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-likes">좋아요 알림</Label>
                <p className="text-sm text-muted-foreground">내 묵상에 좋아요가 달리면 알림</p>
              </div>
              <Switch
                id="notif-likes"
                checked={settings.notifications.likes}
                onCheckedChange={() => toggleNotification('likes')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-group">그룹 알림</Label>
                <p className="text-sm text-muted-foreground">그룹 공지 및 업데이트 알림</p>
              </div>
              <Switch
                id="notif-group"
                checked={settings.notifications.groupUpdates}
                onCheckedChange={() => toggleNotification('groupUpdates')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-daily">매일 읽기 알림</Label>
                <p className="text-sm text-muted-foreground">매일 성경 읽기 리마인더</p>
              </div>
              <Switch
                id="notif-daily"
                checked={settings.notifications.dailyReminder}
                onCheckedChange={() => toggleNotification('dailyReminder')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 앱 정보 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-5 h-5" />
              앱 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">버전</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">개발</span>
              <span>Dream Factory</span>
            </div>
          </CardContent>
        </Card>

        {/* 계정 관리 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-5 h-5" />
              계정 관리
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteAccountDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              계정 삭제
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 로그아웃 확인 */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 로그아웃 하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              로그아웃
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 계정 삭제 확인 */}
      <AlertDialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block mb-3">
                계정을 삭제하면 모든 데이터(묵상, 읽기 기록, 그룹 멤버십)가 영구적으로 삭제됩니다.
              </span>
              <span className="block mb-3 font-medium text-destructive">
                이 작업은 되돌릴 수 없습니다.
              </span>
              <span className="block">
                계속하려면 아래에 <strong>&quot;계정삭제&quot;</strong>를 입력하세요.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="계정삭제"
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== '계정삭제'}
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                deleteConfirmText !== '계정삭제' && "opacity-50 cursor-not-allowed"
              )}
            >
              계정 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
