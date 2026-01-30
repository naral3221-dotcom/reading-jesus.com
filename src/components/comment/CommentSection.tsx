'use client'

/**
 * CommentSection - 재사용 가능한 댓글 섹션 컴포넌트
 *
 * 피드 상세, 묵상 상세 등에서 사용할 수 있는 댓글 섹션입니다.
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Heart,
  MessageCircle,
  Trash2,
  CornerDownRight,
  Loader2,
  Send,
  User,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/date-utils'
import { useToast } from '@/components/ui/toast'
import { MeditationType, PublicMeditationComment } from '@/domain/entities/PublicMeditationComment'
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useToggleCommentLike,
} from '@/presentation/hooks/queries/usePublicMeditationComment'

interface CommentSectionProps {
  meditationId: string
  meditationType: MeditationType
  currentUserId: string | null
  className?: string
}

export function CommentSection({
  meditationId,
  meditationType,
  currentUserId,
  className,
}: CommentSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const [content, setContent] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [replyTo, setReplyTo] = useState<PublicMeditationComment | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  // 댓글 목록 조회
  const {
    data: commentsData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useComments(meditationId, meditationType, currentUserId ?? undefined)

  // 뮤테이션
  const createMutation = useCreateComment()
  const deleteMutation = useDeleteComment()
  const likeMutation = useToggleCommentLike()

  const comments = commentsData?.pages.flatMap((page) => page.data) ?? []

  // 답글 달기 시 입력창 포커스
  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus()
    }
  }, [replyTo])

  const handleSubmit = async () => {
    if (!currentUserId) {
      toast({ title: '로그인이 필요합니다', variant: 'error' })
      return
    }

    if (!content.trim()) {
      toast({ title: '댓글 내용을 입력해주세요', variant: 'error' })
      return
    }

    try {
      await createMutation.mutateAsync({
        meditationId,
        meditationType,
        userId: currentUserId,
        content: content.trim(),
        isAnonymous,
        parentId: replyTo?.id ?? null,
      })

      setContent('')
      setReplyTo(null)
      setIsAnonymous(false)
    } catch {
      toast({ title: '댓글 작성에 실패했습니다', variant: 'error' })
    }
  }

  const handleDelete = async (comment: PublicMeditationComment) => {
    if (!currentUserId) return

    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      await deleteMutation.mutateAsync({
        commentId: comment.id,
        userId: currentUserId,
        meditationId,
        meditationType,
        parentId: comment.parentId,
      })
    } catch {
      toast({ title: '댓글 삭제에 실패했습니다', variant: 'error' })
    }
  }

  const handleLike = async (comment: PublicMeditationComment) => {
    if (!currentUserId) {
      toast({ title: '로그인이 필요합니다', variant: 'error' })
      return
    }

    try {
      await likeMutation.mutateAsync({
        commentId: comment.id,
        userId: currentUserId,
        meditationId,
        meditationType,
      })
    } catch {
      toast({ title: '좋아요 처리에 실패했습니다', variant: 'error' })
    }
  }

  const handleAuthorClick = (userId: string, isAnonymous: boolean) => {
    if (isAnonymous) return
    router.push(`/profile/${userId}`)
  }

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) {
        next.delete(commentId)
      } else {
        next.add(commentId)
      }
      return next
    })
  }

  const renderComment = (comment: PublicMeditationComment, isReply = false) => {
    const isOwner = currentUserId === comment.userId
    const hasReplies = (comment.repliesCount ?? 0) > 0
    const isRepliesExpanded = expandedReplies.has(comment.id)

    return (
      <div
        key={comment.id}
        className={cn('flex gap-3', isReply && 'ml-8 mt-3')}
      >
        {/* 아바타 */}
        <button
          type="button"
          onClick={() => handleAuthorClick(comment.userId, comment.isAnonymous)}
          disabled={comment.isAnonymous}
          className={cn(
            'shrink-0',
            !comment.isAnonymous && 'cursor-pointer'
          )}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.isAnonymous ? undefined : (comment.authorAvatarUrl ?? undefined)} />
            <AvatarFallback className="text-xs">
              {comment.isAnonymous ? '?' : (comment.authorNickname?.[0] ?? <User className="w-4 h-4" />)}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          {/* 작성자 및 시간 */}
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() => handleAuthorClick(comment.userId, comment.isAnonymous)}
              disabled={comment.isAnonymous}
              className={cn(
                'text-sm font-medium',
                !comment.isAnonymous && 'hover:underline cursor-pointer'
              )}
            >
              {comment.getDisplayName()}
            </button>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt.toISOString())}
            </span>
          </div>

          {/* 내용 */}
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-4 mt-2">
            {/* 좋아요 */}
            <button
              type="button"
              onClick={() => handleLike(comment)}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                comment.isLiked
                  ? 'text-red-500'
                  : 'text-muted-foreground hover:text-red-500'
              )}
            >
              <Heart
                className={cn('w-4 h-4', comment.isLiked && 'fill-current')}
              />
              {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
            </button>

            {/* 답글 */}
            {!isReply && (
              <button
                type="button"
                onClick={() => setReplyTo(comment)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                답글
              </button>
            )}

            {/* 삭제 */}
            {isOwner && (
              <button
                type="button"
                onClick={() => handleDelete(comment)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            )}
          </div>

          {/* 답글 보기/접기 */}
          {!isReply && hasReplies && (
            <button
              type="button"
              onClick={() => toggleReplies(comment.id)}
              className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
            >
              <CornerDownRight className="w-3 h-3" />
              {isRepliesExpanded
                ? '답글 숨기기'
                : `답글 ${comment.repliesCount}개 보기`}
              <ChevronDown
                className={cn(
                  'w-3 h-3 transition-transform',
                  isRepliesExpanded && 'rotate-180'
                )}
              />
            </button>
          )}

          {/* 답글 목록 */}
          {!isReply && isRepliesExpanded && (
            <ReplyList
              meditationId={meditationId}
              meditationType={meditationType}
              parentId={comment.id}
              currentUserId={currentUserId}
              onAuthorClick={handleAuthorClick}
              onLike={handleLike}
              onDelete={handleDelete}
              onReply={() => setReplyTo(comment)}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 댓글 입력 */}
      <div className="space-y-3">
        {replyTo && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <CornerDownRight className="w-4 h-4" />
            <span className="font-medium">{replyTo.getDisplayName()}</span>
            에게 답글 작성 중
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="ml-auto text-xs hover:text-foreground"
            >
              취소
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <Textarea
            ref={inputRef}
            placeholder={currentUserId ? '댓글을 입력하세요...' : '로그인 후 댓글을 작성할 수 있습니다'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!currentUserId || createMutation.isPending}
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              disabled={!currentUserId}
            />
            익명으로 작성
          </label>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!currentUserId || !content.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                등록
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-4 pt-4 border-t">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
          </div>
        ) : (
          <>
            {comments.map((comment) => renderComment(comment))}

            {/* 더보기 */}
            {hasNextPage && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    '더보기'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// 답글 목록 서브 컴포넌트
interface ReplyListProps {
  meditationId: string
  meditationType: MeditationType
  parentId: string
  currentUserId: string | null
  onAuthorClick: (userId: string, isAnonymous: boolean) => void
  onLike: (comment: PublicMeditationComment) => void
  onDelete: (comment: PublicMeditationComment) => void
  onReply: () => void
}

function ReplyList({
  meditationId,
  meditationType,
  parentId,
  currentUserId,
  onAuthorClick,
  onLike,
  onDelete,
}: ReplyListProps) {
  const { data, isLoading } = useComments(
    meditationId,
    meditationType,
    currentUserId ?? undefined,
    parentId
  )

  const replies = data?.pages.flatMap((page) => page.data) ?? []

  if (isLoading) {
    return (
      <div className="flex justify-center py-4 ml-8">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-3 mt-3">
      {replies.map((reply) => (
        <div key={reply.id} className="flex gap-3 ml-8">
          <button
            type="button"
            onClick={() => onAuthorClick(reply.userId, reply.isAnonymous)}
            disabled={reply.isAnonymous}
            className={cn('shrink-0', !reply.isAnonymous && 'cursor-pointer')}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={reply.isAnonymous ? undefined : (reply.authorAvatarUrl ?? undefined)} />
              <AvatarFallback className="text-[10px]">
                {reply.isAnonymous ? '?' : (reply.authorNickname?.[0] ?? <User className="w-3 h-3" />)}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => onAuthorClick(reply.userId, reply.isAnonymous)}
                disabled={reply.isAnonymous}
                className={cn(
                  'text-xs font-medium',
                  !reply.isAnonymous && 'hover:underline cursor-pointer'
                )}
              >
                {reply.getDisplayName()}
              </button>
              <span className="text-[10px] text-muted-foreground">
                {formatRelativeTime(reply.createdAt.toISOString())}
              </span>
            </div>

            <p className="text-xs text-foreground whitespace-pre-wrap break-words">
              {reply.content}
            </p>

            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={() => onLike(reply)}
                className={cn(
                  'flex items-center gap-1 text-[10px] transition-colors',
                  reply.isLiked
                    ? 'text-red-500'
                    : 'text-muted-foreground hover:text-red-500'
                )}
              >
                <Heart className={cn('w-3 h-3', reply.isLiked && 'fill-current')} />
                {reply.likesCount > 0 && <span>{reply.likesCount}</span>}
              </button>

              {currentUserId === reply.userId && (
                <button
                  type="button"
                  onClick={() => onDelete(reply)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  삭제
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
