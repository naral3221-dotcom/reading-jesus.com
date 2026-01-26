'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import {
  Settings,
  Bell,
  Shield,
  Database,
  Globe,
  Loader2,
  Save,
  RefreshCw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // 설정 상태 (추후 DB에서 로드)
  const [settings, setSettings] = useState({
    // 일반 설정
    siteName: 'Reading Jesus',
    siteDescription: '성경 통독 앱',
    maintenanceMode: false,

    // 알림 설정
    emailNotifications: true,
    pushNotifications: true,

    // 보안 설정
    allowSignup: true,
    requireEmailVerification: false,
    maxLoginAttempts: 5,

    // 콘텐츠 설정
    allowGuestComments: true,
    requirePostApproval: false,
    maxPostLength: 5000,
  });

  const handleSave = async () => {
    setSaving(true);
    // 추후 실제 저장 로직 구현
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    toast({
      variant: 'success',
      title: '설정이 저장되었습니다',
    });
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">시스템 설정</h1>
          <p className="text-muted-foreground">앱 전체 설정 관리</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          저장
        </Button>
      </div>

      {/* 일반 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="w-5 h-5" />
            일반 설정
          </CardTitle>
          <CardDescription>기본 사이트 정보를 관리합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">사이트 이름</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteDescription">사이트 설명</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">유지보수 모드</p>
              <p className="text-sm text-muted-foreground">
                활성화하면 관리자만 사이트에 접근할 수 있습니다
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5" />
            알림 설정
          </CardTitle>
          <CardDescription>알림 전송 방식을 설정합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">이메일 알림</p>
              <p className="text-sm text-muted-foreground">
                중요 알림을 이메일로 발송합니다
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">푸시 알림</p>
              <p className="text-sm text-muted-foreground">
                모바일 푸시 알림을 발송합니다
              </p>
            </div>
            <Switch
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 보안 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5" />
            보안 설정
          </CardTitle>
          <CardDescription>계정 및 인증 관련 설정입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">회원가입 허용</p>
              <p className="text-sm text-muted-foreground">
                새로운 사용자의 회원가입을 허용합니다
              </p>
            </div>
            <Switch
              checked={settings.allowSignup}
              onCheckedChange={(checked) => setSettings({ ...settings, allowSignup: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">이메일 인증 필수</p>
              <p className="text-sm text-muted-foreground">
                회원가입 시 이메일 인증을 필수로 합니다
              </p>
            </div>
            <Switch
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxLoginAttempts">최대 로그인 시도 횟수</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* 콘텐츠 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="w-5 h-5" />
            콘텐츠 설정
          </CardTitle>
          <CardDescription>게시글 및 댓글 관련 설정입니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">비회원 댓글 허용</p>
              <p className="text-sm text-muted-foreground">
                교회 페이지에서 비회원 댓글을 허용합니다
              </p>
            </div>
            <Switch
              checked={settings.allowGuestComments}
              onCheckedChange={(checked) => setSettings({ ...settings, allowGuestComments: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">게시글 승인 필수</p>
              <p className="text-sm text-muted-foreground">
                게시글이 관리자 승인 후 공개됩니다
              </p>
            </div>
            <Switch
              checked={settings.requirePostApproval}
              onCheckedChange={(checked) => setSettings({ ...settings, requirePostApproval: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPostLength">최대 게시글 길이 (글자)</Label>
            <Input
              id="maxPostLength"
              type="number"
              value={settings.maxPostLength}
              onChange={(e) => setSettings({ ...settings, maxPostLength: parseInt(e.target.value) || 5000 })}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* 시스템 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="w-5 h-5" />
            시스템 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">버전</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">환경</span>
              <span className="font-mono">production</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Next.js</span>
              <span className="font-mono">14.x</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Supabase</span>
              <span className="font-mono">연결됨</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              캐시 초기화
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
