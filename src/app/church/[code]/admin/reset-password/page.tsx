'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ChurchAdminResetPasswordPage() {
  const params = useParams();
  const churchCode = params.code as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [churchName, setChurchName] = useState<string | null>(null);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  // 교회 정보 로드 및 세션 확인
  useEffect(() => {
    const init = async () => {
      const supabase = getSupabaseBrowserClient();
      // 1. 교회 정보 로드
      const { data: church } = await supabase
        .from('churches')
        .select('name')
        .eq('code', churchCode.toUpperCase())
        .single();

      if (church) {
        setChurchName(church.name);
      }

      // 2. 비밀번호 재설정 세션 확인
      // Supabase가 이메일 링크를 통해 자동으로 세션을 설정함
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setValidSession(true);
      } else {
        setValidSession(false);
      }
    };

    init();
  }, [churchCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        variant: 'error',
        title: '비밀번호를 입력해주세요',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: 'error',
        title: '비밀번호는 8자 이상이어야 합니다',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'error',
        title: '비밀번호가 일치하지 않습니다',
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        variant: 'success',
        title: '비밀번호가 변경되었습니다',
      });
    } catch (err) {
      console.error('비밀번호 변경 에러:', err);
      toast({
        variant: 'error',
        title: '비밀번호 변경 실패',
        description: '다시 시도해주세요',
      });
    } finally {
      setLoading(false);
    }
  };

  // 세션 확인 중
  if (validSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 유효하지 않은 세션
  if (validSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">링크가 만료되었습니다</h2>
            <p className="text-muted-foreground mb-6">
              비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.
              <br />
              다시 비밀번호 찾기를 시도해주세요.
            </p>
            <Link href={`/church/${churchCode}/admin/forgot-password`}>
              <Button className="w-full">비밀번호 찾기 다시 시도</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 성공 화면
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-2">비밀번호가 변경되었습니다</h2>
            <p className="text-muted-foreground mb-6">
              새 비밀번호로 로그인하실 수 있습니다.
            </p>
            <Link href={`/church/${churchCode}/admin/login`}>
              <Button className="w-full">로그인하기</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">새 비밀번호 설정</CardTitle>
          <CardDescription>
            {churchName ? `${churchName} 관리자 계정` : '관리자 계정'}의 새 비밀번호를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">새 비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="8자 이상"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="비밀번호 다시 입력"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  변경 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
