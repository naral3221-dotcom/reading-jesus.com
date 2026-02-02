'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProfileSkeleton, StatsSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  ChevronRight,
  Church,
  LayoutGrid,
  Loader2,
  LogIn,
  LogOut,
  Settings,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { signOut } from '@/lib/supabase';  // Auth 헬퍼는 그대로 사용
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { HelpButton } from '@/components/HelpButton';
import { helpContent } from '@/data/helpContent';
import { useGroupCompat } from '@/presentation/hooks/stores/useGroupStore';
import { StreakHeader } from '@/components/church/StreakBadge';
import { calculateStreak, calculateCurrentDay } from '@/lib/streak';
import {
  migrateLocalStorageToCloud,
  needsMigration,
} from '@/lib/migrate-local-data';
import { TOTAL_READING_DAYS } from '@/presentation/hooks/queries/useDashboardStats';

import { ProfileSection } from './ProfileSection';
import { StatsSection } from './StatsSection';
import { ProgressSection } from './ProgressSection';
import { ChurchInfoSection } from './ChurchInfoSection';
import { PersonalProjectsSection } from './PersonalProjectsSection';
import { GroupSelectorSection } from './GroupSelectorSection';
import { IntegratedMenuSection } from './IntegratedMenuSection';
import { ProfileMyPage } from './ProfileMyPage';

import type {
  Church as ChurchType,
  ChurchContext,
  Group,
  MyPageStats,
  PersonalProjectWithStats,
  IntegratedStats,
  ActivityStats,
} from '@/types';
import type { User as AuthUser } from '@supabase/supabase-js';

interface UnifiedMyPageProps {
  churchContext?: ChurchContext | null;
}

