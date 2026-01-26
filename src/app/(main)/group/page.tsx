'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ListSkeleton } from '@/components/ui/skeleton';
import { NoGroupsEmpty } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { Users, Plus, LogIn, Copy, Check, CheckCircle2, ChevronRight, Loader2, BookOpen, ChevronDown, ChevronUp, Church } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { useGroupCompat } from '@/presentation/hooks/stores/useGroupStore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { GroupWithMembership, Group, BibleRangeType, ScheduleMode, Church as ChurchType, ReadingPlanType } from '@/types';
import dynamic from 'next/dynamic';
// React Query Hooks
import { useUserGroups, useJoinGroup, groupKeys } from '@/presentation/hooks/queries/useGroup';
import { useQueryClient } from '@tanstack/react-query';
import { useMainData } from '@/contexts/MainDataContext';

// TipTap 에디터 동적 로드 (번들 최적화)
const RichEditor = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichEditor),
  { ssr: false, loading: () => <div className="h-[100px] border rounded-lg bg-muted/30 animate-pulse" /> }
);
import { HelpButton } from '@/components/HelpButton';
import { helpContent } from '@/data/helpContent';
import { BIBLE_BOOKS, getOldTestament, getNewTestament } from '@/data/bibleBooks';
import { ReadingJesusPlanInfo } from '@/components/group/ReadingJesusPlanInfo';
import { CustomPlanWizard, type CustomPlanData } from '@/components/group/CustomPlanWizard';
import { saveCustomPlan, calculateCalendarDays } from '@/lib/plan-utils';
import { getTodayDateString } from '@/lib/date-utils';

