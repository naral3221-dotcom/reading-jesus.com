'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ListSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  ArrowLeft,
  Loader2,
  Users,
  Copy,
  Check,
  Settings,
  Crown,
  UserMinus,
  LogOut,
  Trash2,
  Share2,
  Target,
  ListChecks,
  BookOpen,
  CalendarDays,
  MessageSquare,
  Megaphone,
  Info,
  Pin,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { useGroupCompat } from '@/presentation/hooks/stores/useGroupStore';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types';
import { GroupNotices } from '@/components/GroupNotices';
import { RichViewer } from '@/components/ui/rich-editor';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { BIBLE_BOOKS } from '@/data/bibleBooks';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';

// React Query Hooks
import {
  useCurrentUser,
  useGroupById,
  groupKeys,
  commentKeys,
} from '@/presentation/hooks/queries';
import { useIsGroupAdmin } from '@/presentation/hooks/queries/useGroup';
import { useQuery } from '@tanstack/react-query';
import type { UnifiedMeditationProps } from '@/domain/entities/UnifiedMeditation';

// Domain Entity GroupMember를 UI용 타입으로 변환하기 위한 인터페이스
interface MemberWithProfile {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile: Profile | null;
}

interface CommentWithProfile extends Comment {
  profile: Profile | null;
}

// Domain Entity의 BibleRangeType을 Types의 BibleRangeType으로 변환
const convertBibleRangeType = (domainType: string | undefined): 'full' | 'old' | 'new' | 'custom' | 'reading_jesus' => {
  if (!domainType) return 'full';
  const mapping: Record<string, 'full' | 'old' | 'new' | 'custom' | 'reading_jesus'> = {
    'full': 'full',
    'ot': 'old',
    'nt': 'new',
    'custom': 'custom',
  };
  return mapping[domainType] || 'full';
};


