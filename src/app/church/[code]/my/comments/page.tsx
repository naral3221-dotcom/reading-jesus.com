'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  Filter,
  X,
  Loader2,
  PenLine,
  BookOpen,
  Calendar,
  Trash2,
  Users,
  Church,
} from 'lucide-react';
import { ChurchBottomNav } from '@/components/church/ChurchBottomNav';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { subDays, subMonths, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FeedCard, FeedItem, FeedItemType } from '@/components/church/FeedCard';
import { EditPostDialog, EditPostData } from '@/components/church/EditPostDialog';
import { useToast } from '@/components/ui/toast';
import { getQTByDate } from '@/lib/qt-content';
import { QTDailyContent } from '@/types';
import { findReadingByDay } from '@/components/church/ReadingDayPicker';
import {
  useUserMeditations,
  useDeleteUnifiedMeditation,
  useToggleUnifiedMeditationLike,
  useUpdateUnifiedMeditation,
} from '@/presentation/hooks/queries/useUnifiedMeditation';
import type { UnifiedMeditationProps, SourceType, ContentType } from '@/domain/entities/UnifiedMeditation';

type DateFilter = 'all' | 'week' | 'month' | '3months';
type TypeFilter = 'all' | 'meditation' | 'qt';
type SourceFilter = 'all' | 'church' | 'group';

interface FilterState {
  keyword: string;
  dateFilter: DateFilter;
  typeFilter: TypeFilter;
  sourceFilter: SourceFilter;
}

// UnifiedMeditationProps를 FeedItem으로 변환
function toFeedItem(meditation: UnifiedMeditationProps): FeedItem {
  const type: FeedItemType = meditation.contentType === 'qt' ? 'qt' : 'meditation';

  return {
    id: meditation.id,
    type,
    authorName: meditation.authorName,
    isAnonymous: meditation.isAnonymous,
    createdAt: meditation.createdAt.toISOString(),
    dayNumber: meditation.dayNumber ?? undefined,
    bibleRange: meditation.bibleRange ?? undefined,
    content: meditation.content ?? undefined,
    // QT 필드
    qtDate: meditation.qtDate?.toISOString().split('T')[0],
    mySentence: meditation.mySentence ?? undefined,
    meditationAnswer: meditation.meditationAnswer ?? undefined,
    gratitude: meditation.gratitude ?? undefined,
    myPrayer: meditation.myPrayer ?? undefined,
    dayReview: meditation.dayReview ?? undefined,
    // 상태
    likesCount: meditation.likesCount,
    repliesCount: meditation.repliesCount,
    isLiked: meditation.isLiked ?? false,
    userId: meditation.userId ?? undefined,
    // 출처 정보 (확장)
    sourceType: meditation.sourceType,
    sourceName: meditation.sourceName,
  };
}

