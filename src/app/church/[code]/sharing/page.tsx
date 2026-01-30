'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  MessageCircle,
  BookOpen,
  ArrowLeft,
  Send,
  Save,
  PenLine,
  ChevronDown,
  ChevronUp,
  Calendar,
  Heart,
  Check,
  Lock,
  Trash2,
  Filter,
  X,
  Headphones,
} from 'lucide-react';
import { formatRelativeTime, getInitials, getAvatarColor, getTodayDateString } from '@/lib/date-utils';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { ChurchLayout } from '@/components/church/ChurchLayout';
import { useToast } from '@/components/ui/toast';
import { VisibilitySelector } from '@/components/ui/visibility-selector';
import type { ContentVisibility } from '@/domain/entities/PublicMeditation';
import { useAutoDraft, formatDraftTime } from '@/hooks/useAutoDraft';
import { QTDailyContent } from '@/types';
import { loadQTData, getQTByDate, getDefaultQTMonth, getAvailableQTMonths, type QTMonthInfo } from '@/lib/qt-content';
import { FeedCard, FeedItem, FeedItemType } from '@/components/church/FeedCard';
import { InstagramStyleFeed } from '@/components/church/InstagramStyleFeed';
import { EditPostDialog, EditPostData } from '@/components/church/EditPostDialog';
import dynamic from 'next/dynamic';
import readingPlan from '@/data/reading_plan.json';
import { LayoutGrid, Play } from 'lucide-react';
import { ReadingDayPicker, findReadingByDay } from '@/components/church/ReadingDayPicker';
import { QTContentRenderer } from '@/components/church/QTContentRenderer';
import { UnifiedQTWriteForm, createInitialQTFormData, type UnifiedQTFormData, MeditationAudioPlayer } from '@/components/qt';

const RichViewerWithEmbed = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichViewerWithEmbed),
  { ssr: false }
);

const RichEditor = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichEditor),
  { ssr: false, loading: () => <div className="h-[150px] border rounded-lg bg-muted/30 animate-pulse" /> }
);

// 빈 HTML 콘텐츠 체크
function isEmptyContent(html: string): boolean {
  if (!html) return true;
  const text = html.replace(/<[^>]*>/g, '').trim();
  return text.length === 0;
}

// Supabase Storage URL 생성 헬퍼
function getMeditationAudioUrl(date: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return '';
  return `${supabaseUrl}/storage/v1/object/public/meditations/${date}-meditation.wav`;
}

interface ChurchInfo {
  id: string;
  code: string;
  name: string;
}

interface ReadingDay {
  day: number;
  date: string;
  display_date: string;
  book: string;
  range: string;
  reading: string;
}

const ITEMS_PER_PAGE = 15;

