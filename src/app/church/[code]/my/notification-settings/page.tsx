'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { ArrowLeft, Loader2, Bell, Clock, Calendar } from 'lucide-react';
import { ChurchBottomNav } from '@/components/church/ChurchBottomNav';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';

const DAYS_OF_WEEK = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 7, label: '일' },
];

export default function ChurchNotificationSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const churchCode = params.code as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [isEnabled, setIsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState('09:00');
  const [customMessage, setCustomMessage] = useState('오늘의 말씀을 읽어보세요');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);

  const loadNotificationSettings = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUserId(user.id);

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
        // 테이블이 없는 경우 기본값 사용 (정상 동작)
        setLoading(false);
        return;
      }

      if (data) {
        setIsEnabled(data.is_enabled);
        const time = data.notification_time.substring(0, 5);
        setNotificationTime(time);
        setCustomMessage(data.custom_message);
        setSelectedDays(data.days_of_week || [1, 2, 3, 4, 5, 6, 7]);
      }
    } catch (err) {
      console.error('알림 설정 조회 실패:', err);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadNotificationSettings();
  }, [loadNotificationSettings]);

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
      notification_time: notificationTime + ':00',
      custom_message: customMessage.trim(),
      days_of_week: selectedDays,
    };

    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert(settingsData, {
          onConflict: 'user_id',
        });

      setSaving(false);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          toast({
            variant: 'error',
            title: '알림 설정 준비 중',
            description: 'DB 설정이 필요합니다. 설정은 로컬에 저장됩니다.',
          });
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
      <div className="min-h-screen bg-background pb-20 lg:pb-4 lg:ml-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
            <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
              <div className="h-20 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-4 lg:ml-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/church/${churchCode}/my`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">알림 설정</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
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
                  '오늘의 말씀을 읽어보세요',
                  '하나님의 말씀과 함께 하루를 시작하세요',
                  '성경 읽기 시간입니다',
                  '오늘도 하나님과 동행하세요',
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
              <strong>알림은 웹 푸시 알림으로 제공됩니다.</strong>
              <br />
              브라우저 알림 권한을 허용해주세요.
              <br />
              실제 알림은 서버 작업이 필요하며, 현재는 설정만 저장됩니다.
            </p>
          </CardContent>
        </Card>
      </main>

      {/* 하단 네비게이션 */}
      <ChurchBottomNav churchCode={churchCode} />
    </div>
  );
}
