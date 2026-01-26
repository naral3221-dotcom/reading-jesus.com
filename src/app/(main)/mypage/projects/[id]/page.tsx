'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/toast';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Calendar,
  BookOpen,
  Trophy,
  Flame,
  Trash2,
  Loader2,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { differenceInDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { PersonalReadingProject } from '@/types';
import readingPlan from '@/data/reading_plan.json';

export default function PersonalProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;

  // React Query 훅 사용
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<PersonalReadingProject | null>(null);
  const [checkedDays, setCheckedDays] = useState<Set<number>>(new Set());
  const [currentDay, setCurrentDay] = useState(1);
  const [totalDays, setTotalDays] = useState(365);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [checkingDay, setCheckingDay] = useState<number | null>(null);

  const loadProject = useCallback(async () => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();

    // 프로젝트 정보
    const { data: projectData } = await supabase
      .from('personal_reading_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (!projectData) {
      router.push('/mypage');
      return;
    }

    setProject(projectData);

    const planDays = projectData.reading_plan_type === '365' ? 365 :
                    projectData.reading_plan_type === '180' ? 180 :
                    projectData.reading_plan_type === '90' ? 90 : 365;
    setTotalDays(planDays);

    const startDate = new Date(projectData.start_date);
    const today = new Date();
    const dayNum = Math.max(1, Math.min(differenceInDays(today, startDate) + 1, planDays));
    setCurrentDay(dayNum);

    // 체크된 날 가져오기
    const { data: checks } = await supabase
      .from('personal_daily_checks')
      .select('day_number')
      .eq('project_id', projectId)
      .eq('is_read', true);

    if (checks) {
      setCheckedDays(new Set(checks.map(c => c.day_number)));
    }

    setLoading(false);
  }, [projectId, router, userId]);

  useEffect(() => {
    if (!userLoading && !userId) {
      router.push('/login');
      return;
    }
    if (userId) {
      loadProject();
    }
  }, [loadProject, userLoading, userId, router]);

  const handleToggleDay = async (dayNumber: number) => {
    if (!project || !userId) return;
    setCheckingDay(dayNumber);
    const supabase = getSupabaseBrowserClient();

    const isCurrentlyChecked = checkedDays.has(dayNumber);

    if (isCurrentlyChecked) {
      // 체크 해제
      await supabase
        .from('personal_daily_checks')
        .delete()
        .eq('project_id', projectId)
        .eq('day_number', dayNumber);

      setCheckedDays(prev => {
        const next = new Set(prev);
        next.delete(dayNumber);
        return next;
      });
    } else {
      // 체크
      await supabase
        .from('personal_daily_checks')
        .upsert({
          project_id: projectId,
          user_id: userId,
          day_number: dayNumber,
          is_read: true,
          checked_at: new Date().toISOString(),
        }, {
          onConflict: 'project_id,day_number',
        });

      setCheckedDays(prev => new Set(Array.from(prev).concat(dayNumber)));
    }

    setCheckingDay(null);
  };

  const handleDeleteProject = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('personal_reading_projects')
      .delete()
      .eq('id', projectId);

    toast({
      variant: 'success',
      title: '프로젝트가 삭제되었습니다',
    });

    router.push('/mypage');
  };

  const goToDay = (day: number) => {
    if (day >= 1 && day <= totalDays) {
      setCurrentDay(day);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-20 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!project) return null;

  const completedDays = checkedDays.size;
  const progressPercentage = Math.round((completedDays / totalDays) * 100);
  const currentPlan = readingPlan[currentDay - 1];

  // 연속 일수 계산
  let currentStreak = 0;
  for (let day = currentDay; day >= 1; day--) {
    if (checkedDays.has(day)) {
      currentStreak++;
    } else {
      break;
    }
  }

  return (
    <div className="flex flex-col p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/mypage">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {project.reading_plan_type === '365' && '365일 플랜'}
              {project.reading_plan_type === '180' && '180일 플랜'}
              {project.reading_plan_type === '90' && '90일 플랜'}
              {project.reading_plan_type === 'custom' && '커스텀 플랜'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{completedDays}</p>
            <p className="text-xs text-muted-foreground">완료한 날</p>
          </CardContent>
        </Card>
        <Card className={cn(currentStreak > 0 && "border-border bg-muted/50")}>
          <CardContent className="pt-4 text-center">
            <div className={cn(
              "w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center",
              currentStreak > 0 ? "bg-muted" : "bg-primary/10"
            )}>
              <Flame className={cn(
                "w-5 h-5",
                currentStreak > 0 ? "text-accent" : "text-accent"
              )} />
            </div>
            <p className="text-2xl font-bold">{currentStreak}</p>
            <p className="text-xs text-muted-foreground">연속 일수</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-accent/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold">{progressPercentage}%</p>
            <p className="text-xs text-muted-foreground">진행률</p>
          </CardContent>
        </Card>
      </div>

      {/* 진행률 바 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {completedDays}일 / {totalDays}일
            </span>
            <span className="font-medium text-primary">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          {project.goal && (
            <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              {project.goal}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 오늘의 말씀 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Day {currentDay}의 말씀
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToDay(currentDay - 1)}
                disabled={currentDay <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToDay(currentDay + 1)}
                disabled={currentDay >= totalDays}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentPlan ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{currentPlan.book}</p>
                  <p className="text-sm text-muted-foreground">{currentPlan.range}</p>
                </div>
                <Button
                  variant={checkedDays.has(currentDay) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggleDay(currentDay)}
                  disabled={checkingDay === currentDay}
                >
                  {checkingDay === currentDay ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : checkedDays.has(currentDay) ? (
                    '읽음 완료'
                  ) : (
                    '읽음 체크'
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentPlan.reading}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              읽기 플랜 정보가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 최근 기록 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">최근 7일</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            {Array.from({ length: 7 }, (_, i) => {
              const day = currentDay - 6 + i;
              if (day < 1 || day > totalDays) return <div key={i} className="w-10" />;
              const isChecked = checkedDays.has(day);
              const isToday = day === currentDay;
              return (
                <button
                  key={i}
                  onClick={() => goToDay(day)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                    isChecked && "bg-primary text-primary-foreground",
                    !isChecked && isToday && "border-2 border-primary",
                    !isChecked && !isToday && "bg-muted text-muted-foreground"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 프로젝트 정보 */}
      <Card>
        <CardContent className="pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">시작일</span>
            <span>{format(new Date(project.start_date), 'yyyy년 M월 d일', { locale: ko })}</span>
          </div>
          {project.end_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">종료 예정일</span>
              <span>{format(new Date(project.end_date), 'yyyy년 M월 d일', { locale: ko })}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">생성일</span>
            <span>{format(new Date(project.created_at), 'yyyy년 M월 d일', { locale: ko })}</span>
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>프로젝트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &apos;{project.name}&apos; 프로젝트를 삭제하시겠습니까?
              <span className="block mt-2 text-destructive">
                모든 읽기 기록이 함께 삭제됩니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
