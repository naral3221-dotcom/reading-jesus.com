'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, Loader2, Bell, Clock, Calendar } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import Link from 'next/link';
// NotificationSettings 타입은 추후 사용 예정

const DAYS_OF_WEEK = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 7, label: '일' },
];

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  // React Query 훅 사용
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 알림 설정 상태
  const [isEnabled, setIsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [customMessage, setCustomMessage] = useState('오늘의 말씀을 읽어보세요 📖');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  // 로그인 체크
  useEffect(() => {
    if (!userLoading && !userData?.user) {
      router.push('/login');
    }
  }, [userLoading, userData, router]);

  const loadNotificationSettings = useCallback(async () => {
    if (!userId) return;

    try {
      // 알림 설정 불러오기
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        // 테이블이 없는 경우 기본값 사용 (정상 동작)
        setSettingsLoading(false);
        return;
      }

      if (data) {
        setIsEnabled(data.is_enabled);
        // HH:MM:SS → HH:MM
        const time = data.notification_time.substring(0, 5);
        setNotificationTime(time);
        setCustomMessage(data.custom_message);
        setSelectedDays(data.days_of_week || [1, 2, 3, 4, 5, 6, 7]);
      }
    } catch (err) {
      console.error('알림 설정 조회 실패:', err);
    }

    setSettingsLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    if (userId) {
      loadNotificationSettings();
    }
  }, [userId, loadNotificationSettings]);

  const loading = userLoading || settingsLoading;

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    if (selectedDays.length === 0) {
      toast({
        variant: 'error',
        title: '알림 요일을 선택해주세요',
      });
      return;
    }

    if (!customMessage.trim()) {
      toast({
        variant: 'error',
        title: '알림 메시지를 입력해주세요',
      });
      return;
    }

    setSaving(true);

    const settingsData = {
      user_id: userId,
      is_enabled: isEnabled,
      notification_time: notificationTime + ':00', // HH:MM → HH:MM:SS
      custom_message: customMessage.trim(),
      days_of_week: selectedDays,
    };

    try {
      // upsert (insert or update)
      const { error } = await supabase
        .from('notification_settings')
        .upsert(settingsData, {
          onConflict: 'user_id',
        });

      setSaving(false);

      if (error) {
        // 테이블이 없는 경우
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          toast({
            variant: 'error',
            title: '알림 설정 준비 중',
            description: 'DB 설정이 필요합니다. 설정은 로컬에 저장됩니다.',
          });
          // 로컬스토리지에 임시 저장
          localStorage.setItem('notification_settings', JSON.stringify(settingsData));
          return;
        }
        toast({
          variant: 'error',
          title: '저장에 실패했습니다',
          description: error.message,
        });
        return;
      }
    } catch {
      setSaving(false);
      toast({
        variant: 'error',
        title: '저장에 실패했습니다',
        description: '잠시 후 다시 시도해주세요',
      });
      return;
    }

    toast({
      variant: 'success',
      title: '알림 설정이 저장되었습니다',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/mypage">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">알림 설정</h1>
      </div>

      {/* 알림 활성화 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">알림 받기</CardTitle>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
          <CardDescription>
            매일 정해진 시간에 알림을 받습니다
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 알림 시간 설정 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">알림 시간</CardTitle>
          </div>
          <CardDescription>
            알림을 받을 시간을 설정하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="time"
            value={notificationTime}
            onChange={(e) => setNotificationTime(e.target.value)}
            disabled={!isEnabled}
          />
        </CardContent>
      </Card>

      {/* 알림 요일 설정 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">알림 요일</CardTitle>
          </div>
          <CardDescription>
            알림을 받을 요일을 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                disabled={!isEnabled}
                className={`
                  flex-1 py-2 rounded-lg font-medium transition-colors
                  ${selectedDays.includes(day.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                  }
                  ${!isEnabled && 'opacity-50 cursor-not-allowed'}
                `}
              >
                {day.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 알림 메시지 커스터마이징 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">알림 메시지</CardTitle>
          <CardDescription>
            알림에 표시될 메시지를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="오늘의 말씀을 읽어보세요"
            rows={3}
            maxLength={100}
            disabled={!isEnabled}
          />
          <p className="text-xs text-muted-foreground text-right">
            {customMessage.length} / 100
          </p>

          {/* 예시 메시지 */}
          <div className="pt-2 space-y-1">
            <Label className="text-xs text-muted-foreground">추천 메시지</Label>
            <div className="flex flex-wrap gap-2">
              {[
                '오늘의 말씀을 읽어보세요 📖',
                '하나님의 말씀과 함께 하루를 시작하세요 ✨',
                '성경 읽기 시간입니다 ⏰',
                '오늘도 하나님과 동행하세요 🙏',
              ].map((msg) => (
                <button
                  key={msg}
                  onClick={() => setCustomMessage(msg)}
                  disabled={!isEnabled}
                  className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded disabled:opacity-50"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 알림 미리보기 */}
      {isEnabled && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm">알림 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-background rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">리딩지저스</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {customMessage}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {notificationTime} · {selectedDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 저장 버튼 */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            저장 중...
          </>
        ) : (
          '저장'
        )}
      </Button>

      {/* 안내 */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">
            💡 <strong>알림은 웹 푸시 알림으로 제공됩니다.</strong>
            <br />
            브라우저 알림 권한을 허용해주세요.
            <br />
            실제 알림은 서버 작업이 필요하며, 현재는 설정만 저장됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
