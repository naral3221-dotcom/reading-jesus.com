'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DraftData, formatDraftTime } from '@/hooks/useMultiDraft';
import {
  FileText,
  ChevronDown,
  Trash2,
  Plus,
  Clock,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraftDropdownProps {
  drafts: DraftData[];
  activeDraftId: string | null;
  lastSaved: Date | null;
  onSelectDraft: (id: string) => void;
  onDeleteDraft: (id: string) => void;
  onNewDraft: () => void;
  className?: string;
}

export function DraftDropdown({
  drafts,
  activeDraftId,
  lastSaved,
  onSelectDraft,
  onDeleteDraft,
  onNewDraft,
  className,
}: DraftDropdownProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 삭제 확인 처리
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirmId === id) {
      onDeleteDraft(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      // 3초 후 확인 상태 리셋
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  // 드래프트가 없으면 표시하지 않음
  if (drafts.length === 0 && !lastSaved) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* 자동저장 상태 표시 */}
      {lastSaved && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDraftTime(lastSaved)}
        </span>
      )}

      {/* 드래프트 드롭다운 */}
      {drafts.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
              <FileText className="w-3 h-3" />
              <span>임시저장 ({drafts.length})</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>임시저장 목록</span>
              <span className="text-xs font-normal text-muted-foreground">
                최대 3개
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* 드래프트 목록 */}
            {drafts
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((draft) => (
                <DropdownMenuItem
                  key={draft.id}
                  className="flex items-start gap-2 p-2 cursor-pointer"
                  onClick={() => onSelectDraft(draft.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {activeDraftId === draft.id && (
                        <Check className="w-3 h-3 text-primary flex-shrink-0" />
                      )}
                      <p className="text-sm font-medium truncate">
                        {draft.preview || '(빈 내용)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {draft.bibleRange && (
                        <span className="truncate">{draft.bibleRange}</span>
                      )}
                      <span>{formatDraftTime(draft.updatedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, draft.id)}
                    className={cn(
                      'p-1 rounded hover:bg-destructive/10 transition-colors flex-shrink-0',
                      deleteConfirmId === draft.id
                        ? 'text-destructive bg-destructive/10'
                        : 'text-muted-foreground hover:text-destructive'
                    )}
                    title={deleteConfirmId === draft.id ? '다시 클릭하여 삭제' : '삭제'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuItem>
              ))}

            {/* 새 드래프트 시작 */}
            {drafts.length < 3 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer text-primary"
                  onClick={onNewDraft}
                >
                  <Plus className="w-4 h-4" />
                  <span>새로 작성</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
