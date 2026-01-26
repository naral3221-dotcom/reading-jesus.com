'use client'

/**
 * User Profile Page - 다른 사용자의 프로필 페이지
 */

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronLeft, User, BookOpen, Loader2 } from 'lucide-react'
import { FollowButton, FollowersList } from '@/components/profile'
import { useCurrentUser } from '@/presentation/hooks/queries/useUser'
import { useUserWithFollowStatus } from '@/presentation/hooks/queries/useUserFollow'
import {
  usePublicMeditations,
  useTogglePublicMeditationLike,
} from '@/presentation/hooks/queries/usePublicMeditation'
import { PublicMeditationCard } from '@/components/community'
import { useToast } from '@/components/ui/toast'

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const targetUserId = params.userId as string

  const [followersOpen, setFollowersOpen] = useState(false)
  const [followersMode, setFollowersMode] = useState<'followers' | 'following'>('followers')
  const [likeAnimating, setLikeAnimating] = useState<string | null>(null)

  // 현재 로그인한 사용자
  const { data: userData, isLoading: userLoading } = useCurrentUser()
  const currentUserId = userData?.user?.id ?? null

  // 대상 사용자 정보 + 팔로우 상태
  const {
    data: targetUser,
    isLoading: targetLoading,
  } = useUserWithFollowStatus(targetUserId, currentUserId ?? undefined)

  // 대상 사용자의 공개 묵상
  const {
    data: meditationsData,
    isLoading: meditationsLoading,
  } = usePublicMeditations({
    userId: targetUserId,
    currentUserId: currentUserId ?? undefined,
  })

  const toggleLikeMutation = useTogglePublicMeditationLike()

  const handleLike = async (meditationId: string) => {
    if (!currentUserId) {
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
        userId: currentUserId,
      })
    } catch {
      toast({
        title: '좋아요 처리에 실패했습니다',
        variant: 'error',
      })
    }
  }

  const openFollowersList = (mode: 'followers' | 'following') => {
    setFollowersMode(mode)
    setFollowersOpen(true)
  }

  const isLoading = userLoading || targetLoading

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!targetUser) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          뒤로
        </Button>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <User className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">사용자를 찾을 수 없습니다</p>
        </div>
      </div>
    )
  }

  const meditations = meditationsData?.pages.flatMap((page) => page.data) ?? []

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">프로필</h1>
      </div>

      {/* Profile Info */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={targetUser.avatarUrl ?? undefined} />
            <AvatarFallback className="text-2xl">
              {targetUser.nickname?.[0] ?? <User className="w-8 h-8" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="text-xl font-bold">{targetUser.nickname ?? '익명'}</h2>

            {/* 팔로워/팔로잉 카운트 */}
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => openFollowersList('followers')}
                className="text-sm hover:underline"
              >
                <span className="font-semibold">{targetUser.followersCount ?? 0}</span>
                <span className="text-muted-foreground ml-1">팔로워</span>
              </button>
              <button
                onClick={() => openFollowersList('following')}
                className="text-sm hover:underline"
              >
                <span className="font-semibold">{targetUser.followingCount ?? 0}</span>
                <span className="text-muted-foreground ml-1">팔로잉</span>
              </button>
            </div>

            {/* 팔로우 버튼 */}
            <div className="mt-4">
              <FollowButton
                currentUserId={currentUserId}
                targetUserId={targetUserId}
                initialIsFollowing={targetUser.isFollowing}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 묵상 목록 */}
      <div className="border-t">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">공개 묵상</span>
            <span className="text-sm text-muted-foreground">
              {meditations.length}개
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {meditationsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : meditations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              아직 공개된 묵상이 없습니다
            </div>
          ) : (
            meditations.map((meditation) => (
              <PublicMeditationCard
                key={meditation.id}
                meditation={meditation}
                currentUserId={currentUserId}
                onLike={handleLike}
                likeAnimating={likeAnimating === meditation.id}
              />
            ))
          )}
        </div>
      </div>

      {/* 팔로워/팔로잉 목록 모달 */}
      <FollowersList
        open={followersOpen}
        onOpenChange={setFollowersOpen}
        userId={targetUserId}
        currentUserId={currentUserId}
        mode={followersMode}
      />
    </div>
  )
}
