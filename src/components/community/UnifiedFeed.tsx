'use client'

/**
 * UnifiedFeed - 통합 피드 컴포넌트
 *
 * 전체/팔로잉/그룹/교회 탭에 따라 통합된 피드를 표시합니다.
 */

import { useState, useRef, useEffect } from 'react'
import { CommentSkeleton } from '@/components/ui/skeleton'
import { UnifiedFeedCard, type UnifiedFeedItem, type FeedSource } from '@/components/feed/UnifiedFeedCard'
import { FeedDetailModal } from '@/components/feed/FeedDetailModal'
import { FeedEmptyState, type FeedTabType } from '@/components/feed/FeedTabs'
import { Loader2 } from 'lucide-react'
import { useUnifiedFeedInfinite } from '@/presentation/hooks/queries/useUnifiedFeed'
import { useRouter } from 'next/navigation'

interface UnifiedFeedProps {
  tab: FeedTabType
  currentUserId?: string | null
  hasGroups?: boolean
  hasChurch?: boolean
}

export function UnifiedFeed({ tab, currentUserId, hasGroups, hasChurch }: UnifiedFeedProps) {
  const router = useRouter()
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [selectedItem, setSelectedItem] = useState<UnifiedFeedItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUnifiedFeedInfinite({ tab })

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

  // 좋아요 처리 (UnifiedFeedCard 내부에서 낙관적 업데이트 처리)
  const handleLike = () => {
    // 낙관적 업데이트는 카드 내부에서 처리됨
  }

  // 댓글 클릭 → 상세 모달 열기
  const handleComment = (id: string, source: FeedSource) => {
    const item = items.find((i) => i.id === id && i.source === source)
    if (item) {
      setSelectedItem(item)
      setIsModalOpen(true)
    }
  }

  // 소스 클릭 (그룹/교회 페이지로 이동)
  const handleSourceClick = (source: FeedSource, sourceId?: string) => {
    if (!sourceId) return

    switch (source) {
      case 'group':
        router.push(`/group/${sourceId}`)
        break
      case 'church':
        router.push(`/church/${sourceId}`)
        break
    }
  }

  // 작성자 클릭 (프로필 보기)
  const handleAuthorClick = (authorId: string) => {
    router.push(`/profile/${authorId}`)
  }

  // 상세 보기 → 모달 열기
  const handleViewDetail = (item: UnifiedFeedItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  // 모달에서 좋아요 - 리스트 캐시 무효화는 React Query가 처리
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleModalLike = (_id: string, _source: FeedSource) => {
    // 모달 내에서 좋아요 토글 시 별도 처리 불필요
  }

  // 모든 페이지의 아이템 합치기
  const items = data?.pages.flatMap((page) => page.items) ?? []

  if (isLoading) {
    return (
      <div className="p-4">
        <CommentSkeleton count={3} />
      </div>
    )
  }

  if (items.length === 0) {
    return <FeedEmptyState tab={tab} hasGroups={hasGroups} hasChurch={hasChurch} />
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.map((item) => (
          <UnifiedFeedCard
            key={`${item.source}-${item.id}`}
            item={item}
            currentUserId={currentUserId}
            onLike={handleLike}
            onComment={handleComment}
            onSourceClick={handleSourceClick}
            onAuthorClick={handleAuthorClick}
            onViewDetail={handleViewDetail}
          />
        ))}

        {/* 무한 스크롤 로딩 트리거 */}
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {isFetchingNextPage && (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* 피드 상세 모달 */}
      <FeedDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={selectedItem}
        currentUserId={currentUserId ?? null}
        onLike={handleModalLike}
        onAuthorClick={handleAuthorClick}
      />
    </>
  )
}