export default function GroupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeGroup, setActiveGroup, refreshGroups } = useGroupCompat();
  const { toast } = useToast();

  // Context에서 사용자 정보 조회 (중복 호출 제거)
  const { user, church, isLoading: contextLoading } = useMainData();
  const userId = user?.id ?? null;

  // 사용자 교회 정보 (Context에서 제공)
  const userChurch = useMemo<ChurchType | null>(() => {
    if (!church) return null;
    return {
      id: church.id,
      code: church.code,
      name: church.name,
      denomination: church.denomination,
      address: church.address,
      region_code: church.regionCode,
      write_token: church.writeToken,
      admin_token: church.adminToken,
      is_active: church.isActive,
      allow_anonymous: church.allowAnonymous,
      schedule_year: church.scheduleYear,
      schedule_start_date: church.scheduleStartDate?.toISOString().split('T')[0] ?? null,
      created_at: church.createdAt.toISOString(),
      updated_at: church.updatedAt.toISOString(),
    };
  }, [church]);

  // React Query 훅으로 사용자 그룹 목록 조회
  const { data: userGroupsData, isLoading: isGroupsLoading } = useUserGroups(userId);

  // 그룹 가입 mutation (나중에 참조 가능)
  useJoinGroup();

  // Domain Entity의 BibleRangeType을 Types의 BibleRangeType으로 변환
  const convertBibleRangeType = (domainType: string | undefined): BibleRangeType => {
    if (!domainType) return 'full';
    const mapping: Record<string, BibleRangeType> = {
      'full': 'full',
      'ot': 'old',
      'nt': 'new',
      'custom': 'custom',
    };
    return mapping[domainType] || 'full';
  };

  // 그룹 목록을 GroupWithMembership 형태로 변환
  const groups = useMemo<GroupWithMembership[]>(() => {
    if (!userGroupsData) return [];
    return userGroupsData.map(({ group, memberCount }) => {
      const g = group;
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        start_date: g.startDate, // 이미 string 타입
        end_date: g.endDate ?? null,
        invite_code: g.inviteCode,
        created_by: g.createdBy,
        created_at: g.createdAt, // 이미 string 타입
        reading_plan_type: g.readingPlanType as '365' | '180' | '90' | 'custom',
        goal: g.goal,
        rules: g.rules,
        is_public: g.isPublic,
        max_members: g.maxMembers,
        allow_anonymous: g.allowAnonymous,
        require_daily_reading: g.requireDailyReading,
        bible_range_type: convertBibleRangeType(g.bibleRangeType),
        bible_range_books: g.bibleRangeBooks,
        schedule_mode: g.scheduleMode,
        church_id: g.churchId,
        is_church_official: g.isChurchOfficial,
        member_count: memberCount,
        // membership은 사용자가 해당 그룹의 멤버이므로 기본 member로 설정 (admin 여부는 별도 확인 필요)
        membership: {
          id: '', // ID는 별도로 조회해야 하므로 빈 문자열
          group_id: g.id,
          user_id: userId || '',
          role: 'member' as const, // 기본값, 상세 페이지에서 확인
          joined_at: new Date().toISOString(),
        },
      };
    });
  }, [userGroupsData, userId]);

  // 멤버 수 계산
  const memberCounts = useMemo<Record<string, number>>(() => {
    if (!userGroupsData) return {};
    const counts: Record<string, number> = {};
    userGroupsData.forEach(({ group, memberCount }) => {
      counts[group.id] = memberCount;
    });
    return counts;
  }, [userGroupsData]);

  // 로딩 상태
  const loading = contextLoading || isGroupsLoading;

  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  // 폼 상태
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPlan, setNewGroupPlan] = useState<'365' | '180' | '90' | 'custom'>('365');
  const [customDays, setCustomDays] = useState('');
  const [newGroupStartDate, setNewGroupStartDate] = useState(getTodayDateString());
  const [newGroupGoal, setNewGroupGoal] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 성경 범위 설정 상태
  const [bibleRangeType, setBibleRangeType] = useState<BibleRangeType>('full');
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [showBookSelector, setShowBookSelector] = useState(false);

  // 일정 모드 설정 상태
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('calendar');

  // 새로운 플랜 선택 상태
  const [planType, setPlanType] = useState<ReadingPlanType>('reading_jesus');
  const [showCustomPlanWizard, setShowCustomPlanWizard] = useState(false);
  const [customPlanData, setCustomPlanData] = useState<CustomPlanData | null>(null);

  // 소속 교회 그룹 생성 옵션
  const [createAsChurchGroup, setCreateAsChurchGroup] = useState(false);
  const [churchDepartment, setChurchDepartment] = useState('');

  // 그룹 생성 완료 후 처리
  const handleGroupCreated = async (group: Group, creatorUserId: string) => {
    const supabase = getSupabaseBrowserClient();
    // 생성자를 admin으로 멤버 추가
    await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: creatorUserId,
        role: 'admin',
      });

    setNewGroupName('');
    setNewGroupDesc('');
    setCreateModalOpen(false);
    setSubmitting(false);

    // React Query 캐시 무효화
    queryClient.invalidateQueries({ queryKey: groupKeys.byUser(creatorUserId) });
    await refreshGroups();

    // 새로 만든 그룹을 활성 그룹으로 설정
    setActiveGroup(group);

    toast({
      variant: 'success',
      title: '그룹이 생성되었습니다',
      description: '초대 코드를 공유하여 멤버를 초대하세요',
    });
  };

  const handleCreateGroup = async () => {
    setError('');
    if (!newGroupName.trim()) {
      setError('그룹 이름을 입력해주세요');
      return;
    }

    // 커스텀 플랜 검증 (새 방식)
    if (planType === 'custom' && !customPlanData) {
      setError('커스텀 플랜을 먼저 설정해주세요');
      return;
    }

    // 커스텀 일수 검증 (구 방식 - 호환성)
    if (planType !== 'custom' && planType !== 'reading_jesus' && newGroupPlan === 'custom') {
      const days = parseInt(customDays);
      if (!customDays || isNaN(days) || days < 1 || days > 1000) {
        setError('1~1000일 사이의 숫자를 입력해주세요');
        return;
      }
    }

    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('로그인이 필요합니다');
      setSubmitting(false);
      return;
    }

    // 커스텀 플랜인 경우 먼저 플랜을 DB에 저장
    let savedPlanId: string | null = null;
    if (planType === 'custom' && customPlanData) {
      // total_calendar_days 계산 (휴식일 포함 달력 기준 일수)
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
        created_by: user.id,
      });

      if (!savedPlanId) {
        setError('커스텀 플랜 저장에 실패했습니다');
        setSubmitting(false);
        return;
      }
    }

    // 실제 일수 및 날짜 계산
    let actualStartDate: string;
    let actualEndDate: string;
    let actualPlanType: string;

    if (planType === 'custom' && customPlanData) {
      actualStartDate = customPlanData.start_date;
      actualEndDate = customPlanData.end_date;
      actualPlanType = 'custom';
    } else if (planType === 'reading_jesus') {
      actualStartDate = '2026-01-12'; // 리딩지저스 고정 시작일
      actualEndDate = '2026-12-31';
      actualPlanType = '365';
    } else {
      const actualDays = newGroupPlan === 'custom' ? parseInt(customDays) : parseInt(newGroupPlan);
      const startDate = new Date(newGroupStartDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + actualDays - 1);
      actualStartDate = newGroupStartDate;
      actualEndDate = endDate.toISOString().split('T')[0];
      actualPlanType = newGroupPlan === 'custom' ? customDays : newGroupPlan;
    }

    // 성경 범위 검증 (구 방식 - 호환성)
    if (bibleRangeType === 'custom' && selectedBooks.length === 0 && planType !== 'custom') {
      setError('읽을 성경 책을 선택해주세요');
      setSubmitting(false);
      return;
    }

    // 그룹 생성 (schedule_mode는 DB에 컬럼이 있는 경우에만 포함)
    const groupData: Record<string, unknown> = {
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || null,
      start_date: actualStartDate,
      end_date: actualEndDate,
      reading_plan_type: actualPlanType,
      goal: newGroupGoal.trim() || null,
      created_by: user.id,
      bible_range_type: planType === 'custom' ? customPlanData?.bible_scope : bibleRangeType,
      bible_range_books: planType === 'custom' ? customPlanData?.selected_books : (bibleRangeType === 'custom' ? selectedBooks : null),
    };

    // 커스텀 플랜이 저장된 경우 plan_id 연결
    if (savedPlanId) {
      groupData.plan_id = savedPlanId;
    }

    // 교회 소속 그룹인 경우 교회 정보 추가
    if (createAsChurchGroup && userChurch) {
      groupData.church_id = userChurch.id;
      groupData.is_church_official = false; // 일반 유저가 만든 교회 그룹은 비공식
      if (churchDepartment.trim()) {
        groupData.department = churchDepartment.trim();
      }
    }

    // schedule_mode 컬럼이 DB에 존재하는 경우에만 추가
    // TODO: DB 마이그레이션 후 이 조건 제거 가능
    try {
      // 먼저 schedule_mode 없이 시도
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single();

      if (groupError) {
        throw groupError;
      }

      // 성공 시 아래 로직으로 진행
      await handleGroupCreated(group, user.id);
      return;
    } catch {
      // schedule_mode 포함해서 다시 시도 (DB에 컬럼이 있는 경우)
      groupData.schedule_mode = scheduleMode;
    }

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert(groupData)
      .select()
      .single();

    if (groupError) {
      console.error('Group creation error:', groupError);
      setError(`그룹 생성 실패: ${groupError.message}`);
      setSubmitting(false);
      return;
    }

    await handleGroupCreated(group, user.id);
  };

  const handleJoinGroup = async () => {
    setError('');
    if (!inviteCode.trim()) {
      setError('초대 코드를 입력해주세요');
      return;
    }

    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('로그인이 필요합니다');
      setSubmitting(false);
      return;
    }

    // 초대 코드로 그룹 찾기 (대소문자 구분 없이)
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select()
      .ilike('invite_code', inviteCode.trim())
      .single();

    if (groupError || !group) {
      setError('유효하지 않은 초대 코드입니다');
      setSubmitting(false);
      return;
    }

    // 이미 가입했는지 확인
    const { data: existing } = await supabase
      .from('group_members')
      .select()
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      setError('이미 가입한 그룹입니다');
      setSubmitting(false);
      return;
    }

    // 멤버로 가입
    await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'member',
      });

    setInviteCode('');
    setJoinModalOpen(false);
    setSubmitting(false);

    // React Query 캐시 무효화
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: groupKeys.byUser(user.id) });
    }
    await refreshGroups();

    // 가입한 그룹을 활성 그룹으로 설정
    setActiveGroup(group);

    toast({
      variant: 'success',
      title: `'${group.name}' 그룹에 참여했습니다`,
    });
  };

  const copyInviteCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      variant: 'success',
      title: '초대 코드가 복사되었습니다',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSelectGroup = (group: GroupWithMembership) => {
    setActiveGroup(group);
    toast({
      title: `'${group.name}' 그룹이 선택되었습니다`,
    });
  };

  const resetCreateModal = () => {
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupPlan('365');
    setCustomDays('');
    setNewGroupStartDate(getTodayDateString());
    setNewGroupGoal('');
    setBibleRangeType('reading_jesus'); // 기본값: 리딩지저스
    setSelectedBooks([]);
    setShowBookSelector(false);
    setError('');
    // 새로운 플랜 상태 초기화
    setPlanType('reading_jesus');
    setShowCustomPlanWizard(false);
    setCustomPlanData(null);
    // 교회 그룹 옵션 초기화
    setCreateAsChurchGroup(false);
    setChurchDepartment('');
  };

  // 커스텀 플랜 완료 처리
  const handleCustomPlanComplete = (planData: CustomPlanData) => {
    setCustomPlanData(planData);
    setShowCustomPlanWizard(false);
  };

  // 성경 범위 타입 변경 시 책 선택 초기화
  const handleBibleRangeTypeChange = (type: BibleRangeType) => {
    setBibleRangeType(type);
    if (type === 'old') {
      setSelectedBooks(getOldTestament().map(b => b.name));
    } else if (type === 'new') {
      setSelectedBooks(getNewTestament().map(b => b.name));
    } else if (type === 'full' || type === 'reading_jesus') {
      // 리딩지저스는 전체 성경 + 365일 기본 일정 사용
      setSelectedBooks(BIBLE_BOOKS.map(b => b.name));
      if (type === 'reading_jesus') {
        setNewGroupPlan('365'); // 자동으로 365일 플랜 설정
      }
    } else {
      setSelectedBooks([]);
    }
  };

  // 책 선택/해제 토글
  const toggleBook = (bookName: string) => {
    setSelectedBooks(prev =>
      prev.includes(bookName)
        ? prev.filter(b => b !== bookName)
        : [...prev, bookName]
    );
  };

  // 전체 선택/해제
  const toggleAllBooks = (books: string[]) => {
    const allSelected = books.every(b => selectedBooks.includes(b));
    if (allSelected) {
      setSelectedBooks(prev => prev.filter(b => !books.includes(b)));
    } else {
      setSelectedBooks(prev => Array.from(new Set([...prev, ...books])));
    }
  };

  // 선택된 책 수 표시
  const getSelectedBooksText = () => {
    if (bibleRangeType === 'reading_jesus') return '리딩지저스 365일 기본 일정';
    if (bibleRangeType === 'full') return '전체 성경 (66권)';
    if (bibleRangeType === 'old') return '구약 (39권)';
    if (bibleRangeType === 'new') return '신약 (27권)';
    if (selectedBooks.length === 0) return '책을 선택하세요';
    if (selectedBooks.length === 66) return '전체 성경 (66권)';
    return `${selectedBooks.length}권 선택됨`;
  };

  const resetJoinModal = () => {
    setInviteCode('');
    setError('');
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-background to-muted/30">
        {/* 헤더 스켈레톤 */}
        <header className="bg-gradient-to-r from-muted/80 via-white to-slate-50/60 sticky top-0 z-10 border-b border-border/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
              <div className="space-y-1">
                <div className="h-5 w-20 bg-muted rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-16 bg-muted rounded animate-pulse" />
              <div className="h-9 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </header>
        <main className="flex-1 p-4">
          <ListSkeleton count={3} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-background to-muted/30">
      {/* 헤더 - 교회/홈 페이지 스타일 */}
      <header className="bg-gradient-to-r from-muted/80 via-white to-slate-50/60 sticky top-0 z-10 border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted0 to-blue-600 flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-800">내 그룹</h1>
              {userChurch ? (
                <Link href={`/church/${userChurch.code}`}>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-primary transition-colors">
                    <Church className="w-3 h-3" />
                    {userChurch.name}
                  </span>
                </Link>
              ) : (
                <p className="text-xs text-slate-500">{groups.length}개의 그룹</p>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <HelpButton helpContent={helpContent.group} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                resetJoinModal();
                setJoinModalOpen(true);
              }}
              className="h-9"
            >
              <LogIn className="w-4 h-4 mr-1" />
              참여
            </Button>
            <Button
              size="sm"
              onClick={() => {
                resetCreateModal();
                setCreateModalOpen(true);
              }}
              className="h-9"
            >
              <Plus className="w-4 h-4 mr-1" />
              만들기
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 pb-24">

      {/* 활성 그룹 안내 */}
      {activeGroup && groups.length > 1 && (
        <div className="bg-primary/10 text-primary text-sm px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>현재 활성 그룹: <strong>{activeGroup.name}</strong></span>
        </div>
      )}

      {/* 그룹 목록 */}
      {groups.length === 0 ? (
        <NoGroupsEmpty
          onCreate={() => {
            resetCreateModal();
            setCreateModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isActive = activeGroup?.id === group.id;
            const memberCount = memberCounts[group.id] || 1;

            return (
              <Card
                key={group.id}
                className={cn(
                  "cursor-pointer card-hover",
                  isActive ? "border-primary bg-primary/5 shadow-sm" : ""
                )}
                onClick={() => router.push(`/group/${group.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                      <CardTitle className="text-base">{group.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 가입됨 배지 */}
                      <span className="text-xs bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent px-2 py-1 rounded font-medium">
                        가입됨
                      </span>
                      {group.membership?.role === 'admin' && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                          관리자
                        </span>
                      )}
                    </div>
                  </div>
                  {group.description && (
                    <CardDescription className="line-clamp-2">
                      {group.description.replace(/<[^>]*>/g, '')}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {memberCount}명
                      </span>
                      <span>시작일: {group.start_date}</span>
                    </div>
                    <div className="flex gap-1 items-center">
                      {!isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectGroup(group);
                          }}
                        >
                          선택
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={(e) => copyInviteCode(group.invite_code, e)}
                      >
                        {copiedCode === group.invite_code ? (
                          <>
                            <Check className="w-4 h-4 mr-1 text-accent" />
                            <span className="text-accent">복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            {group.invite_code}
                          </>
                        )}
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {groups.length > 1 && (
        <p className="text-xs text-muted-foreground text-center">
          그룹을 탭하면 활성 그룹이 변경됩니다
        </p>
      )}
      </main>

      {/* 그룹 만들기 모달 */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 그룹 만들기</DialogTitle>
            <DialogDescription>
              함께 성경을 읽을 그룹을 만들어보세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 소속 교회 선택 (교회가 있는 경우만) */}
            {userChurch && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Church className="w-4 h-4" />
                  그룹 유형
                </label>
                <div className="space-y-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={!createAsChurchGroup ? 'default' : 'outline'}
                    onClick={() => setCreateAsChurchGroup(false)}
                    disabled={submitting}
                    className="w-full justify-start gap-2"
                  >
                    <span className="text-lg">👥</span>
                    <div className="text-left flex-1">
                      <div className="font-medium">일반 그룹</div>
                      <div className="text-xs opacity-80">누구나 참여할 수 있는 독립 그룹</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={createAsChurchGroup ? 'default' : 'outline'}
                    onClick={() => setCreateAsChurchGroup(true)}
                    disabled={submitting}
                    className="w-full justify-start gap-2"
                  >
                    <span className="text-lg">⛪</span>
                    <div className="text-left flex-1">
                      <div className="font-medium">{userChurch.name} 소속 그룹</div>
                      <div className="text-xs opacity-80">교회 그룹 목록에 표시됩니다</div>
                    </div>
                  </Button>
                </div>

                {/* 교회 소속 시 부서 입력 */}
                {createAsChurchGroup && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/30">
                    <label className="text-sm font-medium text-muted-foreground">소속 부서 (선택)</label>
                    <Input
                      placeholder="예: 청년부, 초등부, 성가대"
                      value={churchDepartment}
                      onChange={(e) => setChurchDepartment(e.target.value)}
                      disabled={submitting}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">그룹 이름 *</label>
              <Input
                placeholder="예: 청년부 성경통독"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">그룹 설명 (선택)</label>
              <RichEditor
                content={newGroupDesc}
                onChange={setNewGroupDesc}
                placeholder="그룹에 대한 설명을 입력하세요 (서식 지원)"
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Enter 키로 줄바꿈을 할 수 있습니다
              </p>
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
                    handleBibleRangeTypeChange('reading_jesus');
                    setCustomPlanData(null);
                  }}
                  disabled={submitting}
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
                disabled={submitting}
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

            {/* 기존 성경 범위 설정 (리딩지저스가 아닐 때만) - 호환성 유지 */}
            {planType !== 'reading_jesus' && planType !== 'custom' && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                읽을 성경 범위
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'full', label: '전체 성경' },
                  { value: 'old', label: '구약만' },
                  { value: 'new', label: '신약만' },
                  { value: 'custom', label: '직접 선택' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant={bibleRangeType === option.value ? 'default' : 'outline'}
                    onClick={() => handleBibleRangeTypeChange(option.value as BibleRangeType)}
                    disabled={submitting}
                    className="w-full"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* 선택된 범위 표시 */}
              <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                <span>{getSelectedBooksText()}</span>
                {bibleRangeType === 'custom' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBookSelector(!showBookSelector)}
                    className="h-6 px-2"
                  >
                    {showBookSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}
              </div>

              {/* 커스텀 책 선택기 */}
              {bibleRangeType === 'custom' && showBookSelector && (
                <div className="border rounded-lg p-3 space-y-3 max-h-60 overflow-y-auto">
                  {/* 구약 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-accent">구약 (39권)</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllBooks(getOldTestament().map(b => b.name))}
                        className="h-6 text-xs"
                      >
                        {getOldTestament().every(b => selectedBooks.includes(b.name)) ? '전체 해제' : '전체 선택'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {getOldTestament().map(book => (
                        <button
                          key={book.name}
                          type="button"
                          onClick={() => toggleBook(book.name)}
                          className={cn(
                            "px-2 py-1 text-xs rounded-md transition-colors",
                            selectedBooks.includes(book.name)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {book.abbr}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 신약 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-accent">신약 (27권)</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllBooks(getNewTestament().map(b => b.name))}
                        className="h-6 text-xs"
                      >
                        {getNewTestament().every(b => selectedBooks.includes(b.name)) ? '전체 해제' : '전체 선택'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {getNewTestament().map(book => (
                        <button
                          key={book.name}
                          type="button"
                          onClick={() => toggleBook(book.name)}
                          className={cn(
                            "px-2 py-1 text-xs rounded-md transition-colors",
                            selectedBooks.includes(book.name)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {book.abbr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* 리딩지저스 플랜일 때는 시작일과 일정 모드 숨김 */}
            {planType !== 'reading_jesus' && planType !== 'custom' && (
            <>
            {/* 리딩지저스 선택 시 읽기 플랜 숨김 (자동 365일) */}
            {bibleRangeType !== 'reading_jesus' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">읽기 플랜</label>
                <div className="flex gap-2">
                  {[
                    { value: '365', label: '365일' },
                    { value: '180', label: '180일' },
                    { value: '90', label: '90일' },
                    { value: 'custom', label: '직접입력' },
                  ].map((plan) => (
                    <Button
                      key={plan.value}
                      type="button"
                      size="sm"
                      variant={newGroupPlan === plan.value ? 'default' : 'outline'}
                      onClick={() => setNewGroupPlan(plan.value as '365' | '180' | '90' | 'custom')}
                      disabled={submitting}
                      className="flex-1"
                    >
                      {plan.label}
                    </Button>
                  ))}
                </div>
                {newGroupPlan === 'custom' && (
                  <div className="mt-2">
                    <Input
                      type="number"
                      placeholder="일수를 입력하세요 (1~1000)"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      disabled={submitting}
                      min="1"
                      max="1000"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">시작일</label>
              <Input
                type="date"
                value={newGroupStartDate}
                onChange={(e) => setNewGroupStartDate(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* 일정 모드 설정 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">일정 진행 방식</label>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={scheduleMode === 'calendar' ? 'default' : 'outline'}
                  onClick={() => setScheduleMode('calendar')}
                  disabled={submitting}
                  className="w-full justify-start gap-2 h-auto py-2"
                >
                  <div className="text-left">
                    <div className="font-medium">📅 캘린더 모드 (추천)</div>
                    <div className="text-xs opacity-80">리딩지저스 2026 공식 일정에 맞춰 진행</div>
                    <div className="text-xs opacity-60">1/12(월)부터 시작, 일요일 휴식</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={scheduleMode === 'day_count' ? 'default' : 'outline'}
                  onClick={() => setScheduleMode('day_count')}
                  disabled={submitting}
                  className="w-full justify-start gap-2 h-auto py-2"
                >
                  <div className="text-left">
                    <div className="font-medium">🔢 Day 순차 모드</div>
                    <div className="text-xs opacity-80">그룹 시작일부터 Day 1, 2, 3... 순서대로 진행</div>
                    <div className="text-xs opacity-60">언제든 시작 가능, 매일 연속 진행</div>
                  </div>
                </Button>
              </div>
            </div>
            </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">그룹 목표 (선택)</label>
              <Input
                placeholder="예: 1년 안에 성경 1독 완료!"
                value={newGroupGoal}
                onChange={(e) => setNewGroupGoal(e.target.value)}
                disabled={submitting}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={submitting || !newGroupName.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                '만들기'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 그룹 참여 모달 */}
      <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>그룹 참여하기</DialogTitle>
            <DialogDescription>
              초대 코드를 입력하여 그룹에 참여하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">초대 코드</label>
              <Input
                placeholder="예: ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                disabled={submitting}
                className="uppercase tracking-widest text-center text-lg font-mono"
                maxLength={8}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setJoinModalOpen(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button
              onClick={handleJoinGroup}
              disabled={submitting || !inviteCode.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  참여 중...
                </>
              ) : (
                '참여하기'
              )}
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
    </div>
  );
}