export function UnifiedMyPage({ churchContext }: UnifiedMyPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { activeGroup, groups, setActiveGroup } = useGroupCompat();
  const isChurchContext = !!churchContext;

  // 로딩 상태
  const [loading, setLoading] = useState(true);

  // 사용자 정보
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<{
    nickname: string;
    avatar_url: string | null;
    church_id: string | null;
  } | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 교회 정보
  const [userChurch, setUserChurch] = useState<ChurchType | null>(null);
  const [isRegisteredMember, setIsRegisteredMember] = useState(false);

  // 통계
  const [stats, setStats] = useState<MyPageStats>({
    totalDays: TOTAL_READING_DAYS,
    completedDays: 0,
    progressPercentage: 0,
    currentStreak: 0,
    commentCount: 0,
  });

  // 통합 통계 (메인 컨텍스트용)
  const [integratedStats, setIntegratedStats] = useState<IntegratedStats | null>(null);

  // 개인 프로젝트 (메인 컨텍스트)
  const [personalProjects, setPersonalProjects] = useState<
    PersonalProjectWithStats[]
  >([]);

  // 다이얼로그 상태
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [leaveChurchDialogOpen, setLeaveChurchDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [churchDialogOpen, setChurchDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 로딩 상태
  const [leavingChurch, setLeavingChurch] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [searchingChurch, setSearchingChurch] = useState(false);
  const [registeringChurch, setRegisteringChurch] = useState(false);

  // 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChurchType[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<ChurchType | null>(null);

  // 데이터 로드
  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    try {
      // 사용자 인증 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 비로그인 처리
      if (!user) {
        if (!isChurchContext) {
          // 메인 마이페이지는 로그인 필수
          router.push('/login');
          return;
        } else {
          // 교회 컨텍스트에서도 로그인 유도
          setLoginDialogOpen(true);
          setLoading(false);
          return;
        }
      }

      setCurrentUser(user);
      setIsAnonymous(user.is_anonymous === true);

      // 프로필 조회
      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname, avatar_url, church_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
      }

      if (isChurchContext && churchContext) {
        // 교회 컨텍스트: 교회 마이페이지
        await loadChurchContextData(user, profile, churchContext);
      } else {
        // 메인 컨텍스트
        await loadMainContextData(user, profile);
      }
    } catch (error) {
      console.error('데이터 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, isChurchContext, churchContext]);

  // 교회 컨텍스트 데이터 로드
  const loadChurchContextData = async (
    user: AuthUser,
    profile: { church_id: string | null } | null,
    context: ChurchContext
  ) => {
    const supabase = getSupabaseBrowserClient();
    const { church, churchCode } = context;

    // 등록 교인 여부 확인
    const isMember = profile?.church_id === church.id;
    setIsRegisteredMember(isMember);

    // 마이그레이션 필요시 실행
    if (isMember && needsMigration(churchCode)) {
      const result = await migrateLocalStorageToCloud(
        user.id,
        church.id,
        churchCode
      );
      if (result.success && result.migratedCount > 0) {
        toast({
          title: '데이터 동기화 완료',
          description: `${result.migratedCount}개의 읽기 기록이 클라우드에 저장되었습니다.`,
        });
      }
    }

    // 통계 로드
    await loadChurchStats(user, church, churchCode, isMember);

    // 개인 프로젝트 로드 (교회 컨텍스트에서도)
    const { data: projects } = await supabase
      .from('personal_reading_projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (projects && projects.length > 0) {
      const projectsWithStats: PersonalProjectWithStats[] = await Promise.all(
        projects.map(async (project) => {
          const { data: checks } = await supabase
            .from('personal_daily_checks')
            .select('day_number')
            .eq('project_id', project.id)
            .eq('is_read', true);

          const completedDays = checks?.length || 0;
          const planDays =
            project.reading_plan_type === '365'
              ? 365
              : project.reading_plan_type === '180'
                ? 180
                : project.reading_plan_type === '90'
                  ? 90
                  : 365;

          const startDate = new Date(project.start_date);
          const today = new Date();
          const currentDay = Math.max(1, differenceInDays(today, startDate) + 1);

          return {
            ...project,
            completedDays,
            totalDays: planDays,
            progressPercentage: Math.round((completedDays / planDays) * 100),
            currentDay: Math.min(currentDay, planDays),
          };
        })
      );
      setPersonalProjects(projectsWithStats);
    }
  };

  // 교회 통계 로드
  const loadChurchStats = async (
    user: AuthUser,
    church: ChurchType,
    churchCode: string,
    isMember: boolean
  ) => {
    const supabase = getSupabaseBrowserClient();
    // 리딩지저스 플랜 일정 개수 조회
    const scheduleYear = church.schedule_year || 2026;
    const { count: scheduleCount } = await supabase
      .from('reading_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('year', scheduleYear);

    const totalDays = scheduleCount || TOTAL_READING_DAYS;

    const statsData: MyPageStats = {
      completedDays: 0,
      totalDays,
      progressPercentage: 0,
      currentStreak: 0,
      commentCount: 0,
    };

    // 읽음 체크 데이터 로드 (클라우드)
    const checkedDaysSet = new Set<number>();

    if (isMember) {
      const { data: cloudChecks } = await supabase
        .from('church_reading_checks')
        .select('day_number')
        .eq('user_id', user.id)
        .eq('church_id', church.id);

      if (cloudChecks) {
        cloudChecks.forEach((check: { day_number: number }) => {
          checkedDaysSet.add(check.day_number);
        });
      }
    }

    // 스트릭 계산
    const checkedDays = Array.from(checkedDaysSet);
    const startDate = church.schedule_start_date || '2026-01-01';
    const currentDay = calculateCurrentDay(startDate);

    statsData.completedDays = checkedDays.length;
    statsData.progressPercentage = Math.round(
      (checkedDays.length / totalDays) * 100
    );
    statsData.currentStreak = calculateStreak(checkedDays, currentDay);

    // 댓글 수 로드 (unified_meditations에서 조회 - Phase 4 마이그레이션)
    const { count } = await supabase
      .from('unified_meditations')
      .select('*', { count: 'exact', head: true })
      .eq('source_type', 'church')
      .eq('source_id', church.id)
      .eq('user_id', user.id);

    statsData.commentCount = count || 0;

    setStats(statsData);
  };

  // 메인 컨텍스트 데이터 로드
  const loadMainContextData = async (
    user: AuthUser,
    profile: { church_id: string | null; nickname?: string; avatar_url?: string | null } | null
  ) => {
    const supabase = getSupabaseBrowserClient();
    const activities: ActivityStats[] = [];
    let userChurchData: ChurchType | null = null;

    // 1. 교회 정보 및 교회 활동 통계 가져오기
    if (profile?.church_id) {
      const { data: church } = await supabase
        .from('churches')
        .select('*')
        .eq('id', profile.church_id)
        .eq('is_active', true)
        .single();

      if (church) {
        userChurchData = church;
        setUserChurch(church);

        // 교회 읽기 체크 가져오기
        const { data: churchChecks } = await supabase
          .from('church_reading_checks')
          .select('day_number')
          .eq('user_id', user.id)
          .eq('church_id', church.id);

        if (churchChecks && churchChecks.length > 0) {
          const totalDays = TOTAL_READING_DAYS; // 실제 통독 일정 기준 (271일)
          const completedDays = churchChecks.length;
          const checkedDayNumbers = churchChecks.map(c => c.day_number);

          // 스트릭 계산
          const startDate = church.schedule_start_date || '2026-01-01';
          const currentDay = calculateCurrentDay(startDate);
          const churchStreak = calculateStreak(checkedDayNumbers, currentDay);

          activities.push({
            sourceType: 'church',
            sourceId: church.id,
            sourceName: church.name,
            completedDays,
            totalDays,
            progressPercentage: Math.round((completedDays / totalDays) * 100),
            currentStreak: churchStreak,
          });
        }
      }
    }

    // 2. 그룹 멤버십 및 그룹 활동 통계 가져오기
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, start_date, reading_plan_type)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    if (memberships && memberships.length > 0) {
      for (const membership of memberships) {
        const groupData = membership.groups as unknown as {
          id: string;
          name: string;
          start_date: string;
          reading_plan_type: string;
        } | null;

        if (!groupData) continue;

        const { data: checks } = await supabase
          .from('daily_checks')
          .select('day_number')
          .eq('user_id', user.id)
          .eq('group_id', membership.group_id)
          .eq('is_read', true);

        if (checks && checks.length > 0) {
          const planDays = groupData.reading_plan_type === '365' ? 365 :
            groupData.reading_plan_type === '180' ? 180 :
            groupData.reading_plan_type === '90' ? 90 : 365;

          const completedDays = checks.length;
          const checkedDayNumbers = checks.map(c => c.day_number);

          // 그룹 스트릭 계산
          const startDate = new Date(groupData.start_date);
          const today = new Date();
          const diffTime = today.getTime() - startDate.getTime();
          const currentDay = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

          let groupStreak = 0;
          const checkedSet = new Set(checkedDayNumbers);
          for (let day = currentDay; day >= 1; day--) {
            if (checkedSet.has(day)) {
              groupStreak++;
            } else {
              break;
            }
          }

          activities.push({
            sourceType: 'group',
            sourceId: groupData.id,
            sourceName: groupData.name,
            completedDays,
            totalDays: planDays,
            progressPercentage: Math.round((completedDays / planDays) * 100),
            currentStreak: groupStreak,
          });
        }
      }
    }

    // 3. 개인 프로젝트 가져오기
    const { data: projects } = await supabase
      .from('personal_reading_projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (projects && projects.length > 0) {
      const projectsWithStats: PersonalProjectWithStats[] = await Promise.all(
        projects.map(async (project) => {
          const { data: checks } = await supabase
            .from('personal_daily_checks')
            .select('day_number')
            .eq('project_id', project.id)
            .eq('is_read', true);

          const completedDays = checks?.length || 0;
          const planDays =
            project.reading_plan_type === '365'
              ? 365
              : project.reading_plan_type === '180'
                ? 180
                : project.reading_plan_type === '90'
                  ? 90
                  : 365;

          const startDate = new Date(project.start_date);
          const today = new Date();
          const currentDay = Math.max(1, differenceInDays(today, startDate) + 1);

          // 개인 프로젝트 스트릭 계산
          let projectStreak = 0;
          if (checks && checks.length > 0) {
            const checkedSet = new Set(checks.map(c => c.day_number));
            for (let day = currentDay; day >= 1; day--) {
              if (checkedSet.has(day)) {
                projectStreak++;
              } else {
                break;
              }
            }
          }

          // 통합 통계에 추가
          if (completedDays > 0) {
            activities.push({
              sourceType: 'personal',
              sourceId: project.id,
              sourceName: project.name,
              completedDays,
              totalDays: planDays,
              progressPercentage: Math.round((completedDays / planDays) * 100),
              currentStreak: projectStreak,
            });
          }

          return {
            ...project,
            completedDays,
            totalDays: planDays,
            progressPercentage: Math.round((completedDays / planDays) * 100),
            currentDay: Math.min(currentDay, planDays),
          };
        })
      );
      setPersonalProjects(projectsWithStats);
    }

    // 4. 통합 통계 계산
    const totalCompletedDays = activities.reduce((sum, a) => sum + a.completedDays, 0);
    const maxStreak = activities.length > 0
      ? Math.max(...activities.map(a => a.currentStreak))
      : 0;

    const integrated: IntegratedStats = {
      totalCompletedDays,
      totalStreak: maxStreak,
      activities,
      hasChurchActivity: activities.some(a => a.sourceType === 'church'),
      hasGroupActivity: activities.some(a => a.sourceType === 'group'),
      hasPersonalActivity: activities.some(a => a.sourceType === 'personal'),
    };

    setIntegratedStats(integrated);

    // 기존 stats도 업데이트 (ProfileMyPage 호환용)
    // 교회 > 그룹 > 개인 우선순위로 대표 통계 선정
    const primaryActivity = activities.find(a => a.sourceType === 'church')
      || activities.find(a => a.sourceType === 'group')
      || activities.find(a => a.sourceType === 'personal');

    setStats({
      totalDays: primaryActivity?.totalDays || TOTAL_READING_DAYS,
      completedDays: totalCompletedDays,
      progressPercentage: primaryActivity?.progressPercentage || 0,
      currentStreak: maxStreak,
    });
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 로그아웃
  const handleLogout = async () => {
    await signOut();
    toast({ title: '로그아웃되었습니다' });
    if (isChurchContext && churchContext) {
      router.push(`/church/${churchContext.churchCode}`);
    } else {
      router.push('/login');
    }
  };

  // 교회 등록 (교회 컨텍스트)
  const handleRegisterMember = async () => {
    if (!currentUser || !churchContext) return;

    setRegistering(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          church_id: churchContext.church.id,
          church_joined_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setIsRegisteredMember(true);
      setUserProfile((prev) =>
        prev ? { ...prev, church_id: churchContext.church.id } : null
      );
      setRegisterDialogOpen(false);

      toast({
        variant: 'success',
        title: '교회 등록 완료',
        description: `${churchContext.church.name}에 등록 교인으로 등록되었습니다.`,
      });

      // 마이그레이션 실행
      if (needsMigration(churchContext.churchCode)) {
        const result = await migrateLocalStorageToCloud(
          currentUser.id,
          churchContext.church.id,
          churchContext.churchCode
        );
        if (result.success && result.migratedCount > 0) {
          toast({
            title: '데이터 동기화 완료',
            description: `${result.migratedCount}개의 읽기 기록이 클라우드에 저장되었습니다.`,
          });
        }
      }

      // 통계 새로고침
      await loadChurchStats(
        currentUser,
        churchContext.church,
        churchContext.churchCode,
        true
      );
    } catch (err) {
      console.error('교회 등록 에러:', err);
      toast({
        variant: 'error',
        title: '등록 실패',
        description: '교회 등록에 실패했습니다.',
      });
    } finally {
      setRegistering(false);
    }
  };

  // 교회 탈퇴
  const handleLeaveChurch = async () => {
    if (!currentUser) return;

    setLeavingChurch(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          church_id: null,
          church_joined_at: null,
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      if (isChurchContext) {
        setIsRegisteredMember(false);
        setUserProfile((prev) => (prev ? { ...prev, church_id: null } : null));
      } else {
        const churchName = userChurch?.name;
        setUserChurch(null);
        toast({
          title: '교회 탈퇴 완료',
          description: `${churchName}에서 탈퇴했습니다.`,
        });
      }

      setLeaveChurchDialogOpen(false);

      if (isChurchContext && churchContext) {
        toast({
          title: '교회 탈퇴 완료',
          description: `${churchContext.church.name}에서 탈퇴했습니다.`,
        });
      }
    } catch (err) {
      console.error('교회 탈퇴 에러:', err);
      toast({
        variant: 'error',
        title: '탈퇴 실패',
      });
    } finally {
      setLeavingChurch(false);
    }
  };

  // 교회 검색 (메인 컨텍스트)
  const handleSearchChurch = async () => {
    if (!searchQuery.trim()) {
      toast({
        variant: 'error',
        title: '검색어를 입력해주세요',
      });
      return;
    }

    setSearchingChurch(true);
    setSearchResults([]);
    const supabase = getSupabaseBrowserClient();

    try {
      const query = searchQuery.trim();
      const normalizedQuery = query.replace(/\s+/g, '');

      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .eq('is_active', true)
        .or(
          `code.ilike.%${query}%,name.ilike.%${query}%,name.ilike.%${normalizedQuery}%`
        )
        .order('name', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          variant: 'error',
          title: '검색 결과가 없습니다',
          description: '교회 이름이나 코드를 다시 확인해주세요',
        });
        return;
      }

      setSearchResults(data);
    } catch (err) {
      console.error('교회 검색 에러:', err);
      toast({
        variant: 'error',
        title: '검색 중 오류가 발생했습니다',
      });
    } finally {
      setSearchingChurch(false);
    }
  };

  // 교회 상세 보기
  const handleViewChurchDetail = (church: ChurchType) => {
    setSelectedChurch(church);
    setDetailDialogOpen(true);
  };

  // 교회 등록 (메인 컨텍스트)
  const handleRegisterChurch = async () => {
    if (!selectedChurch || !currentUser) return;

    setRegisteringChurch(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // 프로필 확인/생성
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .single();

      if (!existingProfile) {
        const userMetadata = currentUser.user_metadata || {};
        const provider = currentUser.app_metadata?.provider;

        let nickname = '';
        let avatarUrl = '';

        if (provider === 'kakao') {
          nickname = userMetadata.name || userMetadata.preferred_username || '';
          avatarUrl = userMetadata.avatar_url || userMetadata.picture || '';
        } else if (provider === 'google') {
          nickname = userMetadata.full_name || userMetadata.name || '';
          avatarUrl = userMetadata.avatar_url || userMetadata.picture || '';
        }

        if (!nickname) {
          nickname = currentUser.email?.split('@')[0] || '사용자';
        }

        await supabase.from('profiles').insert({
          id: currentUser.id,
          nickname,
          avatar_url: avatarUrl,
          email: currentUser.email,
          has_completed_onboarding: false,
        });
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          church_id: selectedChurch.id,
          church_joined_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setUserChurch(selectedChurch);
      setDetailDialogOpen(false);
      setChurchDialogOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedChurch(null);

      toast({
        variant: 'success',
        title: '교회 등록 완료',
        description: `${selectedChurch.name}에 등록 교인으로 등록되었습니다.`,
      });
    } catch (err: unknown) {
      console.error('교회 등록 에러:', err);
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류';
      toast({
        variant: 'error',
        title: '등록 실패',
        description: `교회 등록에 실패했습니다. (${errorMessage})`,
      });
    } finally {
      setRegisteringChurch(false);
    }
  };

  // 그룹 변경 핸들러
  const handleGroupChange = (group: Group) => {
    setActiveGroup(group);
    toast({
      title: '활성 그룹이 변경되었습니다',
      description: group.name,
    });
  };

  // 표시할 이름
  const displayName =
    userProfile?.nickname ||
    (isAnonymous ? '게스트' : currentUser?.email?.split('@')[0] || '사용자');

  // 로딩 화면
  if (loading) {
    return (
      <div
        className={cn(
          'flex flex-col p-4 space-y-4 max-w-2xl mx-auto w-full',
          isChurchContext && 'min-h-screen bg-background pb-20 lg:pb-4 lg:ml-20'
        )}
      >
        {isChurchContext && (
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b -mx-4 -mt-4 mb-4">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
              <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            </div>
          </header>
        )}
        <Card>
          <CardContent className="pt-6">
            <ProfileSkeleton />
          </CardContent>
        </Card>
        <StatsSkeleton />
      </div>
    );
  }

  // 비로그인 상태 (교회 컨텍스트에서만)
  if (!currentUser && isChurchContext) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-4 lg:ml-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                router.push(`/church/${churchContext?.churchCode}`)
              }
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold ml-2">마이페이지</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <LogIn className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-semibold mb-2">로그인이 필요합니다</h2>
              <p className="text-sm text-muted-foreground mb-4">
                마이페이지를 이용하려면 로그인해주세요
              </p>
              <Button onClick={() => router.push('/login')}>
                <LogIn className="w-4 h-4 mr-2" />
                로그인하기
              </Button>
            </CardContent>
          </Card>
        </main>

        {/* 로그인 안내 다이얼로그 */}
        <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>로그인</DialogTitle>
              <DialogDescription>
                로그인하시면 더 많은 기능을 이용할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setLoginDialogOpen(false)}
              >
                취소
              </Button>
              <Button onClick={() => router.push('/login')}>
                로그인하러 가기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // 묵상 수 계산 (ProfileMyPage용)
  const meditationCount = stats.commentCount || 0;

  return (
    <div
      className={cn(
        'flex flex-col min-h-screen',
        isChurchContext && 'pb-20 lg:pb-4 lg:ml-20'
      )}
    >
      {/* 인스타그램 스타일 프로필 마이페이지 */}
      <ProfileMyPage
        userId={currentUser?.id || ''}
        nickname={displayName}
        avatarUrl={userProfile?.avatar_url || null}
        isAnonymous={isAnonymous}
        stats={stats}
        meditationCount={meditationCount}
        integratedStats={integratedStats}
        churchContext={churchContext}
        isRegisteredMember={isRegisteredMember}
        onLogout={() => setLogoutDialogOpen(true)}
      >
        {/* 교회 정보 섹션 */}
        {isChurchContext && churchContext ? (
          <ChurchInfoSection
            isChurchContext={true}
            currentChurch={churchContext.church}
            isRegisteredMember={isRegisteredMember}
            isLoggedIn={!!currentUser}
            onRegisterMember={() => setRegisterDialogOpen(true)}
            onLeaveChurch={() => setLeaveChurchDialogOpen(true)}
          />
        ) : (
          <ChurchInfoSection
            userChurch={userChurch}
            onSearchChurch={() => setChurchDialogOpen(true)}
            onLeaveChurch={() => setLeaveChurchDialogOpen(true)}
            churchActivity={integratedStats?.activities.find(a => a.sourceType === 'church')}
          />
        )}

        {/* 그룹 선택 (메인 컨텍스트, 다중 그룹) */}
        {!isChurchContext && groups.length > 1 && (
          <GroupSelectorSection
            groups={groups}
            activeGroup={activeGroup}
            onGroupChange={handleGroupChange}
          />
        )}

        {/* 개인 프로젝트 */}
        <PersonalProjectsSection
          projects={personalProjects}
          churchCode={isChurchContext ? churchContext?.churchCode : undefined}
        />

        {/* 메인으로 돌아가기 (교회 컨텍스트) */}
        {isChurchContext && currentUser && (
          <Button
            variant="outline"
            className="w-full border-primary/30 text-primary"
            onClick={() => router.push('/home')}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            메인으로 돌아가기
          </Button>
        )}
      </ProfileMyPage>

      {/* ========== 다이얼로그들 ========== */}

      {/* 로그아웃 확인 */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>로그아웃</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 로그아웃 하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              로그아웃
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 교회 등록 확인 (교회 컨텍스트) */}
      <AlertDialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>등록 교인으로 등록</AlertDialogTitle>
            <AlertDialogDescription>
              {churchContext?.church.name}에 등록 교인으로 등록하시겠습니까?
              <br />
              <br />
              <span className="text-primary">
                ✓ 읽기 기록이 클라우드에 저장됩니다
              </span>
              <br />
              <span className="text-primary">
                ✓ 다른 기기에서도 기록을 확인할 수 있습니다
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={registering}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegisterMember}
              disabled={registering}
            >
              {registering && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              등록하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 교회 탈퇴 확인 */}
      <AlertDialog
        open={leaveChurchDialogOpen}
        onOpenChange={setLeaveChurchDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>교회 탈퇴</AlertDialogTitle>
            <AlertDialogDescription>
              {isChurchContext
                ? churchContext?.church.name
                : userChurch?.name}
              에서 탈퇴하시겠습니까?
              <br />
              <span className="text-accent">
                {isChurchContext
                  ? '탈퇴 후에도 읽기 기록은 로컬에 유지됩니다.'
                  : '탈퇴 후에는 QR 코드 없이 묵상을 작성할 수 없습니다.'}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leavingChurch}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveChurch}
              disabled={leavingChurch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leavingChurch && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              탈퇴하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 교회 검색 다이얼로그 (메인 컨텍스트) */}
      <Dialog
        open={churchDialogOpen}
        onOpenChange={(open) => {
          setChurchDialogOpen(open);
          if (!open) {
            setSearchQuery('');
            setSearchResults([]);
          }
        }}
      >
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>교회 등록</DialogTitle>
            <DialogDescription>
              교회 이름 또는 코드로 검색하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 flex-1 overflow-hidden flex flex-col">
            {/* 검색 입력 */}
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="교회 이름 또는 코드 입력"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchChurch();
                  }
                }}
              />
              <Button
                onClick={handleSearchChurch}
                disabled={searchingChurch || !searchQuery.trim()}
              >
                {searchingChurch ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '검색'
                )}
              </Button>
            </div>

            {/* 검색 결과 목록 */}
            {searchResults.length > 0 && (
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                <p className="text-sm text-muted-foreground">
                  검색 결과: {searchResults.length}개
                </p>
                {searchResults.map((church) => (
                  <button
                    key={church.id}
                    onClick={() => handleViewChurchDetail(church)}
                    className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Church className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{church.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-muted px-1.5 py-0.5 rounded">
                            {church.code}
                          </span>
                          {church.denomination && (
                            <span className="truncate">
                              {church.denomination}
                            </span>
                          )}
                        </div>
                        {church.address && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {church.address}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* 검색 안내 */}
            {searchResults.length === 0 && !searchingChurch && (
              <div className="text-center py-8 text-muted-foreground">
                <Church className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">교회 이름 또는 코드를 입력하고</p>
                <p className="text-sm">검색 버튼을 눌러주세요</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChurchDialogOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 교회 상세 정보 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>교회 정보 확인</DialogTitle>
            <DialogDescription>
              등록하려는 교회가 맞는지 확인해주세요
            </DialogDescription>
          </DialogHeader>

          {selectedChurch && (
            <div className="py-4 space-y-4">
              {/* 교회 기본 정보 */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Church className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedChurch.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    교회 코드: {selectedChurch.code}
                  </p>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                {selectedChurch.denomination && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-muted-foreground w-16 shrink-0">
                      교단
                    </span>
                    <span className="text-sm font-medium">
                      {selectedChurch.denomination}
                    </span>
                  </div>
                )}
                {selectedChurch.address && (
                  <div className="flex items-start gap-2">
                    <span className="text-sm text-muted-foreground w-16 shrink-0">
                      주소
                    </span>
                    <span className="text-sm font-medium">
                      {selectedChurch.address}
                    </span>
                  </div>
                )}
                {!selectedChurch.denomination && !selectedChurch.address && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    등록된 상세 정보가 없습니다
                  </p>
                )}
              </div>

              {/* 안내 문구 */}
              <div className="text-sm text-muted-foreground space-y-1 bg-accent/10 dark:bg-accent/20 rounded-lg p-3">
                <p className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  등록하시면 QR 코드 없이도 묵상을 작성할 수 있습니다
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  내 묵상은 프로필과 연결되어 관리됩니다
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
            >
              다른 교회 선택
            </Button>
            <Button onClick={handleRegisterChurch} disabled={registeringChurch}>
              {registeringChurch ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Church className="w-4 h-4 mr-2" />
              )}
              이 교회로 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
