'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import {
  Users,
  Plus,
  Loader2,
  AlertCircle,
  Calendar,
  Target,
  ChevronRight,
  UserPlus,
  Search,
  Check,
  BookOpen,
  Copy,
  Share2,
  Clock,
} from 'lucide-react';

// HTML 태그 제거 함수
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChurchLayout } from '@/components/church/ChurchLayout';
import { Progress } from '@/components/ui/progress';
import { ReadingJesusPlanInfo } from '@/components/group/ReadingJesusPlanInfo';
import { CustomPlanWizard, type CustomPlanData } from '@/components/group/CustomPlanWizard';
import { saveCustomPlan, calculateCalendarDays } from '@/lib/plan-utils';
import { getTodayDateString } from '@/lib/date-utils';
import type { Group, Profile, ReadingPlanType } from '@/types';

interface ChurchInfo {
  id: string;
  code: string;
  name: string;
  admin_token: string | null;
}

interface GroupWithStats extends Group {
  member_count: number;
  progress_percentage: number;
}

export default function ChurchGroupsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const churchCode = params.code as string;

  // 상태
  const [church, setChurch] = useState<ChurchInfo | null>(null);
  const [groups, setGroups] = useState<GroupWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [, setUserProfile] = useState<Profile | null>(null);
  const [isChurchAdmin, setIsChurchAdmin] = useState(false);
  const [isRegisteredMember, setIsRegisteredMember] = useState(false);

  // 그룹 생성 모달
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupPlanType] = useState<'365' | '180' | '90'>('365');
  const [newGroupStartDate, setNewGroupStartDate] = useState(
    getTodayDateString()
  );

  // 새로운 플랜 선택 상태
  const [planType, setPlanType] = useState<ReadingPlanType>('reading_jesus');
  const [showCustomPlanWizard, setShowCustomPlanWizard] = useState(false);
  const [customPlanData, setCustomPlanData] = useState<CustomPlanData | null>(null);

  // 초대 코드 입력
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // 그룹 찾기 다이얼로그
  const [browseDialogOpen, setBrowseDialogOpen] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<GroupWithStats[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null);
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null);

  // 그룹 목록 필터 (my: 내 그룹만, all: 전체)
  const [groupFilter, setGroupFilter] = useState<'my' | 'all'>('my');

  // 가입 신청 대기 중인 그룹 ID 목록
  const [pendingRequestGroupIds, setPendingRequestGroupIds] = useState<Set<string>>(new Set());

  // 교회 및 그룹 정보 로드
  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    try {
      // 1. 로그인 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);

        // 프로필 로드
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
        }
      }

      // 2. 교회 정보 로드
      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .select('id, code, name, admin_token')
        .eq('code', churchCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (churchError || !churchData) {
        setChurch(null);
        return;
      }

      setChurch(churchData);

      // 3. 교회 관리자 여부 확인 (localStorage의 토큰과 비교)
      const storedToken = typeof window !== 'undefined'
        ? localStorage.getItem(`church_admin_${churchCode.toUpperCase()}`)
        : null;
      if (storedToken && churchData.admin_token === storedToken) {
        setIsChurchAdmin(true);
      }

      // 4. 등록 교인 여부 확인
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('church_id')
          .eq('id', user.id)
          .single();

        if (profile?.church_id === churchData.id) {
          setIsRegisteredMember(true);
        }
      }

      // 5. 해당 교회의 그룹 목록 로드
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('church_id', churchData.id)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // 5-1. 내가 참여중인 그룹 목록 (필터용)
      if (user) {
        const { data: myMemberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        const myIds = new Set((myMemberships || []).map(m => m.group_id));
        setMyGroupIds(myIds);

        // 5-2. 가입 신청 대기 중인 그룹 목록
        const { data: pendingRequests } = await supabase
          .from('group_join_requests')
          .select('group_id')
          .eq('user_id', user.id)
          .eq('status', 'pending');

        const pendingIds = new Set((pendingRequests || []).map(r => r.group_id));
        setPendingRequestGroupIds(pendingIds);
      }

      // 6. 각 그룹의 멤버 수 및 진행률 계산
      const groupsWithStats: GroupWithStats[] = await Promise.all(
        (groupsData || []).map(async (group: Group) => {
          // 멤버 수
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // 진행률 계산 (daily_checks 기준)
          const { data: checks } = await supabase
            .from('daily_checks')
            .select('is_read')
            .eq('group_id', group.id);

          const totalDays = group.reading_plan_type === '365' ? 365 :
                           group.reading_plan_type === '180' ? 180 : 90;
          const completedChecks = checks?.filter(c => c.is_read).length || 0;
          const totalMembers = memberCount || 1;
          const expectedTotal = totalDays * totalMembers;
          const progressPercentage = expectedTotal > 0
            ? Math.round((completedChecks / expectedTotal) * 100)
            : 0;

          return {
            ...group,
            member_count: memberCount || 0,
            progress_percentage: progressPercentage,
          };
        })
      );

      setGroups(groupsWithStats);
    } catch (err) {
      console.error('데이터 로드 에러:', err);
    } finally {
      setLoading(false);
    }
  }, [churchCode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 커스텀 플랜 완료 처리
  const handleCustomPlanComplete = (planData: CustomPlanData) => {
    setCustomPlanData(planData);
    setShowCustomPlanWizard(false);
  };

  // 폼 초기화
  const resetForm = () => {
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupStartDate(getTodayDateString());
    setPlanType('reading_jesus');
    setShowCustomPlanWizard(false);
    setCustomPlanData(null);
  };

  // 그룹 생성
  const handleCreateGroup = async () => {
    if (!church || !currentUser) return;

    // 등록 교인만 그룹 생성 가능
    if (!isRegisteredMember) {
      toast({
        variant: 'error',
        title: '그룹 생성 권한이 없습니다',
        description: '교회 등록 교인만 그룹을 생성할 수 있습니다.',
      });
      return;
    }

    if (!newGroupName.trim()) {
      toast({
        variant: 'error',
        title: '그룹 이름을 입력해주세요',
      });
      return;
    }

    // 커스텀 플랜 선택 시 플랜 데이터 필수
    if (planType === 'custom' && !customPlanData) {
      toast({
        variant: 'error',
        title: '커스텀 플랜을 설정해주세요',
      });
      setShowCustomPlanWizard(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setCreating(true);

    try {
      // 커스텀 플랜인 경우 먼저 플랜을 DB에 저장
      let savedPlanId: string | null = null;
      if (planType === 'custom' && customPlanData) {
        const totalCalendarDays = calculateCalendarDays(
          customPlanData.total_reading_days,
          customPlanData.reading_days
        );

        savedPlanId = await saveCustomPlan({
          name: customPlanData.name,
          bible_scope: customPlanData.bible_scope,
          selected_books: customPlanData.selected_books || [],
          reading_days: customPlanData.reading_days,
          chapters_per_day: customPlanData.chapters_per_day,
          start_date: customPlanData.start_date,
          end_date: customPlanData.end_date,
          total_chapters: customPlanData.total_chapters,
          total_reading_days: customPlanData.total_reading_days,
          total_calendar_days: totalCalendarDays,
          created_by: currentUser.id,
        });

        if (!savedPlanId) {
          toast({
            variant: 'error',
            title: '커스텀 플랜 저장에 실패했습니다',
          });
          setCreating(false);
          return;
        }
      }

      // 초대 코드 생성
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // 시작일 및 플랜 타입 결정
      let startDate: string;
      let endDate: string;
      let readingPlanType: string;

      if (planType === 'custom' && customPlanData) {
        startDate = customPlanData.start_date;
        endDate = customPlanData.end_date;
        readingPlanType = 'custom';
      } else if (planType === 'reading_jesus') {
        startDate = '2026-01-12';
        endDate = '2026-12-31';
        readingPlanType = '365';
      } else {
        startDate = newGroupStartDate;
        const days = parseInt(newGroupPlanType);
        const end = new Date(startDate);
        end.setDate(end.getDate() + days - 1);
        endDate = end.toISOString().split('T')[0];
        readingPlanType = newGroupPlanType;
      }

      // 그룹 생성 데이터
      const groupData: Record<string, unknown> = {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || null,
        start_date: startDate,
        end_date: endDate,
        reading_plan_type: readingPlanType,
        invite_code: inviteCode,
        created_by: currentUser.id,
        church_id: church.id,
        is_church_official: isChurchAdmin,
        is_public: true,  // 교회 그룹은 기본 공개 (멤버 수 조회를 위해)
        max_members: 100,
        allow_anonymous: false,
        require_daily_reading: true,
        bible_range_type: planType === 'custom' ? customPlanData?.bible_scope : (planType === 'reading_jesus' ? 'reading_jesus' : 'full'),
      };

      // 커스텀 플랜이 저장된 경우 plan_id 연결
      if (savedPlanId) {
        groupData.plan_id = savedPlanId;
      }

      // 그룹 생성 (교회 관리자가 만든 그룹만 공식 그룹으로 표시)
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single();

      if (groupError) throw groupError;

      // 생성자를 관리자로 추가
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: currentUser.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      toast({
        variant: 'success',
        title: '그룹이 생성되었습니다',
        description: `초대 코드: ${inviteCode}`,
      });

      // 폼 초기화 및 새로고침
      resetForm();
      setCreateDialogOpen(false);
      loadData();
    } catch (err) {
      console.error('그룹 생성 에러:', err);
      toast({
        variant: 'error',
        title: '그룹 생성에 실패했습니다',
      });
    } finally {
      setCreating(false);
    }
  };

  // 초대 코드로 그룹 참여
  const handleJoinGroup = async () => {
    if (!currentUser || !joinCode.trim()) {
      toast({
        variant: 'error',
        title: '초대 코드를 입력해주세요',
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setJoining(true);

    try {
      // 그룹 찾기
      const { data: group, error: findError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .single();

      if (findError || !group) {
        toast({
          variant: 'error',
          title: '유효하지 않은 초대 코드입니다',
        });
        return;
      }

      // 이미 멤버인지 확인
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', currentUser.id)
        .single();

      if (existingMember) {
        toast({
          variant: 'error',
          title: '이미 참여중인 그룹입니다',
        });
        return;
      }

      // 멤버 추가
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: currentUser.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      toast({
        variant: 'success',
        title: '그룹에 참여했습니다',
        description: group.name,
      });

      setJoinCode('');
      loadData();
    } catch (err) {
      console.error('그룹 참여 에러:', err);
      toast({
        variant: 'error',
        title: '그룹 참여에 실패했습니다',
      });
    } finally {
      setJoining(false);
    }
  };

  // 그룹 목록 불러오기 (찾아보기용)
  const loadAvailableGroups = async () => {
    if (!church || !currentUser) return;

    const supabase = getSupabaseBrowserClient();
    setBrowseLoading(true);
    try {
      // 1. 해당 교회의 모든 그룹 로드
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('church_id', church.id)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // 2. 내가 참여중인 그룹 목록
      const { data: myMemberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', currentUser.id);

      const myIds = new Set((myMemberships || []).map(m => m.group_id));
      setMyGroupIds(myIds);

      // 3. 각 그룹의 멤버 수 계산
      const groupsWithStats: GroupWithStats[] = await Promise.all(
        (groupsData || []).map(async (group: Group) => {
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            ...group,
            member_count: memberCount || 0,
            progress_percentage: 0, // 간단히 0으로 표시
          };
        })
      );

      setAvailableGroups(groupsWithStats);
    } catch (err) {
      console.error('그룹 목록 로드 에러:', err);
      toast({
        variant: 'error',
        title: '그룹 목록을 불러오는데 실패했습니다',
      });
    } finally {
      setBrowseLoading(false);
    }
  };

  // 그룹 찾기 다이얼로그 열기
  const openBrowseDialog = () => {
    setBrowseDialogOpen(true);
    loadAvailableGroups();
  };

  // 그룹에 바로 참여 (또는 가입 신청)
  const handleDirectJoin = async (groupId: string) => {
    if (!currentUser) return;

    const supabase = getSupabaseBrowserClient();
    setJoiningGroupId(groupId);
    try {
      // 이미 멤버인지 확인 (.maybeSingle()로 406 에러 방지)
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (existingMember) {
        toast({
          variant: 'error',
          title: '이미 참여중인 그룹입니다',
        });
        return;
      }

      // 그룹의 join_type 확인
      const targetGroup = availableGroups.find(g => g.id === groupId) || groups.find(g => g.id === groupId);
      const joinType = targetGroup?.join_type || 'open';

      if (joinType === 'approval') {
        // 승인제 그룹: 가입 신청
        // 이미 신청했는지 확인
        const { data: existingRequest } = await supabase
          .from('group_join_requests')
          .select('id, status')
          .eq('group_id', groupId)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (existingRequest) {
          if (existingRequest.status === 'pending') {
            toast({
              variant: 'error',
              title: '이미 가입 신청 중입니다',
            });
          } else if (existingRequest.status === 'rejected') {
            toast({
              variant: 'error',
              title: '가입 신청이 거절되었습니다',
            });
          }
          return;
        }

        // 가입 신청 생성
        const { error: requestError } = await supabase
          .from('group_join_requests')
          .insert({
            group_id: groupId,
            user_id: currentUser.id,
            message: null,
          });

        if (requestError) throw requestError;

        toast({
          variant: 'success',
          title: '가입 신청이 완료되었습니다',
          description: '관리자 승인 후 그룹에 참여할 수 있습니다.',
        });

        // 대기중 목록에 추가
        setPendingRequestGroupIds(prev => new Set([...Array.from(prev), groupId]));
      } else {
        // 공개 그룹: 바로 가입
        const { error: joinError } = await supabase
          .from('group_members')
          .insert({
            group_id: groupId,
            user_id: currentUser.id,
            role: 'member',
          });

        if (joinError) throw joinError;

        toast({
          variant: 'success',
          title: '그룹에 참여했습니다!',
        });

        // 내 그룹 목록에 추가
        setMyGroupIds(prev => new Set([...Array.from(prev), groupId]));
      }

      // 메인 목록 새로고침
      loadData();
    } catch (err) {
      console.error('그룹 참여 에러:', err);
      toast({
        variant: 'error',
        title: '그룹 참여에 실패했습니다',
      });
    } finally {
      setJoiningGroupId(null);
    }
  };

  // 초대 링크 복사
  const copyInviteLink = async (groupId: string, inviteCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const inviteUrl = `${window.location.origin}/church/${churchCode}/groups/join/${inviteCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedGroupId(groupId);
    toast({
      variant: 'success',
      title: '초대 링크가 복사되었습니다',
    });
    setTimeout(() => setCopiedGroupId(null), 2000);
  };

  // 그룹 탈퇴
  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!currentUser) return;

    const supabase = getSupabaseBrowserClient();
    setLeavingGroupId(groupId);
    try {
      // 관리자인지 확인
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .single();

      if (membership?.role === 'admin') {
        // 다른 관리자가 있는지 확인
        const { count: adminCount } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId)
          .eq('role', 'admin');

        if ((adminCount || 0) <= 1) {
          toast({
            variant: 'error',
            title: '탈퇴할 수 없습니다',
            description: '다른 멤버를 관리자로 지정한 후 탈퇴해주세요.',
          });
          return;
        }
      }

      // 멤버 삭제
      const { error: leaveError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id);

      if (leaveError) throw leaveError;

      toast({
        variant: 'success',
        title: '그룹에서 탈퇴했습니다',
        description: groupName,
      });

      // 내 그룹 목록에서 제거
      setMyGroupIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });

      // 메인 목록 새로고침
      loadData();
    } catch (err) {
      console.error('그룹 탈퇴 에러:', err);
      toast({
        variant: 'error',
        title: '그룹 탈퇴에 실패했습니다',
      });
    } finally {
      setLeavingGroupId(null);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 교회를 찾을 수 없음
  if (!church) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">교회를 찾을 수 없습니다</h1>
        <p className="text-muted-foreground text-center">
          유효하지 않은 코드이거나 비활성화된 교회입니다.
        </p>
      </div>
    );
  }

  return (
    <ChurchLayout churchCode={churchCode} churchId={church?.id}>
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-4">
      {/* 헤더 */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-lg">{church.name} 그룹</h1>
                <p className="text-xs text-muted-foreground">
                  {groups.length}개의 그룹
                </p>
              </div>
            </div>

            {/* 그룹 생성 버튼 (등록 교인만) */}
            {currentUser && isRegisteredMember && (
              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                그룹 만들기
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 그룹 가입하기 버튼들 (로그인 사용자만) */}
        {currentUser && (
          <div className="flex gap-2">
            {/* 그룹 찾기 버튼 */}
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={openBrowseDialog}
            >
              <Search className="w-4 h-4" />
              그룹 찾기
            </Button>

            {/* 초대 코드로 참여 버튼 */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1 gap-2">
                  <UserPlus className="w-4 h-4" />
                  초대 코드 입력
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>초대 코드로 그룹 참여</DialogTitle>
                  <DialogDescription>
                    그룹 관리자에게 받은 6자리 초대 코드를 입력하세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="초대 코드 입력 (예: ABC123)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="text-center text-lg tracking-widest font-mono"
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleJoinGroup}
                    disabled={joining || !joinCode.trim()}
                    className="w-full gap-2"
                  >
                    {joining ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    그룹 참여하기
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* 그룹 목록 필터 (로그인 사용자만) */}
        {currentUser && groups.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setGroupFilter('my')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  groupFilter === 'my'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                내 그룹
              </button>
              <button
                type="button"
                onClick={() => setGroupFilter('all')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  groupFilter === 'all'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                전체
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {groupFilter === 'my'
                ? `${groups.filter(g => myGroupIds.has(g.id)).length}개 참여중`
                : `총 ${groups.length}개`
              }
            </p>
          </div>
        )}

        {/* 그룹 목록 */}
        {groups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">아직 그룹이 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {!currentUser
                  ? '로그인 후 그룹을 생성할 수 있습니다.'
                  : isRegisteredMember
                    ? '첫 번째 그룹을 만들어보세요!'
                    : '교회 등록 교인만 그룹을 생성할 수 있습니다.'}
              </p>
              {currentUser && isRegisteredMember && (
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-1">
                  <Plus className="w-4 h-4" />
                  그룹 만들기
                </Button>
              )}
            </CardContent>
          </Card>
        ) : groupFilter === 'my' && groups.filter(g => myGroupIds.has(g.id)).length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium mb-2">참여중인 그룹이 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                그룹에 참여하여 함께 성경을 읽어보세요
              </p>
              <Button variant="outline" size="sm" onClick={openBrowseDialog}>
                <Search className="w-4 h-4 mr-2" />
                그룹 찾기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {groups
              .filter(g => groupFilter === 'all' || myGroupIds.has(g.id))
              .map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/church/${churchCode}/groups/${group.id}`)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{group.name}</h3>
                        {group.is_church_official && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            공식
                          </span>
                        )}
                        {/* 가입 상태 배지 */}
                        {myGroupIds.has(group.id) ? (
                          <span className="text-[10px] bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent px-1.5 py-0.5 rounded">
                            가입됨
                          </span>
                        ) : pendingRequestGroupIds.has(group.id) && (
                          <span className="text-[10px] bg-muted text-foreground dark:bg-primary/30 dark:text-accent px-1.5 py-0.5 rounded">
                            대기중
                          </span>
                        )}
                      </div>

                      {group.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {stripHtml(group.description)}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {group.member_count}명
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {group.reading_plan_type}일 플랜
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {group.progress_percentage}%
                        </span>
                      </div>

                      <Progress value={group.progress_percentage} className="h-1.5" />
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => copyInviteLink(group.id, group.invite_code, e)}
                        title="초대 링크 복사"
                      >
                        {copiedGroupId === group.id ? (
                          <Check className="w-4 h-4 text-accent" />
                        ) : (
                          <Share2 className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 비로그인 안내 */}
        {!currentUser && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-6 text-center">
              <p className="text-sm font-medium text-primary mb-2">
                로그인하면 그룹에 참여할 수 있습니다
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/login">로그인하기</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* 그룹 생성 다이얼로그 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 그룹 만들기</DialogTitle>
            <DialogDescription>
              {church.name}의 새로운 소그룹을 만듭니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">그룹 이름 *</label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="예: 청년부 1팀"
                maxLength={30}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">설명</label>
              <Textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="그룹에 대한 간단한 설명"
                rows={2}
                maxLength={200}
                disabled={creating}
              />
            </div>

            {/* 읽기 플랜 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                읽기 플랜
              </label>

              {/* 리딩지저스 플랜 (추천) */}
              <div className="relative">
                <Button
                  type="button"
                  size="sm"
                  variant={planType === 'reading_jesus' ? 'default' : 'outline'}
                  onClick={() => {
                    setPlanType('reading_jesus');
                    setCustomPlanData(null);
                  }}
                  disabled={creating}
                  className="w-full justify-start gap-2 pr-10"
                >
                  <span className="text-lg">📖</span>
                  <div className="text-left flex-1">
                    <div className="font-medium">리딩지저스 2026 (추천)</div>
                    <div className="text-xs opacity-80">365일 기본 통독 일정 · QT 가이드 제공</div>
                  </div>
                </Button>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                  <ReadingJesusPlanInfo trigger="icon" />
                </div>
              </div>

              {/* 커스텀 플랜 */}
              <Button
                type="button"
                size="sm"
                variant={planType === 'custom' ? 'default' : 'outline'}
                onClick={() => {
                  setPlanType('custom');
                  if (!customPlanData) {
                    setShowCustomPlanWizard(true);
                  }
                }}
                disabled={creating}
                className="w-full justify-start gap-2"
              >
                <span className="text-lg">✏️</span>
                <div className="text-left flex-1">
                  <div className="font-medium">커스텀 플랜</div>
                  <div className="text-xs opacity-80">
                    {customPlanData
                      ? `${customPlanData.name} (${customPlanData.total_reading_days}일)`
                      : '직접 통독 일정 설정하기'}
                  </div>
                </div>
                {planType === 'custom' && !customPlanData && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>

              {/* 커스텀 플랜 설정 완료 시 요약 표시 */}
              {planType === 'custom' && customPlanData && (
                <div className="bg-primary/10 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{customPlanData.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomPlanWizard(true)}
                      className="h-6 px-2 text-xs"
                    >
                      수정
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {customPlanData.total_chapters}장 · 하루 {customPlanData.chapters_per_day}장 · {customPlanData.total_reading_days}일
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {customPlanData.start_date} ~ {customPlanData.end_date}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              취소
            </Button>
            <Button onClick={handleCreateGroup} disabled={creating}>
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 그룹 찾기 다이얼로그 */}
      <Dialog open={browseDialogOpen} onOpenChange={setBrowseDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>우리교회 그룹 찾기</DialogTitle>
            <DialogDescription>
              {church.name}에 등록된 그룹 목록입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {browseLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : availableGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>아직 등록된 그룹이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableGroups.map((group) => {
                  const isMember = myGroupIds.has(group.id);
                  const isPending = pendingRequestGroupIds.has(group.id);
                  const isJoining = joiningGroupId === group.id;
                  const isApprovalRequired = group.join_type === 'approval';

                  return (
                    <div
                      key={group.id}
                      className="border rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{group.name}</h4>
                          {group.is_church_official && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              공식
                            </span>
                          )}
                          {isApprovalRequired && (
                            <span className="text-[10px] bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent px-1.5 py-0.5 rounded">
                              승인제
                            </span>
                          )}
                        </div>
                        {group.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {stripHtml(group.description)}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {group.member_count}명
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {group.reading_plan_type}일
                          </span>
                        </div>
                      </div>

                      <div className="ml-3 flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => copyInviteLink(group.id, group.invite_code, e)}
                          title="초대 링크 복사"
                        >
                          {copiedGroupId === group.id ? (
                            <Check className="w-4 h-4 text-accent" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        {isMember ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLeaveGroup(group.id, group.name)}
                            disabled={leavingGroupId === group.id}
                            className="gap-1 text-accent border-accent hover:text-destructive hover:border-destructive"
                          >
                            {leavingGroupId === group.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            참여중
                          </Button>
                        ) : isPending ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="gap-1 text-accent border-accent"
                          >
                            <Clock className="w-4 h-4" />
                            대기중
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleDirectJoin(group.id)}
                            disabled={isJoining}
                            className="gap-1"
                          >
                            {isJoining ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                            {isApprovalRequired ? '신청' : '참여'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBrowseDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 커스텀 플랜 위자드 */}
      <CustomPlanWizard
        open={showCustomPlanWizard}
        onOpenChange={setShowCustomPlanWizard}
        onComplete={handleCustomPlanComplete}
      />

      {/* 하단 네비게이션은 ChurchLayout에서 처리 */}
    </div>
    </ChurchLayout>
  );
}