export default function ChurchSharingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const churchCode = params.code as string;
  const writeQt = searchParams.get('writeQt') === 'true';
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [church, setChurch] = useState<ChurchInfo | null>(null);

  // 사용자 정보
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [userProfile, setUserProfile] = useState<{ nickname: string; church_id: string | null } | null>(null);
  const [isRegisteredMember, setIsRegisteredMember] = useState(false);

  // 필터 상태
  const [filterType, setFilterType] = useState<'all' | 'meditation' | 'qt'>('all');
  const [filterDay, setFilterDay] = useState<number | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // 뷰 모드 (list: 기존 카드 목록, story: 인스타그램 스타일)
  const [viewMode, setViewMode] = useState<'list' | 'story'>('list');

  // 피드 데이터
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);

  // QT 컨텐츠 (hwpx 데이터)
  const [qtContentList, setQtContentList] = useState<QTDailyContent[]>([]);
  const [selectedQtDate, setSelectedQtDate] = useState<string>('');
  const [currentQtContent, setCurrentQtContent] = useState<QTDailyContent | null>(null);
  // 월 선택 상태 (QT 작성 다이얼로그용)
  const [availableMonths, setAvailableMonths] = useState<QTMonthInfo[]>([]);
  const [selectedQtYear, setSelectedQtYear] = useState<number>(2026);
  const [selectedQtMonth, setSelectedQtMonth] = useState<number>(1);

  // 작성 다이얼로그 상태
  const [writeType, setWriteType] = useState<'meditation' | 'qt'>('meditation');
  const [writeDialogOpen, setWriteDialogOpen] = useState(false);

  // 짧은 묵상 작성 상태
  const [guestName, setGuestName] = useState('');
  const [bibleRange, setBibleRange] = useState('');
  const [content, setContent] = useState('');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibility, setVisibility] = useState<ContentVisibility>('church');

  // QT 작성 상태
  const [qtAuthorName, setQtAuthorName] = useState('');
  const [qtFormData, setQtFormData] = useState<UnifiedQTFormData>(createInitialQTFormData());
  const [qtSubmitting, setQtSubmitting] = useState(false);
  const [qtIsAnonymous, setQtIsAnonymous] = useState(false);
  const [qtVisibility, setQtVisibility] = useState<ContentVisibility>('church');
  const [expandedSections, setExpandedSections] = useState({
    verses: true,
    guide: true,
    question: true,
  });

  // 오디오 상태
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioAvailable, setAudioAvailable] = useState(false);

  // 상세 보기 상태
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedItemQtContent, setSelectedItemQtContent] = useState<QTDailyContent | null>(null);

  // QT 원문 캐시 (qtDate -> QTDailyContent)
  const [qtContentCache, setQtContentCache] = useState<Map<string, QTDailyContent>>(new Map());

  // 댓글 다이얼로그 상태
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentTargetId, setCommentTargetId] = useState<string | null>(null);
  const [commentTargetType, setCommentTargetType] = useState<FeedItemType>('meditation');
  const [replies, setReplies] = useState<Array<{
    id: string;
    content: string;
    guest_name: string;
    is_anonymous: boolean;
    created_at: string;
    user_id: string | null;
    device_id: string | null;
  }>>([]);
  const [newReply, setNewReply] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // 답글 삭제 상태
  const [deleteReplyId, setDeleteReplyId] = useState<string | null>(null);
  const [deleteReplyConfirmOpen, setDeleteReplyConfirmOpen] = useState(false);
  const [deletingReply, setDeletingReply] = useState(false);

  // 수정 다이얼로그 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);

  // 삭제 확인 다이얼로그 상태
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FeedItem | null>(null);

  // 자동 임시저장
  const {
    draft,
    hasDraft,
    lastSaved,
    updateDraft,
    clearDraft,
    restoreDraft,
  } = useAutoDraft({
    context: 'church_sharing',
    identifier: churchCode,
    debounceMs: 2000,
    enabled: writeDialogOpen && writeType === 'meditation',
  });

  // 교회 정보 및 사용자 정보 로드
  useEffect(() => {
    const loadChurchAndUser = async () => {
      const supabase = getSupabaseBrowserClient();
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      let profileData: { nickname: string; church_id: string | null } | null = null;

      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, church_id')
          .eq('id', user.id)
          .single();
        if (profile) {
          profileData = profile;
          setUserProfile(profile);
          setGuestName(profile.nickname);
          setQtAuthorName(profile.nickname);
        }
      } else {
        const savedName = localStorage.getItem('guest_name');
        if (savedName) {
          setGuestName(savedName);
          setQtAuthorName(savedName);
        }
      }

      const { data: churchData, error } = await supabase
        .from('churches')
        .select('id, code, name')
        .eq('code', churchCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !churchData) {
        setLoading(false);
        return;
      }

      setChurch(churchData);

      if (user && profileData?.church_id === churchData.id) {
        setIsRegisteredMember(true);
      }

      setLoading(false);
    };

    loadChurchAndUser();
  }, [churchCode]);

  // QT 컨텐츠 로드 (초기화 - 오늘 날짜 기준 월)
  useEffect(() => {
    const loadQT = async () => {
      const months = getAvailableQTMonths();
      setAvailableMonths(months);

      const defaultMonth = getDefaultQTMonth();
      setSelectedQtYear(defaultMonth.year);
      setSelectedQtMonth(defaultMonth.month);

      const data = await loadQTData(defaultMonth.year, defaultMonth.month);
      setQtContentList(data);

      const today = getTodayDateString();
      const todayQT = data.find(qt => qt.date === today);
      if (todayQT) {
        setSelectedQtDate(todayQT.date);
        setCurrentQtContent(todayQT);
      } else if (data.length > 0) {
        setSelectedQtDate(data[0].date);
        setCurrentQtContent(data[0]);
      }
    };
    loadQT();
  }, []);

  // 월 변경 시 해당 월의 QT 데이터 로드
  const handleQtMonthChange = async (year: number, month: number) => {
    setSelectedQtYear(year);
    setSelectedQtMonth(month);

    const data = await loadQTData(year, month);
    setQtContentList(data);

    if (data.length > 0) {
      setSelectedQtDate(data[0].date);
      setCurrentQtContent(data[0]);
    } else {
      setSelectedQtDate('');
      setCurrentQtContent(null);
    }
  };

  // URL 파라미터로 QT 작성 다이얼로그 열기 (홈에서 QT 작성하기 링크)
  useEffect(() => {
    if (writeQt && !loading && church) {
      handleOpenWriteDialog('qt');
      // URL 파라미터 제거 (한 번만 실행되도록)
      router.replace(`/church/${churchCode}/sharing`, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeQt, loading, church]);

  // 선택된 날짜 변경 시 QT 컨텐츠 업데이트
  useEffect(() => {
    if (selectedQtDate) {
      const qt = qtContentList.find(q => q.date === selectedQtDate);
      setCurrentQtContent(qt || null);
    }
  }, [selectedQtDate, qtContentList]);

  // 오디오 가용성 체크
  useEffect(() => {
    if (currentQtContent?.date) {
      const url = getMeditationAudioUrl(currentQtContent.date);
      if (url) {
        fetch(url, { method: 'HEAD' })
          .then((res) => {
            if (res.ok) {
              setAudioUrl(url);
              setAudioAvailable(true);
            } else {
              setAudioUrl(null);
              setAudioAvailable(false);
            }
          })
          .catch(() => {
            setAudioUrl(null);
            setAudioAvailable(false);
          });
      }
    } else {
      setAudioUrl(null);
      setAudioAvailable(false);
    }
  }, [currentQtContent?.date]);

  // 피드 데이터 로드
  const loadFeed = useCallback(async (reset = false) => {
    if (!church) return;

    const supabase = getSupabaseBrowserClient();
    const currentPage = reset ? 0 : page;
    if (!reset && loadingMore) return;

    setLoadingMore(true);

    try {
      // 두 테이블에서 병합 시 정확한 페이지네이션을 위해
      // 각 테이블에서 충분한 양(ITEMS_PER_PAGE + 1)을 가져와서 병합 후 자름
      const fetchLimit = ITEMS_PER_PAGE + 1;
      const from = currentPage * ITEMS_PER_PAGE;

      // 짧은 묵상과 QT를 별도로 로드 후 병합
      const items: FeedItem[] = [];
      let meditationHasMore = false;
      let qtHasMore = false;

      // 짧은 묵상 로드
      if (filterType === 'all' || filterType === 'meditation') {
        let meditationQuery = supabase
          .from('guest_comments')
          .select('*')
          .eq('church_id', church.id)
          .order('created_at', { ascending: false });

        if (filterDay !== null) {
          meditationQuery = meditationQuery.eq('day_number', filterDay);
        }

        // filterType이 'all'일 때는 커서 기반으로 더 많이 가져옴
        const meditationLimit = filterType === 'all' ? fetchLimit : ITEMS_PER_PAGE + 1;
        const { data: meditations } = await meditationQuery.range(from, from + meditationLimit - 1);

        if (meditations) {
          meditationHasMore = meditations.length > ITEMS_PER_PAGE;

          // 현재 사용자의 좋아요 상태 확인
          let likedIds: string[] = [];
          if (currentUser && meditations.length > 0) {
            const { data: likes } = await supabase
              .from('guest_comment_likes')
              .select('comment_id')
              .eq('user_id', currentUser.id)
              .in('comment_id', meditations.map(m => m.id));
            likedIds = likes?.map(l => l.comment_id) || [];
          }

          items.push(...meditations.map(m => ({
            id: m.id,
            type: 'meditation' as FeedItemType,
            authorName: m.guest_name,
            isAnonymous: m.is_anonymous || false,
            visibility: m.visibility || 'church',
            createdAt: m.created_at,
            dayNumber: m.day_number,
            bibleRange: m.bible_range,
            content: m.content,
            likesCount: m.likes_count || 0,
            repliesCount: m.replies_count || 0,
            isLiked: likedIds.includes(m.id),
            userId: m.linked_user_id,
          })));
        }
      }

      // QT 로드
      if (filterType === 'all' || filterType === 'qt') {
        let qtQuery = supabase
          .from('church_qt_posts')
          .select('*')
          .eq('church_id', church.id)
          .order('created_at', { ascending: false });

        if (filterDay !== null) {
          qtQuery = qtQuery.eq('day_number', filterDay);
        }

        const qtLimit = filterType === 'all' ? fetchLimit : ITEMS_PER_PAGE + 1;
        const { data: qtPosts } = await qtQuery.range(from, from + qtLimit - 1);

        if (qtPosts) {
          qtHasMore = qtPosts.length > ITEMS_PER_PAGE;

          // 현재 사용자의 좋아요 상태 확인
          let likedIds: string[] = [];
          if (currentUser && qtPosts.length > 0) {
            const { data: likes } = await supabase
              .from('church_qt_post_likes')
              .select('post_id')
              .eq('user_id', currentUser.id)
              .in('post_id', qtPosts.map(p => p.id));
            likedIds = likes?.map(l => l.post_id) || [];
          }

          items.push(...qtPosts.map(p => {
            // 해당 날짜의 QT 콘텐츠에서 묵상 질문 찾기
            const qtContent = qtContentList.find(qt => qt.date === p.qt_date);
            // 첫 번째 묵상 질문 사용 (여러 개일 경우)
            const meditationQuestion = qtContent?.meditation?.meditationQuestions?.[0] || null;

            return {
              id: p.id,
              type: 'qt' as FeedItemType,
              authorName: p.author_name,
              isAnonymous: p.is_anonymous || false,
              visibility: p.visibility || 'church',
              createdAt: p.created_at,
              dayNumber: p.day_number,
              qtDate: p.qt_date,
              mySentence: p.my_sentence,
              meditationAnswer: p.meditation_answer,
              meditationQuestion,
              gratitude: p.gratitude,
              myPrayer: p.my_prayer,
              dayReview: p.day_review,
              likesCount: p.likes_count || 0,
              repliesCount: p.replies_count || 0,
              isLiked: likedIds.includes(p.id),
              userId: p.user_id,
            };
          }));
        }
      }

      // 시간순 정렬
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // ITEMS_PER_PAGE만큼만 자르고, 나머지가 있으면 hasMore = true
      const slicedItems = items.slice(0, ITEMS_PER_PAGE);
      const hasMoreItems = filterType === 'all'
        ? items.length > ITEMS_PER_PAGE || meditationHasMore || qtHasMore
        : items.length > ITEMS_PER_PAGE;

      if (reset) {
        setFeedItems(slicedItems);
        setPage(1);
      } else {
        setFeedItems(prev => [...prev, ...slicedItems]);
        setPage(currentPage + 1);
      }

      setHasMore(hasMoreItems);
    } catch (err) {
      console.error('피드 로드 에러:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [church, page, filterType, filterDay, currentUser, loadingMore, qtContentList]);

  // 초기 로드 및 필터 변경 시 리로드
  useEffect(() => {
    if (church) {
      loadFeed(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [church, filterType, filterDay]);

  // 무한 스크롤 Observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadFeed();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loadFeed]);

  // QT 타입 피드 아이템들의 원문 로드
  useEffect(() => {
    const loadQtContents = async () => {
      // QT 타입 아이템 중 캐시에 없는 qtDate 수집
      const qtDatesToLoad: string[] = [];
      feedItems.forEach((item) => {
        if (item.type === 'qt' && item.qtDate && !qtContentCache.has(item.qtDate)) {
          qtDatesToLoad.push(item.qtDate);
        }
      });

      if (qtDatesToLoad.length === 0) return;

      // 병렬로 QT 원문 로드
      const loadedContents: Array<{ date: string; content: QTDailyContent }> = [];
      await Promise.all(
        qtDatesToLoad.map(async (qtDate) => {
          try {
            const qtData = await getQTByDate(qtDate);
            if (qtData) {
              loadedContents.push({ date: qtDate, content: qtData });
            }
          } catch (error) {
            console.error(`QT 원문 로드 실패 (${qtDate}):`, error);
          }
        })
      );

      // 새로 로드된 콘텐츠가 있으면 캐시 업데이트
      if (loadedContents.length > 0) {
        setQtContentCache(prev => {
          const newCache = new Map(prev);
          loadedContents.forEach(({ date, content }) => {
            newCache.set(date, content);
          });
          return newCache;
        });
      }
    };

    loadQtContents();
  }, [feedItems, qtContentCache]);

  // 좋아요 처리 (낙관적 업데이트)
  const handleLike = async (id: string, type: FeedItemType) => {
    if (!currentUser) {
      toast({ variant: 'error', title: '로그인이 필요합니다' });
      return;
    }

    // 현재 아이템 찾기
    const currentItem = feedItems.find(item => item.id === id);
    if (!currentItem) return;

    const isCurrentlyLiked = currentItem.isLiked;

    // 낙관적 업데이트 - UI 먼저 변경
    setFeedItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          isLiked: !isCurrentlyLiked,
          likesCount: isCurrentlyLiked ? item.likesCount - 1 : item.likesCount + 1,
        };
      }
      return item;
    }));

    const supabase = getSupabaseBrowserClient();
    const tableName = type === 'meditation' ? 'guest_comment_likes' : 'church_qt_post_likes';
    const idField = type === 'meditation' ? 'comment_id' : 'post_id';

    try {
      if (isCurrentlyLiked) {
        // 좋아요 취소
        await supabase
          .from(tableName)
          .delete()
          .eq(idField, id)
          .eq('user_id', currentUser.id);
      } else {
        // 좋아요 추가
        await supabase.from(tableName).insert({
          [idField]: id,
          user_id: currentUser.id,
        });
      }
    } catch (error) {
      // 실패 시 롤백
      console.error('좋아요 처리 실패:', error);
      setFeedItems(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            isLiked: isCurrentlyLiked,
            likesCount: isCurrentlyLiked ? item.likesCount + 1 : item.likesCount - 1,
          };
        }
        return item;
      }));
      toast({ variant: 'error', title: '좋아요 처리에 실패했습니다' });
    }
  };

  // 댓글 다이얼로그 열기
  const handleOpenCommentDialog = async (id: string, type: FeedItemType) => {
    setCommentTargetId(id);
    setCommentTargetType(type);
    setCommentDialogOpen(true);
    setLoadingReplies(true);

    const supabase = getSupabaseBrowserClient();
    // 답글 로드
    const tableName = type === 'meditation' ? 'guest_comment_replies' : 'church_qt_post_replies';
    const idField = type === 'meditation' ? 'comment_id' : 'post_id';

    const { data } = await supabase
      .from(tableName)
      .select('*')
      .eq(idField, id)
      .order('created_at', { ascending: true });

    setReplies(data || []);
    setLoadingReplies(false);
  };

  // 답글 제출
  const handleSubmitReply = async () => {
    if (!commentTargetId || !newReply.trim()) return;
    if (!currentUser) {
      toast({ variant: 'error', title: '로그인이 필요합니다' });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setReplySubmitting(true);

    try {
      const tableName = commentTargetType === 'meditation' ? 'guest_comment_replies' : 'church_qt_post_replies';
      const idField = commentTargetType === 'meditation' ? 'comment_id' : 'post_id';

      const { error } = await supabase.from(tableName).insert({
        [idField]: commentTargetId,
        user_id: currentUser.id,
        guest_name: userProfile?.nickname || '사용자',
        content: newReply.trim(),
        device_id: 'web-' + Date.now(),
      });

      if (error) throw error;

      // 답글 목록 새로고침
      const { data } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, commentTargetId)
        .order('created_at', { ascending: true });

      setReplies(data || []);
      setNewReply('');

      // 피드 아이템 업데이트
      setFeedItems(prev => prev.map(item => {
        if (item.id === commentTargetId) {
          return { ...item, repliesCount: item.repliesCount + 1 };
        }
        return item;
      }));

      toast({ variant: 'success', title: '댓글이 등록되었습니다' });
    } catch (err) {
      console.error('댓글 등록 에러:', err);
      toast({ variant: 'error', title: '댓글 등록에 실패했습니다' });
    } finally {
      setReplySubmitting(false);
    }
  };

  // 본인 답글 확인 함수
  const canDeleteReply = (reply: { user_id: string | null; device_id: string | null }): boolean => {
    // 로그인 사용자인 경우: user_id로 확인
    if (currentUser && reply.user_id === currentUser.id) {
      return true;
    }
    return false;
  };

  // 답글 삭제 핸들러
  const handleDeleteReply = async () => {
    if (!deleteReplyId || !commentTargetId) return;

    const supabase = getSupabaseBrowserClient();
    const tableName = commentTargetType === 'meditation' ? 'guest_comment_replies' : 'church_qt_post_replies';

    setDeletingReply(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', deleteReplyId);

      if (error) throw error;

      toast({ variant: 'success', title: '댓글이 삭제되었습니다' });

      setDeleteReplyConfirmOpen(false);
      setDeleteReplyId(null);

      // 답글 목록에서 해당 답글 제거
      setReplies(prev => prev.filter(r => r.id !== deleteReplyId));

      // 피드 아이템 업데이트
      setFeedItems(prev => prev.map(item => {
        if (item.id === commentTargetId) {
          return { ...item, repliesCount: Math.max(0, item.repliesCount - 1) };
        }
        return item;
      }));
    } catch (err) {
      console.error('답글 삭제 에러:', err);
      toast({ variant: 'error', title: '답글 삭제에 실패했습니다' });
    } finally {
      setDeletingReply(false);
    }
  };

  // 작성 다이얼로그 열기
  const handleOpenWriteDialog = (type: 'meditation' | 'qt') => {
    setWriteType(type);
    if (type === 'meditation') {
      setContent('');
      setBibleRange('');
      setSelectedDayNumber(null);
      setIsAnonymous(false);
      if (hasDraft && draft) {
        setShowDraftRestore(true);
      }
    } else {
      setQtAuthorName(isRegisteredMember && userProfile ? userProfile.nickname : guestName);
      setQtFormData(createInitialQTFormData());
      setQtIsAnonymous(false);
    }
    setWriteDialogOpen(true);
  };

  const handleRestoreDraft = () => {
    const restored = restoreDraft();
    if (restored) {
      setContent(restored.content || '');
      setBibleRange(restored.bibleRange || '');
      if (restored.guestName && !isRegisteredMember) {
        setGuestName(restored.guestName);
      }
      toast({ title: '임시저장된 내용을 복원했습니다' });
    }
    setShowDraftRestore(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftRestore(false);
  };

  useEffect(() => {
    if (writeDialogOpen && writeType === 'meditation' && !isEmptyContent(content)) {
      updateDraft({
        content,
        bibleRange,
        guestName: isRegisteredMember ? undefined : guestName,
      });
    }
  }, [content, bibleRange, guestName, writeDialogOpen, writeType, updateDraft, isRegisteredMember]);

  // 짧은 묵상 제출
  const handleSubmitMeditation = async () => {
    if (!church) return;

    const authorName = isRegisteredMember && userProfile ? userProfile.nickname : guestName.trim();

    if (!authorName) {
      toast({ variant: 'error', title: '이름을 입력해주세요' });
      return;
    }

    if (isEmptyContent(content)) {
      toast({ variant: 'error', title: '내용을 입력해주세요' });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setSubmitting(true);

    try {
      const insertData: Record<string, unknown> = {
        church_id: church.id,
        guest_name: authorName,
        device_id: 'church-sharing-' + Date.now(),
        content: content,
        bible_range: bibleRange.trim() || null,
        is_anonymous: isAnonymous,
        visibility: visibility,
        day_number: selectedDayNumber,
      };

      if (isRegisteredMember && currentUser) {
        insertData.linked_user_id = currentUser.id;
        insertData.linked_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('guest_comments')
        .insert(insertData);

      if (error) throw error;

      if (!isRegisteredMember) {
        localStorage.setItem('guest_name', guestName.trim());
      }

      toast({ variant: 'success', title: '묵상 나눔이 등록되었습니다' });
      setWriteDialogOpen(false);
      setContent('');
      setBibleRange('');
      setSelectedDayNumber(null);
      clearDraft();
      loadFeed(true);
    } catch {
      toast({ variant: 'error', title: '등록에 실패했습니다' });
    } finally {
      setSubmitting(false);
    }
  };

  // QT 제출
  const handleSubmitQt = async () => {
    if (!church || !currentQtContent) return;

    if (!qtAuthorName.trim()) {
      toast({ variant: 'error', title: '이름을 입력해주세요' });
      return;
    }

    const hasAnswers = qtFormData.meditationAnswers.some(a => a.trim());
    const hasContent = qtFormData.oneWord || hasAnswers ||
      qtFormData.gratitude || qtFormData.myPrayer || qtFormData.dayReview;

    if (!hasContent) {
      toast({ variant: 'error', title: '최소 하나 이상의 항목을 작성해주세요' });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setQtSubmitting(true);

    try {
      // QT 날짜에 해당하는 통독일정 day_number 찾기
      const matchingDay = (readingPlan as ReadingDay[]).find(d => d.date === selectedQtDate);

      // 다중 답변을 JSON 문자열로 저장 (빈 답변 제외)
      const filteredAnswers = qtFormData.meditationAnswers.filter(a => a.trim());
      const meditationAnswerJson = filteredAnswers.length > 0
        ? JSON.stringify(filteredAnswers)
        : null;

      const insertData = {
        church_id: church.id,
        author_name: qtAuthorName.trim(),
        qt_date: selectedQtDate,
        day_number: matchingDay?.day || null,
        bible_range: currentQtContent?.bibleRange || null, // 통독 일정 저장
        my_sentence: qtFormData.oneWord.trim() || null,
        meditation_answer: meditationAnswerJson,
        gratitude: qtFormData.gratitude.trim() || null,
        my_prayer: qtFormData.myPrayer.trim() || null,
        day_review: qtFormData.dayReview.trim() || null,
        user_id: currentUser?.id || null,
        is_anonymous: qtIsAnonymous,
        visibility: qtVisibility,
      };

      const { error } = await supabase
        .from('church_qt_posts')
        .insert(insertData);

      if (error) throw error;

      // 로그인 사용자의 경우 읽음 완료 자동 체크
      if (currentUser?.id && matchingDay?.day) {
        try {
          await supabase
            .from('church_reading_checks')
            .upsert({
              user_id: currentUser.id,
              church_id: church.id,
              day_number: matchingDay.day,
              checked_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,church_id,day_number',
            });
        } catch {
          // 읽음 체크 실패해도 QT 등록은 성공으로 처리 (무시됨)
        }
      }

      if (!isRegisteredMember) {
        localStorage.setItem('guest_name', qtAuthorName.trim());
      }

      toast({ variant: 'success', title: 'QT 나눔이 등록되었습니다' });
      setWriteDialogOpen(false);
      loadFeed(true);
    } catch (err) {
      console.error('QT 저장 오류:', err);
      toast({ variant: 'error', title: '등록에 실패했습니다' });
    } finally {
      setQtSubmitting(false);
    }
  };

  // 상세 보기
  const handleViewDetail = async (item: FeedItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);

    // QT 타입일 때 QT 원문 로드 (묵상 질문 표시용)
    if (item.type === 'qt' && item.qtDate) {
      try {
        const qtData = await getQTByDate(item.qtDate);
        setSelectedItemQtContent(qtData);
      } catch (error) {
        console.error('QT 원문 로드 실패:', error);
        setSelectedItemQtContent(null);
      }
    } else {
      setSelectedItemQtContent(null);
    }
  };

  // 수정 다이얼로그 열기
  const handleOpenEdit = (item: FeedItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  // 수정 저장
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
            visibility: data.visibility,
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
            visibility: data.visibility,
          })
          .eq('id', data.id);

        if (error) throw error;
      }

      toast({ variant: 'success', title: '수정되었습니다' });
      loadFeed(true);
    } catch (err) {
      console.error('수정 에러:', err);
      toast({ variant: 'error', title: '수정에 실패했습니다' });
      throw err;
    }
  };

  // 삭제 확인 다이얼로그 열기
  const handleOpenDeleteConfirm = (item: FeedItem) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  // 삭제 실행
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const supabase = getSupabaseBrowserClient();
    setDeletingId(itemToDelete.id);

    try {
      const tableName = itemToDelete.type === 'meditation' ? 'guest_comments' : 'church_qt_posts';
      const { error } = await supabase.from(tableName).delete().eq('id', itemToDelete.id);

      if (error) throw error;

      toast({ variant: 'success', title: '삭제되었습니다' });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      loadFeed(true);
    } catch (err) {
      console.error('삭제 에러:', err);
      toast({ variant: 'error', title: '삭제에 실패했습니다' });
    } finally {
      setDeletingId(null);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!selectedItem) return;

    const supabase = getSupabaseBrowserClient();
    setDeletingId(selectedItem.id);

    try {
      const tableName = selectedItem.type === 'meditation' ? 'guest_comments' : 'church_qt_posts';
      const { error } = await supabase.from(tableName).delete().eq('id', selectedItem.id);

      if (error) throw error;

      toast({ variant: 'success', title: '삭제되었습니다' });
      setDetailDialogOpen(false);
      setSelectedItem(null);
      loadFeed(true);
    } catch (err) {
      console.error('삭제 에러:', err);
      toast({ variant: 'error', title: '삭제에 실패했습니다' });
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!church) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <h1 className="text-xl font-bold mb-2">교회를 찾을 수 없습니다</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>
      </div>
    );
  }

  return (
    <ChurchLayout churchCode={churchCode} churchId={church.id}>
    <div className={`min-h-screen bg-muted/30 ${viewMode === 'list' ? 'pb-20 lg:pb-4' : ''}`}>
      {/* 헤더 - 스토리 뷰에서는 숨김 */}
      <header className={`bg-background border-b sticky top-0 z-10 ${viewMode === 'story' ? 'hidden' : ''}`}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/church/${churchCode}`)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-bold text-lg">나눔</h1>
                <p className="text-xs text-muted-foreground">{church.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 뷰 모드 토글 */}
              <div className="flex bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="목록 보기"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('story')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'story'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="스토리 보기"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setShowFilterSheet(true)}
              >
                <Filter className="w-4 h-4" />
                필터
                {(filterType !== 'all' || filterDay !== null) && (
                  <span className="w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 필터 표시 - 목록 뷰에서만 */}
      {viewMode === 'list' && (filterType !== 'all' || filterDay !== null) && (
        <div className="max-w-2xl mx-auto px-4 py-2 bg-primary/5 border-b flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">필터:</span>
          {filterType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
              {filterType === 'qt' ? 'QT' : '묵상'}
              <button onClick={() => setFilterType('all')} className="hover:bg-primary/20 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filterDay !== null && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
              {filterDay}일차
              <button onClick={() => setFilterDay(null)} className="hover:bg-primary/20 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={() => { setFilterType('all'); setFilterDay(null); }}
            className="text-xs text-muted-foreground hover:text-primary ml-auto"
          >
            전체 해제
          </button>
        </div>
      )}

      {/* 스토리 뷰 모드 */}
      {viewMode === 'story' ? (
        <div className="fixed inset-0 z-40">
          <InstagramStyleFeed
            items={feedItems}
            currentUserId={currentUser?.id}
            onLike={handleLike}
            onComment={handleOpenCommentDialog}
            onWrite={() => handleOpenWriteDialog('meditation')}
            hasMore={hasMore}
            onLoadMore={() => loadFeed(false)}
            loading={loadingMore}
          />
          {/* 목록 뷰로 돌아가기 버튼 - 닫기(X) 버튼으로 변경 */}
          <button
            onClick={() => setViewMode('list')}
            className="absolute top-4 left-4 z-[100] w-10 h-10 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/90 transition-colors shadow-lg border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <main className="max-w-2xl mx-auto px-4 py-4">
          {/* 작성 버튼 */}
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => handleOpenWriteDialog('meditation')}
            >
              <PenLine className="w-4 h-4" />
              묵상 작성
            </Button>
            <Button
              className="flex-1 gap-2 bg-primary hover:bg-primary"
              onClick={() => handleOpenWriteDialog('qt')}
            >
              <BookOpen className="w-4 h-4" />
              QT 작성
            </Button>
          </div>

          {/* 피드 */}
          <div className="space-y-3">
            {feedItems.length === 0 && !loadingMore ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">아직 작성된 나눔이 없습니다</p>
                  <p className="text-sm text-muted-foreground mt-1">첫 번째 나눔을 작성해보세요!</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {feedItems.map((item) => (
                  <FeedCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    currentUserId={currentUser?.id}
                    qtContent={item.type === 'qt' && item.qtDate ? qtContentCache.get(item.qtDate) : undefined}
                    onLike={handleLike}
                    onComment={handleOpenCommentDialog}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDeleteConfirm}
                    onViewDetail={handleViewDetail}
                    onAuthorClick={(authorId) => router.push(`/profile/${authorId}`)}
                  />
                ))}

                {/* 무한 스크롤 트리거 */}
                <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
                  {loadingMore && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                </div>
              </>
            )}
          </div>
        </main>
      )}

      {/* 필터 다이얼로그 */}
      <Dialog open={showFilterSheet} onOpenChange={setShowFilterSheet}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>필터</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 글 타입 필터 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">글 타입</label>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="meditation">묵상만</SelectItem>
                  <SelectItem value="qt">QT만</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 통독일정 필터 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">통독일정</label>
              <Select
                value={filterDay?.toString() || 'all'}
                onValueChange={(v) => setFilterDay(v === 'all' ? null : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="전체 일정" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all">전체 일정</SelectItem>
                  {(readingPlan as ReadingDay[]).map((day) => (
                    <SelectItem key={day.day} value={day.day.toString()}>
                      {day.day}일차 - {day.reading}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setFilterType('all'); setFilterDay(null); }}>
              초기화
            </Button>
            <Button onClick={() => setShowFilterSheet(false)}>
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 작성 다이얼로그 */}
      <Dialog open={writeDialogOpen} onOpenChange={setWriteDialogOpen}>
        <DialogContent className={writeType === 'qt' ? "max-w-2xl max-h-[90vh] overflow-y-auto" : "max-w-lg"} aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {writeType === 'qt' ? (
                  <><BookOpen className="w-5 h-5 text-accent" /> QT 작성하기</>
                ) : (
                  <><PenLine className="w-5 h-5 text-accent" /> 묵상 나눔 작성</>
                )}
              </span>
              {writeType === 'meditation' && lastSaved && !isEmptyContent(content) && (
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <Save className="w-3 h-3" />
                  {formatDraftTime(lastSaved)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {writeType === 'meditation' ? (
            // 짧은 묵상 작성 폼
            <>
              {showDraftRestore && (
                <div className="bg-muted dark:bg-primary border border-border dark:border-border rounded-lg p-3">
                  <p className="text-sm text-foreground dark:text-muted-foreground mb-2">
                    이전에 작성하던 내용이 있습니다. 복원하시겠습니까?
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleDiscardDraft}>
                      새로 작성
                    </Button>
                    <Button size="sm" onClick={handleRestoreDraft}>
                      복원하기
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">이름</label>
                  {isRegisteredMember && userProfile ? (
                    <div className="flex items-center gap-2">
                      <Input value={userProfile.nickname} disabled className="bg-muted" />
                      <span className="text-xs text-primary whitespace-nowrap">등록 교인</span>
                    </div>
                  ) : (
                    <Input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="이름을 입력하세요"
                      maxLength={20}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    통독일정 <span className="text-muted-foreground font-normal">(선택)</span>
                  </label>
                  <ReadingDayPicker
                    value={selectedDayNumber}
                    onChange={setSelectedDayNumber}
                    placeholder="통독일정을 선택하세요"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    성경 구절 <span className="text-muted-foreground font-normal">(선택)</span>
                  </label>
                  <Input
                    value={bibleRange}
                    onChange={(e) => setBibleRange(e.target.value)}
                    placeholder="예: 창세기 1:1-10, 요한복음 3장"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">묵상 내용</label>
                  <RichEditor
                    content={content}
                    onChange={(html) => setContent(html)}
                    placeholder="오늘의 말씀을 묵상하고 나눠주세요..."
                    minHeight="120px"
                  />
                </div>

                {/* 공개 범위 및 익명 설정 */}
                <div className="pt-4 space-y-3 border-t">
                  <VisibilitySelector
                    value={visibility}
                    onChange={setVisibility}
                    allowedOptions={['private', 'church', 'public']}
                    variant="inline"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous-comment"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="anonymous-comment" className="text-sm text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      익명으로 작성하기
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setWriteDialogOpen(false)} disabled={submitting}>
                  취소
                </Button>
                <Button
                  onClick={handleSubmitMeditation}
                  disabled={submitting || isEmptyContent(content) || (!isRegisteredMember && !guestName.trim())}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  등록하기
                </Button>
              </DialogFooter>
            </>
          ) : (
            // QT 작성 폼
            <div className="space-y-6 py-4">
              {/* 월 선택 */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  월 선택
                </label>
                <select
                  value={`${selectedQtYear}-${selectedQtMonth}`}
                  onChange={(e) => {
                    const [year, month] = e.target.value.split('-').map(Number);
                    handleQtMonthChange(year, month);
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                >
                  {availableMonths.map((m) => (
                    <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                      {m.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* QT 날짜 선택 */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  QT 날짜 선택
                </label>
                <select
                  value={selectedQtDate}
                  onChange={(e) => setSelectedQtDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                >
                  {qtContentList.map((qt) => (
                    <option key={qt.date} value={qt.date}>
                      {qt.month}/{qt.day} ({qt.dayOfWeek}) - {qt.title || qt.bibleRange}
                    </option>
                  ))}
                </select>
              </div>

              {/* 선택된 QT 컨텐츠 표시 */}
              {currentQtContent && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-muted to-muted rounded-xl p-4 border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {currentQtContent.date} ({currentQtContent.dayOfWeek})
                        </p>
                        <h2 className="text-lg font-bold text-gray-900 mt-1">
                          {currentQtContent.title || '오늘의 QT'}
                        </h2>
                        {currentQtContent.bibleRange && (
                          <p className="text-sm text-gray-600 mt-1">
                            통독: {currentQtContent.bibleRange}
                          </p>
                        )}
                      </div>
                      {currentQtContent.meditation?.oneWord && (
                        <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-border">
                          <p className="text-xs text-accent font-medium">ONE WORD</p>
                          <p className="font-bold text-foreground">{currentQtContent.meditation.oneWord}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 성경 본문 - 접이식 */}
                  {currentQtContent.verses.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection('verses')}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-accent" />
                          <span className="font-medium text-sm">오늘의 말씀: {currentQtContent.verseReference}</span>
                        </div>
                        {expandedSections.verses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedSections.verses && (
                        <div className="px-3 pb-3">
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm max-h-[200px] overflow-y-auto">
                            {currentQtContent.verses.map((v) => (
                              <div key={v.verse} className="flex gap-2">
                                <span className="font-bold text-accent shrink-0 w-5">{v.verse}</span>
                                <p className="text-gray-700">{v.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 묵상 길잡이 */}
                  {currentQtContent.meditation?.meditationGuide && (
                    <div className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection('guide')}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-accent" />
                          <span className="font-medium text-sm">묵상 길잡이</span>
                        </div>
                        {expandedSections.guide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {expandedSections.guide && (
                        <div className="px-3 pb-3 space-y-3">
                          {/* 오디오 플레이어 */}
                          {audioAvailable && audioUrl && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Headphones className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-muted-foreground">묵상 길잡이 듣기</span>
                              </div>
                              <MeditationAudioPlayer
                                audioUrl={audioUrl}
                                title={`${currentQtContent.title} - 묵상 길잡이`}
                                compact
                              />
                            </div>
                          )}
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {currentQtContent.meditation.meditationGuide}
                          </p>
                          {currentQtContent.meditation.jesusConnection && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                              <div className="flex items-center gap-1 mb-1">
                                <Heart className="w-3 h-3 text-red-500" />
                                <span className="text-xs font-semibold text-red-700">예수님 연결</span>
                              </div>
                              <p className="text-xs text-gray-700">{currentQtContent.meditation.jesusConnection}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* 구분선 */}
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-accent" />
                  나의 묵상 작성
                </h3>

                {/* 이름 */}
                <div className="space-y-2 mb-5">
                  <label className="text-sm font-medium">이름</label>
                  {isRegisteredMember && userProfile ? (
                    <div className="flex items-center gap-2">
                      <Input value={userProfile.nickname} disabled className="bg-muted" />
                      <span className="text-xs text-primary whitespace-nowrap">등록 교인</span>
                    </div>
                  ) : (
                    <Input
                      value={qtAuthorName}
                      onChange={(e) => setQtAuthorName(e.target.value)}
                      placeholder="이름을 입력하세요"
                      maxLength={20}
                    />
                  )}
                </div>

                {/* 묵상 영역 */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center text-accent text-xs font-bold">1</span>
                      내 말로 한 문장
                    </label>
                    <Textarea
                      value={qtFormData.oneWord}
                      onChange={(e) => setQtFormData(prev => ({ ...prev, oneWord: e.target.value }))}
                      placeholder="오늘 말씀을 나의 말로 요약해 보세요"
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  {/* 묵상 질문 답변 - 각 질문별로 입력칸 생성 */}
                  {currentQtContent?.meditation?.meditationQuestions && currentQtContent.meditation.meditationQuestions.length > 0 && (
                    <div className="space-y-4">
                      {currentQtContent.meditation.meditationQuestions.map((question, index) => (
                        <div key={index} className="space-y-2">
                          {/* 질문 표시 */}
                          <div className="bg-accent/10 rounded-lg p-3 border-l-4 border-accent">
                            {currentQtContent.meditation!.meditationQuestions.length > 1 && (
                              <span className="text-xs font-semibold text-accent mb-1 block">
                                질문 {index + 1}
                              </span>
                            )}
                            <p className="text-sm text-gray-700 italic">{question}</p>
                          </div>
                          {/* 답변 입력 */}
                          <Textarea
                            value={qtFormData.meditationAnswers[index] || ''}
                            onChange={(e) => {
                              const newAnswers = [...qtFormData.meditationAnswers];
                              newAnswers[index] = e.target.value;
                              setQtFormData(prev => ({ ...prev, meditationAnswers: newAnswers }));
                            }}
                            placeholder="이 질문에 대한 나의 생각을 적어보세요"
                            rows={2}
                            className="resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-xs">+</span>
                      감사와 적용
                    </label>
                    <Textarea
                      value={qtFormData.gratitude}
                      onChange={(e) => setQtFormData(prev => ({ ...prev, gratitude: e.target.value }))}
                      placeholder="오늘 말씀을 통해 감사한 것, 삶에 적용할 것"
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="w-6 h-6 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-xs">*</span>
                      나의 기도
                    </label>
                    <Textarea
                      value={qtFormData.myPrayer}
                      onChange={(e) => setQtFormData(prev => ({ ...prev, myPrayer: e.target.value }))}
                      placeholder="오늘 말씀을 붙들고 드리는 나의 기도"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* 하루 점검 */}
                <div className="mt-6 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl opacity-10" />
                  <div className="relative bg-white dark:bg-background rounded-xl border-2 border-accent/30 dark:border-accent/30 p-4 shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shrink-0">
                        <span className="text-white text-lg">!</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground dark:text-foreground">
                          말씀과 함께한 하루 점검
                        </h4>
                        <p className="text-xs text-accent dark:text-accent mt-0.5">
                          하루를 돌아보며 말씀이 어떻게 적용되었는지 점검해보세요
                        </p>
                      </div>
                    </div>
                    <Textarea
                      value={qtFormData.dayReview}
                      onChange={(e) => setQtFormData(prev => ({ ...prev, dayReview: e.target.value }))}
                      placeholder="예) 오늘 직장에서 힘든 일이 있었는데, 아침 묵상에서 읽은 '평안' 이라는 말씀을 떠올리며 마음을 다잡을 수 있었습니다..."
                      rows={4}
                      className="resize-none border-accent/30 dark:border-accent/50 focus:border-accent focus:ring-accent"
                    />
                  </div>
                </div>

                {/* 공개 범위 및 익명 설정 */}
                <div className="pt-4 mt-4 border-t space-y-3">
                  <VisibilitySelector
                    value={qtVisibility}
                    onChange={setQtVisibility}
                    allowedOptions={['private', 'church', 'public']}
                    variant="inline"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous-qt"
                      checked={qtIsAnonymous}
                      onChange={(e) => setQtIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <label htmlFor="anonymous-qt" className="text-sm text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      익명으로 작성하기
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setWriteDialogOpen(false)} disabled={qtSubmitting}>
                  취소
                </Button>
                <Button
                  onClick={handleSubmitQt}
                  disabled={qtSubmitting || !qtAuthorName.trim()}
                  className="bg-primary hover:bg-primary"
                >
                  {qtSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  등록하기
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem?.type === 'qt' ? (
                <>
                  <div className="w-8 h-8 bg-gradient-to-br from-muted0 to-muted0 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                  오늘의 QT 원문
                </>
              ) : (
                <><PenLine className="w-5 h-5 text-accent" /> 묵상 나눔</>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (() => {
            const displayName = selectedItem.isAnonymous ? '익명' : selectedItem.authorName;
            const avatarColor = selectedItem.isAnonymous ? 'bg-slate-400' : getAvatarColor(selectedItem.authorName);
            const initials = selectedItem.isAnonymous ? '?' : getInitials(selectedItem.authorName);

            // 묵상 타입은 기존 방식 유지
            if (selectedItem.type === 'meditation') {
              return (
                <div className="space-y-4 py-4">
                  {/* 작성자 정보 */}
                  <div className="flex items-center gap-3 pb-3 border-b">
                    <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center`}>
                      <span className="text-white font-medium text-sm">{initials}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{displayName}</p>
                        {selectedItem.isAnonymous && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded">
                            <Lock className="w-3 h-3" />
                            익명
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedItem.dayNumber && `${selectedItem.dayNumber}일차 · `}
                        {formatRelativeTime(selectedItem.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* 묵상 컨텐츠 */}
                  <div>
                    {selectedItem.bibleRange && (
                      <p className="text-xs text-primary bg-primary/10 px-2 py-1 rounded inline-block mb-2">
                        {selectedItem.bibleRange}
                      </p>
                    )}
                    {selectedItem.content?.startsWith('<') ? (
                      <RichViewerWithEmbed content={selectedItem.content} className="text-sm" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{selectedItem.content}</p>
                    )}
                  </div>
                </div>
              );
            }

            // QT 타입: QT 원문 전체 + 나의 묵상
            return (
              <div className="space-y-4 py-2">
                {/* QT 원문 로딩/에러 처리 */}
                {!selectedItemQtContent ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  </div>
                ) : (
                  <>
                    {/* QT 헤더 */}
                    <div className="bg-gradient-to-r from-muted to-muted rounded-xl p-4 border border-border">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            {selectedItemQtContent.date} ({selectedItemQtContent.dayOfWeek})
                          </p>
                          <h2 className="text-lg font-bold text-gray-900 mt-1">
                            {selectedItemQtContent.title || '오늘의 QT'}
                          </h2>
                          {selectedItemQtContent.bibleRange && (
                            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4" />
                              통독: {selectedItemQtContent.bibleRange}
                            </p>
                          )}
                        </div>
                        {selectedItemQtContent.meditation?.oneWord && (
                          <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-border">
                            <p className="text-xs text-accent font-medium">ONE WORD</p>
                            <p className="text-base font-bold text-foreground">{selectedItemQtContent.meditation.oneWord}</p>
                            {selectedItemQtContent.meditation.oneWordSubtitle && (
                              <p className="text-xs text-gray-500">{selectedItemQtContent.meditation.oneWordSubtitle}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 오늘의 말씀 */}
                    {selectedItemQtContent.verses.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                          <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-3.5 h-3.5 text-accent" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900 text-sm">오늘의 말씀</h3>
                            <p className="text-xs text-gray-500">{selectedItemQtContent.verseReference}</p>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {selectedItemQtContent.verses.map((verse) => (
                              <div key={verse.verse} className="flex gap-2">
                                <span className="text-xs font-bold text-accent shrink-0 w-5">
                                  {verse.verse}
                                </span>
                                <p className="text-sm text-gray-700 leading-relaxed">{verse.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 묵상 길잡이 */}
                    {selectedItemQtContent.meditation?.meditationGuide && (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                          <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-3.5 h-3.5 text-accent" />
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm">묵상 길잡이</h3>
                        </div>
                        <div className="p-3">
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {selectedItemQtContent.meditation.meditationGuide}
                          </p>

                          {/* 예수님 연결 */}
                          {selectedItemQtContent.meditation.jesusConnection && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                              <div className="flex items-center gap-2 mb-2">
                                <Heart className="w-3.5 h-3.5 text-red-500" />
                                <span className="text-xs font-semibold text-red-700">예수님 연결</span>
                              </div>
                              <p className="text-sm text-gray-700">{selectedItemQtContent.meditation.jesusConnection}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 묵상 질문 */}
                    {selectedItemQtContent.meditation?.meditationQuestions && selectedItemQtContent.meditation.meditationQuestions.length > 0 && (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                          <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
                            <span className="text-accent font-bold text-xs">?</span>
                          </div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            묵상 질문
                            {selectedItemQtContent.meditation.meditationQuestions.length > 1 && (
                              <span className="ml-1 text-xs font-normal text-accent">
                                ({selectedItemQtContent.meditation.meditationQuestions.length}개)
                              </span>
                            )}
                          </h3>
                        </div>
                        <div className="p-3 space-y-2">
                          {selectedItemQtContent.meditation.meditationQuestions.map((question, index) => (
                            <div key={index} className="bg-accent/10 rounded-lg p-3 border-l-4 border-accent">
                              {selectedItemQtContent.meditation!.meditationQuestions.length > 1 && (
                                <span className="text-xs font-semibold text-accent mb-1 block">
                                  질문 {index + 1}
                                </span>
                              )}
                              <p className="text-sm text-gray-700 italic">{question}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 오늘의 기도 */}
                    {selectedItemQtContent.meditation?.prayer && (
                      <div className="bg-gradient-to-r from-indigo-50 to-muted rounded-xl p-4 border border-accent/30">
                        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
                          🙏 오늘의 기도
                        </h3>
                        <p className="text-gray-700 text-sm italic leading-relaxed">
                          {selectedItemQtContent.meditation.prayer}
                        </p>
                      </div>
                    )}

                    {/* 구분선 - 나의 묵상 */}
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-dashed border-border"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-4 py-1 text-sm font-semibold text-foreground flex items-center gap-2 rounded-full border border-border">
                          <PenLine className="w-4 h-4" />
                          나의 묵상
                        </span>
                      </div>
                    </div>

                    {/* 작성자 정보 */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/60 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center shrink-0 shadow-sm`}>
                        <span className="text-white font-semibold text-sm">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground">{formatRelativeTime(selectedItem.createdAt)}</p>
                      </div>
                    </div>

                    {/* 사용자 QT 답변 */}
                    <QTContentRenderer
                      data={{
                        mySentence: selectedItem.mySentence,
                        meditationAnswer: selectedItem.meditationAnswer,
                        meditationQuestion: selectedItem.meditationQuestion,
                        gratitude: selectedItem.gratitude,
                        myPrayer: selectedItem.myPrayer,
                        dayReview: selectedItem.dayReview,
                      }}
                      qtContent={selectedItemQtContent}
                    />
                  </>
                )}
              </div>
            );
          })()}

          <DialogFooter className="flex-row justify-between gap-2">
            {selectedItem && currentUser && selectedItem.userId === currentUser.id && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deletingId === selectedItem.id}
              >
                {deletingId === selectedItem.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                삭제
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 댓글 다이얼로그 */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              댓글
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 py-4 space-y-3">
            {loadingReplies ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : replies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">아직 댓글이 없습니다</p>
              </div>
            ) : (
              replies.map((reply) => {
                const replyDisplayName = reply.is_anonymous ? '익명' : reply.guest_name;
                const replyAvatarColor = reply.is_anonymous ? 'bg-gray-400' : getAvatarColor(reply.guest_name);
                const replyInitials = reply.is_anonymous ? '?' : getInitials(reply.guest_name);

                return (
                  <div key={reply.id} className="flex gap-2 group">
                    <div className={`w-8 h-8 rounded-full ${replyAvatarColor} flex items-center justify-center shrink-0`}>
                      <span className="text-white font-medium text-xs">{replyInitials}</span>
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-lg p-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{replyDisplayName}</span>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(reply.created_at)}</span>
                        </div>
                        {/* 본인 답글 삭제 버튼 */}
                        {canDeleteReply(reply) && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteReplyId(reply.id);
                              setDeleteReplyConfirmOpen(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder={currentUser ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
                disabled={!currentUser || replySubmitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply();
                  }
                }}
              />
              <Button
                onClick={handleSubmitReply}
                disabled={!currentUser || !newReply.trim() || replySubmitting}
              >
                {replySubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 답글 삭제 확인 다이얼로그 */}
      <Dialog open={deleteReplyConfirmOpen} onOpenChange={setDeleteReplyConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>댓글 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteReplyConfirmOpen(false);
                setDeleteReplyId(null);
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

      {/* 수정 다이얼로그 */}
      <EditPostDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={editingItem}
        onSave={handleSaveEdit}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>삭제 확인</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            이 {itemToDelete?.type === 'qt' ? 'QT' : '묵상'}을 삭제하시겠습니까?
            삭제된 내용은 복구할 수 없습니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 하단 네비게이션은 ChurchLayout에서 처리 */}
    </div>
    </ChurchLayout>
  );
}
