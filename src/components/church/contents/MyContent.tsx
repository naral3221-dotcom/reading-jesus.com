'use client';

import Link from 'next/link';
import { User, Settings, LogIn, LogOut, MessageCircle, BookOpen, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/supabase';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useChurchByCode } from '@/presentation/hooks/queries/useChurch';
import { useUserActivityStats } from '@/presentation/hooks/queries/useChurchStats';

interface MyContentProps {
  churchCode: string;
}

export function MyContent({ churchCode }: MyContentProps) {
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const user = userData?.user;

  const { data: churchData, isLoading: churchLoading } = useChurchByCode(churchCode);
  const church = churchData?.church;

  const { data: stats, isLoading: statsLoading } = useUserActivityStats(church?.id, user?.id);

  const isLoading = userLoading || churchLoading || (user && statsLoading);

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-24 bg-accent/10 rounded-xl" />
        <div className="h-20 bg-accent/10 rounded-xl" />
        <div className="h-20 bg-accent/10 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-background via-background to-muted/30">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-muted via-white to-muted/50 sticky top-0 z-10 border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">마이페이지</h1>
              <p className="text-xs text-accent">
                {user ? user.nickname || '사용자' : '로그인 필요'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="p-4 space-y-4">
        {!user ? (
          /* 비로그인 상태 */
          <Card className="border-accent/30">
            <CardContent className="py-8 text-center">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">로그인이 필요합니다</h3>
              <p className="text-sm text-accent mb-4">
                로그인하면 나의 활동을 확인하고 관리할 수 있습니다.
              </p>
              <Button asChild className="bg-accent hover:bg-accent">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  로그인하기
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 프로필 카드 */}
            <Card className="border-accent/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-accent">
                        {user.nickname?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-foreground">
                      {user.nickname || '사용자'}
                    </h3>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/church/${churchCode}/my/settings`}>
                      <Settings className="w-5 h-5 text-accent" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 나의 활동 */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-accent">나의 활동</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="text-center p-4 bg-accent/10 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats?.myPosts ?? 0}</p>
                  <p className="text-xs text-accent">나의 묵상</p>
                </div>
                <div className="text-center p-4 bg-accent/10 rounded-xl">
                  <BookOpen className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats?.myQTs ?? 0}</p>
                  <p className="text-xs text-muted-foreground">나의 QT</p>
                </div>
              </CardContent>
            </Card>

            {/* 메뉴 */}
            <Card className="border-border">
              <CardContent className="py-2">
                <Link
                  href={`/church/${churchCode}/my/posts`}
                  className="flex items-center justify-between py-3 border-b border-border"
                >
                  <span className="text-accent">나의 글 보기</span>
                  <ChevronRight className="w-5 h-5 text-accent" />
                </Link>
                <Link
                  href={`/church/${churchCode}/my/settings`}
                  className="flex items-center justify-between py-3 border-b border-border"
                >
                  <span className="text-accent">설정</span>
                  <ChevronRight className="w-5 h-5 text-accent" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between py-3 w-full text-left"
                >
                  <span className="text-red-600 flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </span>
                </button>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
