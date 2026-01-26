'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ChurchAdminForgotPasswordPage() {
  const params = useParams();
  const churchCode = params.code as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [churchName, setChurchName] = useState<string | null>(null);

  // 교회 정보 로드
  useEffect(() => {
    const loadChurch = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('churches')
        .select('name')
        .eq('code', churchCode.toUpperCase())
        .single();

      if (data) {
        setChurchName(data.name);
      }
    };

    loadChurch();
  }, [churchCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        variant: 'error',
        title: '이메일을 입력해주세요',
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    try {
      // 이 이메일이 해당 교회의 관리자인지 확인 (선택적)
      const { data: admin } = await supabase
        .from('church_admins')
        .select('id')
        .eq('email', email.trim())
        .single();

      if (!admin) {
        // 보안상 존재 여부를 알리지 않음
        // 하지만 실제로는 Supabase가 이메일 발송을 시도함
      }

      // 비밀번호 재설정 이메일 발송
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/church/${churchCode}/admin/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast({
        variant: 'success',
        title: '이메일이 발송되었습니다',
        description: '이메일을 확인하여 비밀번호를 재설정하세요',
      });
    } catch (err) {
      console.error('비밀번호 재설정 에러:', err);
      toast({
        variant: 'error',
        title: '이메일 발송 실패',
        description: '잠시 후 다시 시도해주세요',
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold mb-2">이메일이 발송되었습니다</h2>
            <p className="text-muted-foreground mb-6">
              <strong>{email}</strong>로 비밀번호 재설정 링크를 보냈습니다.
              <br />
              이메일을 확인하여 비밀번호를 재설정하세요.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
              >
                다른 이메일로 다시 시도
              </Button>
              <Link href={`/church/${churchCode}/admin/login`}>
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  로그인으로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
          <CardDescription>
            {churchName ? `${churchName} 관리자 계정` : '관리자 계정'}의 비밀번호를 재설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">가입한 이메일 주소</Label>
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
              <p className="text-xs text-muted-foreground">
                관리자 계정 가입 시 사용한 이메일을 입력하세요
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  발송 중...
                </>
              ) : (
                '비밀번호 재설정 이메일 발송'
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t">
            <Link
              href={`/church/${churchCode}/admin/login`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              로그인으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
