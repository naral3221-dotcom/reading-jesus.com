'use client';

/**
 * /church - 교회 찾기 페이지
 *
 * 어르신들도 쉽게 교회를 검색하고 가입할 수 있는 전용 페이지입니다.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import {
  Church,
  Search,
  ChevronLeft,
  Loader2,
  Users,
  ChevronRight,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useSearchChurches, useJoinChurch, usePopularChurches } from '@/presentation/hooks/queries/useChurch';

export default function ChurchSearchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: userData, isLoading: userLoading } = useCurrentUser();

  const user = userData?.user;
  const currentChurch = userData?.church;

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 교회 검색 훅
  const { data: searchResults, isLoading: searchLoading } = useSearchChurches(
    searchQuery,
    { enabled: searchQuery.length >= 2 }
  );

  // 인기/추천 교회 훅
  const { data: popularChurches } = usePopularChurches();

  // 교회 가입 뮤테이션
  const joinChurchMutation = useJoinChurch();

  // 교회 가입
  const handleJoinChurch = async (churchCode: string, churchName: string) => {
    if (!user?.id) {
      toast({
        variant: 'error',
        title: '로그인이 필요합니다',
        description: '교회에 가입하려면 먼저 로그인해주세요',
      });
      router.push('/login');
      return;
    }

    try {
      await joinChurchMutation.mutateAsync({ userId: user.id, churchCode });
      toast({
        variant: 'success',
        title: '교회에 가입되었습니다',
        description: `${churchName}에 가입되었습니다`,
      });
      // 해당 교회 페이지로 이동
      router.push(`/church/${churchCode}`);
    } catch (error) {
      toast({
        variant: 'error',
        title: '가입에 실패했습니다',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요',
      });
    }
  };

  // 교회 페이지로 이동 (이미 가입된 경우)
  const handleGoToChurch = (churchCode: string) => {
    router.push(`/church/${churchCode}`);
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">교회 찾기</h1>
            <p className="text-xs text-muted-foreground">교회를 검색하여 가입하세요</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6 pb-24">
        {/* 현재 소속 교회 표시 */}
        {currentChurch && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Church className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-primary font-medium">현재 소속 교회</p>
                    <p className="font-bold">{currentChurch.name}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGoToChurch(currentChurch.code)}
                >
                  바로가기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 검색 섹션 */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold">교회 검색</h2>
              <p className="text-sm text-muted-foreground mt-1">
                교회 이름 또는 교회 코드로 검색하세요
              </p>
            </div>

            {/* 검색 입력 */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="예: 사랑의교회, LOVE01"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearching(true);
                }}
                className="pl-12 h-14 text-lg"
              />
            </div>

            {/* 검색 결과 */}
            {searchQuery.length >= 2 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium text-muted-foreground">
                  검색 결과 {searchResults?.length || 0}건
                </p>

                {searchLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((church) => (
                      <ChurchCard
                        key={church.id}
                        church={church}
                        isCurrent={church.id === currentChurch?.id}
                        onJoin={() => handleJoinChurch(church.code, church.name)}
                        onGoTo={() => handleGoToChurch(church.code)}
                        isJoining={joinChurchMutation.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Church className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">검색 결과가 없습니다</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">
                      찾는 교회가 없으신가요?
                    </p>
                    <Link href="/church/register">
                      <Button variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" />
                        새 교회 등록하기
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 검색 안내 (검색 전) */}
            {searchQuery.length < 2 && !isSearching && (
              <div className="bg-muted rounded-lg p-4 mt-4">
                <p className="text-sm text-muted-foreground text-center">
                  💡 <span className="font-medium">검색 팁</span>
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>• 교회 이름의 일부만 입력해도 검색됩니다</li>
                  <li>• 교회 관리자에게 받은 코드로도 검색할 수 있습니다</li>
                  <li>• 최소 2글자 이상 입력해주세요</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 인기/추천 교회 */}
        {!searchQuery && popularChurches && popularChurches.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              추천 교회
            </h3>
            <div className="space-y-2">
              {popularChurches.slice(0, 5).map((church) => (
                <ChurchCard
                  key={church.id}
                  church={church}
                  isCurrent={church.id === currentChurch?.id}
                  onJoin={() => handleJoinChurch(church.code, church.name)}
                  onGoTo={() => handleGoToChurch(church.code)}
                  isJoining={joinChurchMutation.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* 비로그인 안내 */}
        {!user && (
          <Card className="border-border bg-muted">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-foreground mb-3">
                교회에 가입하려면 로그인이 필요합니다
              </p>
              <Button onClick={() => router.push('/login')}>
                로그인하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 교회 등록 안내 */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-primary">찾는 교회가 없으신가요?</p>
                <p className="text-sm text-muted-foreground">
                  새로운 교회를 등록하고 관리해보세요
                </p>
              </div>
              <Link href="/church/register">
                <Button size="sm" className="shrink-0">
                  등록하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// 교회 카드 컴포넌트
interface ChurchCardProps {
  church: {
    id: string;
    name: string;
    code: string;
    denomination?: string | null;
    memberCount?: number;
  };
  isCurrent: boolean;
  onJoin: () => void;
  onGoTo: () => void;
  isJoining: boolean;
}

function ChurchCard({ church, isCurrent, onJoin, onGoTo, isJoining }: ChurchCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-shadow ${isCurrent ? 'border-primary/50 bg-primary/5' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Church className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{church.name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {church.denomination && (
                <span className="truncate">{church.denomination}</span>
              )}
              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                {church.code}
              </span>
            </div>
            {church.memberCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                <Users className="w-3 h-3 inline mr-1" />
                {church.memberCount}명 참여 중
              </p>
            )}
          </div>
          <div className="shrink-0">
            {isCurrent ? (
              <Button variant="outline" size="sm" onClick={onGoTo}>
                바로가기
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={onJoin} disabled={isJoining}>
                {isJoining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '가입하기'
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
