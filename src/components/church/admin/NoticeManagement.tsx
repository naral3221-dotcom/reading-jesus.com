'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  Bell,
  Pin,
  PinOff,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import {
  useChurchNotices,
  useCreateChurchNotice,
  useUpdateChurchNotice,
  useDeleteChurchNotice,
  useToggleNoticePin,
  useToggleNoticeActive,
} from '@/presentation/hooks/queries/useChurchNotice';
import { ChurchNotice } from '@/domain/entities/ChurchNotice';

interface NoticeManagementProps {
  churchId: string;
}

export default function NoticeManagement({ churchId }: NoticeManagementProps) {
  const { toast } = useToast();

  // 공지사항 데이터
  const { data: noticesData, isLoading: noticesLoading } = useChurchNotices(churchId);
  const notices = noticesData?.notices || [];

  // 뮤테이션 훅
  const createMutation = useCreateChurchNotice();
  const updateMutation = useUpdateChurchNotice(churchId);
  const deleteMutation = useDeleteChurchNotice(churchId);
  const togglePinMutation = useToggleNoticePin(churchId);
  const toggleActiveMutation = useToggleNoticeActive(churchId);

  // 폼 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<ChurchNotice | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeIsPinned, setNoticeIsPinned] = useState(false);
  const [noticeIsActive, setNoticeIsActive] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<ChurchNotice | null>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // 폼 초기화
  const resetForm = () => {
    setEditingNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeIsPinned(false);
    setNoticeIsActive(true);
  };

  // 수정 다이얼로그 열기
  const openEditDialog = (notice: ChurchNotice) => {
    setEditingNotice(notice);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setNoticeIsPinned(notice.isPinned);
    setNoticeIsActive(notice.isActive);
    setDialogOpen(true);
  };

  // 저장 핸들러
  const handleSave = async () => {
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      toast({ variant: 'error', title: '제목과 내용을 입력해주세요' });
      return;
    }

    try {
      if (editingNotice) {
        // 수정
        await updateMutation.mutateAsync({
          id: editingNotice.id,
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          isPinned: noticeIsPinned,
          isActive: noticeIsActive,
        });
        toast({ variant: 'success', title: '공지사항이 수정되었습니다' });
      } else {
        // 생성
        await createMutation.mutateAsync({
          churchId,
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          isPinned: noticeIsPinned,
          isActive: noticeIsActive,
        });
        toast({ variant: 'success', title: '공지사항이 등록되었습니다' });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        variant: 'error',
        title: '공지사항 저장에 실패했습니다',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!noticeToDelete) return;

    try {
      await deleteMutation.mutateAsync(noticeToDelete.id);
      toast({ variant: 'success', title: '공지사항이 삭제되었습니다' });
      setDeleteConfirmOpen(false);
      setNoticeToDelete(null);
    } catch (error) {
      toast({
        variant: 'error',
        title: '공지사항 삭제에 실패했습니다',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  // 고정 토글 핸들러
  const handleTogglePin = async (notice: ChurchNotice) => {
    try {
      await togglePinMutation.mutateAsync(notice.id);
    } catch {
      toast({
        variant: 'error',
        title: '고정 상태 변경에 실패했습니다',
      });
    }
  };

  // 활성화 토글 핸들러
  const handleToggleActive = async (notice: ChurchNotice) => {
    try {
      await toggleActiveMutation.mutateAsync(notice.id);
    } catch {
      toast({
        variant: 'error',
        title: '활성 상태 변경에 실패했습니다',
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 헤더 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Bell className="w-5 h-5" />
              공지사항 관리
              <span className="text-sm text-muted-foreground font-normal">
                ({notices.length}개)
              </span>
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              새 공지
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {noticesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notices.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              등록된 공지사항이 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`p-3 border rounded-lg ${
                    notice.isActive ? 'bg-background' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {notice.isPinned && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full shrink-0">
                            고정
                          </span>
                        )}
                        {!notice.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full shrink-0">
                            비활성
                          </span>
                        )}
                        <span className="font-medium text-sm truncate">
                          {notice.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notice.content}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleTogglePin(notice)}
                        title={notice.isPinned ? '고정 해제' : '고정'}
                        disabled={togglePinMutation.isPending}
                      >
                        {notice.isPinned ? (
                          <PinOff className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Pin className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleToggleActive(notice)}
                        title={notice.isActive ? '비활성화' : '활성화'}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {notice.isActive ? (
                          <Eye className="w-3.5 h-3.5 text-accent" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(notice)}
                        title="수정"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-destructive"
                        onClick={() => {
                          setNoticeToDelete(notice);
                          setDeleteConfirmOpen(true);
                        }}
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 공지사항 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNotice ? '공지사항 수정' : '새 공지사항'}
            </DialogTitle>
            <DialogDescription>
              공지사항을 {editingNotice ? '수정' : '등록'}합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="noticeTitle">제목</Label>
              <Input
                id="noticeTitle"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noticeContent">내용</Label>
              <Textarea
                id="noticeContent"
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                placeholder="공지사항 내용을 입력하세요"
                rows={5}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="noticeIsPinned">상단 고정</Label>
              <Switch
                id="noticeIsPinned"
                checked={noticeIsPinned}
                onCheckedChange={setNoticeIsPinned}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="noticeIsActive">활성화</Label>
              <Switch
                id="noticeIsActive"
                checked={noticeIsActive}
                onCheckedChange={setNoticeIsActive}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingNotice ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{noticeToDelete?.title}&quot; 공지사항을 삭제하시겠습니까?
              <br />
              이 작업은 취소할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
