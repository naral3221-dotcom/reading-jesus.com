'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Loader2, Mail, Lock, Church, Key, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ChurchAdminLoginPage() {
  const router = useRouter();
  const params = useParams();
  const churchCode = params.code as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [churchName, setChurchName] = useState<string | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 로그인 폼
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 토큰 입력 (기존 방식)
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  // 교회 정보 로드 및 기존 인증 확인
  useEffect(() => {
    const initPage = async () => {
      const supabase = getSupabaseBrowserClient();
      try {
        // 1. 교회 정보 조회
        const { data: church, error } = await supabase
          .from('churches')
          .select('id, name, admin_token')
          .eq('code', churchCode.toUpperCase())
          .single();

        if (error || !church) {
          toast({
            variant: 'error',
            title: '교회를 찾을 수 없습니다',
          });
          router.push('/');
          return;
        }

        setChurchName(church.name);
        setChurchId(church.id);

        // 2. 이미 로그인되어 있는지 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // 현재 사용자가 이 교회의 관리자인지 확인
          const { data: admin } = await supabase
            .from('church_admins')
            .select('id')
            .eq('id', session.user.id)
            .eq('church_id', church.id)
            .eq('is_active', true)
            .single();

          if (admin) {
            // 이미 인증됨 - 관리자 페이지로 이동
            router.replace(`/church/${churchCode}/admin`);
            return;
          }
        }

        // 3. localStorage에 토큰이 있는지 확인
        const savedToken = localStorage.getItem(`church_admin_token_${churchCode.toUpperCase()}`);
        if (savedToken && savedToken === church.admin_token) {
          // 토큰으로 이미 인증됨
          router.replace(`/church/${churchCode}/admin`);
          return;
        }
      } catch (err) {
        console.error('초기화 에러:', err);
      } finally {
        setCheckingAuth(false);
      }
    };

    initPage();
  }, [churchCode, router, toast]);

  // 이메일/비밀번호 로그인
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        variant: 'error',
        title: '이메일과 비밀번호를 입력해주세요',
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    try {
      // 1. Supabase Auth 로그인
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. 이 교회의 관리자인지 확인
      const { data: admin, error: adminError } = await supabase
        .from('church_admins')
        .select('id, church_id, is_active')
        .eq('id', data.user.id)
        .eq('church_id', churchId)
        .single();

      if (adminError || !admin) {
        await supabase.auth.signOut();
        toast({
          variant: 'error',
          title: '이 교회의 관리자가 아닙니다',
          description: '다른 교회 관리자 계정이거나 권한이 없습니다',
        });
        return;
      }

      if (!admin.is_active) {
        await supabase.auth.signOut();
        toast({
          variant: 'error',
          title: '비활성화된 계정입니다',
          description: '시스템 관리자에게 문의하세요',
        });
        return;
      }

      // 3. 마지막 로그인 시간 업데이트
      await supabase
        .from('church_admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      toast({
        variant: 'success',
        title: '로그인 성공',
      });

      router.push(`/church/${churchCode}/admin`);
    } catch (err) {
      console.error('로그인 에러:', err);
      toast({
        variant: 'error',
        title: '로그인 실패',
        description: '이메일 또는 비밀번호를 확인해주세요',
      });
    } finally {
      setLoading(false);
    }
  };

  // 토큰 로그인 (기존 방식)
  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      toast({
        variant: 'error',
        title: '관리자 토큰을 입력해주세요',
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setTokenLoading(true);
    try {
      // 토큰 검증
      const { data: church, error } = await supabase
        .from('churches')
        .select('admin_token')
        .eq('code', churchCode.toUpperCase())
        .single();

      if (error || !church) {
        toast({
          variant: 'error',
          title: '교회를 찾을 수 없습니다',
        });
        return;
      }

      if (church.admin_token !== token.trim()) {
        toast({
          variant: 'error',
          title: '토큰이 일치하지 않습니다',
        });
        return;
      }

      // 토큰 저장
      localStorage.setItem(`church_admin_token_${churchCode.toUpperCase()}`, token.trim());

      toast({
        variant: 'success',
        title: '인증 성공',
      });

      router.push(`/church/${churchCode}/admin`);
    } catch (err) {
      console.error('토큰 인증 에러:', err);
      toast({
        variant: 'error',
        title: '인증 실패',
      });
    } finally {
      setTokenLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-xl bg-primary mx-auto mb-4 flex items-center justify-center">
            <Church className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">교회 관리자 로그인</CardTitle>
          <CardDescription>
            {churchName ? `${churchName} 관리자 페이지` : '관리자 페이지에 접속합니다'}
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
                '로그인'
              )}
            </Button>
          </form>

          {/* 비밀번호 찾기 */}
          <div className="text-center">
            <Link
              href={`/church/${churchCode}/admin/forgot-password`}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                또는
              </span>
            </div>
          </div>

          {/* 토큰 로그인 (접기/펼치기) */}
          <div>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setShowTokenInput(!showTokenInput)}
            >
              <Key className="w-4 h-4 mr-2" />
              관리자 토큰으로 접근
            </Button>

            {showTokenInput && (
              <form onSubmit={handleTokenLogin} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">관리자 토큰</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="admin-xxxxx-xxxxxxxxxxxxxxxx"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={tokenLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    시스템 관리자로부터 받은 토큰을 입력하세요
                  </p>
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={tokenLoading}
                >
                  {tokenLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      확인 중...
                    </>
                  ) : (
                    '토큰으로 접근'
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* 돌아가기 */}
          <div className="text-center pt-4 border-t">
            <Link
              href={`/church/${churchCode}`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              교회 페이지로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
