'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InlineError } from '@/components/ui/error-state';
import { BookOpen, Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { signInWithKakao, signInWithGoogle } from '@/lib/supabase';
import { isInAppBrowser, getInAppBrowserName } from '@/lib/utils';
import { useState, useEffect } from 'react';

type LoginProvider = 'kakao' | 'google' | null;

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<LoginProvider>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInApp, setIsInApp] = useState(false);
  const [inAppName, setInAppName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const inApp = isInAppBrowser();
    setIsInApp(inApp);
    if (inApp) {
      setInAppName(getInAppBrowserName());
    }
  }, []);

  const handleKakaoLogin = async () => {
    setLoadingProvider('kakao');
    setError(null);
    const { error } = await signInWithKakao();
    if (error) {
      setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      setLoadingProvider(null);
    }
  };

  const handleGoogleLogin = async () => {
    // 인앱 브라우저에서 Google 로그인 시도 시 안내
    if (isInApp) {
      setError(`${inAppName || '인앱 브라우저'}에서는 Google 로그인이 지원되지 않습니다. 아래 안내를 따라 외부 브라우저에서 접속해주세요.`);
      return;
    }

    setLoadingProvider('google');
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
      setLoadingProvider(null);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 API 실패 시 fallback
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenExternal = () => {
    // Android에서 외부 브라우저로 열기 시도
    const url = window.location.href;
    const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;

    // iOS 감지
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isIOS) {
      // iOS는 Safari에서 열기 불가능, URL 복사 안내
      handleCopyUrl();
      setError('iOS에서는 URL이 복사되었습니다. Safari 브라우저에 붙여넣기 해주세요.');
    } else {
      // Android Intent 시도
      window.location.href = intentUrl;
    }
  };

  const isLoading = loadingProvider !== null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">리딩지저스</h1>
        <p className="text-muted-foreground mt-2">365일 성경 통독 묵상</p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>로그인</CardTitle>
          <CardDescription>
            소셜 계정으로 간편하게 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 인앱 브라우저 경고 */}
          {isInApp && (
            <div className="flex gap-3 p-4 rounded-lg border border-border bg-muted">
              <ExternalLink className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="text-foreground">
                <p className="font-medium mb-2">
                  {inAppName || '인앱 브라우저'}에서 접속하셨네요
                </p>
                <p className="text-sm mb-3 text-muted-foreground">
                  Google 로그인은 외부 브라우저(Chrome, Safari)에서만 가능합니다.
                  카카오 로그인은 바로 사용 가능합니다.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={handleOpenExternal}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    외부 브라우저로 열기
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={handleCopyUrl}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        URL 복사
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <InlineError
              message={error}
              onRetry={() => setError(null)}
            />
          )}

          {/* Kakao Login */}
          <Button
            variant="outline"
            className="w-full h-12 bg-[#FEE500] hover:bg-[#FEE500]/90 text-black border-none transition-all"
            onClick={handleKakaoLogin}
            disabled={isLoading}
          >
            {loadingProvider === 'kakao' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                로그인 중...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.648 1.758 4.98 4.399 6.312-.178.632-.646 2.287-.74 2.642-.117.442.162.435.341.317.14-.093 2.23-1.51 3.131-2.121.61.091 1.234.139 1.869.139 5.523 0 10-3.463 10-7.289C22 6.463 17.523 3 12 3z" />
                </svg>
                카카오로 시작하기
              </>
            )}
          </Button>

          {/* Google Login */}
          <Button
            variant="outline"
            className="w-full h-12 transition-all"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {loadingProvider === 'google' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                로그인 중...
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 시작하기
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-8 text-center">
        로그인 시 서비스 이용약관 및<br />
        개인정보 처리방침에 동의하게 됩니다.
      </p>
    </div>
  );
}
