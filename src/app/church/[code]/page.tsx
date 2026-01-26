'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import {
  Church,
  BookOpen,
  Send,
  Loader2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  AlertCircle,
  Calendar,
  UserPlus,
  UserCheck,
  LogIn,
  Heart,
  FileEdit,
  Trash2,
  Reply,
  ChevronDown,
  ChevronUp,
  Settings,
  MapPin,
  User,
  ExternalLink,
} from 'lucide-react';
import { formatRelativeTime, getInitials, getAvatarColor, getTodayDateString } from '@/lib/date-utils';
import { checkCommentRateLimit, checkLikeRateLimit } from '@/lib/rate-limit';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { Profile } from '@/types';
import { ChurchLayout } from '@/components/church/ChurchLayout';
import { QTContentRenderer } from '@/components/church/QTContentRenderer';
import { EditPostDialog, EditPostData } from '@/components/church/EditPostDialog';
import { FeedItem } from '@/components/church/FeedCard';
import { QTCardSlider } from '@/components/church/QTCardSlider';
import { ShortsViewer } from '@/components/church/ShortsViewer';
import { Pencil } from 'lucide-react';
import { findDayByDate, findReadingByDay } from '@/components/church/ReadingDayPicker';
import NoticeBanner from '@/components/church/NoticeBanner';

// RichEditor는 클라이언트에서만 로드 (SSR 비활성화)
const RichEditor = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichEditor),
  { ssr: false, loading: () => <div className="h-[150px] border rounded-lg bg-muted/30 animate-pulse" /> }
);
const RichViewerWithEmbed = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichViewerWithEmbed),
  { ssr: false }
);

// 빈 HTML 콘텐츠 체크 (서버/클라이언트 모두 호환)
function isEmptyContent(html: string): boolean {
  if (!html) return true;
  // HTML 태그 제거 후 빈 문자열인지 확인
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length === 0;
}

const COMMENTS_PER_PAGE = 5;

interface ChurchInfo {
  id: string;
  code: string;
  name: string;
  denomination: string | null;
  address: string | null;
  pastor_name: string | null;
  write_token: string | null;
  is_active: boolean;
  allow_anonymous: boolean;
  token_expires_at: string | null;
  schedule_year: number | null;
  schedule_start_date: string | null;
}

interface ReadingSchedule {
  day?: number;
  date: string;
  reading: string;
  memory_verse: string | null;
  is_supplement_week: boolean;
}

interface GuestComment {
  id: string;
  guest_name: string;
  content: string;
  day_number: number | null;
  bible_range: string | null;
  is_anonymous: boolean;
  created_at: string;
  likes_count: number;
  replies_count: number;
  linked_user_id: string | null;
  device_id: string | null;
  source?: 'guest_comment' | 'qt_post'; // 출처 구분
  // QT 원본 필드 (source === 'qt_post'인 경우)
  mySentence?: string | null;
  meditationAnswer?: string | null;
  meditationQuestion?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
  qtDate?: string | null; // QT 날짜
}

interface ChurchQTPost {
  id: string;
  author_name: string;
  qt_date: string;
  my_sentence: string | null;
  meditation_answer: string | null;
  gratitude: string | null;
  my_prayer: string | null;
  day_review: string | null;
  is_anonymous: boolean;
  likes_count: number;
  replies_count?: number; // 선택적 - 마이그레이션 안 된 경우 대비
  created_at: string;
  user_id: string | null;
}

interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string | null;
  guest_name: string | null;
  device_id: string | null;
  content: string;
  is_anonymous: boolean;
  created_at: string;
}

// 기기 ID 생성/조회
function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let deviceId = localStorage.getItem('guest_device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('guest_device_id', deviceId);
  }
  return deviceId;
}

// 마지막 작성자 이름 저장/조회
function getLastGuestName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('guest_name') || '';
}

function setLastGuestName(name: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('guest_name', name);
  }
}

