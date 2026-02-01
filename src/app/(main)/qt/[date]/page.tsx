'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QTDailyContent } from '@/types';
import { getQTByDate, loadQTData } from '@/lib/qt-content';
import { QTViewer } from '@/components/qt';
import { MeditationPanel, SelectedVerse, MeditationSubmitData } from '@/components/meditation';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { formatRelativeTime } from '@/lib/date-utils';
import { useGroupCompat } from '@/presentation/hooks/stores/useGroupStore';

// Device ID 관리
function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'qt_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = 'qt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

interface GuestComment {
  id: string;
  guest_name: string;
  content: string;
  bible_range: string | null;
  is_anonymous: boolean;
  device_id: string;
  created_at: string;
}

export default function QTPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { activeGroup } = useGroupCompat();
  const date = params.date as string; // 2026-01-24 형태

  // activeGroup.id를 안정적인 참조로 추출 (무한 루프 방지)
  const activeGroupId = activeGroup?.id;
  const activeGroupName = activeGroup?.name;

  const [qt, setQt] = useState<QTDailyContent | null>(null);
  const [allQTs, setAllQTs] = useState<QTDailyContent[]>([]);
  const [loading, setLoading] = useState(true);

  // 묵상 패널 상태
  const [meditationPanelOpen, setMeditationPanelOpen] = useState(false);
  const [meditationVerses, setMeditationVerses] = useState<SelectedVerse[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 내 묵상 목록 상태
  const [myComments, setMyComments] = useState<GuestComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');

  // 수정 다이얼로그 상태
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<GuestComment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editBibleRange, setEditBibleRange] = useState('');
  const [editName, setEditName] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // 삭제 다이얼로그 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingComment, setDeletingComment] = useState<GuestComment | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Device ID 초기화
  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  // 내 묵상 목록 로드 (그룹이 있을 때만)
  const loadMyComments = useCallback(async () => {
    if (!activeGroupId || !deviceId) return;

    setLoadingComments(true);
    const supabase = getSupabaseBrowserClient();
    try {
      // unified_meditations에서 내 묵상 조회 (Phase 4 마이그레이션)
      const { data } = await supabase
        .from('unified_meditations')
        .select('*')
        .eq('source_id', activeGroupId)
        .eq('guest_token', deviceId)
        .order('created_at', { ascending: false });

      // 기존 인터페이스에 맞게 매핑
      const mappedData = (data || []).map(row => ({
        id: row.legacy_id || row.id,
        church_id: row.source_id,
        guest_name: row.author_name || '익명',
        device_id: row.guest_token,
        content: row.content,
        bible_range: row.bible_range,
        is_anonymous: row.is_anonymous,
        likes_count: row.likes_count || 0,
        replies_count: row.replies_count || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      setMyComments(mappedData);
    } catch (err) {
      console.error('내 묵상 로드 에러:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [activeGroupId, deviceId]);

  useEffect(() => {
    loadMyComments();
  }, [loadMyComments]);

  // QT 데이터 로드
  useEffect(() => {
    async function fetchData() {
      // URL의 date에서 년/월 파싱
      const [yearStr, monthStr] = date.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      const [qtData, allData] = await Promise.all([
        getQTByDate(date),
        loadQTData(year, month),
      ]);
      setQt(qtData);
      setAllQTs(allData);
      setLoading(false);
    }
    fetchData();
  }, [date]);

  // 이전/다음 QT 찾기
  const currentIndex = allQTs.findIndex(q => q.date === date);
  const prevQT = currentIndex > 0 ? allQTs[currentIndex - 1] : null;
  const nextQT = currentIndex < allQTs.length - 1 ? allQTs[currentIndex + 1] : null;

  // QT 작성 페이지로 이동
  const handleWrite = useCallback(() => {
    if (activeGroupId) {
      router.push(`/community?date=${date}`);
    } else {
      toast({
        variant: 'error',
        title: '그룹을 먼저 선택해주세요',
      });
    }
  }, [router, date, activeGroupId, toast]);

  // 묵상 구절 제거
  const handleRemoveMeditationVerse = useCallback((index: number) => {
    setMeditationVerses(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 묵상 구절 전체 삭제
  const handleClearMeditationVerses = useCallback(() => {
    setMeditationVerses([]);
  }, []);

  // 묵상 발행
  const handleMeditationSubmit = useCallback(async (data: MeditationSubmitData) => {
    if (!activeGroupId) {
      toast({
        variant: 'error',
        title: '그룹을 먼저 선택해주세요',
      });
      return;
    }

    const currentDeviceId = deviceId || getOrCreateDeviceId();
    setSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const { error } = await supabase
        .from('guest_comments')
        .insert({
          church_id: activeGroupId,
          guest_name: data.authorName || '익명',
          device_id: currentDeviceId,
          content: data.content,
          bible_range: data.bibleRange || qt?.verseReference || null,
          is_anonymous: data.isAnonymous,
        });

      if (error) throw error;

      toast({
        variant: 'success',
        title: '묵상이 등록되었습니다',
      });

      // 상태 초기화
      setMeditationVerses([]);
      setMeditationPanelOpen(false);

      // 내 묵상 목록 새로고침
      loadMyComments();

    } catch {
      toast({
        variant: 'error',
        title: '등록에 실패했습니다',
      });
    } finally {
      setSubmitting(false);
    }
  }, [activeGroupId, qt, toast, deviceId, loadMyComments]);

  // 수정 다이얼로그 열기
  const handleOpenEdit = useCallback((comment: GuestComment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
    setEditBibleRange(comment.bible_range || '');
    setEditName(comment.guest_name);
    setEditDialogOpen(true);
  }, []);

  // 수정 제출
  const handleEditSubmit = useCallback(async () => {
    if (!editingComment || !editContent.trim()) return;

    setEditSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('guest_comments')
        .update({
          content: editContent.trim(),
          bible_range: editBibleRange.trim() || null,
          guest_name: editName.trim() || '익명',
        })
        .eq('id', editingComment.id)
        .eq('device_id', deviceId);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '수정되었습니다',
      });

      setEditDialogOpen(false);
      setEditingComment(null);
      loadMyComments();
    } catch (err) {
      console.error('수정 에러:', err);
      toast({
        variant: 'error',
        title: '수정에 실패했습니다',
      });
    } finally {
      setEditSubmitting(false);
    }
  }, [editingComment, editContent, editBibleRange, editName, deviceId, toast, loadMyComments]);

  // 삭제 다이얼로그 열기
  const handleOpenDelete = useCallback((comment: GuestComment) => {
    setDeletingComment(comment);
    setDeleteDialogOpen(true);
  }, []);

  // 삭제 제출
  const handleDeleteSubmit = useCallback(async () => {
    if (!deletingComment) return;

    setDeleteSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('guest_comments')
        .delete()
        .eq('id', deletingComment.id)
        .eq('device_id', deviceId);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '삭제되었습니다',
      });

      setDeleteDialogOpen(false);
      setDeletingComment(null);
      loadMyComments();
    } catch (err) {
      console.error('삭제 에러:', err);
      toast({
        variant: 'error',
        title: '삭제에 실패했습니다',
      });
    } finally {
      setDeleteSubmitting(false);
    }
  }, [deletingComment, deviceId, toast, loadMyComments]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!qt) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">해당 날짜의 QT를 찾을 수 없습니다.</p>
        <p className="text-sm text-muted-foreground mb-4">{date}</p>
        <Link
          href="/qt"
          className="text-primary font-medium hover:underline"
        >
          QT 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/qt"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">목록</span>
          </Link>

          <div className="flex items-center gap-2">
            {prevQT ? (
              <Link
                href={`/qt/${prevQT.date}`}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </Link>
            ) : (
              <div className="p-2">
                <ChevronLeft className="w-5 h-5 text-muted-foreground/50" />
              </div>
            )}

            <span className="text-sm font-medium text-foreground min-w-[60px] text-center">
              {qt.month}/{qt.day}
            </span>

            {nextQT ? (
              <Link
                href={`/qt/${nextQT.date}`}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ) : (
              <div className="p-2">
                <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QT 내용 */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <QTViewer
          qt={qt}
          showWriteButton={!!activeGroupId}
          onWrite={handleWrite}
        />

        {/* 내가 쓴 묵상 목록 */}
        {myComments.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">내가 쓴 묵상</h3>
              <span className="text-sm text-muted-foreground">({myComments.length})</span>
            </div>
            <div className="space-y-3">
              {myComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-card rounded-xl border border-border p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {comment.is_anonymous ? '익명' : comment.guest_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(comment)}
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDelete(comment)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {comment.bible_range && (
                    <p className="text-xs text-primary mb-2">{comment.bible_range}</p>
                  )}
                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingComments && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {prevQT ? (
            <Link
              href={`/qt/${prevQT.date}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <ChevronLeft className="w-5 h-5" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">이전</p>
                <p className="text-sm font-medium text-foreground">{prevQT.title?.split(' (')[0] || `${prevQT.month}/${prevQT.day}`}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextQT ? (
            <Link
              href={`/qt/${nextQT.date}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <div className="text-right">
                <p className="text-xs text-muted-foreground">다음</p>
                <p className="text-sm font-medium text-foreground">{nextQT.title?.split(' (')[0] || `${nextQT.month}/${nextQT.day}`}</p>
              </div>
              <ChevronRight className="w-5 h-5" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-20" />

      {/* 묵상 패널 */}
      <MeditationPanel
        isOpen={meditationPanelOpen}
        onOpenChange={setMeditationPanelOpen}
        selectedVerses={meditationVerses}
        onRemoveVerse={handleRemoveMeditationVerse}
        onClearVerses={handleClearMeditationVerses}
        onSubmit={handleMeditationSubmit}
        context="bible_reader"
        identifier={date}
        showCardButton={false}
        showAnonymous={true}
        churchName={activeGroupName}
        isSubmitting={submitting}
      />

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              묵상 수정
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">이름</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="이름을 입력하세요"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                성경 구절 <span className="text-muted-foreground font-normal">(선택)</span>
              </label>
              <Input
                value={editBibleRange}
                onChange={(e) => setEditBibleRange(e.target.value)}
                placeholder="예: 창세기 1:1-10"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">묵상 내용</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="묵상 내용을 입력하세요..."
                rows={6}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={editSubmitting}
            >
              취소
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editSubmitting || !editContent.trim()}
              className="bg-primary hover:bg-primary"
            >
              {editSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Edit2 className="w-4 h-4 mr-2" />
              )}
              수정하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              묵상 삭제
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-foreground">
              정말로 이 묵상을 삭제하시겠습니까?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              삭제된 묵상은 복구할 수 없습니다.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteSubmitting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              삭제하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
