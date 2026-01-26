'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
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
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Crown,
  Calendar,
  LogOut,
  BookOpen,
  Check,
} from 'lucide-react';
import { useGroupCompat } from '@/presentation/hooks/stores/useGroupStore';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useUserGroups, useLeaveGroup } from '@/presentation/hooks/queries/useGroup';
import { useAllGroupReadings } from '@/presentation/hooks/queries/useReadingCheck';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import readingPlan from '@/data/reading_plan.json';

interface GroupWithStats {
  id: string;
  name: string;
  description: string | null;
  startDate: Date;
  role: 'admin' | 'member';
  memberCount: number;
  myReadDays: number;
  currentDay: number;
  progressPercent: number;
  createdAt: Date;
}

export default function MyGroupsPage() {
  const router = useRouter();
  const { activeGroup, setActiveGroup, refreshGroups } = useGroupCompat();
  const { toast } = useToast();

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<GroupWithStats | null>(null);

  // React Query 훅 사용
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  // 사용자 그룹 조회
  const { data: userGroupsData, isLoading: groupsLoading, refetch: refetchGroups } = useUserGroups(userId);

  // 그룹 ID 목록 생성
  const groupIds = useMemo(() => {
    if (!userGroupsData || userGroupsData.length === 0) return [];
    return userGroupsData.map(g => g.group.id);
  }, [userGroupsData]);

  // 모든 그룹의 읽기 데이터 조회
  const { data: readingsData } = useAllGroupReadings(userId, groupIds);

  // 그룹 나가기 뮤테이션
  const leaveGroup = useLeaveGroup();

  // 그룹 통계 데이터 계산
  const groups = useMemo<GroupWithStats[]>(() => {
    if (!userGroupsData || userGroupsData.length === 0) return [];

    // 읽기 데이터를 그룹별로 정리
    const checksByGroup: Record<string, number> = {};
    readingsData?.groupReadings?.forEach(gr => {
      // readings 배열에서 읽은 것들만 카운트
      checksByGroup[gr.groupId] = gr.readings.filter(r => r.isRead).length;
    });

    const groupsWithStats = userGroupsData.map(({ group, memberCount }) => {
      const startDate = new Date(group.startDate);
      const today = new Date();
      const currentDay = Math.max(1, Math.min(differenceInDays(today, startDate) + 1, readingPlan.length));
      const myReadDays = checksByGroup[group.id] || 0;
      const progressPercent = currentDay > 0 ? Math.round((myReadDays / currentDay) * 100) : 0;

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        startDate,
        role: 'member' as const, // 현재 findByUserId에서 role을 반환하지 않음, TODO: 추후 개선
        memberCount,
        myReadDays,
        currentDay,
        progressPercent,
        createdAt: new Date(group.createdAt),
      };
    });

    // 활성 그룹이 먼저 오도록 정렬
    groupsWithStats.sort((a, b) => {
      if (a.id === activeGroup?.id) return -1;
      if (b.id === activeGroup?.id) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return groupsWithStats;
  }, [userGroupsData, readingsData, activeGroup?.id]);

  const loading = userLoading || groupsLoading;

  // 로그인 체크
  useEffect(() => {
    if (!userLoading && !userData?.user) {
      router.push('/login');
    }
  }, [userLoading, userData, router]);

  const handleSetActiveGroup = async (group: GroupWithStats) => {
    // GroupWithStats를 Group 호환 형식으로 변환
    setActiveGroup({
      id: group.id,
      name: group.name,
      description: group.description,
      start_date: group.startDate.toISOString().split('T')[0],
      created_at: group.createdAt.toISOString(),
    } as Parameters<typeof setActiveGroup>[0]);
    toast({
      variant: 'success',
      title: `${group.name} 그룹으로 전환되었습니다`,
    });
  };

  const openLeaveDialog = (group: GroupWithStats) => {
    setLeaveTarget(group);
    setLeaveDialogOpen(true);
  };

  const handleLeaveGroup = async () => {
    if (!leaveTarget || !userId) return;

    try {
      await leaveGroup.mutateAsync({
        groupId: leaveTarget.id,
        userId,
      });

      // 활성 그룹이었다면 다른 그룹으로 전환
      if (activeGroup?.id === leaveTarget.id) {
        const remainingGroups = groups.filter(g => g.id !== leaveTarget.id);
        if (remainingGroups.length > 0) {
          handleSetActiveGroup(remainingGroups[0]);
        }
      }

      await refreshGroups();
      await refetchGroups();
      setLeaveDialogOpen(false);
      setLeaveTarget(null);

      toast({
        title: `${leaveTarget.name} 그룹에서 나갔습니다`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '그룹 나가기 실패';

      // 유일한 관리자인 경우 에러 처리
      if (message.includes('유일한 관리자') || message.includes('admin')) {
        toast({
          variant: 'error',
          title: '그룹을 나갈 수 없습니다',
          description: '다른 멤버를 관리자로 지정한 후 나가주세요',
        });
      } else {
        toast({
          variant: 'error',
          title: '오류',
          description: message,
        });
      }
      setLeaveDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">내 그룹</h1>
        </div>
        <div className="flex-1 p-4">
          <ListSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold flex-1">내 그룹</h1>
          <Button variant="outline" size="sm" onClick={() => router.push('/group')}>
            그룹 관리
          </Button>
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">아직 참여한 그룹이 없습니다</p>
            <Button onClick={() => router.push('/group')}>
              그룹 참여하기
            </Button>
          </div>
        ) : (
          groups.map(group => (
            <Card
              key={group.id}
              className={cn(
                "overflow-hidden transition-all",
                group.id === activeGroup?.id && "ring-2 ring-primary"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {group.name}
                    {group.role === 'admin' && (
                      <Crown className="w-4 h-4 text-accent" />
                    )}
                    {group.id === activeGroup?.id && (
                      <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">활성</span>
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push(`/group/${group.id}`)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {group.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {group.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {group.memberCount}명
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Day {group.currentDay}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {group.myReadDays}일 완료
                  </span>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">나의 진행률</span>
                    <span className={cn(
                      "font-medium",
                      group.progressPercent >= 80 && "text-accent",
                      group.progressPercent >= 50 && group.progressPercent < 80 && "text-accent",
                      group.progressPercent < 50 && "text-red-600"
                    )}>
                      {group.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        group.progressPercent >= 80 && "bg-accent",
                        group.progressPercent >= 50 && group.progressPercent < 80 && "bg-primary",
                        group.progressPercent < 50 && "bg-red-500"
                      )}
                      style={{ width: `${group.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {group.id !== activeGroup?.id ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSetActiveGroup(group)}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      활성 그룹으로 설정
                    </Button>
                  ) : (
                    <div className="flex-1 text-xs text-center text-muted-foreground py-2">
                      현재 활성 그룹입니다
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => openLeaveDialog(group)}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Leave Dialog */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>그룹 나가기</AlertDialogTitle>
            <AlertDialogDescription>
              &apos;{leaveTarget?.name}&apos; 그룹을 나가시겠습니까?
              {leaveTarget?.role === 'admin' && (
                <span className="block mt-2 text-accent">
                  관리자인 경우 다른 관리자가 있어야 나갈 수 있습니다.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              나가기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
