'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import {
  Users,
  Loader2,
  AlertCircle,
  ArrowLeft,
  MessageCircle,
  BarChart3,
  Send,
  User,
  Target,
  Crown,
  Copy,
  Heart,
  Settings,
  UserMinus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Hand,
  CalendarDays,
  MapPin,
  Video,
  Clock,
  Plus,
  Check,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ChurchLayout } from '@/components/church/ChurchLayout';
import { getTodayDateString } from '@/lib/date-utils';
import { StreakBadge, StreakHeader } from '@/components/church/StreakBadge';
import { PrayerTab } from '@/components/church/PrayerTab';
import { MeditationReplies } from '@/components/church/MeditationReplies';
import { BadgeDisplay } from '@/components/church/BadgeDisplay';
import { BadgeNotificationModal } from '@/components/church/BadgeNotificationModal';
import { EncouragementButton } from '@/components/church/EncouragementButton';
import { JoinRequestsManager } from '@/components/group/JoinRequestsManager';
import { calculateStreak } from '@/lib/streak';
import type { Group, Profile, CommentWithProfile } from '@/types';
import type { GroupMeetingWithHost, MeetingPurpose } from '@/types/meeting';
import { MEETING_PURPOSES } from '@/types/meeting';
import { format, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { QTDailyContent } from '@/types';
import { getQTByDate } from '@/lib/qt-content';
import { findReadingByDay } from '@/components/church/ReadingDayPicker';

// RichEditor 동적 로드
const RichEditor = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichEditor),
  { ssr: false, loading: () => <div className="h-[120px] border rounded-lg bg-muted/30 animate-pulse" /> }
);
const RichViewerWithEmbed = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichViewerWithEmbed),
  { ssr: false }
);

// 빈 HTML 콘텐츠 체크
function isEmptyContent(html: string): boolean {
  if (!html) return true;
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length === 0;
}

interface ChurchInfo {
  id: string;
  code: string;
  name: string;
  admin_token: string | null;
}

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile: Pick<Profile, 'nickname' | 'avatar_url'> | null;
  completed_days: number;
  total_days: number;
  streak: number; // 연속 읽기 일수
  checkedDays: number[]; // 읽은 day 목록
}

// Supabase에서 반환하는 멤버 데이터 타입
interface MemberRow {
  id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profiles: { nickname: string; avatar_url: string | null } | { nickname: string; avatar_url: string | null }[] | null;
}

interface GuestComment {
  id: string;
  guest_name: string;
  content: string;
  bible_range: string | null;
  is_anonymous: boolean;
  created_at: string;
  likes_count: number;
  linked_user_id: string | null;
}

const COMMENTS_PER_PAGE = 10;

