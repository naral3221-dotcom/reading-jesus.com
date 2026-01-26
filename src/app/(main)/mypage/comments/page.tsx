'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CommentSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronLeft,
  Search,
  Filter,
  X,
  Heart,
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  BookOpen,
  Church,
  Users,
} from 'lucide-react';
import { formatDistanceToNow, subDays, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import readingPlan from '@/data/reading_plan.json';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import {
  useUserMeditations,
  useDeleteUnifiedMeditation,
} from '@/presentation/hooks/queries/useUnifiedMeditation';
import type { UnifiedMeditationProps, SourceType } from '@/domain/entities/UnifiedMeditation';

type DateFilter = 'all' | 'week' | 'month' | '3months' | 'custom';
type SourceFilterType = 'all' | 'church' | 'group';

interface FilterState {
  keyword: string;
  dateFilter: DateFilter;
  customStartDate: string;
  customEndDate: string;
  bibleBook: string;
  sourceFilter: SourceFilterType;
}

export default function MyCommentsPage() {
  const router = useRouter();
  const { toast } = useToast();

  // React Query 훅 사용
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const userId = currentUser?.user?.id ?? null;

  // 통합 묵상 조회 훅 사용 (모든 출처)
  const { data: meditations, isLoading: meditationsLoading } = useUserMeditations(userId);
  const deleteMeditation = useDeleteUnifiedMeditation();

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    dateFilter: 'all',
    customStartDate: '',
    customEndDate: '',
    bibleBook: 'all',
    sourceFilter: 'all',
  });

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Get unique Bible books from reading plan
  const bibleBooks = Array.from(new Set(readingPlan.map((p) => p.book)));

  // 필터링된 묵상
  const filteredMeditations = useMemo(() => {
    if (!meditations) return [];

    let result = [...meditations];

    // 출처 필터
    if (filters.sourceFilter !== 'all') {
      result = result.filter((m) => m.sourceType === filters.sourceFilter);
    }

    // Keyword filter
    if (filters.keyword.trim()) {
      const keyword = filters.keyword.toLowerCase();
      result = result.filter((m) => {
        const content = m.content?.toLowerCase() || '';
        const mySentence = m.mySentence?.toLowerCase() || '';
        const meditationAnswer = m.meditationAnswer?.toLowerCase() || '';
        const myPrayer = m.myPrayer?.toLowerCase() || '';
        return (
          content.includes(keyword) ||
          mySentence.includes(keyword) ||
          meditationAnswer.includes(keyword) ||
          myPrayer.includes(keyword)
        );
      });
    }

    // Date filter
    const now = new Date();
    if (filters.dateFilter === 'week') {
      const weekAgo = subDays(now, 7);
      result = result.filter((m) => m.createdAt >= weekAgo);
    } else if (filters.dateFilter === 'month') {
      const monthAgo = subMonths(now, 1);
      result = result.filter((m) => m.createdAt >= monthAgo);
    } else if (filters.dateFilter === '3months') {
      const threeMonthsAgo = subMonths(now, 3);
      result = result.filter((m) => m.createdAt >= threeMonthsAgo);
    } else if (filters.dateFilter === 'custom') {
      if (filters.customStartDate) {
        result = result.filter((m) => m.createdAt >= new Date(filters.customStartDate));
      }
      if (filters.customEndDate) {
        const endDate = new Date(filters.customEndDate);
        endDate.setHours(23, 59, 59, 999);
        result = result.filter((m) => m.createdAt <= endDate);
      }
    }

    // Bible book filter
    if (filters.bibleBook && filters.bibleBook !== 'all') {
      const matchingDays = readingPlan
        .filter((p) => p.book === filters.bibleBook)
        .map((p) => p.day);
      result = result.filter((m) => m.dayNumber && matchingDays.includes(m.dayNumber));
    }

    return result;
  }, [meditations, filters]);

  // 통계 계산
  const stats = useMemo(() => {
    if (!meditations) return { total: 0, church: 0, group: 0 };
    return {
      total: meditations.length,
      church: meditations.filter((m) => m.sourceType === 'church').length,
      group: meditations.filter((m) => m.sourceType === 'group').length,
    };
  }, [meditations]);

  // 로그인 체크
  useEffect(() => {
    if (!userLoading && !currentUser?.user) {
      router.push('/login');
    }
  }, [userLoading, currentUser?.user, router]);

  const clearFilters = () => {
    setFilters({
      keyword: '',
      dateFilter: 'all',
      customStartDate: '',
      customEndDate: '',
      bibleBook: 'all',
      sourceFilter: 'all',
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.keyword !== '' ||
      filters.dateFilter !== 'all' ||
      filters.bibleBook !== 'all' ||
      filters.sourceFilter !== 'all'
    );
  };

  const handleDelete = async () => {
    if (!deleteTargetId || !userId) return;

    try {
      await deleteMeditation.mutateAsync({ id: deleteTargetId, userId, guestToken: null });
      toast({
        variant: 'success',
        title: '삭제되었습니다',
      });
    } catch {
      toast({
        variant: 'error',
        title: '삭제에 실패했습니다',
      });
    }

    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  const openDeleteDialog = (id: string) => {
    setDeleteTargetId(id);
    setDeleteDialogOpen(true);
  };

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  const getPlanInfo = (dayNumber: number | null) => {
    if (!dayNumber) return null;
    return readingPlan.find((p) => p.day === dayNumber);
  };

  const goToMeditation = (meditation: UnifiedMeditationProps) => {
    if (meditation.sourceType === 'church') {
      // 교회 묵상은 교회 페이지로 이동 (sourceId가 church_id)
      // TODO: church_code로 변환 필요
      router.push(`/community?day=${meditation.dayNumber}`);
    } else {
      router.push(`/community?day=${meditation.dayNumber}`);
    }
  };

  // 출처별 아이콘과 색상
  const getSourceInfo = (sourceType: SourceType) => {
    if (sourceType === 'church') {
      return {
        icon: Church,
        label: '교회',
        color: 'bg-accent/10 text-accent dark:bg-accent dark:text-accent-foreground',
      };
    }
    return {
      icon: Users,
      label: '그룹',
      color: 'bg-accent/10 text-accent dark:bg-accent dark:text-accent-foreground',
    };
  };

  // 묵상 내용 가져오기
  const getContent = (meditation: UnifiedMeditationProps) => {
    if (meditation.contentType === 'qt') {
      // QT 타입: 여러 필드를 조합
      return (
        meditation.mySentence ||
        meditation.meditationAnswer ||
        meditation.myPrayer ||
        '(QT 묵상)'
      );
    }
    return meditation.content || '';
  };

  const loading = userLoading || meditationsLoading;

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">내가 쓴 묵상</h1>
        </div>
        <div className="flex-1 p-4">
          <CommentSkeleton count={5} />
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
          <h1 className="text-lg font-bold flex-1">내가 쓴 묵상</h1>
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
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="묵상 내용 검색..."
            value={filters.keyword}
            onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            className="pl-9"
          />
          {filters.keyword && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setFilters((prev) => ({ ...prev, keyword: '' }))}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">필터</span>
              {hasActiveFilters() && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                  초기화
                </Button>
              )}
            </div>

            {/* Source filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">출처</label>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={filters.sourceFilter === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilters((prev) => ({ ...prev, sourceFilter: 'all' }))}
                >
                  전체
                </Badge>
                <Badge
                  variant={filters.sourceFilter === 'church' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilters((prev) => ({ ...prev, sourceFilter: 'church' }))}
                >
                  <Church className="w-3 h-3 mr-1" />
                  교회 ({stats.church})
                </Badge>
                <Badge
                  variant={filters.sourceFilter === 'group' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilters((prev) => ({ ...prev, sourceFilter: 'group' }))}
                >
                  <Users className="w-3 h-3 mr-1" />
                  그룹 ({stats.group})
                </Badge>
              </div>
            </div>

            {/* Date filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                기간
              </label>
              <Select
                value={filters.dateFilter}
                onValueChange={(value: DateFilter) =>
                  setFilters((prev) => ({ ...prev, dateFilter: value }))
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 기간</SelectItem>
                  <SelectItem value="week">최근 1주일</SelectItem>
                  <SelectItem value="month">최근 1개월</SelectItem>
                  <SelectItem value="3months">최근 3개월</SelectItem>
                  <SelectItem value="custom">직접 선택</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom date range */}
            {filters.dateFilter === 'custom' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">시작일</label>
                  <Input
                    type="date"
                    value={filters.customStartDate}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, customStartDate: e.target.value }))
                    }
                    className="h-9"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">종료일</label>
                  <Input
                    type="date"
                    value={filters.customEndDate}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, customEndDate: e.target.value }))
                    }
                    className="h-9"
                  />
                </div>
              </div>
            )}

            {/* Bible book filter */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                성경
              </label>
              <Select
                value={filters.bibleBook}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, bibleBook: value }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 성경</SelectItem>
                  {bibleBooks.map((book) => (
                    <SelectItem key={book} value={book}>
                      {book}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-medium text-foreground">{filteredMeditations.length}</span>
            개의 묵상
            {hasActiveFilters() && meditations && meditations.length !== filteredMeditations.length && (
              <span className="ml-1">(전체 {meditations.length}개)</span>
            )}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Church className="w-3 h-3 text-accent" />
              {stats.church}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3 text-accent" />
              {stats.group}
            </span>
          </div>
        </div>
      </div>

      {/* Meditations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredMeditations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {hasActiveFilters() ? '검색 결과가 없습니다' : '아직 작성한 묵상이 없습니다'}
            </p>
            {!hasActiveFilters() && (
              <Button variant="link" onClick={() => router.push('/community')} className="mt-2">
                묵상 나눔 바로가기
              </Button>
            )}
          </div>
        ) : (
          filteredMeditations.map((meditation) => {
            const planInfo = getPlanInfo(meditation.dayNumber);
            const sourceInfo = getSourceInfo(meditation.sourceType);
            const SourceIcon = sourceInfo.icon;
            const content = getContent(meditation);

            return (
              <Card key={meditation.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => goToMeditation(meditation)}
                      className="text-left hover:underline"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-primary">
                          {meditation.dayNumber ? `Day ${meditation.dayNumber}` : meditation.contentType === 'qt' ? 'QT' : '묵상'}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 ${sourceInfo.color}`}
                        >
                          <SourceIcon className="w-2.5 h-2.5 mr-0.5" />
                          {meditation.sourceName || sourceInfo.label}
                        </Badge>
                        {meditation.contentType === 'qt' && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            QT
                          </Badge>
                        )}
                      </div>
                      {planInfo && (
                        <p className="text-xs text-muted-foreground">
                          {planInfo.book} {planInfo.range}
                        </p>
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(meditation.createdAt)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => goToMeditation(meditation)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            수정하기
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(meditation.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">
                    {content}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-muted-foreground">
                    <span className="flex items-center gap-1 text-xs">
                      <Heart
                        className={`w-3 h-3 ${meditation.likesCount > 0 ? 'text-red-500 fill-current' : ''}`}
                      />
                      {meditation.likesCount}
                    </span>
                    <span className="flex items-center gap-1 text-xs">
                      <MessageCircle className="w-3 h-3" />
                      {meditation.repliesCount || 0}
                    </span>
                    {meditation.isAnonymous && (
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">익명</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>묵상 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 묵상을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
