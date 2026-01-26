'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MessageCircle, Send, Loader2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useCommentReplies,
  useCreateCommentReply,
  useDeleteCommentReply,
} from '@/presentation/hooks/queries';

interface MeditationRepliesProps {
  commentId: string;
  repliesCount: number;
  currentUserId: string | null;
  onRepliesCountChange?: (count: number) => void;
}

export function MeditationReplies({
  commentId,
  repliesCount,
  currentUserId,
  onRepliesCountChange,
}: MeditationRepliesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [localRepliesCount, setLocalRepliesCount] = useState(repliesCount);

  // React Query 훅 사용
  const { data, isLoading } = useCommentReplies(commentId, { enabled: isOpen });
  const createReply = useCreateCommentReply(commentId);
  const deleteReply = useDeleteCommentReply(commentId);

  const replies = data?.replies || [];

  // 답글 수 업데이트
  useEffect(() => {
    if (data?.replies) {
      setLocalRepliesCount(data.replies.length);
      onRepliesCountChange?.(data.replies.length);
    }
  }, [data?.replies, onRepliesCountChange]);

  // 댓글 작성
  const handleSubmit = async () => {
    if (!content.trim() || !currentUserId || createReply.isPending) return;

    try {
      await createReply.mutateAsync({
        userId: currentUserId,
        content: content.trim(),
        isAnonymous: false,
      });
      setContent('');
    } catch (err) {
      console.error('댓글 작성 에러:', err);
    }
  };

  // 댓글 삭제
  const handleDelete = async (replyId: string) => {
    if (!currentUserId) return;
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteReply.mutateAsync({ replyId, userId: currentUserId });
    } catch (err) {
      console.error('댓글 삭제 에러:', err);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t">
      {/* 토글 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        <span>댓글 {localRepliesCount > 0 ? localRepliesCount : ''}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* 댓글 목록 */}
      {isOpen && (
        <div className="mt-3 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {replies.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  아직 댓글이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {replies.map((reply) => {
                    const isOwner = currentUserId === reply.userId;
                    const displayName = reply.isAnonymous
                      ? '익명'
                      : reply.profile?.nickname || '알 수 없음';

                    return (
                      <div
                        key={reply.id}
                        className="flex gap-2 p-2 rounded-lg bg-muted/30"
                      >
                        <Avatar className="w-7 h-7">
                          {!reply.isAnonymous && reply.profile?.avatar_url ? (
                            <AvatarImage src={reply.profile.avatar_url} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{displayName}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reply.createdAt), 'M/d a h:mm', {
                                locale: ko,
                              })}
                            </span>
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => handleDelete(reply.id)}
                                className="ml-auto text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-sm mt-0.5 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 댓글 작성 폼 */}
              {currentUserId && (
                <div className="flex gap-2 mt-3">
                  <Textarea
                    placeholder="댓글을 작성하세요..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={1}
                    className="min-h-[36px] text-sm resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!content.trim() || createReply.isPending}
                    className="shrink-0"
                  >
                    {createReply.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
