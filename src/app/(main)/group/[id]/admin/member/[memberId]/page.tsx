'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import {
  ChevronLeft,
  BookOpen,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Award,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import Link from 'next/link';
import type { Profile, Group, MemberRank, DailyCheck } from '@/types';
import { differenceInDays, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import readingPlan from '@/data/reading_plan.json';

interface MemberDetail {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  rank: MemberRank | null;
  profile: Profile | null;
}

interface ReadingStats {
  totalDays: number;
  completedDays: number;
  missedDays: number;
  progressPercentage: number;
  currentStreak: number;
  longestStreak: number;
  averagePerWeek: number;
}

interface DailyCheckWithPlan extends DailyCheck {
  book?: string;
  range?: string;
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const groupId = params.id as string;
  const memberId = params.memberId as string;

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [checks, setChecks] = useState<DailyCheckWithPlan[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('overview');

  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 관리자 권한 확인
    const { data: myMembership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (!myMembership || myMembership.role !== 'admin') {
      toast({ variant: 'error', title: '접근 권한이 없습니다' });
      router.push(`/group/${groupId}`);
      return;
    }

    // 그룹 정보
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (!groupData) {
      router.push('/group');
      return;
    }
    setGroup(groupData);

    // 멤버 정보
    const { data: memberData } = await supabase
      .from('group_members')
      .select(`
        *,
        profile:profiles(*),
        rank:member_ranks(*)
      `)
      .eq('id', memberId)
      .single();

    if (!memberData) {
      toast({ variant: 'error', title: '멤버를 찾을 수 없습니다' });
      router.push(`/group/${groupId}/admin`);
      return;
    }

    setMember({
      id: memberData.id,
      user_id: memberData.user_id,
      role: memberData.role,
      joined_at: memberData.joined_at,
      rank: Array.isArray(memberData.rank) ? memberData.rank[0] : memberData.rank,
      profile: memberData.profile as Profile | null,
    });

    // 읽기 체크 데이터
    const { data: checksData } = await supabase
      .from('daily_checks')
      .select('*')
      .eq('group_id', groupId)
      .eq('user_id', memberData.user_id)
      .eq('is_read', true)
      .order('day_number', { ascending: true });

    // 읽기 플랜 정보 추가
    const checksWithPlan: DailyCheckWithPlan[] = (checksData || []).map(check => {
      const plan = readingPlan.find(p => p.day === check.day_number);
      return {
        ...check,
        book: plan?.book,
        range: plan?.range,
      };
    });

    setChecks(checksWithPlan);

    // 통계 계산
    const startDate = new Date(groupData.start_date);
    const today = new Date();
    const totalDays = Math.max(1, Math.min(differenceInDays(today, startDate) + 1, readingPlan.length));
    const completedDays = checksWithPlan.length;
    const checkedDaysSet = new Set(checksWithPlan.map(c => c.day_number));

    // 빠진 날 계산 (오늘까지)
    let missedDays = 0;
    for (let day = 1; day <= totalDays; day++) {
      if (!checkedDaysSet.has(day)) {
        missedDays++;
      }
    }

    // 현재 연속일수
    let currentStreak = 0;
    for (let day = totalDays; day >= 1; day--) {
      if (checkedDaysSet.has(day)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // 최장 연속일수
    let longestStreak = 0;
    let tempStreak = 0;
    for (let day = 1; day <= readingPlan.length; day++) {
      if (checkedDaysSet.has(day)) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // 주간 평균 (가입 후 주 수)
    const weeksJoined = Math.max(1, Math.ceil(differenceInDays(today, new Date(memberData.joined_at)) / 7));
    const averagePerWeek = Math.round(completedDays / weeksJoined * 10) / 10;

    setStats({
      totalDays,
      completedDays,
      missedDays,
      progressPercentage: Math.round(completedDays / totalDays * 100),
      currentStreak,
      longestStreak,
      averagePerWeek,
    });

    setLoading(false);
  }, [groupId, memberId, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 해당 월의 날짜별 체크 상태
  const monthlyChecks = useMemo(() => {
    if (!group) return [];

    const startDate = new Date(group.start_date);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const checkedDaysSet = new Set(checks.map(c => c.day_number));

    return days.map(date => {
      const dayNumber = differenceInDays(date, startDate) + 1;
      const plan = readingPlan.find(p => p.day === dayNumber);
      const isChecked = checkedDaysSet.has(dayNumber);
      const isPast = date < new Date() && dayNumber > 0 && dayNumber <= readingPlan.length;
      const isFuture = dayNumber > readingPlan.length || dayNumber < 1;
      const isToday = isSameDay(date, new Date());

      return {
        date,
        dayNumber,
        plan,
        isChecked,
        isPast,
        isFuture,
        isToday,
      };
    });
  }, [group, currentMonth, checks]);

  // 빠진 날 목록 (최근 30개)
  const missedDaysList = useMemo(() => {
    if (!group) return [];

    const startDate = new Date(group.start_date);
    const today = new Date();
    const totalDays = Math.min(differenceInDays(today, startDate) + 1, readingPlan.length);
    const checkedDaysSet = new Set(checks.map(c => c.day_number));
    const missed: { day: number; plan: typeof readingPlan[0] }[] = [];

    for (let day = totalDays; day >= 1 && missed.length < 30; day--) {
      if (!checkedDaysSet.has(day)) {
        const plan = readingPlan.find(p => p.day === day);
        if (plan) {
          missed.push({ day, plan });
        }
      }
    }

    return missed;
  }, [group, checks]);

  if (loading) {
    return (
      <div className="flex flex-col p-4 space-y-4 pb-20">
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        <Card>
          <CardContent className="py-8">
            <div className="h-20 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!member || !group || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/group/${groupId}/admin`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="w-12 h-12">
            <AvatarImage src={member.profile?.avatar_url || undefined} />
            <AvatarFallback>{member.profile?.nickname?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-bold">{member.profile?.nickname || '익명'}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {member.role === 'admin' && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">관리자</span>
              )}
              {member.rank && (
                <span
                  className="text-xs px-2 py-0.5 rounded text-white"
                  style={{ backgroundColor: member.rank.color }}
                >
                  {member.rank.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            통독 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>진행률</span>
                <span className="font-medium">{stats.progressPercentage}%</span>
              </div>
              <Progress value={stats.progressPercentage} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{stats.completedDays}일 완료</span>
                <span>{stats.totalDays}일 중</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded-lg">
                <div className="flex items-center gap-2 text-accent dark:text-accent mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs">완료</span>
                </div>
                <p className="text-2xl font-bold text-accent dark:text-accent-foreground">{stats.completedDays}일</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">미완료</span>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.missedDays}일</p>
              </div>
              <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded-lg">
                <div className="flex items-center gap-2 text-accent dark:text-accent mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">현재 연속</span>
                </div>
                <p className="text-2xl font-bold text-accent dark:text-accent-foreground">{stats.currentStreak}일</p>
              </div>
              <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded-lg">
                <div className="flex items-center gap-2 text-accent dark:text-accent mb-1">
                  <Award className="w-4 h-4" />
                  <span className="text-xs">최장 연속</span>
                </div>
                <p className="text-2xl font-bold text-accent dark:text-accent-foreground">{stats.longestStreak}일</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">주간 평균</span>
              <span className="font-medium">{stats.averagePerWeek}일/주</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">캘린더</TabsTrigger>
          <TabsTrigger value="completed">완료 목록</TabsTrigger>
          <TabsTrigger value="missed">미완료 목록</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    이전
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    오늘
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className="text-center text-xs text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {/* 첫 주 빈 칸 */}
                {Array.from({ length: monthlyChecks[0]?.date.getDay() || 0 }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {monthlyChecks.map(({ date, dayNumber, isChecked, isPast, isFuture, isToday }) => (
                  <div
                    key={date.toISOString()}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                      isFuture ? 'text-muted-foreground/30' :
                      isChecked ? 'bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent-foreground' :
                      isPast ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' :
                      ''
                    } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    title={dayNumber > 0 && dayNumber <= readingPlan.length ? `Day ${dayNumber}` : ''}
                  >
                    <span className="font-medium">{date.getDate()}</span>
                    {!isFuture && dayNumber > 0 && dayNumber <= readingPlan.length && (
                      <span className="text-[10px] opacity-70">D{dayNumber}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* 범례 */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-accent/10 dark:bg-accent/20 rounded" />
                  <span>완료</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-50 dark:bg-red-900/20 rounded" />
                  <span>미완료</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 ring-2 ring-primary rounded" />
                  <span>오늘</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed List */}
        <TabsContent value="completed" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                완료한 말씀 ({checks.length}개)
              </CardTitle>
              <CardDescription>읽음 완료 처리한 일정 목록</CardDescription>
            </CardHeader>
            <CardContent>
              {checks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>아직 읽은 말씀이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {[...checks].reverse().map(check => (
                    <div
                      key={check.id}
                      className="flex items-center justify-between p-3 bg-accent/10 dark:bg-accent/20 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Day {check.day_number}</span>
                          <span className="text-xs text-muted-foreground">{check.book}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{check.range}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {format(new Date(check.checked_at), 'M/d HH:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Missed List */}
        <TabsContent value="missed" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                미완료 말씀 ({stats.missedDays}개)
              </CardTitle>
              <CardDescription>아직 읽지 않은 일정 목록 (최근 30개)</CardDescription>
            </CardHeader>
            <CardContent>
              {missedDaysList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>모든 말씀을 읽었습니다!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {missedDaysList.map(({ day, plan }) => (
                    <Link
                      key={day}
                      href={`/bible-reader?book=${encodeURIComponent(plan.book)}&chapter=1`}
                      className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Day {day}</span>
                          <span className="text-xs text-muted-foreground">{plan.book}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.range}</p>
                      </div>
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Join Info */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">가입일</span>
            <span>{format(new Date(member.joined_at), 'yyyy년 M월 d일', { locale: ko })}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
