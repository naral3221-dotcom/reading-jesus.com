'use client'

/**
 * AllFeed - 전체 피드 컴포넌트
 *
 * 공개 묵상 + 팔로잉 사용자의 묵상을 표시
 */

import { useCallback, useRef, useEffect, useState } from 'react'
import { CommentSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { PublicMeditationCard } from './PublicMeditationCard'
import { PublicMeditationEditor } from './PublicMeditationEditor'
import { Loader2, Inbox } from 'lucide-react'
import {
  usePublicMeditations,
  useCreatePublicMeditation,
  useTogglePublicMeditationLike,
  useDeletePublicMeditation,
} from '@/presentation/hooks/queries/usePublicMeditation'
import { useFollowingIds } from '@/presentation/hooks/queries/useUserFollow'

interface AllFeedProps {
  userId: string | null
}

export function AllFeed({ userId }: AllFeedProps) {
  const { toast } = useToast()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [likeAnimating, setLikeAnimating] = useState<string | null>(null)

  // 팔로잉 ID 목록 조회
  const { data: followingIds = [] } = useFollowingIds(userId)

  // 공개 묵상 목록 조회 (무한 스크롤)
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePublicMeditations({
    followingUserIds: followingIds.length > 0 ? followingIds : undefined,
    currentUserId: userId ?? undefined,
  })

  // 뮤테이션
  const createMutation = useCreatePublicMeditation()
  const toggleLikeMutation = useTogglePublicMeditationLike()
  const deleteMutation = useDeletePublicMeditation()

  // 무한 스크롤 감지
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // 묵상 작성
  const handleSubmit = useCallback(
    async (data: {
      title?: string
      content: string
      bibleReference?: string
      isAnonymous: boolean
    }) => {
      if (!userId) {
        toast({
          title: '로그인이 필요합니다',
          variant: 'error',
        })
        return
      }

      try {
        await createMutation.mutateAsync({
          userId,
          ...data,
        })

        toast({
          title: '묵상이 등록되었습니다',
          variant: 'success',
        })
      } catch {
        toast({
          title: '등록에 실패했습니다',
          description: '잠시 후 다시 시도해주세요',
          variant: 'error',
        })
      }
    },
    [userId, createMutation, toast]
  )

  // 좋아요 토글
  const handleLike = useCallback(
    async (meditationId: string) => {
      if (!userId) {
        toast({
          title: '로그인이 필요합니다',
          variant: 'error',
        })
        return
      }

      setLikeAnimating(meditationId)
      setTimeout(() => setLikeAnimating(null), 300)

      try {
        await toggleLikeMutation.mutateAsync({
          meditationId,
          userId,
        })
      } catch {
        toast({
          title: '좋아요 처리에 실패했습니다',
          variant: 'error',
        })
      }
    },
    [userId, toggleLikeMutation, toast]
  )

  // 삭제
  const handleDelete = useCallback(
    async (meditationId: string) => {
      if (!userId) return

      try {
        await deleteMutation.mutateAsync({
          id: meditationId,
          userId,
        })

        toast({
          title: '삭제되었습니다',
          variant: 'success',
        })
      } catch {
        toast({
          title: '삭제에 실패했습니다',
          variant: 'error',
        })
      }
    },
    [userId, deleteMutation, toast]
  )

  // 모든 페이지의 묵상 합치기
  const meditations = data?.pages.flatMap((page) => page.data) ?? []

  if (isLoading) {
    return (
      <div className="p-4">
        <CommentSkeleton count={3} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 묵상 작성 */}
      <div className="p-4 border-b">
        <PublicMeditationEditor
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
        />
      </div>

      {/* 피드 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {meditations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Inbox className="w-12 h-12 mb-4" />
            <p className="text-center">아직 묵상이 없습니다</p>
            <p className="text-sm text-center mt-1">첫 묵상을 나눠보세요!</p>
          </div>
        ) : (
          <>
            {meditations.map((meditation) => (
              <PublicMeditationCard
                key={meditation.id}
                meditation={meditation}
                currentUserId={userId}
                onLike={handleLike}
                onDelete={handleDelete}
                likeAnimating={likeAnimating === meditation.id}
              />
            ))}

            {/* 무한 스크롤 로딩 트리거 */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
