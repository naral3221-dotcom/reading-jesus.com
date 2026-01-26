'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  CheckCircle2,
  Calendar,
  Clock,
  Church,
  Users,
  Filter,
} from 'lucide-react';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useAllUserReadings } from '@/presentation/hooks/queries/useUnifiedReadingCheck';
import readingPlan from '@/data/reading_plan.json';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { NoReadingEmpty } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import type { SourceType, UnifiedReadingCheckProps } from '@/domain/entities/UnifiedReadingCheck';

// 평탄화된 읽음 기록 타입
interface FlattenedReading {
  id: string;
  dayNumber: number;
  checkedAt: Date | null;
  sourceType: SourceType;
  sourceId: string;
  sourceName: string;
}

export default function MyReadingsPage() {
  const [selectedTab, setSelectedTab] = useState<'recent' | 'all'>('recent');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'church' | 'group'>('all');
  const [showSourceFilter, setShowSourceFilter] = useState(false);

  // React Query 훅 사용
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const userId = currentUser?.user?.id ?? null;

  // 통합 읽음 기록 조회
  const {
    data: readingsBySource,
    isLoading: readingsLoading,
    error: readingsError,
    refetch,
  } = useAllUserReadings(userId);

  const loading = userLoading || readingsLoading;

  // 모든 읽음 기록을 평탄화하여 단일 배열로
  const allReadings = useMemo(() => {
    if (!readingsBySource) return [];

    const flattened: FlattenedReading[] = [];
    for (const source of readingsBySource) {
      for (const reading of source.readings) {
        flattened.push({
          id: reading.id,
          dayNumber: reading.dayNumber,
          checkedAt: reading.checkedAt,
          sourceType: source.sourceType,
          sourceId: source.sourceId,
          sourceName: source.sourceName,
        });
      }
    }

    // 최신순 정렬
    return flattened.sort((a, b) => {
      if (!a.checkedAt || !b.checkedAt) return 0;
      return new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime();
    });
  }, [readingsBySource]);

  // 출처 필터링
  const filteredReadings = useMemo(() => {
    if (sourceFilter === 'all') return allReadings;
    return allReadings.filter((r) => r.sourceType === sourceFilter);
  }, [allReadings, sourceFilter]);

  // 최근 7일 필터링
  const displayReadings = useMemo(() => {
    if (selectedTab === 'all') return filteredReadings;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return filteredReadings.filter(
      (r) => r.checkedAt && new Date(r.checkedAt) >= sevenDaysAgo
    );
  }, [filteredReadings, selectedTab]);

  // 통계 계산
  const stats = useMemo(() => {
    const churchReadings = allReadings.filter((r) => r.sourceType === 'church').length;
    const groupReadings = allReadings.filter((r) => r.sourceType === 'group').length;
    const uniqueSources = readingsBySource?.length ?? 0;
    return {
      total: allReadings.length,
      church: churchReadings,
      group: groupReadings,
      sources: uniqueSources,
    };
  }, [allReadings, readingsBySource]);

  // Day 정보 가져오기
  const getDayInfo = (dayNumber: number) => {
    return readingPlan.find((p) => p.day === dayNumber);
  };

  // 출처별 아이콘과 색상
  const getSourceInfo = (sourceType: SourceType) => {
    if (sourceType === 'church') {
      return {
        icon: Church,
        label: '교회',
        color: 'bg-accent/10 text-accent dark:bg-accent dark:text-accent-foreground',
      };
    }
    return {
      icon: Users,
      label: '그룹',
      color: 'bg-accent/10 text-accent dark:bg-accent dark:text-accent-foreground',
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (readingsError) {
    return (
      <div className="flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/mypage">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">내가 읽은 말씀</h1>
          </div>
        </div>
        <ErrorState
          title="읽기 기록을 불러올 수 없습니다"
          message="네트워크 연결을 확인하고 다시 시도해주세요"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/mypage">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold">내가 읽은 말씀</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSourceFilter(!showSourceFilter)}
          className={showSourceFilter ? 'bg-accent' : ''}
        >
          <Filter className="w-5 h-5" />
        </Button>
      </div>

      {/* 통계 */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">{stats.total}일</p>
              <p className="text-sm text-muted-foreground">총 읽은 날</p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-1 justify-end text-sm">
                <Church className="w-3.5 h-3.5 text-accent" />
                <span className="text-muted-foreground">교회</span>
                <span className="font-medium">{stats.church}일</span>
              </div>
              <div className="flex items-center gap-1 justify-end text-sm">
                <Users className="w-3.5 h-3.5 text-accent" />
                <span className="text-muted-foreground">그룹</span>
                <span className="font-medium">{stats.group}일</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 출처 필터 */}
      {showSourceFilter && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground mr-1">출처:</span>
              <Badge
                variant={sourceFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSourceFilter('all')}
              >
                전체
              </Badge>
              <Badge
                variant={sourceFilter === 'church' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSourceFilter('church')}
              >
                <Church className="w-3 h-3 mr-1" />
                교회 ({stats.church})
              </Badge>
              <Badge
                variant={sourceFilter === 'group' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSourceFilter('group')}
              >
                <Users className="w-3 h-3 mr-1" />
                그룹 ({stats.group})
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 탭 */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'recent' | 'all')}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="recent">최근 7일</TabsTrigger>
          <TabsTrigger value="all">전체</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {displayReadings.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                {selectedTab === 'recent' && filteredReadings.length > 0 ? (
                  <div className="text-center py-6">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">최근 7일간 읽은 말씀이 없습니다</p>
                    <Button
                      variant="link"
                      onClick={() => setSelectedTab('all')}
                      className="mt-2"
                    >
                      전체 기록 보기
                    </Button>
                  </div>
                ) : sourceFilter !== 'all' ? (
                  <div className="text-center py-6">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {sourceFilter === 'church' ? '교회' : '그룹'}에서 읽은 말씀이 없습니다
                    </p>
                    <Button
                      variant="link"
                      onClick={() => setSourceFilter('all')}
                      className="mt-2"
                    >
                      전체 보기
                    </Button>
                  </div>
                ) : (
                  <NoReadingEmpty />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  읽은 말씀
                  <span className="text-sm font-normal text-muted-foreground">
                    ({displayReadings.length}일)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {displayReadings.slice(0, selectedTab === 'recent' ? 7 : 20).map((reading) => {
                    const dayInfo = getDayInfo(reading.dayNumber);
                    const firstChapter = dayInfo?.range.split('-')[0] || '1';
                    const sourceInfo = getSourceInfo(reading.sourceType);
                    const SourceIcon = sourceInfo.icon;

                    return (
                      <Link
                        key={`${reading.sourceType}-${reading.sourceId}-${reading.dayNumber}`}
                        href={`/bible-reader?book=${encodeURIComponent(dayInfo?.book || '창세기')}&chapter=${firstChapter}`}
                      >
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent/10 dark:bg-accent flex items-center justify-center">
                              <span className="text-xs font-bold text-accent dark:text-accent-foreground">
                                D{reading.dayNumber}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">
                                  {dayInfo?.book || '알 수 없음'}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] px-1.5 py-0 h-4 ${sourceInfo.color}`}
                                >
                                  <SourceIcon className="w-2.5 h-2.5 mr-0.5" />
                                  {reading.sourceName || sourceInfo.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{dayInfo?.reading}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {reading.checkedAt && (
                              <>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(reading.checkedAt), 'M/d (EEE)', {
                                    locale: ko,
                                  })}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(reading.checkedAt), 'a h:mm', { locale: ko })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  {selectedTab === 'all' && filteredReadings.length > 20 && (
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      외 {filteredReadings.length - 20}일 더 읽음
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
