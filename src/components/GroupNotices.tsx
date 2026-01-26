'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Megaphone, Plus, Pin, Edit2, Trash2, Calendar, Loader2 } from 'lucide-react';
import { createGroupNoticeNotification } from '@/lib/notifications';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  useGroupNotices,
  useCreateGroupNotice,
  useUpdateGroupNotice,
  useDeleteGroupNotice,
} from '@/presentation/hooks/queries/useGroupNotice';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { GroupNotice } from '@/domain/entities/GroupNotice';

interface GroupNoticesProps {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
}

export function GroupNotices({ groupId, groupName, isAdmin }: GroupNoticesProps) {
  const { toast } = useToast();

  // 데이터 조회
  const { data: userData } = useCurrentUser();
  const { data: noticesData, isLoading } = useGroupNotices(groupId);
  const notices = noticesData?.notices || [];

  // 뮤테이션 훅
  const createMutation = useCreateGroupNotice(groupId);
  const updateMutation = useUpdateGroupNotice(groupId);
  const deleteMutation = useDeleteGroupNotice(groupId);

  // 공지 작성 모달
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // 공지 수정 모달
  const [editingNotice, setEditingNotice] = useState<GroupNotice | null>(null);

  // 공지 삭제 확인
  const [deletingNotice, setDeletingNotice] = useState<GroupNotice | null>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // 수정 모달 열 때 폼 데이터 설정
  useEffect(() => {
    if (editingNotice) {
      setTitle(editingNotice.title);
      setContent(editingNotice.content);
      setIsPinned(editingNotice.isPinned);
    }
  }, [editingNotice]);

  const handleCreateNotice = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: '제목과 내용을 입력해주세요', variant: 'error' });
      return;
    }

    const userId = userData?.user?.id;
    if (!userId) {
      toast({ title: '로그인이 필요합니다', variant: 'error' });
      return;
    }

    try {
      await createMutation.mutateAsync({
        groupId,
        authorId: userId,
        title: title.trim(),
        content: content.trim(),
        isPinned,
      });

      // 그룹 멤버들에게 공지 알림 생성
      createGroupNoticeNotification(groupId, groupName, title.trim(), userId);

      toast({ title: '공지사항이 작성되었습니다' });
      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: '공지 작성 실패',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error'
      });
    }
  };

  const handleUpdateNotice = async () => {
    if (!editingNotice) return;
    if (!title.trim() || !content.trim()) {
      toast({ title: '제목과 내용을 입력해주세요', variant: 'error' });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingNotice.id,
        title: title.trim(),
        content: content.trim(),
        isPinned,
      });

      toast({ title: '공지사항이 수정되었습니다' });
      setEditingNotice(null);
      resetForm();
    } catch (error) {
      toast({
        title: '공지 수정 실패',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error'
      });
    }
  };

  const handleDeleteNotice = async () => {
    if (!deletingNotice) return;

    try {
      await deleteMutation.mutateAsync(deletingNotice.id);
      toast({ title: '공지사항이 삭제되었습니다' });
      setDeletingNotice(null);
    } catch (error) {
      toast({
        title: '공지 삭제 실패',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error'
      });
    }
  };

  const openEditModal = (notice: GroupNotice) => {
    setEditingNotice(notice);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsPinned(false);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">공지사항</h2>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            공지 작성
          </Button>
        )}
      </div>

      {/* 공지 목록 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : notices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {isAdmin ? '첫 공지사항을 작성해보세요' : '공지사항이 없습니다'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <Card key={notice.id} className={cn(notice.isPinned && 'border-primary')}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {notice.isPinned && (
                        <Pin className="w-4 h-4 text-primary" />
                      )}
                      <h3 className="font-semibold">{notice.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{notice.author?.nickname || '알 수 없음'}</span>
                      <span>·</span>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(notice)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingNotice(notice)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {notice.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 공지 작성 모달 */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지사항 작성</DialogTitle>
            <DialogDescription>
              그룹원에게 알릴 공지사항을 작성하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목 *</label>
              <Input
                placeholder="공지 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">내용 *</label>
              <Textarea
                placeholder="공지 내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSaving}
                rows={6}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pin-notice"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                disabled={isSaving}
                className="w-4 h-4"
              />
              <label htmlFor="pin-notice" className="text-sm">
                상단 고정
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                resetForm();
              }}
              disabled={isSaving}
            >
              취소
            </Button>
            <Button onClick={handleCreateNotice} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              작성하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 공지 수정 모달 */}
      <Dialog open={!!editingNotice} onOpenChange={(open) => !open && setEditingNotice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지사항 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목 *</label>
              <Input
                placeholder="공지 제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">내용 *</label>
              <Textarea
                placeholder="공지 내용을 입력하세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSaving}
                rows={6}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-pin-notice"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                disabled={isSaving}
                className="w-4 h-4"
              />
              <label htmlFor="edit-pin-notice" className="text-sm">
                상단 고정
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingNotice(null);
                resetForm();
              }}
              disabled={isSaving}
            >
              취소
            </Button>
            <Button onClick={handleUpdateNotice} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              수정하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 공지 삭제 확인 */}
      <AlertDialog open={!!deletingNotice} onOpenChange={(open) => !open && setDeletingNotice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 공지사항을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNotice}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
