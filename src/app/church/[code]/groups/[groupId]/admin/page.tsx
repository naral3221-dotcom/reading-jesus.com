'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ListSkeleton } from '@/components/ui/skeleton';
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
  Users,
  Crown,
  UserMinus,
  BarChart3,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Award,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Group, Profile, MemberRank } from '@/types';
import { differenceInDays } from 'date-fns';
import readingPlan from '@/data/reading_plan.json';
import { JoinRequestsManager } from '@/components/group/JoinRequestsManager';
import { ChurchLayout } from '@/components/church/ChurchLayout';

interface ChurchInfo {
  id: string;
  name: string;
  code: string;
  admin_token: string | null;
}

interface MemberWithStats {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  rank_id: string | null;
  profile: Profile | null;
  rank: MemberRank | null;
  readDays: number;
  commentsCount: number;
  streak: number;
}

interface GroupStats {
  totalMembers: number;
  activeMembers: number;
  totalReadChecks: number;
  totalComments: number;
  averageProgress: number;
  currentDay: number;
  totalDays: number;
}

export default function ChurchGroupAdminPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const churchCode = params.code as string;
  const groupId = params.groupId as string;

  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [ranks, setRanks] = useState<MemberRank[]>([]);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_churchInfo, setChurchInfo] = useState<ChurchInfo | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isChurchAdmin, setIsChurchAdmin] = useState(false);

  const [removeMemberDialog, setRemoveMemberDialog] = useState<{ open: boolean; member: MemberWithStats | null }>({
    open: false,
    member: null,
  });
  const [promoteDialog, setPromoteDialog] = useState<{ open: boolean; member: MemberWithStats | null }>({
    open: false,
    member: null,
  });
  const [rankDialog, setRankDialog] = useState<{ open: boolean; member: MemberWithStats | null }>({
    open: false,
    member: null,
  });
  const [selectedRankId, setSelectedRankId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUserId(user.id);

    // 교회 정보 로드
    const { data: church } = await supabase
      .from('churches')
      .select('id, name, code, admin_token')
      .eq('code', churchCode.toUpperCase())
      .single();

    if (!church) {
      router.push('/');
      return;
    }
    setChurchInfo(church);

    // 교회 관리자 확인
    const storedToken = typeof window !== 'undefined'
      ? localStorage.getItem(`church_admin_${church.code}`)
      : null;
    const isCurrentUserChurchAdmin = !!(storedToken && church.admin_token === storedToken);
    setIsChurchAdmin(isCurrentUserChurchAdmin);

    // 그룹 정보
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .eq('church_id', church.id)
      .single();

    if (!groupData) {
      router.push(`/church/${churchCode}/groups`);
      return;
    }
    setGroup(groupData);

    // 현재 날짜 계산
    const startDate = new Date(groupData.start_date);
    const today = new Date();
    const currentDay = Math.max(1, Math.min(differenceInDays(today, startDate) + 1, readingPlan.length));

    // 등급 목록
    const { data: ranksData } = await supabase
      .from('member_ranks')
      .select('*')
      .eq('group_id', groupId)
      .order('level', { ascending: false });

    if (ranksData) {
      setRanks(ranksData);
    }

    // 멤버 목록
    const { data: membersData } = await supabase
      .from('group_members')
      .select(`
        *,
        profile:profiles(*)
      `)
      .eq('group_id', groupId)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: true });

    if (!membersData) {
      setLoading(false);
      return;
    }

    const rankMap = new Map(ranksData?.map(r => [r.id, r]) || []);

    // 현재 사용자 권한 확인
    const myMembership = membersData.find(m => m.user_id === user.id);
    const userIsAdmin = myMembership?.role === 'admin';

    if (!userIsAdmin && !isCurrentUserChurchAdmin) {
      toast({
        variant: 'error',
        title: '접근 권한이 없습니다',
      });
      router.push(`/church/${churchCode}/groups/${groupId}`);
      return;
    }

    // 읽기 체크 데이터
    const { data: checksData } = await supabase
      .from('daily_checks')
      .select('user_id, day_number, checked_at')
      .eq('group_id', groupId)
      .eq('is_read', true);

    // 댓글 데이터
    const { data: commentsData } = await supabase
      .from('comments')
      .select('user_id, created_at')
      .eq('group_id', groupId);

    // 멤버별 통계 계산
    const checksByUser: Record<string, number[]> = {};
    const commentsByUser: Record<string, number> = {};

    checksData?.forEach(check => {
      if (!checksByUser[check.user_id]) {
        checksByUser[check.user_id] = [];
      }
      checksByUser[check.user_id].push(check.day_number);
    });

    commentsData?.forEach(comment => {
      commentsByUser[comment.user_id] = (commentsByUser[comment.user_id] || 0) + 1;
    });

    // 연속 일수 계산 함수
    const calculateStreak = (checkedDays: number[], currentDay: number): number => {
      if (!checkedDays.length) return 0;
      const daySet = new Set(checkedDays);
      let streak = 0;
      for (let day = currentDay; day >= 1; day--) {
        if (daySet.has(day)) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    };

    const membersWithStats: MemberWithStats[] = membersData.map(member => {
      const userChecks = checksByUser[member.user_id] || [];
      return {
        id: member.id,
        user_id: member.user_id,
        role: member.role as 'admin' | 'member',
        joined_at: member.joined_at,
        rank_id: member.rank_id || null,
        profile: member.profile as Profile | null,
        rank: member.rank_id ? rankMap.get(member.rank_id) || null : null,
        readDays: userChecks.length,
        commentsCount: commentsByUser[member.user_id] || 0,
        streak: calculateStreak(userChecks, currentDay),
      };
    });

    membersWithStats.sort((a, b) => b.readDays - a.readDays);
    setMembers(membersWithStats);

    // 최근 7일 활동 멤버 수
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUserIds = new Set<string>();
    checksData?.forEach(check => {
      if (new Date(check.checked_at) >= sevenDaysAgo) {
        activeUserIds.add(check.user_id);
      }
    });
    commentsData?.forEach(comment => {
      if (new Date(comment.created_at) >= sevenDaysAgo) {
        activeUserIds.add(comment.user_id);
      }
    });

    // 그룹 통계
    const totalReadChecks = checksData?.length || 0;
    const totalComments = commentsData?.length || 0;
    const avgProgress = membersWithStats.length > 0
      ? Math.round(membersWithStats.reduce((sum, m) => sum + m.readDays, 0) / membersWithStats.length / currentDay * 100)
      : 0;

    setStats({
      totalMembers: membersWithStats.length,
      activeMembers: activeUserIds.size,
      totalReadChecks,
      totalComments,
      averageProgress: avgProgress,
      currentDay,
      totalDays: readingPlan.length,
    });

    setLoading(false);
  }, [churchCode, groupId, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRemoveMember = async () => {
    const member = removeMemberDialog.member;
    if (!member || member.user_id === userId) return;

    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('group_members')
      .delete()
      .eq('id', member.id);

    setMembers(members.filter(m => m.id !== member.id));
    setRemoveMemberDialog({ open: false, member: null });

    toast({
      variant: 'success',
      title: `${member.profile?.nickname || '멤버'}님을 그룹에서 내보냈습니다`,
    });
  };

  const handlePromoteToAdmin = async () => {
    const member = promoteDialog.member;
    if (!member) return;

    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('id', member.id);

    setMembers(members.map(m =>
      m.id === member.id ? { ...m, role: 'admin' } : m
    ));
    setPromoteDialog({ open: false, member: null });

    toast({
      variant: 'success',
      title: `${member.profile?.nickname || '멤버'}님을 관리자로 지정했습니다`,
    });
  };

  const handleDemoteFromAdmin = async (member: MemberWithStats) => {
    if (member.user_id === userId) {
      toast({
        variant: 'error',
        title: '자신의 관리자 권한은 해제할 수 없습니다',
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('group_members')
      .update({ role: 'member' })
      .eq('id', member.id);

    setMembers(members.map(m =>
      m.id === member.id ? { ...m, role: 'member' } : m
    ));

    toast({
      variant: 'success',
      title: `${member.profile?.nickname || '멤버'}님의 관리자 권한을 해제했습니다`,
    });
  };

  const openRankDialog = (member: MemberWithStats) => {
    setSelectedRankId(member.rank_id);
    setRankDialog({ open: true, member });
  };

  const handleAssignRank = async () => {
    const member = rankDialog.member;
    if (!member) return;

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('group_members')
      .update({ rank_id: selectedRankId })
      .eq('id', member.id);

    if (error) {
      console.error('등급 지정 에러:', error);
      toast({
        variant: 'error',
        title: '등급 지정에 실패했습니다',
        description: error.message,
      });
      return;
    }

    const selectedRank = selectedRankId ? ranks.find(r => r.id === selectedRankId) : null;

    setMembers(members.map(m =>
      m.id === member.id
        ? { ...m, rank_id: selectedRankId, rank: selectedRank || null }
        : m
    ));

    toast({
      variant: 'success',
      title: selectedRankId ? '등급이 지정되었습니다' : '등급이 해제되었습니다',
    });

    setRankDialog({ open: false, member: null });
  };

  if (loading) {
    return (
      <ChurchLayout churchCode={churchCode} >
        <div className="flex flex-col p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded animate-pulse" />
            <div className="h-7 w-40 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="h-8 w-12 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <ListSkeleton count={5} />
            </CardContent>
          </Card>
        </div>
      </ChurchLayout>
    );
  }

  if (!group || !stats) return null;

  const inactiveMembers = members.filter(m => {
    return m.readDays === 0 && m.commentsCount === 0;
  });

  return (
    <ChurchLayout churchCode={churchCode} >
      <div className="flex flex-col p-4 space-y-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/church/${churchCode}/groups/${groupId}`}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">관리자 대시보드</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {group.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/church/${churchCode}/groups/${groupId}/admin/ranks`}>
              <Button variant="outline" size="sm">
                <Award className="w-4 h-4 mr-2" />
                등급 관리
              </Button>
            </Link>
            <Link href={`/church/${churchCode}/groups/${groupId}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                그룹 설정
              </Button>
            </Link>
          </div>
        </div>

        {/* 가입 신청 관리 */}
        {group.join_type === 'approval' && (
          <JoinRequestsManager groupId={groupId} />
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs">총 멤버</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalMembers}</p>
            </CardContent>
          </Card>
          <Card className={cn(
            stats.activeMembers < stats.totalMembers / 2 && "border-border bg-muted/50"
          )}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">활동 멤버 (7일)</span>
              </div>
              <p className="text-2xl font-bold">{stats.activeMembers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs">총 읽음 체크</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalReadChecks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">총 묵상</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalComments}</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              그룹 진행 현황
            </CardTitle>
            <CardDescription>
              Day {stats.currentDay} / {stats.totalDays}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">평균 진행률</span>
                <span className="font-medium">{stats.averageProgress}%</span>
              </div>
              <Progress value={stats.averageProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {inactiveMembers.length > 0 && (
          <Card className="border-border bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">비활동 멤버 알림</p>
                  <p className="text-sm text-foreground mt-1">
                    {inactiveMembers.length}명의 멤버가 아직 활동을 시작하지 않았습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members Ranking */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-5 h-5" />
              멤버 현황
            </CardTitle>
            <CardDescription>
              읽은 날 수 기준 정렬
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {members.map((member, index) => {
              const progressPercent = stats.currentDay > 0
                ? Math.round((member.readDays / stats.currentDay) * 100)
                : 0;

              return (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center justify-between py-3 px-2 rounded-lg transition-colors",
                    member.user_id === userId && "bg-primary/5",
                    "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      index === 0 && "bg-muted text-accent",
                      index === 1 && "bg-gray-100 text-gray-600",
                      index === 2 && "bg-accent/10 text-accent",
                      index > 2 && "bg-muted text-muted-foreground"
                    )}>
                      {index + 1}
                    </div>
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.profile?.nickname?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {member.profile?.nickname || '알 수 없음'}
                        </span>
                        {member.role === 'admin' && (
                          <Crown className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                        )}
                        {member.rank && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                            style={{ backgroundColor: member.rank.color }}
                          >
                            {member.rank.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <BookOpen className="w-3 h-3" />
                          {member.readDays}일
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" />
                          {member.commentsCount}
                        </span>
                        {member.streak > 0 && (
                          <span className="text-accent">🔥{member.streak}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right mr-1">
                      <span className={cn(
                        "text-sm font-medium",
                        progressPercent >= 80 && "text-accent",
                        progressPercent >= 50 && progressPercent < 80 && "text-accent",
                        progressPercent < 50 && "text-red-600"
                      )}>
                        {progressPercent}%
                      </span>
                    </div>

                    {member.user_id !== userId && (
                      <div className="flex gap-1">
                        {member.role === 'admin' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleDemoteFromAdmin(member)}
                          >
                            권한해제
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setPromoteDialog({ open: true, member })}
                            title="관리자 지정"
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openRankDialog(member)}
                          title="등급 지정"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setRemoveMemberDialog({ open: true, member })}
                          title="내보내기"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 멤버 내보내기 확인 */}
        <AlertDialog
          open={removeMemberDialog.open}
          onOpenChange={(open) => !open && setRemoveMemberDialog({ open: false, member: null })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>멤버 내보내기</AlertDialogTitle>
              <AlertDialogDescription>
                &apos;{removeMemberDialog.member?.profile?.nickname || '이 멤버'}&apos;님을 그룹에서 내보내시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                내보내기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 관리자 지정 확인 */}
        <AlertDialog
          open={promoteDialog.open}
          onOpenChange={(open) => !open && setPromoteDialog({ open: false, member: null })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>관리자 지정</AlertDialogTitle>
              <AlertDialogDescription>
                &apos;{promoteDialog.member?.profile?.nickname || '이 멤버'}&apos;님을 관리자로 지정하시겠습니까?
                <span className="block mt-2 text-muted-foreground">
                  관리자는 그룹 설정 변경, 멤버 관리 등의 권한을 갖습니다.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handlePromoteToAdmin}>
                지정하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 등급 지정 다이얼로그 */}
        <AlertDialog
          open={rankDialog.open}
          onOpenChange={(open) => !open && setRankDialog({ open: false, member: null })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>등급 지정</AlertDialogTitle>
              <AlertDialogDescription>
                &apos;{rankDialog.member?.profile?.nickname || '이 멤버'}&apos;님의 등급을 선택하세요
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2 py-4">
              <button
                onClick={() => setSelectedRankId(null)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all",
                  selectedRankId === null ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/30"
                )}
              >
                <span className="text-sm font-medium">등급 없음</span>
              </button>
              {ranks.map((rank) => (
                <button
                  key={rank.id}
                  onClick={() => setSelectedRankId(rank.id)}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3",
                    selectedRankId === rank.id ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/30"
                  )}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: rank.color }}
                  >
                    {rank.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{rank.name}</p>
                    {rank.description && (
                      <p className="text-xs text-muted-foreground truncate">{rank.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleAssignRank}>
                지정하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ChurchLayout>
  );
}
