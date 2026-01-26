'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getDraftsLocalByGroup,
  getDraftPreview,
  getDraftTitle,
  deleteDraftLocal,
  deleteDraftFromServer,
} from '@/lib/draftStorage';
import type { Draft } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
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

interface DraftSelectorProps {
  userId: string;
  groupId: string;
  dayNumber: number;
  currentDraftId?: string;
  onSelect: (draft: Draft) => void;
  onNew: () => void;
  className?: string;
}

export function DraftSelector({
  userId,
  groupId,
  dayNumber: _dayNumber,
  currentDraftId,
  onSelect,
  onNew,
  className,
}: DraftSelectorProps) {
  // dayNumber는 나중에 필터링에 사용될 수 있음
  void _dayNumber;
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<Draft | null>(null);

  // 드래프트 목록 로드
  useEffect(() => {
    const loadDrafts = () => {
      const localDrafts = getDraftsLocalByGroup(groupId);
      // 내용이 있는 드래프트만 표시
      const validDrafts = localDrafts.filter(d =>
        d.user_id === userId && d.content.trim()
      );
      setDrafts(validDrafts);
    };

    loadDrafts();

    // localStorage 변경 감지
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'reading_jesus_drafts') {
        loadDrafts();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [groupId, userId]);

  // 삭제 확인
  const handleDeleteClick = (draft: Draft, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftToDelete(draft);
    setDeleteDialogOpen(true);
  };

  // 실제 삭제
  const handleConfirmDelete = async () => {
    if (!draftToDelete) return;

    // 로컬에서 삭제
    deleteDraftLocal(draftToDelete.id);

    // 서버에서도 삭제 시도
    if (draftToDelete.synced) {
      await deleteDraftFromServer(draftToDelete.id);
    }

    // 목록 업데이트
    setDrafts(prev => prev.filter(d => d.id !== draftToDelete.id));

    // 현재 선택된 드래프트가 삭제되면 새 드래프트 생성
    if (currentDraftId === draftToDelete.id) {
      onNew();
    }

    setDeleteDialogOpen(false);
    setDraftToDelete(null);
  };

  // 드래프트 선택
  const handleSelectDraft = (draftId: string) => {
    if (draftId === 'new') {
      onNew();
    } else {
      const draft = drafts.find(d => d.id === draftId);
      if (draft) {
        onSelect(draft);
      }
    }
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <Select value={currentDraftId || 'new'} onValueChange={handleSelectDraft}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="묵상 선택..." />
          </SelectTrigger>
          <SelectContent>
            {/* 새 묵상 작성 옵션 */}
            <SelectItem value="new">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <span className="font-medium">새 묵상 작성</span>
              </div>
            </SelectItem>

            {/* 임시저장된 묵상들 */}
            {drafts.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                  임시저장된 묵상 ({drafts.length})
                </div>
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="relative group"
                  >
                    <SelectItem value={draft.id} className="pr-10">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium truncate max-w-[180px]">
                            {getDraftTitle(draft)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(draft.updated_at), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {getDraftPreview(draft)}
                        </p>
                      </div>
                    </SelectItem>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => handleDeleteClick(draft, e)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>임시저장 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 임시저장된 묵상을 삭제하시겠습니까?
              <br />
              삭제된 묵상은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
