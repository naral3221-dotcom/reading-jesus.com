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
import { ChurchLayout } from '@/components/church/ChurchLayout';
import { SplitViewProvider } from '@/contexts/SplitViewContext';

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

export default function ChurchQTDetailPage() {
  const params = useParams();
  const router = useRouter();
  const churchCode = params.code as string;
  const date = params.date as string;
  const { toast } = useToast();

  const [qt, setQt] = useState<QTDailyContent | null>(null);
  const [allQTs, setAllQTs] = useState<QTDailyContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [church, setChurch] = useState<{ id: string; name: string } | null>(null);

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

  // 교회 정보 로드
  useEffect(() => {
    async function loadChurch() {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('churches')
        .select('id, name')
        .eq('code', churchCode.toUpperCase())
        .single();
      if (data) setChurch(data);
    }
    loadChurch();
  }, [churchCode]);

  // 내 묵상 목록 로드
  const loadMyComments = useCallback(async () => {
    if (!church || !deviceId) return;

    setLoadingComments(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { data } = await supabase
        .from('guest_comments')
        .select('*')
        .eq('church_id', church.id)
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false });

      setMyComments(data || []);
    } catch (err) {
      console.error('내 묵상 로드 에러:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [church, deviceId]);

  useEffect(() => {
    loadMyComments();
  }, [loadMyComments]);

  useEffect(() => {
    async function fetchData() {
      const [qtData, allData] = await Promise.all([
        getQTByDate(date),
        loadQTData(),
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
    // sharing 페이지의 QT 작성 모드로 리다이렉트
    router.push(`/church/${churchCode}/sharing?writeQt=true`);
  }, [router, churchCode]);

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
    if (!church) {
      toast({
        variant: 'error',
        title: '교회 정보를 찾을 수 없습니다',
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
          church_id: church.id,
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
  }, [church, qt, toast, deviceId, loadMyComments]);

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
      <SplitViewProvider>
        <ChurchLayout churchCode={churchCode}>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        </ChurchLayout>
      </SplitViewProvider>
    );
  }

  if (!qt) {
    return (
      <SplitViewProvider>
        <ChurchLayout churchCode={churchCode}>
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <p className="text-gray-500 mb-4">해당 날짜의 QT를 찾을 수 없습니다.</p>
            <Link
              href={`/church/${churchCode}/qt`}
              className="text-accent font-medium hover:underline"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </ChurchLayout>
      </SplitViewProvider>
    );
  }

  return (
    <SplitViewProvider>
      <ChurchLayout churchCode={churchCode}>
        <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/church/${churchCode}/qt`}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">목록</span>
          </Link>

          <div className="flex items-center gap-2">
            {prevQT ? (
              <Link
                href={`/church/${churchCode}/qt/${prevQT.date}`}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </Link>
            ) : (
              <div className="p-2">
                <ChevronLeft className="w-5 h-5 text-gray-300" />
              </div>
            )}

            <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
              {qt.month}/{qt.day}
            </span>

            {nextQT ? (
              <Link
                href={`/church/${churchCode}/qt/${nextQT.date}`}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </Link>
            ) : (
              <div className="p-2">
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QT 내용 */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <QTViewer
          qt={qt}
          showWriteButton={true}
          onWrite={handleWrite}
        />

        {/* 내가 쓴 묵상 목록 */}
        {myComments.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-gray-900">내가 쓴 묵상</h3>
              <span className="text-sm text-gray-500">({myComments.length})</span>
            </div>
            <div className="space-y-3">
              {myComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {comment.is_anonymous ? '익명' : comment.guest_name}
                      </p>
                      <p className="text-xs text-gray-500">
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
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenDelete(comment)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {comment.bible_range && (
                    <p className="text-xs text-accent mb-2">{comment.bible_range}</p>
                  )}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingComments && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {prevQT ? (
            <Link
              href={`/church/${churchCode}/qt/${prevQT.date}`}
              className="flex items-center gap-2 text-gray-600 hover:text-accent"
            >
              <ChevronLeft className="w-5 h-5" />
              <div className="text-left">
                <p className="text-xs text-gray-400">이전</p>
                <p className="text-sm font-medium">{prevQT.title?.split(' (')[0] || `${prevQT.month}/${prevQT.day}`}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextQT ? (
            <Link
              href={`/church/${churchCode}/qt/${nextQT.date}`}
              className="flex items-center gap-2 text-gray-600 hover:text-accent"
            >
              <div className="text-right">
                <p className="text-xs text-gray-400">다음</p>
                <p className="text-sm font-medium">{nextQT.title?.split(' (')[0] || `${nextQT.month}/${nextQT.day}`}</p>
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
        context="church_bible"
        identifier={churchCode}
        showCardButton={false}
        showAnonymous={true}
        churchName={church?.name}
        isSubmitting={submitting}
      />

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-accent" />
              묵상 수정
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">이름</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="이름을 입력하세요"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                성경 구절 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <Input
                value={editBibleRange}
                onChange={(e) => setEditBibleRange(e.target.value)}
                placeholder="예: 창세기 1:1-10"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">묵상 내용</label>
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
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              묵상 삭제
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-700">
              정말로 이 묵상을 삭제하시겠습니까?
            </p>
            <p className="text-sm text-gray-500 mt-2">
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
      </ChurchLayout>
    </SplitViewProvider>
  );
}
