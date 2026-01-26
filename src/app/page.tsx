'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useLandingStats } from '@/presentation/hooks/queries/useChurchStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  LogIn,
  Calendar,
  Users,
  CheckCircle,
  MessageSquare,
  Church,
  ArrowRight,
  Heart,
  Sparkles,
  Loader2,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  // 로그인 상태 확인
  const { data: userData, isLoading: isCheckingAuth } = useCurrentUser();
  const isLoggedIn = !!userData?.user;

  // 통계 조회 (비로그인 사용자만)
  const { data: stats } = useLandingStats(!isLoggedIn && !isCheckingAuth);

  // 로그인된 사용자는 /home으로 리다이렉트
  useEffect(() => {
    if (!isCheckingAuth && isLoggedIn) {
      router.replace('/home');
    }
  }, [isCheckingAuth, isLoggedIn, router]);

  // 숫자 포맷 (1000 → 1,000)
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K+';
    }
    return num.toLocaleString();
  };

  // 로그인 체크 중 또는 리다이렉트 대기 중 로딩 화면
  if (isCheckingAuth || isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-muted/30 to-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* 헤더 - Apple 스타일 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg">리딩지저스</span>
          </Link>

          <Link href="/login">
            <Button size="sm" className="gap-2">
              <LogIn className="w-4 h-4" />
              로그인
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero 섹션 */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* 로고 아이콘 */}
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-primary" />
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            리딩지저스
          </h1>
          <p className="text-xl md:text-2xl text-primary/80 mb-2">
            365일 성경 통독 묵상
          </p>

          {/* 서브 카피 */}
          <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            매일 말씀을 읽고, 묵상하고, 나누세요.<br />
            전국의 성도들과 함께합니다.
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 gap-2">
                <Sparkles className="w-5 h-5" />
                시작하기
              </Button>
            </Link>
            <Link href="/preview">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 gap-2">
                통독 계획 보기
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 추천 대상 섹션 */}
      <section className="py-12 md:py-16 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8">
            이런 분들께 추천해요
          </h2>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <RecommendCard
              icon={<BookOpen className="w-6 h-6" />}
              title="매일 성경을"
              subtitle="읽고 싶은 분"
            />
            <RecommendCard
              icon={<Users className="w-6 h-6" />}
              title="함께 묵상을"
              subtitle="나누고 싶은 분"
            />
            <RecommendCard
              icon={<CheckCircle className="w-6 h-6" />}
              title="읽기 습관을"
              subtitle="만들고 싶은 분"
            />
            <RecommendCard
              icon={<Church className="w-6 h-6" />}
              title="교회 소그룹"
              subtitle="운영하시는 분"
            />
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8">
            주요 기능
          </h2>

          <div className="space-y-4">
            <FeatureCard
              icon={<Calendar className="w-8 h-8 text-primary" />}
              title="365일 통독 계획"
              description="구약과 신약을 균형있게 읽는 1년 통독 일정을 제공합니다."
            />
            <FeatureCard
              icon={<Heart className="w-8 h-8 text-accent" />}
              title="QT 묵상 가이드"
              description="매일 제공되는 묵상 질문으로 말씀을 깊이 묵상할 수 있습니다."
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8 text-accent" />}
              title="묵상 나눔 커뮤니티"
              description="전국의 성도들과 묵상을 나누고 서로 격려할 수 있습니다."
            />
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      {stats && (stats.churches > 0 || stats.posts > 0) && (
        <section className="py-12 md:py-16 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8">
              함께하는 성도들
            </h2>

            <div className="grid grid-cols-3 gap-4 text-center">
              <StatCard number={formatNumber(stats.users || 100)} label="사용자" />
              <StatCard number={formatNumber(stats.churches || 10)} label="교회" />
              <StatCard number={formatNumber(stats.posts || 500)} label="묵상 나눔" />
            </div>
          </div>
        </section>
      )}

      {/* 통독 계획 미리보기 섹션 */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            365일 통독 계획
          </h2>
          <p className="text-muted-foreground mb-6">
            매일 구약과 신약을 함께 읽는 균형 잡힌 통독 일정을 확인하세요
          </p>

          <Link href="/preview">
            <Button variant="outline" size="lg" className="gap-2">
              통독 계획 보러가기
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 최종 CTA 섹션 */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            로그인하면 모든 기능을 무료로 이용할 수 있습니다
          </p>

          <Link href="/login">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6 bg-background text-foreground hover:bg-background/90 gap-2"
            >
              <Sparkles className="w-5 h-5" />
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-8 px-4 bg-muted/30 border-t">
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>&copy; 2026 리딩지저스. All rights reserved.</p>
          <p className="mt-2">
            <Link href="/preview" className="hover:underline">365일 통독 계획 보기</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

// 추천 대상 카드 컴포넌트
function RecommendCard({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4 md:p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// 기능 카드 컴포넌트
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6 flex items-start gap-4">
        <div className="w-14 h-14 shrink-0 rounded-xl bg-muted/50 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-1">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// 통계 카드 컴포넌트
function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="p-4">
      <p className="text-3xl md:text-4xl font-bold text-primary">
        {number}
      </p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