export default function ChurchGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const churchCode = params.code as string;
  const groupId = params.groupId as string;

  // 상태
  const [church, setChurch] = useState<ChurchInfo | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isChurchAdmin, setIsChurchAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // 탭 상태
  const [activeTab, setActiveTab] = useState('meditation');

  // 묵상 관련 상태
  const [currentDay, setCurrentDay] = useState(1);
  const [comments, setComments] = useState<(CommentWithProfile | GuestComment)[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentPage, setCommentPage] = useState(1);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // 작성 타입 (묵상/QT)
  const [writeType, setWriteType] = useState<'meditation' | 'qt'>('meditation');

  // QT 관련 상태
  const [currentQtContent, setCurrentQtContent] = useState<QTDailyContent | null>(null);
  const [qtFormData, setQtFormData] = useState({
    mySentence: '',
    meditationAnswers: [] as string[],
    gratitude: '',
    myPrayer: '',
    dayReview: '',
  });
  const [qtSubmitting, setQtSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    verses: false,
    guide: false,
    question: true,
  });
  const [userProfile, setUserProfileData] = useState<Profile | null>(null);

  // 모임 관련 상태
  const [meetings, setMeetings] = useState<GroupMeetingWithHost[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [createMeetingOpen, setCreateMeetingOpen] = useState(false);
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [meetingIsOnline, setMeetingIsOnline] = useState(false);
  const [meetingOnlineLink, setMeetingOnlineLink] = useState('');
  const [meetingMaxParticipants, setMeetingMaxParticipants] = useState('20');
  const [meetingPurpose, setMeetingPurpose] = useState<MeetingPurpose | ''>('');

  // 그룹 탈퇴 관련 상태
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // 가입 신청 관련 상태
  const [joinRequestStatus, setJoinRequestStatus] = useState<'none' | 'pending' | 'rejected'>('none');
  const [joinRequestMessage, setJoinRequestMessage] = useState('');
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);

  // 현재 Day 계산
  const calculateCurrentDay = useCallback((startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(diffDays, 365));
  }, []);

  // 데이터 로드
  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    try {
      // 1. 로그인 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfileData(profile);
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

      // 4. 그룹 정보 로드
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .eq('church_id', churchData.id)
        .single();

      if (groupError || !groupData) {
        setGroup(null);
        return;
      }

      setGroup(groupData);

      // 현재 Day 설정
      const day = calculateCurrentDay(groupData.start_date);
      setCurrentDay(day);

      // 5. 멤버 목록 로드
      const { data: membersData } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles:user_id (nickname, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('role', { ascending: false })
        .order('joined_at', { ascending: true });

      // 6. 각 멤버의 진행률 계산 (배치 쿼리로 최적화)
      const totalDays = groupData.reading_plan_type === '365' ? 365 :
                       groupData.reading_plan_type === '180' ? 180 : 90;

      // 모든 멤버의 user_id 수집
      const memberUserIds = (membersData || []).map((m: { user_id: string }) => m.user_id);

      // 배치 쿼리: 그룹의 모든 읽은 날 목록 조회 (한 번에)
      const { data: allGroupChecks } = await supabase
        .from('daily_checks')
        .select('user_id, day_number')
        .eq('group_id', groupId)
        .eq('is_read', true)
        .in('user_id', memberUserIds);

      // 배치 쿼리: 교회의 모든 읽은 날 목록 조회 (한 번에)
      const { data: allChurchChecks } = await supabase
        .from('church_reading_checks')
        .select('user_id, day_number')
        .eq('church_id', churchData.id)
        .in('user_id', memberUserIds);

      // user_id별로 그룹화
      const groupChecksByUser = new Map<string, number[]>();
      const churchChecksByUser = new Map<string, number[]>();

      allGroupChecks?.forEach(check => {
        const existing = groupChecksByUser.get(check.user_id) || [];
        existing.push(check.day_number);
        groupChecksByUser.set(check.user_id, existing);
      });

      allChurchChecks?.forEach(check => {
        const existing = churchChecksByUser.get(check.user_id) || [];
        existing.push(check.day_number);
        churchChecksByUser.set(check.user_id, existing);
      });

      // 멤버별 진행률 계산 (쿼리 없이 메모리에서 처리)
      const membersWithProgress: MemberWithProfile[] = (membersData || []).map((member: MemberRow) => {
        const groupDays = groupChecksByUser.get(member.user_id) || [];
        const churchDays = churchChecksByUser.get(member.user_id) || [];
        const checkedDays = Array.from(new Set([...groupDays, ...churchDays]));

        const streak = calculateStreak(checkedDays, day);

        // profiles가 배열로 오는 경우 첫 번째 요소 사용
        const profile = Array.isArray(member.profiles)
          ? member.profiles[0]
          : member.profiles;

        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          joined_at: member.joined_at,
          profile: profile || null,
          completed_days: checkedDays.length,
          total_days: totalDays,
          streak,
          checkedDays,
        };
      });

      setMembers(membersWithProgress);

      // 7. 현재 사용자가 멤버/관리자인지 확인
      if (user) {
        const userMember = membersWithProgress.find(m => m.user_id === user.id);
        if (userMember) {
          setIsMember(true);
          if (userMember.role === 'admin') {
            setIsGroupAdmin(true);
          }
        } else {
          // 멤버가 아닌 경우, 가입 신청 상태 확인
          const { data: joinRequest } = await supabase
            .from('group_join_requests')
            .select('status')
            .eq('group_id', groupId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (joinRequest) {
            if (joinRequest.status === 'pending') {
              setJoinRequestStatus('pending');
            } else if (joinRequest.status === 'rejected') {
              setJoinRequestStatus('rejected');
            }
          }
        }
      }
    } catch (err) {
      console.error('데이터 로드 에러:', err);
    } finally {
      setLoading(false);
    }
  }, [churchCode, groupId, calculateCurrentDay]);

  // 묵상 로드
  const loadComments = useCallback(async () => {
    if (!group || !church) return;

    setCommentsLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // 1. 그룹 내 comments 로드
      const { data: groupComments } = await supabase
        .from('comments')
        .select(`
          *,
          profile:user_id (nickname, avatar_url)
        `)
        .eq('group_id', groupId)
        .eq('day_number', currentDay)
        .order('created_at', { ascending: false });

      // 2. 연동된 guest_comments 로드 (그룹 멤버들의 교회 묵상)
      const memberUserIds = members.map(m => m.user_id);

      let guestComments: GuestComment[] = [];
      if (memberUserIds.length > 0) {
        const { data: linkedComments } = await supabase
          .from('guest_comments')
          .select('*')
          .eq('church_id', church.id)
          .eq('day_number', currentDay)
          .in('linked_user_id', memberUserIds)
          .order('created_at', { ascending: false });

        guestComments = linkedComments || [];
      }

      // 3. 통합 및 정렬
      const allComments = [
        ...(groupComments || []),
        ...guestComments.map(gc => ({
          ...gc,
          isGuestComment: true,
        })),
      ].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setComments(allComments);

      // 4. 좋아요 상태 로드
      if (currentUser) {
        const commentIds = (groupComments || []).map(c => c.id);
        if (commentIds.length > 0) {
          const { data: likes } = await supabase
            .from('comment_likes')
            .select('comment_id')
            .eq('user_id', currentUser.id)
            .in('comment_id', commentIds);

          if (likes) {
            setLikedComments(new Set(likes.map(l => l.comment_id)));
          }
        }
      }
    } catch (err) {
      console.error('묵상 로드 에러:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, [group, church, groupId, currentDay, members, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (group && members.length > 0) {
      loadComments();
    }
  }, [group, members, loadComments]);

  // QT 원문 로드
  const loadQtContent = useCallback(async (dayNumber: number) => {
    const readingInfo = findReadingByDay(dayNumber);
    if (!readingInfo?.date) {
      setCurrentQtContent(null);
      return;
    }

    try {
      const qtData = await getQTByDate(readingInfo.date);
      setCurrentQtContent(qtData);

      // 묵상 질문 개수에 맞게 답변 배열 초기화
      if (qtData?.meditation?.meditationQuestions) {
        setQtFormData(prev => ({
          ...prev,
          meditationAnswers: new Array(qtData.meditation!.meditationQuestions.length).fill(''),
        }));
      }
    } catch (error) {
      console.error('QT 원문 로드 에러:', error);
      setCurrentQtContent(null);
    }
  }, []);

  // Day 변경 시 QT 원문 로드
  useEffect(() => {
    if (writeType === 'qt') {
      loadQtContent(currentDay);
    }
  }, [currentDay, writeType, loadQtContent]);

  // 묵상 작성
  const handleSubmitComment = async () => {
    if (!currentUser || !group || isEmptyContent(commentContent)) return;

    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: currentUser.id,
          group_id: groupId,
          day_number: currentDay,
          content: commentContent,
          is_anonymous: isAnonymous,
        });

      if (error) throw error;

      setCommentContent('');
      setIsAnonymous(false); // 작성 후 익명 옵션 초기화
      toast({
        variant: 'success',
        title: '묵상이 등록되었습니다',
      });
      loadComments();
    } catch (err) {
      console.error('묵상 작성 에러:', err);
      toast({
        variant: 'error',
        title: '등록에 실패했습니다',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // QT 작성
  const handleSubmitQT = async () => {
    if (!currentUser || !church || !group) return;

    const hasAnswers = qtFormData.meditationAnswers.some(a => a.trim());
    const hasContent = qtFormData.mySentence || hasAnswers ||
      qtFormData.gratitude || qtFormData.myPrayer || qtFormData.dayReview;

    if (!hasContent) {
      toast({ variant: 'error', title: '최소 하나 이상의 항목을 작성해주세요' });
      return;
    }

    setQtSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const readingInfo = findReadingByDay(currentDay);
      const qtDate = readingInfo?.date || null;

      // 묵상 답변 JSON 변환
      let meditationAnswerJson: string | null = null;
      if (hasAnswers) {
        meditationAnswerJson = JSON.stringify(qtFormData.meditationAnswers.filter(a => a.trim()));
      }

      const insertData = {
        church_id: church.id,
        author_name: isAnonymous ? '익명' : (userProfile?.nickname || '그룹원'),
        qt_date: qtDate,
        day_number: currentDay,
        my_sentence: qtFormData.mySentence.trim() || null,
        meditation_answer: meditationAnswerJson,
        gratitude: qtFormData.gratitude.trim() || null,
        my_prayer: qtFormData.myPrayer.trim() || null,
        day_review: qtFormData.dayReview.trim() || null,
        user_id: currentUser.id,
        is_anonymous: isAnonymous,
      };

      const { error } = await supabase
        .from('church_qt_posts')
        .insert(insertData);

      if (error) throw error;

      // 폼 초기화
      setQtFormData({
        mySentence: '',
        meditationAnswers: currentQtContent?.meditation?.meditationQuestions
          ? new Array(currentQtContent.meditation.meditationQuestions.length).fill('')
          : [],
        gratitude: '',
        myPrayer: '',
        dayReview: '',
      });
      setIsAnonymous(false); // 작성 후 익명 옵션 초기화

      toast({
        variant: 'success',
        title: 'QT가 등록되었습니다',
      });

      // 댓글 목록 새로고침 (교회 QT도 표시되므로)
      loadComments();
    } catch (err) {
      console.error('QT 작성 에러:', err);
      toast({
        variant: 'error',
        title: '등록에 실패했습니다',
      });
    } finally {
      setQtSubmitting(false);
    }
  };

  // 좋아요 핸들러
  const handleLike = async (commentId: string) => {
    if (!currentUser) return;

    const isLiked = likedComments.has(commentId);
    const supabase = getSupabaseBrowserClient();

    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', currentUser.id);

        setLikedComments(prev => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });
      } else {
        await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: currentUser.id });

        setLikedComments(prev => new Set(Array.from(prev).concat(commentId)));
      }

      loadComments();
    } catch (err) {
      console.error('좋아요 에러:', err);
    }
  };

  // 묵상 삭제
  const handleDeleteComment = async (commentId: string, isGuestComment: boolean) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setDeletingCommentId(commentId);
    const supabase = getSupabaseBrowserClient();
    try {
      if (isGuestComment) {
        // guest_comments 테이블에서 삭제
        const { error } = await supabase
          .from('guest_comments')
          .delete()
          .eq('id', commentId);

        if (error) throw error;
      } else {
        // comments 테이블에서 삭제
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId);

        if (error) throw error;
      }

      toast({
        variant: 'success',
        title: '묵상이 삭제되었습니다',
      });

      loadComments();
    } catch (err) {
      console.error('삭제 에러:', err);
      toast({
        variant: 'error',
        title: '삭제에 실패했습니다',
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  // 초대 링크 복사
  const handleCopyInviteLink = () => {
    if (group) {
      const inviteUrl = `${window.location.origin}/church/${churchCode}/groups/join/${group.invite_code}`;
      navigator.clipboard.writeText(inviteUrl);
      toast({
        variant: 'success',
        title: '초대 링크가 복사되었습니다',
        description: '링크를 공유하여 그룹원을 초대하세요',
      });
    }
  };

  // 그룹 탈퇴
  const handleLeaveGroup = async () => {
    if (!currentUser || !group) return;

    setLeaving(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // 관리자인 경우 다른 관리자가 있는지 확인
      if (isGroupAdmin) {
        const { count: adminCount } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id)
          .eq('role', 'admin');

        if ((adminCount || 0) <= 1) {
          toast({
            variant: 'error',
            title: '탈퇴할 수 없습니다',
            description: '다른 멤버를 관리자로 지정한 후 탈퇴해주세요.',
          });
          setLeaving(false);
          setLeaveDialogOpen(false);
          return;
        }
      }

      // 멤버십 삭제
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', group.id)
        .eq('user_id', currentUser.id);

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

      toast({
        variant: 'success',
        title: '그룹에서 탈퇴했습니다',
      });

      // 그룹 목록으로 이동
      router.push(`/church/${churchCode}/groups`);
    } catch (err) {
      console.error('그룹 탈퇴 에러:', err);
      toast({
        variant: 'error',
        title: '그룹 탈퇴에 실패했습니다',
      });
      setLeaveDialogOpen(false);
    } finally {
      setLeaving(false);
    }
  };

  // 그룹 가입 신청 (승인제) 또는 바로 가입 (공개)
  const handleJoinRequest = async () => {
    if (!currentUser || !group) return;

    setJoiningGroup(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // 승인제가 아닌 경우 바로 가입
      if (group.join_type !== 'approval') {
        const { error } = await supabase
          .from('group_members')
          .insert({
            group_id: group.id,
            user_id: currentUser.id,
            role: 'member',
          });

        if (error) throw error;

        setIsMember(true);
        setJoinDialogOpen(false);

        toast({
          variant: 'success',
          title: '그룹에 가입되었습니다',
        });

        // 페이지 새로고침으로 멤버 데이터 반영
        loadData();
        return;
      }

      // 승인제인 경우 가입 신청
      // 이미 신청했는지 확인
      const { data: existingRequest } = await supabase
        .from('group_join_requests')
        .select('id, status')
        .eq('group_id', group.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast({
            variant: 'error',
            title: '이미 가입 신청 중입니다',
          });
          setJoiningGroup(false);
          return;
        }
        // rejected 상태면 기존 요청 삭제 후 재신청
        if (existingRequest.status === 'rejected') {
          await supabase
            .from('group_join_requests')
            .delete()
            .eq('id', existingRequest.id);
        }
      }

      // 가입 신청 생성
      const { error } = await supabase
        .from('group_join_requests')
        .insert({
          group_id: group.id,
          user_id: currentUser.id,
          message: joinRequestMessage.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      setJoinRequestStatus('pending');
      setJoinDialogOpen(false);
      setJoinRequestMessage('');

      toast({
        variant: 'success',
        title: '가입 신청이 완료되었습니다',
        description: '관리자 승인 후 그룹에 참여할 수 있습니다.',
      });
    } catch (err) {
      console.error('가입 신청 에러:', err);
      toast({
        variant: 'error',
        title: '가입 신청에 실패했습니다',
      });
    } finally {
      setJoiningGroup(false);
    }
  };

  // 모임 목록 로드
  const loadMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase
        .from('group_meetings')
        .select('*')
        .eq('group_id', groupId)
        .order('meeting_date', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          setMeetings([]);
          return;
        }
        throw error;
      }

      if (data) {
        const meetingsWithDetails = await Promise.all(
          data.map(async (meeting) => {
            let hostProfile = { nickname: '알 수 없음', avatar_url: null };
            const { data: profile } = await supabase
              .from('profiles')
              .select('nickname, avatar_url')
              .eq('id', meeting.host_id)
              .maybeSingle();
            if (profile) hostProfile = profile;

            let count = 0;
            const result = await supabase
              .from('meeting_participants')
              .select('*', { count: 'exact', head: true })
              .eq('meeting_id', meeting.id)
              .neq('status', 'cancelled');
            count = result.count || 0;

            let myParticipation = null;
            if (currentUser) {
              const { data: participation } = await supabase
                .from('meeting_participants')
                .select('*')
                .eq('meeting_id', meeting.id)
                .eq('user_id', currentUser.id)
                .maybeSingle();
              myParticipation = participation;
            }

            return {
              ...meeting,
              host: hostProfile,
              participant_count: count,
              is_participant: !!myParticipation && myParticipation.status !== 'cancelled',
              my_participation: myParticipation,
            };
          })
        );
        setMeetings(meetingsWithDetails);
      }
    } catch (err) {
      console.error('모임 로드 에러:', err);
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  }, [groupId, currentUser]);

  // 모임 생성
  const handleCreateMeeting = async () => {
    if (!currentUser || !meetingTitle.trim()) {
      toast({ variant: 'error', title: '제목을 입력해주세요' });
      return;
    }
    if (!meetingDate) {
      toast({ variant: 'error', title: '날짜를 선택해주세요' });
      return;
    }

    const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
    if (meetingDateTime <= new Date()) {
      toast({ variant: 'error', title: '과거 날짜/시간은 선택할 수 없습니다' });
      return;
    }

    if (meetingIsOnline && !meetingOnlineLink.trim()) {
      toast({ variant: 'error', title: '온라인 링크를 입력해주세요' });
      return;
    }
    if (!meetingIsOnline && !meetingLocation.trim()) {
      toast({ variant: 'error', title: '장소를 입력해주세요' });
      return;
    }

    setMeetingSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase.from('group_meetings').insert({
        group_id: groupId,
        host_id: currentUser.id,
        title: meetingTitle.trim(),
        description: meetingDescription.trim() || null,
        meeting_date: meetingDateTime.toISOString(),
        location: !meetingIsOnline ? meetingLocation.trim() : null,
        is_online: meetingIsOnline,
        online_link: meetingIsOnline ? meetingOnlineLink.trim() : null,
        max_participants: parseInt(meetingMaxParticipants),
        purpose: meetingPurpose || null,
        status: 'upcoming',
      });

      if (error) throw error;

      toast({ variant: 'success', title: '모임이 생성되었습니다' });
      resetMeetingForm();
      setCreateMeetingOpen(false);
      loadMeetings();
    } catch (err) {
      console.error('모임 생성 에러:', err);
      toast({ variant: 'error', title: '모임 생성에 실패했습니다' });
    } finally {
      setMeetingSubmitting(false);
    }
  };

  // 모임 참여
  const handleJoinMeeting = async (meetingId: string) => {
    if (!currentUser) return;

    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    if ((meeting.participant_count ?? 0) >= meeting.max_participants) {
      toast({ variant: 'error', title: '최대 참가 인원에 도달했습니다' });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase.from('meeting_participants').insert({
        meeting_id: meetingId,
        user_id: currentUser.id,
        status: 'confirmed',
      });

      if (error) throw error;

      toast({ variant: 'success', title: '모임에 참여했습니다' });
      loadMeetings();
    } catch (err) {
      console.error('모임 참여 에러:', err);
      toast({ variant: 'error', title: '참여에 실패했습니다' });
    }
  };

  // 모임 참여 취소
  const handleCancelMeeting = async (participationId: string) => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('meeting_participants')
        .delete()
        .eq('id', participationId);

      if (error) throw error;

      toast({ variant: 'success', title: '참여가 취소되었습니다' });
      loadMeetings();
    } catch (err) {
      console.error('모임 취소 에러:', err);
      toast({ variant: 'error', title: '취소에 실패했습니다' });
    }
  };

  // 모임 폼 초기화
  const resetMeetingForm = () => {
    setMeetingTitle('');
    setMeetingDescription('');
    setMeetingDate('');
    setMeetingTime('14:00');
    setMeetingLocation('');
    setMeetingIsOnline(false);
    setMeetingOnlineLink('');
    setMeetingMaxParticipants('20');
    setMeetingPurpose('');
  };

  // 목적 정보 가져오기
  const getPurposeInfo = (purposeValue: MeetingPurpose | null) => {
    if (!purposeValue) return null;
    return MEETING_PURPOSES.find(p => p.value === purposeValue);
  };

  // 모임 탭 선택시 로드
  useEffect(() => {
    if (activeTab === 'meeting' && meetings.length === 0) {
      loadMeetings();
    }
  }, [activeTab, loadMeetings, meetings.length]);

  // Day 이동
  const handlePrevDay = () => {
    if (currentDay > 1) {
      setCurrentDay(currentDay - 1);
      setCommentPage(1);
    }
  };

  const handleNextDay = () => {
    const maxDay = group?.reading_plan_type === '365' ? 365 :
                   group?.reading_plan_type === '180' ? 180 : 90;
    if (currentDay < maxDay) {
      setCurrentDay(currentDay + 1);
      setCommentPage(1);
    }
  };

  // 페이지네이션
  const totalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);
  const paginatedComments = comments.slice(
    (commentPage - 1) * COMMENTS_PER_PAGE,
    commentPage * COMMENTS_PER_PAGE
  );

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 교회/그룹을 찾을 수 없음
  if (!church || !group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">그룹을 찾을 수 없습니다</h1>
        <p className="text-muted-foreground text-center">
          유효하지 않은 그룹이거나 삭제되었습니다.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/church/${churchCode}/groups`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          목록으로
        </Button>
      </div>
    );
  }

  // 그룹 전체 진행률
  const totalDays = group.reading_plan_type === '365' ? 365 :
                   group.reading_plan_type === '180' ? 180 : 90;
  const totalCompleted = members.reduce((sum, m) => sum + m.completed_days, 0);
  const totalExpected = members.length * totalDays;
  const groupProgress = totalExpected > 0
    ? Math.round((totalCompleted / totalExpected) * 100)
    : 0;

  return (
    <ChurchLayout churchCode={churchCode} churchId={church?.id}>
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-4">
      {/* 헤더 */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/church/${churchCode}/groups`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg">{group.name}</h1>
                {group.is_church_official && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    공식
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {members.length}명 · {group.reading_plan_type}일 플랜
              </p>
            </div>

            {/* 그룹 탈퇴 버튼 (멤버만) */}
            {isMember && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeaveDialogOpen(true)}
                title="그룹 탈퇴"
              >
                <UserMinus className="w-5 h-5 text-muted-foreground hover:text-destructive" />
              </Button>
            )}

            {/* 관리 버튼 */}
            {(isChurchAdmin || isGroupAdmin) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/church/${churchCode}/groups/${groupId}/admin`)}
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* 현재 사용자 스트릭 표시 */}
          {currentUser && (() => {
            const myMember = members.find(m => m.user_id === currentUser.id);
            return myMember && myMember.streak > 0 ? (
              <div className="mt-3">
                <StreakHeader streak={myMember.streak} />
              </div>
            ) : null;
          })()}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 비회원인 경우: is_private이면 가입 안내, 아니면 콘텐츠 표시 */}
        {!isMember && group.is_private !== false ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">그룹 멤버 전용</h2>
              <p className="text-muted-foreground mb-6">
                그룹 내용을 보려면 먼저 가입해야 합니다.
              </p>

              {/* 그룹 정보 미리보기 */}
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-2">{group.name}</h3>
                {group.description && (
                  <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {members.length}명
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {group.reading_plan_type}일 플랜
                  </span>
                </div>
              </div>

              {/* 로그인 여부에 따른 버튼 */}
              {!currentUser ? (
                <Button
                  onClick={() => router.push(`/login?redirect=/church/${churchCode}/groups/${groupId}`)}
                  className="gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  로그인 후 가입 신청
                </Button>
              ) : joinRequestStatus === 'pending' ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg">
                    <Clock className="w-4 h-4" />
                    가입 신청 대기 중
                  </div>
                  <p className="text-sm text-muted-foreground">
                    관리자 승인을 기다리고 있습니다.
                  </p>
                </div>
              ) : joinRequestStatus === 'rejected' ? (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg">
                    <X className="w-4 h-4" />
                    가입 신청이 거절되었습니다
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    다시 신청하시려면 아래 버튼을 눌러주세요.
                  </p>
                  <Button onClick={() => setJoinDialogOpen(true)} className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    다시 가입 신청
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setJoinDialogOpen(true)} className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  {group.join_type === 'approval' ? '가입 신청하기' : '그룹 가입하기'}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : !isMember && group.is_private === false ? (
          /* 비공개가 아닌 경우: 콘텐츠 보여주되 상단에 가입 유도 배너 표시 */
          <div className="space-y-4">
            {/* 가입 유도 배너 */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">그룹에 가입하면 글을 작성할 수 있습니다</p>
                      <p className="text-xs text-muted-foreground">
                        {group.join_type === 'approval' ? '관리자 승인 필요' : '바로 가입 가능'}
                      </p>
                    </div>
                  </div>
                  {currentUser ? (
                    joinRequestStatus === 'pending' ? (
                      <span className="text-xs bg-muted text-foreground px-2 py-1 rounded">
                        승인 대기중
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => setJoinDialogOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        {group.join_type === 'approval' ? '가입 신청' : '가입하기'}
                      </Button>
                    )
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => router.push(`/login?redirect=/church/${churchCode}/groups/${groupId}`)}
                    >
                      <LogIn className="w-4 h-4 mr-1" />
                      로그인
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 읽기 전용 탭 콘텐츠 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="meditation" className="gap-1 text-xs sm:text-sm">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">묵상</span>
                </TabsTrigger>
                <TabsTrigger value="meeting" className="gap-1 text-xs sm:text-sm">
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:inline">모임</span>
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-1 text-xs sm:text-sm">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">멤버</span>
                </TabsTrigger>
                <TabsTrigger value="progress" className="gap-1 text-xs sm:text-sm">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">진행</span>
                </TabsTrigger>
                <TabsTrigger value="prayer" className="gap-1 text-xs sm:text-sm">
                  <Hand className="w-4 h-4" />
                  <span className="hidden sm:inline">기도</span>
                </TabsTrigger>
              </TabsList>

              {/* 묵상 탭 - 읽기 전용 */}
              <TabsContent value="meditation" className="space-y-4">
                {/* Day 선택 */}
                <Card>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePrevDay}
                        disabled={currentDay <= 1}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span className="font-semibold">Day {currentDay}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          / {totalDays}일
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextDay}
                        disabled={currentDay >= totalDays}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 묵상 목록 (읽기 전용) */}
                {commentsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : comments.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>아직 묵상이 없습니다</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => {
                      const isCommentWithProfile = 'profile' in comment;
                      const authorName = isCommentWithProfile
                        ? comment.profile?.nickname
                        : ('author_name' in comment ? (comment as { author_name?: string }).author_name : null);
                      return (
                        <Card key={comment.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={isCommentWithProfile ? comment.profile?.avatar_url || undefined : undefined} />
                                <AvatarFallback>
                                  {authorName?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {comment.is_anonymous ? '익명' : (authorName || '알 수 없음')}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                                  </span>
                                </div>
                                <div
                                  className="text-sm prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: comment.content }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* 다른 탭들도 읽기 전용으로 표시 */}
              <TabsContent value="meeting">
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>모임 정보를 보려면 그룹에 가입하세요</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members">
                <Card>
                  <CardContent className="py-4">
                    <p className="text-center text-sm text-muted-foreground mb-4">
                      {members.length}명의 멤버가 함께하고 있습니다
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {members.slice(0, 10).map((member) => (
                        <Avatar key={member.user_id} className="w-8 h-8">
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.profile?.nickname?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {members.length > 10 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">
                          +{members.length - 10}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress">
                <Card>
                  <CardContent className="py-4">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-primary">{groupProgress}%</div>
                      <p className="text-sm text-muted-foreground">그룹 전체 진행률</p>
                    </div>
                    <Progress value={groupProgress} className="h-2" />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prayer">
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Hand className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>기도제목을 보려면 그룹에 가입하세요</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
        /* 회원인 경우 기존 탭 콘텐츠 표시 */
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="meditation" className="gap-1 text-xs sm:text-sm">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">묵상</span>
            </TabsTrigger>
            <TabsTrigger value="meeting" className="gap-1 text-xs sm:text-sm">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">모임</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-1 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">멤버</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1 text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">진행</span>
            </TabsTrigger>
            <TabsTrigger value="prayer" className="gap-1 text-xs sm:text-sm">
              <Hand className="w-4 h-4" />
              <span className="hidden sm:inline">기도</span>
            </TabsTrigger>
          </TabsList>

          {/* 묵상 탭 */}
          <TabsContent value="meditation" className="space-y-4">
            {/* Day 선택 */}
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevDay}
                    disabled={currentDay <= 1}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="font-semibold">Day {currentDay}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      / {totalDays}일
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextDay}
                    disabled={currentDay >= totalDays}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 묵상/QT 작성 폼 (멤버만) */}
            {isMember && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {writeType === 'meditation' ? (
                        <MessageCircle className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-primary" />
                      )}
                      {writeType === 'meditation' ? '묵상 나눔 작성' : 'QT 작성'}
                    </CardTitle>
                    {/* 작성 타입 토글 */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setWriteType('meditation')}
                        className={cn(
                          "px-3 py-1 text-xs rounded-md transition-colors",
                          writeType === 'meditation'
                            ? "bg-background shadow-sm font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        묵상
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWriteType('qt');
                          loadQtContent(currentDay);
                        }}
                        className={cn(
                          "px-3 py-1 text-xs rounded-md transition-colors",
                          writeType === 'qt'
                            ? "bg-background shadow-sm font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        QT
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {writeType === 'meditation' ? (
                    // 기존 묵상 작성 폼
                    <>
                      <RichEditor
                        content={commentContent}
                        onChange={setCommentContent}
                        placeholder="오늘의 말씀 묵상을 나눠주세요..."
                        minHeight="100px"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-muted-foreground">익명으로 작성</span>
                        </label>
                        <Button
                          onClick={handleSubmitComment}
                          disabled={submitting || isEmptyContent(commentContent)}
                        >
                          {submitting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          나눔 등록
                        </Button>
                      </div>
                    </>
                  ) : (
                    // QT 작성 폼
                    <div className="space-y-4">
                      {/* QT 원문 표시 */}
                      {currentQtContent ? (
                        <div className="space-y-3">
                          {/* 본문 영역 */}
                          <div className="border rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedSections(prev => ({ ...prev, verses: !prev.verses }))}
                              className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <span className="text-sm font-medium flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                본문: {currentQtContent.bibleRange}
                              </span>
                              {expandedSections.verses ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                            {expandedSections.verses && (
                              <div className="p-3 space-y-1 max-h-60 overflow-y-auto text-sm">
                                {currentQtContent.verses.map((verse) => (
                                  <p key={verse.verse} className="leading-relaxed">
                                    <span className="text-primary font-medium mr-1">{verse.verse}</span>
                                    {verse.content}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 묵상 가이드 */}
                          {currentQtContent.meditation?.meditationGuide && (
                            <div className="border rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setExpandedSections(prev => ({ ...prev, guide: !prev.guide }))}
                                className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <span className="text-sm font-medium">묵상 가이드</span>
                                {expandedSections.guide ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                              {expandedSections.guide && (
                                <div className="p-3 text-sm text-muted-foreground whitespace-pre-wrap">
                                  {currentQtContent.meditation.meditationGuide}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 묵상 질문 */}
                          {currentQtContent.meditation?.meditationQuestions && currentQtContent.meditation.meditationQuestions.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setExpandedSections(prev => ({ ...prev, question: !prev.question }))}
                                className="w-full flex items-center justify-between p-3 bg-primary/5 hover:bg-primary/10 transition-colors"
                              >
                                <span className="text-sm font-medium text-primary">묵상 질문</span>
                                {expandedSections.question ? (
                                  <ChevronUp className="w-4 h-4 text-primary" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-primary" />
                                )}
                              </button>
                              {expandedSections.question && (
                                <div className="p-3 space-y-4">
                                  {currentQtContent.meditation.meditationQuestions.map((q, idx) => (
                                    <div key={idx} className="space-y-2">
                                      <p className="text-sm font-medium">{idx + 1}. {q}</p>
                                      <Textarea
                                        placeholder="답변을 작성해주세요..."
                                        value={qtFormData.meditationAnswers[idx] || ''}
                                        onChange={(e) => {
                                          const newAnswers = [...qtFormData.meditationAnswers];
                                          newAnswers[idx] = e.target.value;
                                          setQtFormData(prev => ({ ...prev, meditationAnswers: newAnswers }));
                                        }}
                                        rows={2}
                                        className="resize-none"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                          QT 원문을 불러오는 중...
                        </div>
                      )}

                      {/* QT 작성 필드 */}
                      <div className="space-y-3 pt-2 border-t">
                        {/* 내 말로 한 문장 */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-primary">
                            내 말로 한 문장
                          </label>
                          <Input
                            placeholder="오늘 말씀을 한 문장으로 정리해보세요"
                            value={qtFormData.mySentence}
                            onChange={(e) => setQtFormData(prev => ({ ...prev, mySentence: e.target.value }))}
                          />
                        </div>

                        {/* 감사 */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-accent">
                            감사
                          </label>
                          <Textarea
                            placeholder="오늘 감사한 것을 적어보세요"
                            value={qtFormData.gratitude}
                            onChange={(e) => setQtFormData(prev => ({ ...prev, gratitude: e.target.value }))}
                            rows={2}
                            className="resize-none"
                          />
                        </div>

                        {/* 기도 */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-accent">
                            기도
                          </label>
                          <Textarea
                            placeholder="오늘의 기도를 적어보세요"
                            value={qtFormData.myPrayer}
                            onChange={(e) => setQtFormData(prev => ({ ...prev, myPrayer: e.target.value }))}
                            rows={2}
                            className="resize-none"
                          />
                        </div>

                        {/* 하루 점검 */}
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-accent">
                            하루 점검
                          </label>
                          <Textarea
                            placeholder="오늘 하루를 돌아보며..."
                            value={qtFormData.dayReview}
                            onChange={(e) => setQtFormData(prev => ({ ...prev, dayReview: e.target.value }))}
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-muted-foreground">익명으로 작성</span>
                        </label>
                        <Button
                          onClick={handleSubmitQT}
                          disabled={qtSubmitting}
                        >
                          {qtSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          QT 등록
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 묵상 목록 */}
            {commentsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : comments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    아직 작성된 묵상이 없습니다
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {paginatedComments.map((comment) => {
                  const isGuestComment = 'guest_name' in comment;
                  const authorName = isGuestComment
                    ? (comment as GuestComment).is_anonymous ? '익명' : (comment as GuestComment).guest_name
                    : (comment as CommentWithProfile).profile?.nickname || '알 수 없음';

                  // 삭제 권한 확인: 본인 글이거나 관리자
                  const canDelete = currentUser && (
                    // 일반 댓글: 본인 글
                    (!isGuestComment && (comment as CommentWithProfile).user_id === currentUser.id) ||
                    // 게스트 댓글: linked_user_id가 본인
                    (isGuestComment && (comment as GuestComment).linked_user_id === currentUser.id) ||
                    // 교회 관리자 또는 그룹 관리자
                    isChurchAdmin || isGroupAdmin
                  );

                  return (
                    <Card key={comment.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{authorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {isGuestComment && (
                                <span className="ml-1 text-primary">(교회 묵상)</span>
                              )}
                            </p>
                          </div>
                          {/* 삭제 버튼 */}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteComment(comment.id, isGuestComment)}
                              disabled={deletingCommentId === comment.id}
                            >
                              {deletingCommentId === comment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>

                        {comment.content.startsWith('<') ? (
                          <RichViewerWithEmbed content={comment.content} className="text-sm" />
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        )}

                        {!isGuestComment && (
                          <>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                              <button
                                type="button"
                                onClick={() => handleLike(comment.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                                  likedComments.has(comment.id)
                                    ? 'bg-red-50 text-red-500'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                <Heart
                                  className={`w-4 h-4 ${
                                    likedComments.has(comment.id) ? 'fill-current' : ''
                                  }`}
                                />
                                <span>{(comment as CommentWithProfile).likes_count || 0}</span>
                              </button>
                            </div>

                            {/* 댓글 (리플) */}
                            <MeditationReplies
                              commentId={comment.id}
                              repliesCount={(comment as CommentWithProfile).replies_count || 0}
                              currentUserId={currentUser?.id || null}
                            />
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCommentPage(p => p - 1)}
                      disabled={commentPage <= 1}
                    >
                      이전
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {commentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCommentPage(p => p + 1)}
                      disabled={commentPage >= totalPages}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* 모임 탭 */}
          <TabsContent value="meeting" className="space-y-4">
            {/* 모임 만들기 버튼 (관리자 또는 멤버) */}
            {isMember && (
              <div className="flex justify-end">
                <Button onClick={() => setCreateMeetingOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  모임 만들기
                </Button>
              </div>
            )}

            {/* 모임 목록 */}
            {meetingsLoading ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">모임을 불러오는 중...</p>
                </CardContent>
              </Card>
            ) : meetings.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">아직 예정된 모임이 없습니다</p>
                  {isMember && (
                    <p className="text-sm text-muted-foreground mt-1">
                      첫 모임을 만들어보세요!
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting) => {
                  const meetDate = new Date(meeting.meeting_date);
                  const isPastMeeting = isPast(meetDate);
                  const isFull = (meeting.participant_count ?? 0) >= meeting.max_participants;

                  return (
                    <Card key={meeting.id} className={cn(
                      "hover:shadow-md transition-shadow",
                      isPastMeeting && "opacity-60"
                    )}>
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {meeting.purpose && getPurposeInfo(meeting.purpose) && (
                                <span className="text-lg">
                                  {getPurposeInfo(meeting.purpose)?.emoji}
                                </span>
                              )}
                              <h3 className="font-semibold">{meeting.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              by {meeting.host.nickname}
                              {meeting.purpose && getPurposeInfo(meeting.purpose) && (
                                <span className="ml-2">• {getPurposeInfo(meeting.purpose)?.label}</span>
                              )}
                            </p>
                          </div>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            meeting.status === 'upcoming' && "bg-accent/10 text-accent",
                            meeting.status === 'completed' && "bg-gray-100 text-gray-700",
                            meeting.status === 'cancelled' && "bg-red-100 text-red-700"
                          )}>
                            {meeting.status === 'upcoming' && '예정'}
                            {meeting.status === 'completed' && '완료'}
                            {meeting.status === 'cancelled' && '취소'}
                          </span>
                        </div>

                        {meeting.description && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {meeting.description}
                          </p>
                        )}

                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {format(meetDate, 'yyyy년 M월 d일 (E) HH:mm', { locale: ko })}
                          </div>
                          {meeting.is_online ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Video className="w-4 h-4" />
                              온라인 모임
                            </div>
                          ) : meeting.location && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {meeting.location}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {meeting.participant_count} / {meeting.max_participants}명 참여
                          </div>
                        </div>

                        {/* 참여 버튼 */}
                        {!isPastMeeting && meeting.status === 'upcoming' && currentUser && (
                          <div className="pt-2">
                            {meeting.is_participant ? (
                              <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" disabled>
                                  <Check className="w-4 h-4 mr-2" />
                                  참여 신청됨
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => meeting.my_participation && handleCancelMeeting(meeting.my_participation.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                className="w-full"
                                onClick={() => handleJoinMeeting(meeting.id)}
                                disabled={isFull || meeting.host_id === currentUser.id}
                              >
                                {isFull ? '인원 마감' : meeting.host_id === currentUser.id ? '내가 만든 모임' : '참여 신청'}
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* 멤버 탭 */}
          <TabsContent value="members" className="space-y-4">
            {/* 가입 신청 관리 (관리자만 표시) */}
            {(isGroupAdmin || isChurchAdmin) && group.join_type === 'approval' && (
              <JoinRequestsManager groupId={groupId} />
            )}

            {/* 초대 링크 */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm text-muted-foreground">초대 링크</p>
                    <p className="text-sm text-primary truncate">
                      {typeof window !== 'undefined'
                        ? `${window.location.origin}/church/${churchCode}/groups/join/${group.invite_code}`
                        : `그룹 초대 링크`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyInviteLink}>
                    <Copy className="w-4 h-4 mr-1" />
                    복사
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 멤버 목록 */}
            <div className="space-y-2">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {member.profile?.avatar_url ? (
                            <Image
                              src={member.profile.avatar_url}
                              alt=""
                              fill
                              className="rounded-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {member.profile?.nickname || '알 수 없음'}
                            </span>
                            {member.role === 'admin' && (
                              <Crown className="w-4 h-4 text-accent" />
                            )}
                            {/* 스트릭 표시 */}
                            <StreakBadge streak={member.streak} size="sm" />
                            {/* 배지 표시 */}
                            <BadgeDisplay
                              userId={member.user_id}
                              groupId={groupId}
                              maxDisplay={3}
                              size="sm"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {member.completed_days} / {member.total_days}일 완료
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* 격려 버튼 (자기 자신 제외) */}
                        {currentUser && currentUser.id !== member.user_id && (
                          <EncouragementButton
                            groupId={groupId}
                            receiverId={member.user_id}
                            receiverName={member.profile?.nickname || '멤버'}
                            currentUserId={currentUser.id}
                            variant="icon"
                            size="sm"
                          />
                        )}
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {Math.round((member.completed_days / member.total_days) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <Progress
                      value={(member.completed_days / member.total_days) * 100}
                      className="h-1.5 mt-2"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 진행현황 탭 */}
          <TabsContent value="progress" className="space-y-4">
            {/* 전체 통계 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  그룹 진행 현황
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{members.length}</p>
                    <p className="text-xs text-muted-foreground">멤버</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">Day {currentDay}</p>
                    <p className="text-xs text-muted-foreground">현재 진행</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{groupProgress}%</p>
                    <p className="text-xs text-muted-foreground">전체 진행률</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>전체 진행률</span>
                    <span>{groupProgress}%</span>
                  </div>
                  <Progress value={groupProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* 멤버별 진행률 순위 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  멤버별 진행률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members
                    .sort((a, b) => b.completed_days - a.completed_days)
                    .map((member, index) => {
                      const percentage = Math.round((member.completed_days / member.total_days) * 100);
                      return (
                        <div key={member.id} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-muted text-foreground' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-accent/10 text-accent' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {member.profile?.nickname || '알 수 없음'}
                                </span>
                                <StreakBadge streak={member.streak} size="sm" />
                              </div>
                              <span className="text-sm text-primary font-semibold">
                                {percentage}%
                              </span>
                            </div>
                            <Progress value={percentage} className="h-1.5" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 기도 탭 */}
          <TabsContent value="prayer">
            <PrayerTab
              groupId={groupId}
              currentUserId={currentUser?.id || null}
              isMember={isMember}
            />
          </TabsContent>
        </Tabs>
        )}
      </main>

      {/* 모임 생성 다이얼로그 */}
      <Dialog open={createMeetingOpen} onOpenChange={setCreateMeetingOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 모임 만들기</DialogTitle>
            <DialogDescription>
              그룹원들과 함께할 모임을 만들어보세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목 *</label>
              <Input
                placeholder="예: 이번 주 토요일 묵상 모임"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                disabled={meetingSubmitting}
              />
            </div>

            {/* 모임 목적 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                모임 목적 (선택)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MEETING_PURPOSES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setMeetingPurpose(meetingPurpose === p.value ? '' : p.value)}
                    disabled={meetingSubmitting}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border transition-colors",
                      meetingPurpose === p.value
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <span className="text-xl mb-1">{p.emoji}</span>
                    <span className="text-xs">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">설명 (선택)</label>
              <Textarea
                placeholder="모임에 대한 설명을 입력하세요"
                value={meetingDescription}
                onChange={(e) => setMeetingDescription(e.target.value)}
                disabled={meetingSubmitting}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">날짜 *</label>
                <Input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  disabled={meetingSubmitting}
                  min={getTodayDateString()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">시간 *</label>
                <Input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  disabled={meetingSubmitting}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="online"
                checked={meetingIsOnline}
                onCheckedChange={(checked) => setMeetingIsOnline(checked as boolean)}
                disabled={meetingSubmitting}
              />
              <label htmlFor="online" className="text-sm cursor-pointer">
                온라인 모임
              </label>
            </div>

            {meetingIsOnline ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">온라인 링크 *</label>
                <Input
                  placeholder="Zoom, Google Meet 링크 등"
                  value={meetingOnlineLink}
                  onChange={(e) => setMeetingOnlineLink(e.target.value)}
                  disabled={meetingSubmitting}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">장소 *</label>
                <Input
                  placeholder="예: 교회 소그룹실"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                  disabled={meetingSubmitting}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">최대 인원</label>
              <Input
                type="number"
                value={meetingMaxParticipants}
                onChange={(e) => setMeetingMaxParticipants(e.target.value)}
                disabled={meetingSubmitting}
                min="2"
                max="100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateMeetingOpen(false)} disabled={meetingSubmitting}>
              취소
            </Button>
            <Button onClick={handleCreateMeeting} disabled={meetingSubmitting}>
              {meetingSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              모임 만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 그룹 탈퇴 확인 다이얼로그 */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>그룹 탈퇴</DialogTitle>
            <DialogDescription>
              정말 &quot;{group.name}&quot; 그룹에서 탈퇴하시겠습니까?
              {isGroupAdmin && (
                <span className="block mt-2 text-accent">
                  관리자 권한을 가지고 있습니다. 탈퇴하려면 다른 멤버에게 관리자 권한을 먼저 위임해주세요.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeaveDialogOpen(false)}
              disabled={leaving}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleLeaveGroup}
              disabled={leaving}
            >
              {leaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserMinus className="w-4 h-4 mr-2" />
              )}
              탈퇴하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 가입 신청 다이얼로그 */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {group.join_type === 'approval' ? '그룹 가입 신청' : '그룹 가입'}
            </DialogTitle>
            <DialogDescription>
              &quot;{group.name}&quot; 그룹에 {group.join_type === 'approval' ? '가입을 신청합니다. 관리자 승인 후 그룹에 참여할 수 있습니다.' : '가입합니다.'}
            </DialogDescription>
          </DialogHeader>
          {group.join_type === 'approval' && (
            <div className="py-4">
              <label className="text-sm font-medium">가입 인사 (선택)</label>
              <Textarea
                placeholder="간단한 자기소개나 가입 인사를 적어주세요"
                value={joinRequestMessage}
                onChange={(e) => setJoinRequestMessage(e.target.value)}
                rows={3}
                className="mt-2"
                disabled={joiningGroup}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setJoinDialogOpen(false)}
              disabled={joiningGroup}
            >
              취소
            </Button>
            <Button onClick={handleJoinRequest} disabled={joiningGroup}>
              {joiningGroup ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              {group.join_type === 'approval' ? '가입 신청' : '가입하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 배지 획득 알림 모달 */}
      <BadgeNotificationModal userId={currentUser?.id || null} />
      {/* 하단 네비게이션은 ChurchLayout에서 처리 */}
    </div>
    </ChurchLayout>
  );
}