export default function ChurchPublicPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const churchCode = params.code as string;
  const tokenFromUrl = searchParams.get('token');
  const dateFromUrl = searchParams.get('date'); // QR 코드에서 전달된 날짜

  // 상태
  const [church, setChurch] = useState<ChurchInfo | null>(null);
  const [comments, setComments] = useState<GuestComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 폼 상태
  const [guestName, setGuestName] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // 일정 상태
  const [schedules, setSchedules] = useState<ReadingSchedule[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<ReadingSchedule | null>(null);

  // 토큰 유효성
  const [hasWriteAccess, setHasWriteAccess] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  // 로그인 사용자 & 교회 등록 상태
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isRegisteredMember, setIsRegisteredMember] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [registering, setRegistering] = useState(false);

  // 무한 스크롤 상태
  const [displayCount, setDisplayCount] = useState(COMMENTS_PER_PAGE);
  const commentsObserverRef = useRef<IntersectionObserver | null>(null);
  const commentsLoadMoreRef = useRef<HTMLDivElement | null>(null);

  // 좋아요 상태
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [likeAnimating, setLikeAnimating] = useState<string | null>(null);

  // 삭제 관련 상태
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [deleteCommentSource, setDeleteCommentSource] = useState<'guest_comment' | 'qt_post'>('guest_comment');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 수정 관련 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);

  // 답글 관련 상태
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyingToSource, setReplyingToSource] = useState<'guest_comment' | 'qt_post'>('guest_comment');
  const [replyContent, setReplyContent] = useState('');
  const [replyGuestName, setReplyGuestName] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [repliesMap, setRepliesMap] = useState<Record<string, CommentReply[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Shorts 상태
  interface ShortItem {
    id: string;
    videoId: string;
    title: string | null;
    thumbnailUrl: string | null;
  }
  const [shorts, setShorts] = useState<ShortItem[]>([]);
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());

  // 오늘의 QT 나눔 (슬라이더용) - 오늘 작성된 QT 별도 로드
  const [todayQtPosts, setTodayQtPosts] = useState<GuestComment[]>([]);

  // 답글 삭제 관련 상태
  const [deleteReplyId, setDeleteReplyId] = useState<string | null>(null);
  const [deleteReplyCommentId, setDeleteReplyCommentId] = useState<string | null>(null);
  const [deleteReplySource, setDeleteReplySource] = useState<'guest_comment' | 'qt_post'>('guest_comment');
  const [deleteReplyConfirmOpen, setDeleteReplyConfirmOpen] = useState(false);
  const [deletingReply, setDeletingReply] = useState(false);

  // 교회 정보 다이얼로그 상태
  const [churchInfoDialogOpen, setChurchInfoDialogOpen] = useState(false);

  // 교회 정보 로드
  const loadChurch = useCallback(async () => {
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
      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .eq('code', churchCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setChurch(null);
        return;
      }

      setChurch(data);

      // 해당 교회의 일정 로드
      const scheduleYear = data.schedule_year || 2026;
      const { data: scheduleData } = await supabase
        .from('reading_schedules')
        .select('date, reading, memory_verse, is_supplement_week')
        .eq('year', scheduleYear)
        .order('date', { ascending: true });

      if (scheduleData) {
        setSchedules(scheduleData);

        // URL에 date 파라미터가 있으면 해당 날짜로 이동 (QR 코드 스캔 시)
        if (dateFromUrl) {
          const targetSchedule = scheduleData.find(s => s.date === dateFromUrl);
          if (targetSchedule) {
            setCurrentSchedule(targetSchedule);
            setSelectedDate(dateFromUrl);
            // return 제거 - 토큰 검증 로직이 실행되도록 함
          } else {
            // URL 날짜가 일정에 없으면 오늘 날짜로 fallback
            const today = getTodayDateString();
            const todaySchedule = scheduleData.find(s => s.date === today);
            if (todaySchedule) {
              setCurrentSchedule(todaySchedule);
              setSelectedDate(today);
            } else if (scheduleData.length > 0) {
              setCurrentSchedule(scheduleData[0]);
              setSelectedDate(scheduleData[0].date);
            }
          }
        } else {
          // URL에 날짜가 없으면 오늘 날짜의 일정 찾기
          const today = getTodayDateString();
          const todaySchedule = scheduleData.find(s => s.date === today);
          if (todaySchedule) {
            setCurrentSchedule(todaySchedule);
            setSelectedDate(today);
          } else if (scheduleData.length > 0) {
            // 오늘 일정이 없으면 가장 최근 일정 찾기
            const pastSchedules = scheduleData.filter(s => s.date <= today);
            if (pastSchedules.length > 0) {
              const latestSchedule = pastSchedules[pastSchedules.length - 1];
              setCurrentSchedule(latestSchedule);
              setSelectedDate(latestSchedule.date);
            } else {
              // 미래 일정만 있는 경우 첫번째 일정
              setCurrentSchedule(scheduleData[0]);
              setSelectedDate(scheduleData[0].date);
            }
          }
        }
      }

      // 3. 접근 권한 확인
      let canWrite = false;

      // 방법 A: 토큰 기반 (기존) - 대소문자 무시 비교
      const dbToken = data.write_token?.toLowerCase().trim();
      const urlToken = tokenFromUrl?.toLowerCase().trim();

      if (dbToken && urlToken && dbToken === urlToken) {
        // 토큰 만료 확인
        if (data.token_expires_at) {
          const expiresAt = new Date(data.token_expires_at);
          if (expiresAt > new Date()) {
            canWrite = true;
            // 토큰 유효 시 sessionStorage에 저장 (페이지 이동 시에도 유지)
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(`church_token_${data.code}`, urlToken);
              sessionStorage.setItem(`church_token_expires_${data.code}`, data.token_expires_at);
            }
          }
        } else {
          canWrite = true;
          // 만료일 없는 경우도 저장
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`church_token_${data.code}`, urlToken);
            sessionStorage.removeItem(`church_token_expires_${data.code}`);
          }
        }
      }

      // 방법 B: 등록 교인 확인 (신규)
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('church_id')
          .eq('id', user.id)
          .single();

        if (profile?.church_id === data.id) {
          canWrite = true;
          setIsRegisteredMember(true);
        }
      }

      setHasWriteAccess(canWrite);
    } catch (err) {
      console.error('교회 정보 로드 에러:', err);
    }
  }, [churchCode, tokenFromUrl, dateFromUrl]);

  // Shorts 로드
  const loadShorts = useCallback(async (churchId: string) => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase
        .from('church_shorts')
        .select('id, video_id, title, thumbnail_url')
        .eq('church_id', churchId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const shortsData: ShortItem[] = (data || []).map((s: { id: string; video_id: string; title: string | null; thumbnail_url: string | null }) => ({
        id: s.id,
        videoId: s.video_id,
        title: s.title,
        thumbnailUrl: s.thumbnail_url,
      }));

      setShorts(shortsData);
    } catch (err) {
      console.error('Shorts 로드 에러:', err);
    }
  }, []);

  // 오늘 날짜의 QT 나눔 로드 (슬라이더용) - qt_date가 오늘인 모든 QT
  const loadTodayQtPosts = useCallback(async () => {
    if (!church) return;

    const supabase = getSupabaseBrowserClient();
    const today = getTodayDateString();

    try {
      // qt_date(QT 콘텐츠 날짜)가 오늘인 모든 QT 나눔 조회
      const { data: qtData, error: qtError } = await supabase
        .from('church_qt_posts')
        .select('id, author_name, qt_date, my_sentence, meditation_answer, gratitude, my_prayer, day_review, is_anonymous, likes_count, created_at, user_id')
        .eq('church_id', church.id)
        .eq('qt_date', today)
        .order('created_at', { ascending: false });

      if (qtError) throw qtError;

      // QT 게시글을 GuestComment 형식으로 변환
      const qtComments: GuestComment[] = (qtData || []).map((qt: ChurchQTPost) => ({
        id: qt.id,
        guest_name: qt.author_name,
        content: '',
        day_number: null,
        bible_range: null,
        is_anonymous: qt.is_anonymous || false,
        created_at: qt.created_at,
        likes_count: qt.likes_count || 0,
        replies_count: 0,
        linked_user_id: qt.user_id,
        device_id: null,
        source: 'qt_post' as const,
        mySentence: qt.my_sentence,
        meditationAnswer: qt.meditation_answer,
        gratitude: qt.gratitude,
        myPrayer: qt.my_prayer,
        dayReview: qt.day_review,
        qtDate: qt.qt_date,
      }));

      setTodayQtPosts(qtComments);
    } catch (err) {
      console.error('오늘의 QT 나눔 로드 에러:', err);
    }
  }, [church]);

  // 게시글 로드 (날짜 기준) - guest_comments + church_qt_posts 병합
  const loadComments = useCallback(async () => {
    if (!church || !selectedDate) return;

    const supabase = getSupabaseBrowserClient();

    // 현재 요청의 날짜를 캡처하여 race condition 방지
    const requestDate = selectedDate;

    setCommentsLoading(true);
    setCommentsError(false);

    try {
      // 선택된 날짜의 day_number 찾기 (reading_plan.json 기준)
      const currentDayNumber = findDayByDate(selectedDate);

      // 1. guest_comments 로드 (기존 묵상 글) - 선택된 날짜의 day_number에 해당하는 것만
      // replies_count는 아직 마이그레이션 안 된 경우를 대비해 제외
      let guestQuery = supabase
        .from('guest_comments')
        .select('id, guest_name, content, day_number, bible_range, is_anonymous, created_at, likes_count, linked_user_id, device_id')
        .eq('church_id', church.id)
        .order('created_at', { ascending: false });

      // day_number가 있으면 해당 일차로 필터링, 없으면 bible_range로 필터링 (fallback)
      if (currentDayNumber) {
        guestQuery = guestQuery.eq('day_number', currentDayNumber);
      } else if (currentSchedule?.reading) {
        guestQuery = guestQuery.eq('bible_range', currentSchedule.reading);
      }

      const { data: guestData, error: guestError } = await guestQuery;

      if (guestError) throw guestError;

      // guest_comments에 source 추가
      const guestComments: GuestComment[] = (guestData || []).map(c => ({
        ...c,
        replies_count: 0, // 기본값 (나중에 별도 쿼리로 가져올 수 있음)
        source: 'guest_comment' as const,
      }));

      // 2. church_qt_posts 로드 (QT 나눔 글) - 선택된 날짜의 QT만
      // replies_count는 아직 마이그레이션 안 된 경우를 대비해 제외
      const { data: qtData, error: qtError } = await supabase
        .from('church_qt_posts')
        .select('id, author_name, qt_date, my_sentence, meditation_answer, gratitude, my_prayer, day_review, is_anonymous, likes_count, created_at, user_id')
        .eq('church_id', church.id)
        .eq('qt_date', selectedDate) // 선택된 날짜의 QT만
        .order('created_at', { ascending: false });

      if (qtError) throw qtError;

      // QT 게시글을 GuestComment 형식으로 변환 (원본 필드 유지)
      const qtComments: GuestComment[] = (qtData || []).map((qt: ChurchQTPost) => {
        return {
          id: qt.id,
          guest_name: qt.author_name,
          content: '', // QT는 원본 필드로 렌더링
          day_number: null,
          bible_range: currentSchedule?.reading || null,
          is_anonymous: qt.is_anonymous || false,
          created_at: qt.created_at,
          likes_count: qt.likes_count || 0,
          replies_count: 0, // 기본값 (나중에 별도 쿼리로 가져올 수 있음)
          linked_user_id: qt.user_id,
          device_id: null,
          source: 'qt_post' as const,
          // QT 원본 필드
          mySentence: qt.my_sentence,
          meditationAnswer: qt.meditation_answer,
          gratitude: qt.gratitude,
          myPrayer: qt.my_prayer,
          dayReview: qt.day_review,
          qtDate: qt.qt_date, // QT 날짜 포함
        };
      });

      // 3. 두 목록 합치고 시간순 정렬
      const allComments = [...guestComments, ...qtComments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Race condition 체크: 요청 시점의 날짜와 현재 날짜가 다르면 결과 무시
      if (requestDate !== selectedDate) {
        return; // 오래된 요청의 결과는 무시
      }

      setComments(allComments);

      // 좋아요 상태 로드 (로그인 유저 또는 device_id 기준)
      if (allComments.length > 0) {
        const guestCommentIds = allComments.filter(c => c.source === 'guest_comment').map(c => c.id);
        const qtPostIds = allComments.filter(c => c.source === 'qt_post').map(c => c.id);

        const likedSet = new Set<string>();

        // guest_comments 좋아요 상태
        if (guestCommentIds.length > 0) {
          if (currentUser) {
            const { data: likes } = await supabase
              .from('guest_comment_likes')
              .select('comment_id')
              .eq('user_id', currentUser.id)
              .in('comment_id', guestCommentIds);
            likes?.forEach(l => likedSet.add(l.comment_id));
          } else if (deviceId) {
            const { data: likes } = await supabase
              .from('guest_comment_likes')
              .select('comment_id')
              .eq('device_id', deviceId)
              .in('comment_id', guestCommentIds);
            likes?.forEach(l => likedSet.add(l.comment_id));
          }
        }

        // QT 게시글 좋아요 상태
        if (qtPostIds.length > 0) {
          if (currentUser) {
            const { data: likes } = await supabase
              .from('church_qt_post_likes')
              .select('post_id')
              .eq('user_id', currentUser.id)
              .in('post_id', qtPostIds);
            likes?.forEach(l => likedSet.add(l.post_id));
          } else if (deviceId) {
            const { data: likes } = await supabase
              .from('church_qt_post_likes')
              .select('post_id')
              .eq('device_id', deviceId)
              .in('post_id', qtPostIds);
            likes?.forEach(l => likedSet.add(l.post_id));
          }
        }

        setLikedComments(likedSet);
      }
    } catch (err) {
      console.error('게시글 로드 에러:', err);
      setCommentsError(true);
    } finally {
      setCommentsLoading(false);
    }
  }, [church, selectedDate, currentSchedule, currentUser, deviceId]);

  // 초기 로드
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setDeviceId(getDeviceId());
      setGuestName(getLastGuestName());
      await loadChurch();
      setLoading(false);
    };
    init();
  }, [loadChurch]);

  // 교회 정보 로드 후 게시글 및 Shorts 로드
  useEffect(() => {
    if (church) {
      loadComments();
      loadShorts(church.id);
      loadTodayQtPosts(); // 오늘의 QT 나눔 로드
    }
  }, [church, loadComments, loadShorts, loadTodayQtPosts]);

  // 게시글 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!church || !hasWriteAccess) {
      toast({
        variant: 'error',
        title: 'QR 코드를 통해 접근해주세요',
      });
      return;
    }

    // Rate Limiting 체크
    const rateLimitResult = checkCommentRateLimit(deviceId);
    if (!rateLimitResult.allowed) {
      toast({
        variant: 'error',
        title: rateLimitResult.message || '너무 빠르게 작성하고 있습니다',
      });
      return;
    }

    // 등록 교인이 아닌 경우에만 이름 검증
    const authorName = isRegisteredMember && userProfile ? userProfile.nickname : guestName.trim();

    if (!authorName) {
      toast({
        variant: 'error',
        title: '이름을 입력해주세요',
      });
      return;
    }

    if (isEmptyContent(content)) {
      toast({
        variant: 'error',
        title: '내용을 입력해주세요',
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setSubmitting(true);

    try {
      const bibleRange = currentSchedule?.reading || null;
      // reading_plan.json에서 날짜로 day_number 찾기
      const dayNumber = selectedDate ? findDayByDate(selectedDate) : null;

      // 등록 교인의 경우 linked_user_id 추가
      const insertData: {
        church_id: string;
        guest_name: string;
        device_id: string;
        content: string;
        bible_range: string | null;
        day_number: number | null;
        is_anonymous: boolean;
        linked_user_id?: string;
        linked_at?: string;
      } = {
        church_id: church.id,
        guest_name: authorName,
        device_id: deviceId,
        content: content,
        bible_range: bibleRange,
        day_number: dayNumber,
        is_anonymous: isAnonymous,
      };

      // 등록 교인인 경우 연결 정보 추가
      if (isRegisteredMember && currentUser) {
        insertData.linked_user_id = currentUser.id;
        insertData.linked_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('guest_comments')
        .insert(insertData);

      if (error) throw error;

      // 비등록 사용자만 이름 저장
      if (!isRegisteredMember) {
        setLastGuestName(guestName.trim());
      }

      // 폼 초기화
      setContent('');

      toast({
        variant: 'success',
        title: '묵상이 등록되었습니다',
      });

      // 새로고침
      loadComments();
      loadTodayQtPosts(); // 오늘의 QT 나눔 슬라이더도 새로고침
    } catch (err) {
      console.error('게시글 작성 에러:', err);
      toast({
        variant: 'error',
        title: '등록에 실패했습니다',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 날짜 이동
  const handlePrevDate = () => {
    const currentIndex = schedules.findIndex(s => s.date === selectedDate);
    if (currentIndex > 0) {
      const prevSchedule = schedules[currentIndex - 1];
      setSelectedDate(prevSchedule.date);
      setCurrentSchedule(prevSchedule);
      setDisplayCount(COMMENTS_PER_PAGE); // 표시 개수 초기화
    }
  };

  const handleNextDate = () => {
    const currentIndex = schedules.findIndex(s => s.date === selectedDate);
    if (currentIndex < schedules.length - 1) {
      const nextSchedule = schedules[currentIndex + 1];
      setSelectedDate(nextSchedule.date);
      setCurrentSchedule(nextSchedule);
      setDisplayCount(COMMENTS_PER_PAGE); // 표시 개수 초기화
    }
  };

  // 좋아요 핸들러 (source에 따라 다른 테이블 사용)
  const handleLike = async (commentId: string) => {
    // Rate Limiting 체크
    const rateLimitResult = checkLikeRateLimit(deviceId);
    if (!rateLimitResult.allowed) {
      return; // 조용히 무시 (좋아요는 토스트 안 띄움)
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const supabase = getSupabaseBrowserClient();

    const isQTPost = comment.source === 'qt_post';
    const likeTable = isQTPost ? 'church_qt_post_likes' : 'guest_comment_likes';
    const idColumn = isQTPost ? 'post_id' : 'comment_id';

    const isLiked = likedComments.has(commentId);

    // 애니메이션 효과
    if (!isLiked) {
      setLikeAnimating(commentId);
      setTimeout(() => setLikeAnimating(null), 300);
    }

    try {
      if (isLiked) {
        // 좋아요 취소
        if (currentUser) {
          await supabase
            .from(likeTable)
            .delete()
            .eq(idColumn, commentId)
            .eq('user_id', currentUser.id);
        } else if (deviceId) {
          await supabase
            .from(likeTable)
            .delete()
            .eq(idColumn, commentId)
            .eq('device_id', deviceId);
        }

        setLikedComments(prev => {
          const next = new Set(prev);
          next.delete(commentId);
          return next;
        });

        // 로컬 상태 업데이트
        setComments(prev =>
          prev.map(c =>
            c.id === commentId ? { ...c, likes_count: Math.max(0, c.likes_count - 1) } : c
          )
        );
      } else {
        // 좋아요 추가
        if (currentUser) {
          await supabase
            .from(likeTable)
            .insert({ [idColumn]: commentId, user_id: currentUser.id });
        } else if (deviceId) {
          await supabase
            .from(likeTable)
            .insert({ [idColumn]: commentId, device_id: deviceId });
        }

        setLikedComments(prev => new Set(Array.from(prev).concat(commentId)));

        // 로컬 상태 업데이트
        setComments(prev =>
          prev.map(c =>
            c.id === commentId ? { ...c, likes_count: c.likes_count + 1 } : c
          )
        );
      }
    } catch (err) {
      console.error('좋아요 처리 에러:', err);
    }
  };

  // 댓글 무한 스크롤 계산 (QT는 슬라이더에서 표시하므로 피드에서 제외)
  const feedComments = comments.filter(c => c.source !== 'qt_post');
  const displayedComments = feedComments.slice(0, displayCount);
  const hasMoreComments = displayCount < feedComments.length;

  // 무한 스크롤 - 더 보기 핸들러
  const loadMoreComments = useCallback(() => {
    if (hasMoreComments) {
      setDisplayCount(prev => prev + COMMENTS_PER_PAGE);
    }
  }, [hasMoreComments]);

  // 무한 스크롤 Observer
  useEffect(() => {
    if (commentsObserverRef.current) {
      commentsObserverRef.current.disconnect();
    }

    commentsObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreComments && !commentsLoading) {
          loadMoreComments();
        }
      },
      { threshold: 0.1 }
    );

    if (commentsLoadMoreRef.current) {
      commentsObserverRef.current.observe(commentsLoadMoreRef.current);
    }

    return () => {
      if (commentsObserverRef.current) {
        commentsObserverRef.current.disconnect();
      }
    };
  }, [hasMoreComments, commentsLoading, loadMoreComments]);

  // 본인 작성 글 확인 함수
  const canDeleteComment = (comment: GuestComment): boolean => {
    // 로그인 사용자인 경우: linked_user_id로 확인
    if (currentUser && comment.linked_user_id === currentUser.id) {
      return true;
    }
    // 비로그인 사용자인 경우: device_id로 확인
    if (!currentUser && deviceId && comment.device_id === deviceId) {
      return true;
    }
    return false;
  };

  // 본인 작성 답글 확인 함수
  const canDeleteReply = (reply: CommentReply): boolean => {
    // 로그인 사용자인 경우: user_id로 확인
    if (currentUser && reply.user_id === currentUser.id) {
      return true;
    }
    // 비로그인 사용자인 경우: device_id로 확인
    if (!currentUser && deviceId && reply.device_id === deviceId) {
      return true;
    }
    return false;
  };

  // 수정 다이얼로그 열기
  const handleOpenEdit = (comment: GuestComment) => {
    // GuestComment를 FeedItem으로 변환
    const feedItem: FeedItem = {
      id: comment.id,
      type: comment.source === 'qt_post' ? 'qt' : 'meditation',
      authorName: comment.guest_name,
      isAnonymous: comment.is_anonymous,
      createdAt: comment.created_at,
      dayNumber: comment.day_number,
      bibleRange: comment.bible_range,
      content: comment.content,
      mySentence: comment.mySentence,
      meditationAnswer: comment.meditationAnswer,
      meditationQuestion: comment.meditationQuestion,
      gratitude: comment.gratitude,
      myPrayer: comment.myPrayer,
      dayReview: comment.dayReview,
      likesCount: comment.likes_count,
      repliesCount: comment.replies_count,
      userId: comment.linked_user_id,
    };
    setEditingItem(feedItem);
    setEditDialogOpen(true);
  };

  // 수정 저장 핸들러
  const handleSaveEdit = async (data: EditPostData) => {
    const supabase = getSupabaseBrowserClient();
    try {
      // 통독일정 변경 시 bible_range도 함께 업데이트
      const readingInfo = data.dayNumber ? findReadingByDay(data.dayNumber) : null;
      const newBibleRange = readingInfo?.reading || null;

      if (data.type === 'meditation') {
        const { error } = await supabase
          .from('guest_comments')
          .update({
            content: data.content,
            day_number: data.dayNumber,
            bible_range: newBibleRange,
            is_anonymous: data.isAnonymous,
          })
          .eq('id', data.id);

        if (error) throw error;
      } else {
        // QT의 경우 qt_date도 함께 업데이트
        const newQtDate = readingInfo?.date || null;

        const { error } = await supabase
          .from('church_qt_posts')
          .update({
            my_sentence: data.mySentence,
            meditation_answer: data.meditationAnswer,
            gratitude: data.gratitude,
            my_prayer: data.myPrayer,
            day_review: data.dayReview,
            day_number: data.dayNumber,
            qt_date: newQtDate,
            is_anonymous: data.isAnonymous,
          })
          .eq('id', data.id);

        if (error) throw error;
      }

      toast({ variant: 'success', title: '수정되었습니다' });
      loadComments();
    } catch (err) {
      console.error('수정 에러:', err);
      toast({ variant: 'error', title: '수정에 실패했습니다' });
      throw err;
    }
  };

  // 댓글 삭제 핸들러 (source에 따라 다른 테이블 사용)
  const handleDeleteComment = async () => {
    if (!deleteCommentId) return;

    const supabase = getSupabaseBrowserClient();
    const tableName = deleteCommentSource === 'qt_post' ? 'church_qt_posts' : 'guest_comments';

    setDeleting(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', deleteCommentId);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '삭제되었습니다',
      });

      setDeleteConfirmOpen(false);
      setDeleteCommentId(null);
      loadComments();
    } catch (err) {
      console.error('삭제 에러:', err);
      toast({
        variant: 'error',
        title: '삭제에 실패했습니다',
      });
    } finally {
      setDeleting(false);
    }
  };

  // 답글 삭제 핸들러
  const handleDeleteReply = async () => {
    if (!deleteReplyId || !deleteReplyCommentId) return;

    const supabase = getSupabaseBrowserClient();
    const tableName = deleteReplySource === 'qt_post' ? 'church_qt_post_replies' : 'guest_comment_replies';

    setDeletingReply(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', deleteReplyId);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '답글이 삭제되었습니다',
      });

      setDeleteReplyConfirmOpen(false);
      setDeleteReplyId(null);

      // 답글 목록에서 해당 답글 제거
      setRepliesMap(prev => ({
        ...prev,
        [deleteReplyCommentId]: (prev[deleteReplyCommentId] || []).filter(r => r.id !== deleteReplyId),
      }));

      // 댓글의 replies_count 업데이트
      setComments(prev =>
        prev.map(c =>
          c.id === deleteReplyCommentId ? { ...c, replies_count: Math.max(0, (c.replies_count || 0) - 1) } : c
        )
      );

      setDeleteReplyCommentId(null);
    } catch (err) {
      console.error('답글 삭제 에러:', err);
      toast({
        variant: 'error',
        title: '답글 삭제에 실패했습니다',
      });
    } finally {
      setDeletingReply(false);
    }
  };

  // 답글 로드 함수
  const loadReplies = useCallback(async (commentId: string, source: 'guest_comment' | 'qt_post') => {
    // 이미 로딩 중이면 스킵
    if (loadingReplies.has(commentId)) return;

    const supabase = getSupabaseBrowserClient();
    setLoadingReplies(prev => new Set(prev).add(commentId));

    try {
      const tableName = source === 'qt_post' ? 'church_qt_post_replies' : 'guest_comment_replies';
      const idColumn = source === 'qt_post' ? 'post_id' : 'comment_id';

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idColumn, commentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setRepliesMap(prev => ({
        ...prev,
        [commentId]: (data || []).map(r => ({
          ...r,
          comment_id: commentId,
        })),
      }));
    } catch (err) {
      console.error('답글 로드 에러:', err);
    } finally {
      setLoadingReplies(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  }, [loadingReplies]);

  // 답글 토글 (펼치기/접기)
  const toggleReplies = useCallback((commentId: string, source: 'guest_comment' | 'qt_post') => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
        // 처음 펼칠 때 답글 로드
        if (!repliesMap[commentId]) {
          loadReplies(commentId, source);
        }
      }
      return next;
    });
  }, [repliesMap, loadReplies]);

  // 답글 작성 시작
  const startReply = useCallback((commentId: string, source: 'guest_comment' | 'qt_post') => {
    setReplyingToId(commentId);
    setReplyingToSource(source);
    setReplyContent('');
    setReplyGuestName(isRegisteredMember && userProfile ? userProfile.nickname : getLastGuestName());

    // 답글 목록 펼치기
    if (!expandedReplies.has(commentId)) {
      setExpandedReplies(prev => new Set(prev).add(commentId));
      if (!repliesMap[commentId]) {
        loadReplies(commentId, source);
      }
    }
  }, [isRegisteredMember, userProfile, expandedReplies, repliesMap, loadReplies]);

  // 답글 작성 취소
  const cancelReply = useCallback(() => {
    setReplyingToId(null);
    setReplyContent('');
    setReplyGuestName('');
  }, []);

  // 답글 제출
  const handleSubmitReply = useCallback(async () => {
    if (!replyingToId || !replyContent.trim()) return;

    const authorName = isRegisteredMember && userProfile ? userProfile.nickname : replyGuestName.trim();

    if (!authorName) {
      toast({
        variant: 'error',
        title: '이름을 입력해주세요',
      });
      return;
    }

    // Rate Limiting 체크
    const rateLimitResult = checkCommentRateLimit(deviceId);
    if (!rateLimitResult.allowed) {
      toast({
        variant: 'error',
        title: rateLimitResult.message || '너무 빠르게 작성하고 있습니다',
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setReplySubmitting(true);

    try {
      const tableName = replyingToSource === 'qt_post' ? 'church_qt_post_replies' : 'guest_comment_replies';
      const idColumn = replyingToSource === 'qt_post' ? 'post_id' : 'comment_id';

      const insertData: Record<string, unknown> = {
        [idColumn]: replyingToId,
        guest_name: authorName,
        device_id: deviceId,
        content: replyContent.trim(),
        is_anonymous: false,
      };

      // 로그인 사용자의 경우 user_id 추가
      if (currentUser) {
        insertData.user_id = currentUser.id;
      }

      const { error } = await supabase
        .from(tableName)
        .insert(insertData);

      if (error) throw error;

      // 비등록 사용자만 이름 저장
      if (!isRegisteredMember && replyGuestName.trim()) {
        setLastGuestName(replyGuestName.trim());
      }

      toast({
        variant: 'success',
        title: '답글이 등록되었습니다',
      });

      // 폼 초기화
      cancelReply();

      // 답글 목록 다시 로드
      loadReplies(replyingToId, replyingToSource);

      // 댓글의 replies_count 업데이트
      setComments(prev =>
        prev.map(c =>
          c.id === replyingToId ? { ...c, replies_count: (c.replies_count || 0) + 1 } : c
        )
      );
    } catch (err) {
      console.error('답글 작성 에러:', err);
      toast({
        variant: 'error',
        title: '답글 등록에 실패했습니다',
      });
    } finally {
      setReplySubmitting(false);
    }
  }, [replyingToId, replyingToSource, replyContent, replyGuestName, isRegisteredMember, userProfile, deviceId, currentUser, toast, cancelReply, loadReplies]);

  // 현재 인덱스 계산
  const currentIndex = schedules.findIndex(s => s.date === selectedDate);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < schedules.length - 1;

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // 교회 등록 핸들러
  const handleRegisterChurch = async () => {
    if (!currentUser || !church) return;

    const supabase = getSupabaseBrowserClient();
    setRegistering(true);
    try {
      // 먼저 프로필이 있는지 확인
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .single();

      // 프로필이 없으면 생성
      if (!existingProfile || profileCheckError) {
        // 사용자 정보 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userMetadata = user.user_metadata || {};
          const provider = user.app_metadata?.provider;

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
            nickname = user.email?.split('@')[0] || '사용자';
          }

          // 프로필 생성
          const { error: createError } = await supabase.from('profiles').insert({
            id: user.id,
            nickname,
            avatar_url: avatarUrl,
            email: user.email,
            has_completed_onboarding: false,
          });

          if (createError) {
            console.error('프로필 생성 에러:', createError);
          }
        }
      }

      // 교회 등록
      const { error } = await supabase
        .from('profiles')
        .update({
          church_id: church.id,
          church_joined_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      setIsRegisteredMember(true);
      setHasWriteAccess(true);
      setRegisterDialogOpen(false);

      // 프로필 정보 갱신 - 다시 로드
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (updatedProfile) {
        setUserProfile(updatedProfile);
        setGuestName(updatedProfile.nickname || '');
      }

      toast({
        variant: 'success',
        title: '교회 등록 완료',
        description: `${church.name}에 등록 교인으로 등록되었습니다.`,
      });
    } catch (err: unknown) {
      console.error('교회 등록 에러:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
      toast({
        variant: 'error',
        title: '등록 실패',
        description: `교회 등록에 실패했습니다. (${errorMessage})`,
      });
    } finally {
      setRegistering(false);
    }
  };

  // QT 슬라이더용 데이터 - 오늘 날짜의 모든 QT 나눔
  const qtSliderItems = todayQtPosts
    .filter(c => c.qtDate) // qtDate만 있으면 표시
    .map(c => ({
      id: c.id,
      authorName: c.guest_name,
      isAnonymous: c.is_anonymous,
      createdAt: c.created_at,
      dayReview: c.dayReview || null,
      qtDate: c.qtDate!,
      // 사용자 QT 답변 필드들
      selectedWord: null,
      oneSentence: c.mySentence || null,
      questionAnswer: c.meditationAnswer || null,
      gratitude: c.gratitude || null,
      prayer: c.myPrayer || null,
    }));

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-background to-coral-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-500/20">
            <BookOpen className="w-8 h-8 text-white animate-pulse" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // 교회를 찾을 수 없음
  if (!church) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-background to-coral-50/30 p-4">
        <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold mb-2">교회를 찾을 수 없습니다</h1>
        <p className="text-muted-foreground text-center">
          유효하지 않은 코드이거나 비활성화된 교회입니다.
        </p>
      </div>
    );
  }

  return (
    <ChurchLayout churchCode={churchCode} churchId={church.id}>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-background to-coral-50/30 pb-20 lg:pb-4">
      {/* 헤더 - 밝은 아이보리/화이트 계열 */}
      <header className="bg-gradient-to-r from-muted/80 via-white to-muted/60 sticky top-0 z-10 shadow-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* 클릭 가능한 교회 정보 버튼 */}
            <button
              type="button"
              onClick={() => setChurchInfoDialogOpen(true)}
              className="flex items-center gap-3 hover:bg-slate-100/50 rounded-xl p-1.5 -m-1.5 transition-colors group"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Church className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{church.name}</h1>
                {church.address && (
                  <p className="text-xs text-slate-500 truncate max-w-[180px]">{church.address}</p>
                )}
              </div>
            </button>

            {/* 교회 등록 버튼 영역 */}
            <div className="flex items-center gap-2">
              {currentUser ? (
                isRegisteredMember ? (
                  <span className="flex items-center gap-1 text-xs text-white bg-primary px-3 py-1.5 rounded-full shadow-sm">
                    <UserCheck className="w-3 h-3" />
                    등록 교인
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setRegisterDialogOpen(true)}
                    className="gap-1 bg-primary hover:bg-primary text-white shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    교회 등록
                  </Button>
                )
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="gap-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                >
                  <a href="/login">
                    <LogIn className="w-4 h-4" />
                    로그인
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 날짜 선택 - 슬레이트 강조 */}
        <Card className="overflow-hidden border-border/60 shadow-soft">
          <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-coral-50/50 px-4 py-1.5">
            <p className="text-[10px] font-medium text-slate-600 text-center tracking-wider uppercase">Today&apos;s Reading</p>
          </div>
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                onClick={handlePrevDate}
                disabled={!canGoPrev}
                className="min-w-[44px] min-h-[44px] p-0 shrink-0 rounded-xl hover:bg-slate-100 text-slate-600 disabled:text-muted-foreground"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <div className="text-center flex-1 min-w-0">
                {currentSchedule ? (
                  <>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(selectedDate)}
                      </span>
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800">{currentSchedule.reading}</CardTitle>
                    {currentSchedule.is_supplement_week && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">보충 주간</span>
                    )}
                    {currentSchedule.memory_verse && (
                      <p className="text-xs text-slate-700 mt-2 bg-slate-50 px-3 py-1.5 rounded-lg inline-block font-medium">
                        📖 암송: {currentSchedule.memory_verse}
                      </p>
                    )}
                  </>
                ) : (
                  <CardTitle className="text-lg text-muted-foreground">
                    일정 없음
                  </CardTitle>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={handleNextDate}
                disabled={!canGoNext}
                className="min-w-[44px] min-h-[44px] p-0 shrink-0 rounded-xl hover:bg-slate-100 text-slate-600 disabled:text-muted-foreground"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* 공지사항 배너 */}
        {church && <NoticeBanner churchId={church.id} />}

        {/* 작성 폼 - 슬레이트 + 코랄 강조 */}
        {hasWriteAccess ? (
          <Card className="border-border/60 shadow-soft overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-coral-50/50 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2 text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center shadow-sm">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                짧은 묵상 나눔 작성
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 이름 입력 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">이름</label>
                  {isRegisteredMember && userProfile ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={userProfile.nickname}
                        disabled
                        className="bg-slate-50 border-border"
                      />
                      <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap font-medium">
                        등록 교인
                      </span>
                    </div>
                  ) : (
                    <Input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="이름을 입력하세요"
                      maxLength={20}
                      className="border-border focus:border-primary focus:ring-primary"
                    />
                  )}
                </div>

                {/* 내용 입력 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">묵상 내용</label>
                  <RichEditor
                    content={content}
                    onChange={(html) => setContent(html)}
                    placeholder="오늘의 말씀을 묵상하고 나눠주세요..."
                    minHeight="120px"
                  />
                </div>

                {/* 익명 옵션 */}
                {church.allow_anonymous && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor="anonymous"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      익명으로 작성
                    </label>
                  </div>
                )}

                {/* 나눔 등록 버튼 - 코랄 그라데이션 */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 shadow-lg shadow-coral-500/25"
                  disabled={
                    submitting ||
                    isEmptyContent(content) ||
                    (!isRegisteredMember && !guestName.trim())
                  }
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  나눔 등록
                </Button>

                {/* QT 작성 안내 - 개선된 버전 */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-xs text-center text-muted-foreground mb-2">
                    더 자세한 묵상을 남기고 싶다면?
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* QT 작성하기 버튼 */}
                    <a
                      href={`/church/${churchCode}/sharing?writeQt=true`}
                      className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-muted to-muted hover:from-amber-100 hover:to-orange-100 border border-border rounded-lg transition-all hover:shadow-md group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <FileEdit className="w-5 h-5 text-accent" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-foreground">QT 작성</div>
                        <div className="text-xs text-foreground">오늘의 묵상</div>
                      </div>
                    </a>

                    {/* QT 목록 보기 버튼 */}
                    <a
                      href={`/church/${churchCode}/qt`}
                      className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-muted to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-accent/30 rounded-lg transition-all hover:shadow-md group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <BookOpen className="w-5 h-5 text-accent" />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-foreground">QT 목록</div>
                        <div className="text-xs text-accent">전체 일정</div>
                      </div>
                    </a>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-border/60 bg-slate-50/30">
            <CardContent className="py-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">
                묵상을 작성하려면 QR 코드를 스캔해주세요
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                교회에서 제공하는 QR 코드로 접근하면 작성이 가능합니다
              </p>
            </CardContent>
          </Card>
        )}

        {/* QT 카드 슬라이더 - 작성 폼과 피드 사이 */}
        {qtSliderItems.length > 0 && (
          <QTCardSlider
            items={qtSliderItems}
            churchCode={churchCode}
            autoSlideInterval={3000}
          />
        )}

        {/* YouTube Shorts 섹션 */}
        {shorts.length > 0 && (
          <ShortsViewer shorts={shorts} churchName={church?.name} />
        )}

        {/* 게시글 목록 - 인스타 피드 스타일 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {currentSchedule?.reading || '오늘'} 묵상 나눔
              <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium">{feedComments.length}</span>
            </h2>
            {feedComments.length > COMMENTS_PER_PAGE && (
              <span className="text-xs text-muted-foreground">
                {displayedComments.length} / {feedComments.length}개 표시
              </span>
            )}
          </div>

          {/* 로딩 스켈레톤 */}
          {commentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-slate-100">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-slate-50 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-slate-50 rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-slate-50 rounded animate-pulse" />
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="h-8 w-20 bg-slate-50 rounded-full animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : commentsError ? (
            /* 에러 상태 */
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-8 text-center">
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                <p className="text-destructive font-medium">
                  묵상을 불러오는데 실패했습니다
                </p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  네트워크 연결을 확인해주세요
                </p>
                <Button variant="outline" size="sm" onClick={loadComments}>
                  <Loader2 className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          ) : feedComments.length === 0 ? (
            /* 빈 상태 - 슬레이트 스타일 */
            <Card className="border-dashed border-border bg-gradient-to-br from-slate-50/50 to-coral-50/30">
              <CardContent className="py-12 text-center">
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center shadow-inner">
                  <MessageCircle className="w-10 h-10 text-slate-400" />
                </div>
                <p className="font-bold text-lg mb-2 text-slate-700">
                  아직 작성된 묵상이 없습니다
                </p>
                <p className="text-sm text-muted-foreground">
                  오늘의 말씀을 묵상하고 첫 번째 나눔을 시작해보세요!
                </p>
                {hasWriteAccess && (
                  <p className="text-xs text-primary mt-4 bg-primary/10 inline-block px-4 py-2 rounded-full font-medium">
                    ⬆️ 위 양식에서 묵상을 작성할 수 있어요
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {displayedComments.map((comment) => {
                const displayName = comment.is_anonymous ? '익명' : comment.guest_name;
                const avatarColor = comment.is_anonymous ? 'bg-slate-400' : getAvatarColor(comment.guest_name);
                const initials = comment.is_anonymous ? '?' : getInitials(comment.guest_name);

                return (
                  <Card key={comment.id} className="transition-all duration-200 hover:shadow-soft border-slate-100 hover:border-border">
                    <CardContent className="pt-4">
                      {/* 작성자 정보 */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-11 h-11 rounded-xl ${avatarColor} flex items-center justify-center shrink-0 shadow-sm`}>
                          <span className="text-white font-semibold text-sm">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {displayName}
                            </p>
                            {comment.source === 'qt_post' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-muted text-foreground text-xs rounded-full font-medium">
                                QT
                              </span>
                            )}
                            {comment.is_anonymous && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs rounded-full">
                                <Lock className="w-3 h-3" />
                                익명
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(comment.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* 성경 범위 */}
                      {comment.bible_range && (
                        <span className="text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full inline-block mb-3 font-medium">
                          📖 {comment.bible_range}
                        </span>
                      )}

                      {/* 내용 - QT인 경우 박스 스타일, 일반 묵상은 기존 스타일 */}
                      {comment.source === 'qt_post' ? (
                        <QTContentRenderer data={comment} />
                      ) : (
                        <div className="bg-slate-50/70 rounded-xl p-4 -mx-1">
                          {comment.content.startsWith('<') ? (
                            <RichViewerWithEmbed content={comment.content} className="text-sm text-slate-800" />
                          ) : (
                            <p className="text-sm whitespace-pre-wrap text-slate-800">{comment.content}</p>
                          )}
                        </div>
                      )}

                      {/* 좋아요 버튼 & 답글 & 삭제 버튼 */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLike(comment.id)}
                            className={`flex items-center gap-2 min-w-[44px] min-h-[44px] px-4 py-2 rounded-full text-sm transition-all active:scale-95 ${
                              likedComments.has(comment.id)
                                ? 'bg-gradient-to-r from-coral-50 to-red-50 dark:from-coral-950 dark:to-red-950 text-primary shadow-sm'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 active:bg-slate-100'
                            }`}
                          >
                            <Heart
                              className={`w-5 h-5 transition-transform ${
                                likedComments.has(comment.id) ? 'fill-current' : ''
                              } ${likeAnimating === comment.id ? 'scale-125' : ''}`}
                            />
                            <span className="font-semibold">{comment.likes_count || 0}</span>
                          </button>

                          {/* 답글 버튼 */}
                          {hasWriteAccess && (
                            <button
                              type="button"
                              onClick={() => startReply(comment.id, comment.source || 'guest_comment')}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <Reply className="w-4 h-4" />
                              답글
                            </button>
                          )}

                          {/* 답글 펼치기/접기 (답글이 있을 때만) */}
                          {(comment.replies_count || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleReplies(comment.id, comment.source || 'guest_comment')}
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-muted-foreground hover:text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{comment.replies_count}</span>
                              {expandedReplies.has(comment.id) ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* 본인 글인 경우 수정/삭제 버튼 표시 */}
                        {canDeleteComment(comment) && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(comment)}
                              className="flex items-center gap-1 px-3 py-2 rounded-full text-xs text-muted-foreground hover:text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteCommentId(comment.id);
                                setDeleteCommentSource(comment.source || 'guest_comment');
                                setDeleteConfirmOpen(true);
                              }}
                              className="flex items-center gap-1 px-3 py-2 rounded-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              삭제
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 답글 목록 */}
                      {expandedReplies.has(comment.id) && (
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                          {loadingReplies.has(comment.id) ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            </div>
                          ) : (
                            <>
                              {(repliesMap[comment.id] || []).map((reply) => {
                                const replyDisplayName = reply.is_anonymous ? '익명' : reply.guest_name;
                                const replyAvatarColor = reply.is_anonymous ? 'bg-slate-400' : getAvatarColor(reply.guest_name || '');
                                const replyInitials = reply.is_anonymous ? '?' : getInitials(reply.guest_name || '');

                                return (
                                  <div key={reply.id} className="flex gap-2 pl-2 group">
                                    <div className={`w-8 h-8 rounded-lg ${replyAvatarColor} flex items-center justify-center shrink-0`}>
                                      <span className="text-white font-semibold text-xs">{replyInitials}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-slate-700">{replyDisplayName}</span>
                                          <span className="text-xs text-muted-foreground">{formatRelativeTime(reply.created_at)}</span>
                                        </div>
                                        {/* 본인 답글 삭제 버튼 */}
                                        {canDeleteReply(reply) && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setDeleteReplyId(reply.id);
                                              setDeleteReplyCommentId(comment.id);
                                              setDeleteReplySource(comment.source || 'guest_comment');
                                              setDeleteReplyConfirmOpen(true);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-sm text-slate-700 bg-slate-50/70 rounded-lg px-3 py-2">
                                        {reply.content}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}

                              {(repliesMap[comment.id] || []).length === 0 && !loadingReplies.has(comment.id) && (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                  아직 답글이 없습니다
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* 답글 작성 폼 */}
                      {replyingToId === comment.id && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="space-y-3">
                            {/* 비등록 사용자 이름 입력 */}
                            {!isRegisteredMember && (
                              <Input
                                value={replyGuestName}
                                onChange={(e) => setReplyGuestName(e.target.value)}
                                placeholder="이름"
                                maxLength={20}
                                className="text-sm border-border focus:border-primary"
                              />
                            )}
                            <div className="flex gap-2">
                              <Input
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="답글을 입력하세요..."
                                className="flex-1 text-sm border-border focus:border-primary"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitReply();
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={handleSubmitReply}
                                disabled={replySubmitting || !replyContent.trim() || (!isRegisteredMember && !replyGuestName.trim())}
                                className="bg-primary hover:bg-primary"
                              >
                                {replySubmitting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelReply}
                                className="text-muted-foreground"
                              >
                                취소
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* 무한 스크롤 트리거 */}
              <div ref={commentsLoadMoreRef} className="h-10 flex items-center justify-center">
                {hasMoreComments && (
                  <span className="text-xs text-muted-foreground">스크롤하여 더 보기...</span>
                )}
                {!hasMoreComments && feedComments.length > COMMENTS_PER_PAGE && (
                  <span className="text-xs text-muted-foreground">모든 묵상을 불러왔습니다</span>
                )}
              </div>
            </>
          )}
        </div>

      </main>

      {/* 푸터 - 슬레이트 스타일 */}
      <footer className="bg-gradient-to-r from-slate-50 via-background to-coral-50/50 border-t border-slate-100 py-5 text-center">
        <p className="text-xs text-slate-600 font-medium">
          ✝️ Powered by 리딩지저스 · {church.code}
        </p>
      </footer>

      {/* 교회 정보 다이얼로그 */}
      <Dialog open={churchInfoDialogOpen} onOpenChange={setChurchInfoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                <Church className="w-5 h-5 text-white" />
              </div>
              {church.name}
            </DialogTitle>
            <DialogDescription>
              교회 정보 및 관리자 페이지
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 교회 상세 정보 */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">주소</p>
                  <p className="text-sm text-slate-700">{church.address || '주소 정보 없음'}</p>
                </div>
              </div>

              {church.pastor_name && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">담임 목사</p>
                    <p className="text-sm text-slate-700">{church.pastor_name} 목사님</p>
                  </div>
                </div>
              )}

              {church.denomination && (
                <div className="flex items-start gap-3">
                  <Church className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">교단</p>
                    <p className="text-sm text-slate-700">{church.denomination}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <BookOpen className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">교회 코드</p>
                  <p className="text-sm font-mono text-primary font-semibold">{church.code}</p>
                </div>
              </div>
            </div>

            {/* 관리자 페이지 접근 */}
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-3">교회 관리자이신가요?</p>
              <a
                href={`/church/${churchCode}/admin/login`}
                className="flex items-center justify-between w-full p-3 bg-gradient-to-r from-slate-100 to-slate-50 hover:from-coral-50 hover:to-muted rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">관리자 페이지</p>
                    <p className="text-xs text-slate-500">교회 설정 및 컨텐츠 관리</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChurchInfoDialogOpen(false)}
              className="w-full"
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 교회 등록 다이얼로그 */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>교회 등록</DialogTitle>
            <DialogDescription>
              {church.name}에 등록 교인으로 등록하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Church className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {church.name} <span className="text-muted-foreground font-normal">(교회 코드: {church.code})</span>
                </span>
              </div>
              {church.pastor_name && (
                <p className="text-sm text-muted-foreground">
                  담임 목사: {church.pastor_name} 목사님
                </p>
              )}
              {church.denomination && (
                <p className="text-sm text-muted-foreground">
                  교단: {church.denomination}
                </p>
              )}
              {church.address && (
                <p className="text-sm text-muted-foreground">
                  주소: {church.address}
                </p>
              )}
            </div>

            <div className="mt-4 text-sm text-muted-foreground space-y-1">
              <p>✅ 등록하시면 QR 코드 없이도 묵상을 작성할 수 있습니다</p>
              <p>✅ 내 묵상은 프로필과 연결되어 관리됩니다</p>
              {userProfile?.church_id && (
                <p className="text-accent mt-2">
                  ⚠️ 기존 교회 등록이 해제되고 새로운 교회로 등록됩니다
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegisterDialogOpen(false)}
              disabled={registering}
            >
              취소
            </Button>
            <Button
              onClick={handleRegisterChurch}
              disabled={registering}
            >
              {registering ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              등록하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>글 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteCommentId(null);
              }}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteComment}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 답글 삭제 확인 다이얼로그 */}
      <Dialog open={deleteReplyConfirmOpen} onOpenChange={setDeleteReplyConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>답글 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 답글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteReplyConfirmOpen(false);
                setDeleteReplyId(null);
                setDeleteReplyCommentId(null);
              }}
              disabled={deletingReply}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReply}
              disabled={deletingReply}
            >
              {deletingReply ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 게시글 수정 다이얼로그 */}
      <EditPostDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={editingItem}
        onSave={handleSaveEdit}
      />

      {/* QT 플로팅 버튼 */}
      <a
        href={`/church/${churchCode}/qt`}
        className="fixed bottom-20 right-4 lg:right-8 z-40 w-14 h-14 bg-gradient-to-br from-muted0 to-muted0 hover:from-amber-600 hover:to-orange-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-white font-bold text-sm transition-all hover:scale-110 group"
        title="QT 목록"
      >
        <div className="flex flex-col items-center justify-center">
          <BookOpen className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] leading-none">QT</span>
        </div>
      </a>

      {/* 하단 네비게이션은 ChurchLayout에서 처리 */}
    </div>
    </ChurchLayout>
  );
}
