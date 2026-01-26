'use client';

import Link from 'next/link';
import { Church, BookOpen, MessageCircle, Users, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChurchByCode } from '@/presentation/hooks/queries/useChurch';
import { useTodayStats } from '@/presentation/hooks/queries/useChurchStats';

interface HomeContentProps {
  churchCode: string;
}

export function HomeContent({ churchCode }: HomeContentProps) {
  const { data: churchData, isLoading: churchLoading } = useChurchByCode(churchCode);
  const church = churchData?.church;
  const { data: stats } = useTodayStats(church?.id);

  if (churchLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-32 bg-muted/50 rounded-xl" />
        <div className="h-32 bg-muted/50 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      {/* 헤더 */}
      <header className="bg-background sticky top-0 z-10 border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Church className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">{church?.name || '교회'}</h1>
              {church?.address && (
                <p className="text-xs text-muted-foreground">{church.address}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="p-4 space-y-4">
        {/* 오늘의 통계 */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground">오늘의 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats?.todayMeditations ?? 0}</p>
                <p className="text-xs text-muted-foreground">오늘 묵상</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/church/${churchCode}/sharing`}>
                  나눔 보기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/church/${churchCode}/bible`}>
            <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium text-foreground">성경 읽기</span>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/church/${churchCode}/sharing`}>
            <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-foreground" />
                </div>
                <span className="font-medium text-foreground">나눔</span>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/church/${churchCode}/groups`}>
            <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Users className="w-6 h-6 text-foreground" />
                </div>
                <span className="font-medium text-foreground">소그룹</span>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/church/${churchCode}/my`}>
            <Card className="border-border/60 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Church className="w-6 h-6 text-foreground" />
                </div>
                <span className="font-medium text-foreground">마이페이지</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
