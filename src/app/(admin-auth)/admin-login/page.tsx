'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Loader2, Mail, Lock, Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 이메일/비밀번호 로그인 (admin, moderator)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        variant: 'error',
        title: '이메일과 비밀번호를 입력해주세요',
      });
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 권한 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      const role = profile?.role;
      if (!role || !['superadmin', 'admin', 'moderator'].includes(role)) {
        await supabase.auth.signOut();
        toast({
          variant: 'error',
          title: '관리자 권한이 없습니다',
        });
        return;
      }

      toast({
        variant: 'success',
        title: '로그인 성공',
      });
      router.push('/admin');
    } catch (err) {
      console.error('Login error:', err);
      toast({
        variant: 'error',
        title: '로그인 실패',
        description: '이메일 또는 비밀번호를 확인해주세요',
      });
    } finally {
      setLoading(false);
    }
  };

  // 소셜 로그인 (superadmin 전용)
  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    setSocialLoading(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/admin`,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error('Social login error:', err);
      toast({
        variant: 'error',
        title: '로그인 실패',
      });
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">관리자 로그인</CardTitle>
          <CardDescription>
            Reading Jesus 관리자 페이지에 접속합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 이메일/비밀번호 로그인 폼 */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '관리자 로그인'
              )}
            </Button>
          </form>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는 슈퍼 계정 로그인
              </span>
            </div>
          </div>

          {/* 소셜 로그인 (슈퍼 계정 전용) */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSocialLogin('google')}
              disabled={socialLoading}
            >
              {socialLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Google로 로그인 (슈퍼 계정)
            </Button>
          </div>

          {/* 비밀번호 재설정 */}
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              className="text-xs text-muted-foreground"
              onClick={async () => {
                if (!email) {
                  toast({
                    variant: 'error',
                    title: '이메일을 먼저 입력해주세요',
                  });
                  return;
                }
                const supabase = getSupabaseBrowserClient();
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/admin/reset-password`,
                  });
                  if (error) throw error;
                  toast({
                    variant: 'success',
                    title: '비밀번호 재설정 이메일을 발송했습니다',
                    description: '이메일을 확인해주세요',
                  });
                } catch (err) {
                  console.error('Reset password error:', err);
                  toast({
                    variant: 'error',
                    title: '이메일 발송 실패',
                    description: '해당 이메일로 가입된 계정이 없거나 오류가 발생했습니다',
                  });
                }
              }}
            >
              비밀번호를 잊으셨나요?
            </Button>
          </div>

          {/* 안내 문구 */}
          <p className="text-xs text-center text-muted-foreground">
            관리자 계정이 없으신가요? 슈퍼 계정에게 문의하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