export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { refreshGroups, setActiveGroup } = useGroupCompat();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const groupId = params.id as string;

  // React Query Hooks
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  const { data: groupData, isLoading: groupLoading } = useGroupById(groupId);
  const group = groupData?.group ?? null;

  // 멤버 목록 (profile 정보 포함)
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: async (): Promise<MemberWithProfile[]> => {
      if (!groupId) return [];
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profile:profiles!group_members_user_id_fkey(
            id,
            nickname,
            avatar_url,
            has_completed_onboarding,
            created_at,
            updated_at,
            church_id,
            church_joined_at
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (error || !data) return [];
      return data.map(row => {
        // Supabase foreign key join은 단일 객체 또는 배열을 반환할 수 있음
        const profileData = Array.isArray(row.profile) ? row.profile[0] : row.profile;
        return {
          id: row.id,
          user_id: row.user_id,
          role: row.role as 'admin' | 'member',
          joined_at: row.joined_at,
          profile: profileData as Profile | null,
        };
      });
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5,
  });
  const members = membersData ?? [];

  const { isAdmin } = useIsGroupAdmin(groupId, userId);

  // 콘텐츠 타입 필터 상태
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'free' | 'qt'>('all');

  // 그룹 묵상 피드 조회 (unified_meditations에서 통합 조회)
  const { data: feedData, isLoading: commentsLoading } = useQuery({
    queryKey: [...commentKeys.all, 'groupFeed', groupId, contentTypeFilter],
    queryFn: async () => {
      if (!groupId) return [];
      const supabase = getSupabaseBrowserClient();

      // unified_meditations에서 그룹 묵상 조회
      let query = supabase
        .from('unified_meditations')
        .select('*')
        .eq('source_type', 'group')
        .eq('source_id', groupId);

      // 콘텐츠 타입 필터
      if (contentTypeFilter === 'qt') {
        query = query.eq('content_type', 'qt');
      } else if (contentTypeFilter === 'free') {
        query = query.in('content_type', ['free', 'memo']);
      }

      const { data, error } = await query
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('그룹 묵상 조회 에러:', error);
        return [];
      }

      // 프로필 조회 (별도 쿼리)
      const userIds = Array.from(new Set((data || []).map(r => r.user_id).filter(Boolean)));
      let profileMap = new Map<string, { nickname: string; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .in('id', userIds);
        profiles?.forEach(p => profileMap.set(p.id, p));
      }

      // UnifiedMeditationProps 형식으로 변환
      return (data || []).map(row => {
        const profileData = row.user_id ? profileMap.get(row.user_id) : null;
        return {
          id: row.id,
          legacyId: row.legacy_id,
          legacyTable: row.legacy_table,
          userId: row.user_id,
          guestToken: row.guest_token,
          authorName: row.author_name || profileData?.nickname || '사용자',
          sourceType: 'group' as const,
          sourceId: row.source_id,
          contentType: row.content_type as 'free' | 'qt',
          dayNumber: row.day_number,
          content: row.content,
          bibleRange: row.bible_range,
          qtDate: row.qt_date,
          mySentence: row.my_sentence,
          meditationAnswer: row.meditation_answer,
          gratitude: row.gratitude,
          myPrayer: row.my_prayer,
          dayReview: row.day_review,
          isAnonymous: row.is_anonymous,
          visibility: row.visibility || 'group',
          isPinned: row.is_pinned || false,
          likesCount: row.likes_count || 0,
          repliesCount: row.replies_count || 0,
          createdAt: new Date(row.created_at),
          updatedAt: row.updated_at ? new Date(row.updated_at) : null,
          profile: profileData ? {
            nickname: profileData.nickname,
            avatarUrl: profileData.avatar_url,
          } : null,
          isLiked: false, // 좋아요 상태는 별도 조회 필요
        };
      });
    },
    enabled: !!groupId,
    staleTime: 1000 * 30,
  });
  const comments = feedData ?? [];

  // 로딩 상태 통합
  const loading = userLoading || groupLoading || membersLoading || commentsLoading;

  // UI States
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  // 설정 모달
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [startDate, setStartDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // 확인 다이얼로그
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [removeMemberDialog, setRemoveMemberDialog] = useState<{ open: boolean; member: MemberWithProfile | null }>({
    open: false,
    member: null,
  });
  const [promoteDialog, setPromoteDialog] = useState<{ open: boolean; member: MemberWithProfile | null }>({
    open: false,
    member: null,
  });

  // 댓글 삭제 관련 상태
  const [deleteCommentDialog, setDeleteCommentDialog] = useState<{ open: boolean; commentId: string | null }>({
    open: false,
    commentId: null,
  });
  const [deletingComment, setDeletingComment] = useState(false);

  // 그룹 데이터가 로드되면 설정 모달 초기값 설정
  useMemo(() => {
    if (group) {
      setGroupName(group.name);
      setGroupDesc(group.description || '');
      setStartDate(group.startDate);
    }
  }, [group]);

  // 로그인 체크
  useMemo(() => {
    if (!userLoading && !userData?.user) {
      router.push('/login');
    }
  }, [userLoading, userData, router]);

  // 그룹이 없으면 리스트로 리다이렉트
  useMemo(() => {
    if (!groupLoading && !group && groupId) {
      router.push('/group');
    }
  }, [groupLoading, group, groupId, router]);

  const copyInviteCode = async () => {
    if (group?.inviteCode) {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopiedCode(true);
      toast({
        variant: 'success',
        title: '초대 코드가 복사되었습니다',
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const shareInviteCode = async () => {
    if (group?.inviteCode && navigator.share) {
      try {
        await navigator.share({
          title: `${group.name} 그룹 초대`,
          text: `함께 성경을 읽어요! 초대 코드: ${group.inviteCode}`,
        });
      } catch {
        // 사용자가 공유를 취소한 경우
      }
    } else {
      copyInviteCode();
    }
  };

  const handleSaveSettings = async () => {
    if (!group || !groupName.trim()) {
      setError('그룹 이름을 입력해주세요');
      return;
    }

    setSaving(true);
    setError('');
    const supabase = getSupabaseBrowserClient();

    const { error: updateError } = await supabase
      .from('groups')
      .update({
        name: groupName.trim(),
        description: groupDesc.trim() || null,
        start_date: startDate,
      })
      .eq('id', group.id);

    if (updateError) {
      setError('저장에 실패했습니다');
      setSaving(false);
      return;
    }

    // React Query 캐시 무효화
    queryClient.invalidateQueries({ queryKey: groupKeys.byId(groupId) });

    setSettingsModalOpen(false);
    setSaving(false);
    await refreshGroups();

    toast({
      variant: 'success',
      title: '그룹 설정이 저장되었습니다',
    });
  };

  const handleRemoveMember = async () => {
    const member = removeMemberDialog.member;
    if (!member || !isAdmin || member.user_id === userId) return;
    const supabase = getSupabaseBrowserClient();

    await supabase
      .from('group_members')
      .delete()
      .eq('id', member.id);

    // React Query 캐시 무효화
    queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });

    setRemoveMemberDialog({ open: false, member: null });

    toast({
      variant: 'success',
      title: `${member.profile?.nickname || '멤버'}님을 그룹에서 내보냈습니다`,
    });
  };

  const handlePromoteToAdmin = async () => {
    const member = promoteDialog.member;
    if (!member || !isAdmin) return;
    const supabase = getSupabaseBrowserClient();

    await supabase
      .from('group_members')
      .update({ role: 'admin' })
      .eq('id', member.id);

    // React Query 캐시 무효화
    queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });

    setPromoteDialog({ open: false, member: null });

    toast({
      variant: 'success',
      title: `${member.profile?.nickname || '멤버'}님을 관리자로 지정했습니다`,
    });
  };

  const handleLeaveGroup = async () => {
    if (!userId || !group) return;
    const supabase = getSupabaseBrowserClient();

    // 관리자가 나가려면 다른 관리자가 있어야 함
    if (isAdmin) {
      const otherAdmins = members.filter(m => m.role === 'admin' && m.user_id !== userId);
      if (otherAdmins.length === 0) {
        setLeaveDialogOpen(false);
        toast({
          variant: 'error',
          title: '그룹을 나갈 수 없습니다',
          description: '먼저 다른 멤버를 관리자로 지정해주세요',
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', userId);

      if (error) {
        console.error('그룹 탈퇴 에러:', error);
        toast({
          variant: 'error',
          title: '그룹 탈퇴에 실패했습니다',
          description: error.message,
        });
        setLeaveDialogOpen(false);
        return;
      }

      await refreshGroups();

      toast({
        title: '그룹에서 나갔습니다',
      });

      router.push('/group');
    } catch (err) {
      console.error('그룹 탈퇴 에러:', err);
      toast({
        variant: 'error',
        title: '그룹 탈퇴에 실패했습니다',
      });
      setLeaveDialogOpen(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin || !group) return;
    const supabase = getSupabaseBrowserClient();

    // 멤버 삭제
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', group.id);

    // 그룹 삭제
    await supabase
      .from('groups')
      .delete()
      .eq('id', group.id);

    await refreshGroups();

    toast({
      title: '그룹이 삭제되었습니다',
    });

    router.push('/group');
  };

  // 본인 묵상인지 확인
  const canDeleteComment = (meditation: UnifiedMeditationProps): boolean => {
    return meditation.userId === userId;
  };

  // 댓글 삭제
  const handleDeleteComment = async () => {
    const commentId = deleteCommentDialog.commentId;
    if (!commentId) return;

    // feedData에서 해당 항목 찾아서 legacy_id 가져오기
    const item = feedData?.find(f => f.id === commentId);
    const targetId = item?.legacyId || commentId;

    setDeletingComment(true);
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', targetId);

    if (error) {
      toast({
        variant: 'error',
        title: '삭제 실패',
        description: '묵상을 삭제하지 못했습니다.',
      });
    } else {
      // React Query 캐시 무효화
      queryClient.invalidateQueries({ queryKey: [...commentKeys.all, 'groupFeed', groupId] });
      toast({
        variant: 'success',
        title: '묵상이 삭제되었습니다',
      });
    }

    setDeletingComment(false);
    setDeleteCommentDialog({ open: false, commentId: null });
  };

  const handleActivateGroup = () => {
    if (group) {
      // Domain Entity를 Types의 Group으로 변환
      const typesGroup = {
        id: group.id,
        name: group.name,
        description: group.description,
        start_date: group.startDate,
        end_date: group.endDate,
        invite_code: group.inviteCode,
        created_by: group.createdBy,
        created_at: group.createdAt,
        reading_plan_type: group.readingPlanType as '365' | '180' | '90' | 'custom',
        goal: group.goal,
        rules: group.rules,
        is_public: group.isPublic,
        max_members: group.maxMembers,
        allow_anonymous: group.allowAnonymous,
        require_daily_reading: group.requireDailyReading,
        bible_range_type: convertBibleRangeType(group.bibleRangeType),
        bible_range_books: group.bibleRangeBooks,
        schedule_mode: group.scheduleMode,
        church_id: group.churchId,
        is_church_official: group.isChurchOfficial,
      };
      setActiveGroup(typesGroup);
      toast({
        variant: 'success',
        title: `'${group.name}' 그룹이 활성화되었습니다`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col p-4 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        </div>

        {/* Group info skeleton */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="flex gap-4">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-9 w-full bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>

        {/* Members skeleton */}
        <Card>
          <CardHeader>
            <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <ListSkeleton count={3} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!group) return null;

  // 고정된 묵상 분리
  const pinnedComments = comments.filter(c => c.isPinned);
  const regularComments = comments.filter(c => !c.isPinned);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/group">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold">{group.name}</h1>
              <p className="text-xs text-muted-foreground">
                {members.length}명의 멤버
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowGroupInfo(true)}
            >
              <Info className="w-5 h-5" />
            </Button>
            {isAdmin && (
              <Link href={`/group/${groupId}/admin`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <Settings className="w-4 h-4" />
                  관리
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleActivateGroup}
          >
            <Check className="w-4 h-4 mr-1" />
            이 그룹 활성화
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1",
              copiedCode && "bg-accent/10 border-accent/30 text-accent"
            )}
            onClick={copyInviteCode}
          >
            {copiedCode ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                초대 코드
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={shareInviteCode}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setLeaveDialogOpen(true)}
            title="그룹 탈퇴"
          >
            <UserMinus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content - Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start px-4 py-6 bg-transparent border-b rounded-none">
          <TabsTrigger value="feed" className="flex-1">
            <MessageSquare className="w-4 h-4 mr-1" />
            묵상
          </TabsTrigger>
          <TabsTrigger value="notices" className="flex-1">
            <Megaphone className="w-4 h-4 mr-1" />
            공지
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1">
            <Users className="w-4 h-4 mr-1" />
            멤버
          </TabsTrigger>
        </TabsList>

        {/* 묵상 피드 */}
        <TabsContent value="feed" className="mt-0 px-4 py-4 space-y-4">
          {/* 콘텐츠 타입 필터 */}
          <div className="flex items-center gap-2">
            <Button
              variant={contentTypeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentTypeFilter('all')}
            >
              전체
            </Button>
            <Button
              variant={contentTypeFilter === 'free' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentTypeFilter('free')}
            >
              묵상
            </Button>
            <Button
              variant={contentTypeFilter === 'qt' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContentTypeFilter('qt')}
            >
              QT
            </Button>
          </div>

          {/* 고정된 묵상 */}
          {pinnedComments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Pin className="w-4 h-4" />
                고정된 묵상
              </h3>
              {pinnedComments.map((meditation) => (
                <Card key={meditation.id} className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={meditation.profile?.avatarUrl || undefined} />
                        <AvatarFallback>
                          {meditation.isAnonymous ? '?' : (meditation.profile?.nickname || meditation.authorName)?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {meditation.isAnonymous ? '익명' : (meditation.profile?.nickname || meditation.authorName)}
                          </span>
                          {meditation.dayNumber && (
                            <span className="text-xs text-muted-foreground">
                              Day {meditation.dayNumber}
                            </span>
                          )}
                          {meditation.contentType === 'qt' && (
                            <span className="text-xs bg-accent-warm/20 text-accent-warm px-1.5 py-0.5 rounded">QT</span>
                          )}
                          <Pin className="w-3 h-3 text-primary" />
                        </div>
                        <p className="text-sm line-clamp-3 whitespace-pre-wrap">
                          {meditation.contentType === 'qt'
                            ? (meditation.mySentence || meditation.meditationAnswer || '').replace(/<[^>]*>/g, '').slice(0, 150)
                            : (meditation.content || '').replace(/<[^>]*>/g, '').slice(0, 150)}
                          {((meditation.content || meditation.mySentence || '').length > 150) && '...'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {meditation.likesCount || 0}
                            </span>
                            <span>
                              {format(new Date(meditation.createdAt), 'M/d HH:mm', { locale: ko })}
                            </span>
                          </div>
                          {canDeleteComment(meditation) && (
                            <button
                              type="button"
                              onClick={() => setDeleteCommentDialog({ open: true, commentId: meditation.id })}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 최근 묵상 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                {contentTypeFilter === 'all' ? '최근 묵상' : contentTypeFilter === 'qt' ? '최근 QT' : '최근 묵상'}
              </h3>
              <Link href="/community">
                <Button variant="ghost" size="sm" className="text-xs">
                  전체보기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {regularComments.length === 0 && pinnedComments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {contentTypeFilter === 'qt' ? '아직 QT가 없습니다' : '아직 묵상이 없습니다'}
                  </p>
                  <Link href="/community">
                    <Button className="mt-3" size="sm">
                      첫 {contentTypeFilter === 'qt' ? 'QT' : '묵상'} 작성하기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              regularComments.slice(0, 10).map((meditation) => (
                <Card key={meditation.id} className="hover:bg-muted/30 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={meditation.profile?.avatarUrl || undefined} />
                        <AvatarFallback>
                          {meditation.isAnonymous ? '?' : (meditation.profile?.nickname || meditation.authorName)?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {meditation.isAnonymous ? '익명' : (meditation.profile?.nickname || meditation.authorName)}
                          </span>
                          {meditation.dayNumber && (
                            <span className="text-xs text-muted-foreground">
                              Day {meditation.dayNumber}
                            </span>
                          )}
                          {meditation.contentType === 'qt' && (
                            <span className="text-xs bg-accent-warm/20 text-accent-warm px-1.5 py-0.5 rounded">QT</span>
                          )}
                        </div>
                        <p className="text-sm line-clamp-3 whitespace-pre-wrap">
                          {meditation.contentType === 'qt'
                            ? (meditation.mySentence || meditation.meditationAnswer || '').replace(/<[^>]*>/g, '').slice(0, 150)
                            : (meditation.content || '').replace(/<[^>]*>/g, '').slice(0, 150)}
                          {((meditation.content || meditation.mySentence || '').length > 150) && '...'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {meditation.likesCount || 0}
                            </span>
                            <span>
                              {format(new Date(meditation.createdAt), 'M/d HH:mm', { locale: ko })}
                            </span>
                          </div>
                          {canDeleteComment(meditation) && (
                            <button
                              type="button"
                              onClick={() => setDeleteCommentDialog({ open: true, commentId: meditation.id })}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* 공지사항 */}
        <TabsContent value="notices" className="mt-0 px-4 py-4 space-y-4">
          <GroupNotices groupId={groupId} groupName={group.name} isAdmin={isAdmin} />

          {/* 소그룹 모임 바로가기 */}
          <Link href={`/group/${groupId}/meetings`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CalendarDays className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">소그룹 모임</h3>
                      <p className="text-xs text-muted-foreground">
                        모임 일정 확인 및 참여
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </TabsContent>

        {/* 멤버 목록 */}
        <TabsContent value="members" className="mt-0 px-4 py-4 space-y-4">
          {/* 멤버 통계 */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-sm text-muted-foreground">총 멤버</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {members.filter(m => m.role === 'admin').length}
                  </p>
                  <p className="text-sm text-muted-foreground">관리자</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 멤버 목록 */}
          <div className="space-y-2">
            {members.map((member) => (
              <Card
                key={member.id}
                className={cn(
                  "transition-colors",
                  member.user_id === userId && "bg-primary/5 border-primary/30"
                )}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* 아바타 - 프로필 링크 */}
                      <Link href={`/profile/${member.user_id}`}>
                        <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.profile?.nickname?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          {/* 닉네임 - 프로필 링크 */}
                          <Link
                            href={`/profile/${member.user_id}`}
                            className="font-medium hover:underline"
                          >
                            {member.profile?.nickname || '알 수 없음'}
                          </Link>
                          {member.role === 'admin' && (
                            <Crown className="w-4 h-4 text-accent" />
                          )}
                          {member.user_id === userId && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              나
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(member.joined_at), 'yyyy.M.d', { locale: ko })} 가입
                        </p>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && member.user_id !== userId && (
                      <div className="flex gap-1">
                        {member.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPromoteDialog({ open: true, member })}
                            title="관리자로 지정"
                          >
                            <Crown className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setRemoveMemberDialog({ open: true, member })}
                          title="내보내기"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 그룹 나가기 버튼 */}
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setLeaveDialogOpen(true)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            그룹 나가기
          </Button>

          {isAdmin && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              그룹 삭제
            </Button>
          )}
        </TabsContent>
      </Tabs>

      {/* 그룹 정보 모달 */}
      <Dialog open={showGroupInfo} onOpenChange={setShowGroupInfo}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{group.name}</DialogTitle>
            <DialogDescription>그룹 정보</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {group.description && (
              <div>
                <h4 className="text-sm font-medium mb-2">소개</h4>
                <div className="prose prose-sm max-w-none">
                  <RichViewer content={group.description} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">시작일</p>
                <p className="font-medium">{group.startDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">멤버 수</p>
                <p className="font-medium">{members.length}명</p>
              </div>
              {group.readingPlanType && (
                <div>
                  <p className="text-sm text-muted-foreground">읽기 플랜</p>
                  <p className="font-medium">
                    {group.readingPlanType === '365' && '365일'}
                    {group.readingPlanType === '180' && '180일'}
                    {group.readingPlanType === '90' && '90일'}
                    {!['365', '180', '90'].includes(group.readingPlanType) && `${group.readingPlanType}일`}
                  </p>
                </div>
              )}
              {group.endDate && (
                <div>
                  <p className="text-sm text-muted-foreground">종료일</p>
                  <p className="font-medium">{group.endDate}</p>
                </div>
              )}
            </div>

            {/* 성경 범위 표시 */}
            <div>
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                읽을 성경 범위
              </div>
              <p className="text-sm text-muted-foreground">
                {group.bibleRangeType === 'full' && '전체 성경 (66권)'}
                {group.bibleRangeType === 'ot' && '구약 (39권)'}
                {group.bibleRangeType === 'nt' && '신약 (27권)'}
                {group.bibleRangeType === 'custom' && group.bibleRangeBooks && (
                  <>
                    {group.bibleRangeBooks.length}권 선택됨
                    <span className="block mt-1 text-xs">
                      {group.bibleRangeBooks
                        .map(name => BIBLE_BOOKS.find(b => b.name === name)?.abbr || name)
                        .join(', ')}
                    </span>
                  </>
                )}
                {!group.bibleRangeType && '전체 성경 (66권)'}
              </p>
            </div>

            {group.goal && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  목표
                </div>
                <p className="text-sm text-muted-foreground">{group.goal}</p>
              </div>
            )}

            {group.rules && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                  <ListChecks className="w-4 h-4 text-primary" />
                  규칙
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {group.rules.split('\n').filter(rule => rule.trim()).map((rule, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{rule.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 초대 코드 */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">초대 코드</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 font-mono",
                    copiedCode && "bg-accent/10 border-accent/30 text-accent"
                  )}
                  onClick={copyInviteCode}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      {group.inviteCode}
                    </>
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={shareInviteCode}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 설정 모달 */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>그룹 설정</DialogTitle>
            <DialogDescription>
              그룹 정보를 수정합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">그룹 이름</label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">그룹 설명</label>
              <Input
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="선택사항"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">시작일</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={saving}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsModalOpen(false)}
              disabled={saving}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saving || !groupName.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 그룹 나가기 확인 */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>그룹 나가기</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 &apos;{group.name}&apos; 그룹을 나가시겠습니까?
              {isAdmin && members.filter(m => m.role === 'admin').length === 1 && (
                <span className="block mt-2 text-destructive">
                  다른 관리자가 없으면 그룹을 나갈 수 없습니다.
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

      {/* 그룹 삭제 확인 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>그룹 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 &apos;{group.name}&apos; 그룹을 삭제하시겠습니까?
              <span className="block mt-2 font-medium text-destructive">
                모든 멤버가 그룹에서 제거되고 데이터가 삭제됩니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* 댓글 삭제 확인 */}
      <AlertDialog
        open={deleteCommentDialog.open}
        onOpenChange={(open) => !open && setDeleteCommentDialog({ open: false, commentId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>묵상 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 묵상을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingComment}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              disabled={deletingComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingComment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