export default function ChurchMyCommentsPage() {
  const router = useRouter();
  const params = useParams();
  const churchCode = params.code as string;
  const { toast } = useToast();

  const [userId, setUserId] = useState<string | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [churchName, setChurchName] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  // QT 원문 캐시
  const [qtContentCache, setQtContentCache] = useState<Map<string, QTDailyContent>>(new Map());

  // 필터 상태
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    dateFilter: 'all',
    typeFilter: 'all',
    sourceFilter: 'all',
  });

  // 수정/삭제 다이얼로그
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FeedItem | null>(null);

  // 사용자 및 교회 정보 초기화
  useEffect(() => {
    const init = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const { data: church } = await supabase
        .from('churches')
        .select('id, name')
        .eq('code', churchCode)
        .single();

      if (church) {
        setChurchId(church.id);
        setChurchName(church.name);
      }
      setInitialLoading(false);
    };
    init();
  }, [router, churchCode]);

  // 통합 훅 사용 - 사용자의 모든 묵상 조회
  const { data: meditations, isLoading: meditationsLoading } = useUserMeditations(userId, {
    enabled: !!userId,
  });

  const deleteMutation = useDeleteUnifiedMeditation();
  const likeMutation = useToggleUnifiedMeditationLike();
  const updateMutation = useUpdateUnifiedMeditation();

  // FeedItem으로 변환
  const feedItems = useMemo(() => {
    if (!meditations) return [];
    return meditations.map(toFeedItem);
  }, [meditations]);

  // QT 원문 로드
  useEffect(() => {
    const loadQtContents = async () => {
      const qtDates = new Set<string>();
      feedItems.forEach((item) => {
        if (item.type === 'qt' && item.qtDate && !qtContentCache.has(item.qtDate)) {
          qtDates.add(item.qtDate);
        }
      });

      if (qtDates.size === 0) return;

      const newCache = new Map(qtContentCache);
      await Promise.all(
        Array.from(qtDates).map(async (qtDate) => {
          try {
            const qtData = await getQTByDate(qtDate);
            if (qtData) {
              newCache.set(qtDate, qtData);
            }
          } catch {
            // ignore
          }
        })
      );

      if (newCache.size > qtContentCache.size) {
        setQtContentCache(newCache);
      }
    };

    loadQtContents();
  }, [feedItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // 필터 적용
  const filteredItems = useMemo(() => {
    let result = [...feedItems];

    // 출처 필터
    if (filters.sourceFilter !== 'all') {
      result = result.filter(item => item.sourceType === filters.sourceFilter);
    }

    // 타입 필터
    if (filters.typeFilter !== 'all') {
      result = result.filter(item => item.type === filters.typeFilter);
    }

    // 키워드 필터
    if (filters.keyword.trim()) {
      const keyword = filters.keyword.toLowerCase();
      result = result.filter(item => {
        if (item.type === 'meditation') {
          return item.content?.toLowerCase().includes(keyword);
        } else {
          return (
            item.mySentence?.toLowerCase().includes(keyword) ||
            item.meditationAnswer?.toLowerCase().includes(keyword) ||
            item.gratitude?.toLowerCase().includes(keyword) ||
            item.myPrayer?.toLowerCase().includes(keyword) ||
            item.dayReview?.toLowerCase().includes(keyword)
          );
        }
      });
    }

    // 기간 필터
    const now = new Date();
    if (filters.dateFilter === 'week') {
      const weekAgo = subDays(now, 7);
      result = result.filter(item => new Date(item.createdAt) >= weekAgo);
    } else if (filters.dateFilter === 'month') {
      const monthAgo = subMonths(now, 1);
      result = result.filter(item => new Date(item.createdAt) >= monthAgo);
    } else if (filters.dateFilter === '3months') {
      const threeMonthsAgo = subMonths(now, 3);
      result = result.filter(item => new Date(item.createdAt) >= threeMonthsAgo);
    }

    return result;
  }, [feedItems, filters]);

  const clearFilters = () => {
    setFilters({
      keyword: '',
      dateFilter: 'all',
      typeFilter: 'all',
      sourceFilter: 'all',
    });
  };

  const hasActiveFilters = () => {
    return filters.keyword !== '' ||
           filters.dateFilter !== 'all' ||
           filters.typeFilter !== 'all' ||
           filters.sourceFilter !== 'all';
  };

  // 좋아요 처리
  const handleLike = async (id: string) => {
    if (!userId) return;
    likeMutation.mutate({
      meditationId: id,
      userId,
      guestToken: null,
    });
  };

  // 댓글 다이얼로그 열기 (상세 페이지로 이동)
  const handleComment = (id: string) => {
    const item = feedItems.find(i => i.id === id);
    if (item?.sourceType === 'church') {
      if (item?.dayNumber) {
        router.push(`/church/${churchCode}/sharing?day=${item.dayNumber}`);
      } else {
        router.push(`/church/${churchCode}/sharing`);
      }
    } else {
      // 그룹 묵상은 그룹 페이지로 이동 (추후 구현)
      toast({ variant: 'default', title: '그룹 페이지에서 확인하세요' });
    }
  };

  // 수정 다이얼로그 열기
  const handleOpenEdit = (item: FeedItem) => {
    setEditingItem(item);
    setEditDialogOpen(true);
  };

  // 수정 저장
  const handleSaveEdit = async (data: EditPostData) => {
    const meditation = meditations?.find(m => m.id === data.id);
    if (!meditation) return;

    const readingInfo = data.dayNumber ? findReadingByDay(data.dayNumber) : null;

    try {
      await updateMutation.mutateAsync({
        id: data.id,
        userId,
        guestToken: null,
        input: {
          content: data.type === 'meditation' ? data.content : undefined,
          bibleRange: readingInfo?.reading || undefined,
          mySentence: data.type === 'qt' ? data.mySentence : undefined,
          meditationAnswer: data.type === 'qt' ? data.meditationAnswer : undefined,
          gratitude: data.type === 'qt' ? data.gratitude : undefined,
          myPrayer: data.type === 'qt' ? data.myPrayer : undefined,
          dayReview: data.type === 'qt' ? data.dayReview : undefined,
          isAnonymous: data.isAnonymous,
        },
      });
      toast({ variant: 'success', title: '수정되었습니다' });
    } catch {
      toast({ variant: 'error', title: '수정에 실패했습니다' });
      throw new Error('수정 실패');
    }
  };

  // 삭제 확인
  const handleOpenDeleteConfirm = (item: FeedItem) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  // 삭제 실행
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        id: itemToDelete.id,
        userId,
        guestToken: null,
      });
      toast({ variant: 'success', title: '삭제되었습니다' });
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    } catch {
      toast({ variant: 'error', title: '삭제에 실패했습니다' });
    }
  };

  // 통계 계산
  const stats = useMemo(() => ({
    total: feedItems.length,
    meditations: feedItems.filter(i => i.type === 'meditation').length,
    qts: feedItems.filter(i => i.type === 'qt').length,
    fromChurch: feedItems.filter(i => i.sourceType === 'church').length,
    fromGroup: feedItems.filter(i => i.sourceType === 'group').length,
  }), [feedItems]);

  const loading = initialLoading || meditationsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-4 lg:ml-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">내가 쓴 글</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <ChurchBottomNav churchCode={churchCode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-4 lg:ml-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto px-4">
          <div className="h-14 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/church/${churchCode}/my`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold flex-1">내가 쓴 글</h1>
            <Button
              variant={showFilters ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="w-5 h-5" />
              {hasActiveFilters() && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </Button>
          </div>

          {/* Search bar */}
          <div className="pb-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="내용 검색..."
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              className="pl-9"
            />
            {filters.keyword && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setFilters(prev => ({ ...prev, keyword: '' }))}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="pb-3 p-3 bg-muted/50 rounded-lg space-y-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">필터</span>
                {hasActiveFilters() && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                    초기화
                  </Button>
                )}
              </div>

              {/* 출처 필터 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Church className="w-3 h-3" />
                  작성 위치
                </label>
                <Select
                  value={filters.sourceFilter}
                  onValueChange={(value: SourceFilter) => setFilters(prev => ({ ...prev, sourceFilter: value }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="church">교회</SelectItem>
                    <SelectItem value="group">그룹</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 타입 필터 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <PenLine className="w-3 h-3" />
                  글 타입
                </label>
                <Select
                  value={filters.typeFilter}
                  onValueChange={(value: TypeFilter) => setFilters(prev => ({ ...prev, typeFilter: value }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="meditation">묵상</SelectItem>
                    <SelectItem value="qt">QT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 기간 필터 */}
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  기간
                </label>
                <Select
                  value={filters.dateFilter}
                  onValueChange={(value: DateFilter) => setFilters(prev => ({ ...prev, dateFilter: value }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 기간</SelectItem>
                    <SelectItem value="week">최근 1주일</SelectItem>
                    <SelectItem value="month">최근 1개월</SelectItem>
                    <SelectItem value="3months">최근 3개월</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-2xl mx-auto px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{stats.total}</p>
              <p className="text-xs text-muted-foreground">전체</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-accent">{stats.meditations}</p>
              <p className="text-xs text-muted-foreground">묵상</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-accent">{stats.qts}</p>
              <p className="text-xs text-muted-foreground">QT</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Church className="w-3 h-3" /> {stats.fromChurch}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {stats.fromGroup}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters() && (
        <div className="max-w-2xl mx-auto px-4 py-2 bg-primary/5 border-b flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">필터:</span>
          {filters.sourceFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
              {filters.sourceFilter === 'church' ? '교회' : '그룹'}
              <button onClick={() => setFilters(prev => ({ ...prev, sourceFilter: 'all' }))} className="hover:bg-primary/20 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.typeFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
              {filters.typeFilter === 'qt' ? 'QT' : '묵상'}
              <button onClick={() => setFilters(prev => ({ ...prev, typeFilter: 'all' }))} className="hover:bg-primary/20 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.dateFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
              {filters.dateFilter === 'week' ? '1주일' : filters.dateFilter === 'month' ? '1개월' : '3개월'}
              <button onClick={() => setFilters(prev => ({ ...prev, dateFilter: 'all' }))} className="hover:bg-primary/20 rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-primary ml-auto"
          >
            전체 해제
          </button>
        </div>
      )}

      {/* Feed */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {filteredItems.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                {filters.typeFilter === 'qt' ? (
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <PenLine className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-muted-foreground">
                {hasActiveFilters() ? '검색 결과가 없습니다' : '아직 작성한 글이 없습니다'}
              </p>
              {!hasActiveFilters() && (
                <Button
                  variant="link"
                  onClick={() => router.push(`/church/${churchCode}/sharing`)}
                  className="mt-2"
                >
                  나눔 작성하러 가기
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="relative">
                {/* 출처 배지 */}
                <div className="absolute -top-2 left-3 z-10">
                  <Badge
                    variant={item.sourceType === 'church' ? 'default' : 'secondary'}
                    className="text-[10px] h-5 px-2"
                  >
                    {item.sourceType === 'church' ? (
                      <><Church className="w-3 h-3 mr-1" /> {item.sourceName || '교회'}</>
                    ) : (
                      <><Users className="w-3 h-3 mr-1" /> {item.sourceName || '그룹'}</>
                    )}
                  </Badge>
                </div>
                <FeedCard
                  item={item}
                  currentUserId={userId}
                  qtContent={item.type === 'qt' && item.qtDate ? qtContentCache.get(item.qtDate) : undefined}
                  onLike={handleLike}
                  onComment={handleComment}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDeleteConfirm}
                  onAuthorClick={(authorId) => router.push(`/profile/${authorId}`)}
                />
              </div>
            ))}
          </>
        )}
      </main>

      {/* 수정 다이얼로그 */}
      <EditPostDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={editingItem}
        onSave={handleSaveEdit}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>삭제 확인</DialogTitle>
            <DialogDescription>
              이 {itemToDelete?.type === 'qt' ? 'QT' : '묵상'}을 삭제하시겠습니까?
              삭제된 내용은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 하단 네비게이션 */}
      <ChurchBottomNav churchCode={churchCode} />
    </div>
  );
}
