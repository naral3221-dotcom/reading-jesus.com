'use client'

/**
 * FollowersList - 팔로워/팔로잉 목록 모달
 */

import { useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, User } from 'lucide-react'
import Link from 'next/link'
import { FollowButton } from './FollowButton'
import { useFollowers, useFollowing } from '@/presentation/hooks/queries/useUserFollow'
import type { UserWithFollowStatus } from '@/domain/entities/UserFollow'

interface FollowersListProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  currentUserId: string | null
  mode: 'followers' | 'following'
}

export function FollowersList({
  open,
  onOpenChange,
  userId,
  currentUserId,
  mode,
}: FollowersListProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 팔로워/팔로잉 목록 조회
  const followersQuery = useFollowers(userId, currentUserId ?? undefined)
  const followingQuery = useFollowing(userId, currentUserId ?? undefined)

  const query = mode === 'followers' ? followersQuery : followingQuery
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = query

  // 무한 스크롤
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

  const users: UserWithFollowStatus[] = data?.pages.flatMap((page) => page.data) ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'followers' ? '팔로워' : '팔로잉'}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {mode === 'followers'
                ? '아직 팔로워가 없습니다'
                : '아직 팔로잉이 없습니다'}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-2"
                >
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={() => onOpenChange(false)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        {user.nickname?.[0] ?? <User className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.nickname ?? '익명'}
                      </p>
                      {user.isFollowedBy && currentUserId === userId && (
                        <p className="text-xs text-muted-foreground">
                          나를 팔로우함
                        </p>
                      )}
                    </div>
                  </Link>

                  <FollowButton
                    currentUserId={currentUserId}
                    targetUserId={user.id}
                    initialIsFollowing={user.isFollowing}
                    size="sm"
                  />
                </div>
              ))}

              {/* 무한 스크롤 로딩 트리거 */}
              <div ref={loadMoreRef} className="py-2 flex justify-center">
                {isFetchingNextPage && (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
