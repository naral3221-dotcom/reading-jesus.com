'use client'

/**
 * FollowButton - 팔로우/언팔로우 버튼 컴포넌트
 */

import { Button } from '@/components/ui/button'
import { Loader2, UserPlus, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToggleFollow, useIsFollowing } from '@/presentation/hooks/queries/useUserFollow'
import { useToast } from '@/components/ui/toast'

interface FollowButtonProps {
  currentUserId: string | null
  targetUserId: string
  initialIsFollowing?: boolean
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
  currentUserId,
  targetUserId,
  initialIsFollowing,
  size = 'default',
  variant = 'default',
  className,
  onFollowChange,
}: FollowButtonProps) {
  const { toast } = useToast()
  const { toggle, isLoading } = useToggleFollow()

  // 팔로우 상태 조회
  const { data: isFollowing = initialIsFollowing ?? false } = useIsFollowing(
    currentUserId,
    targetUserId
  )

  // 자기 자신이면 버튼 표시 안함
  if (!currentUserId || currentUserId === targetUserId) {
    return null
  }

  const handleClick = async () => {
    try {
      const newFollowingState = await toggle(currentUserId, targetUserId, isFollowing)
      onFollowChange?.(newFollowingState)

      toast({
        title: newFollowingState ? '팔로우했습니다' : '언팔로우했습니다',
        variant: 'success',
      })
    } catch {
      toast({
        title: '오류가 발생했습니다',
        description: '잠시 후 다시 시도해주세요',
        variant: 'error',
      })
    }
  }

  return (
    <Button
      size={size}
      variant={isFollowing ? 'outline' : variant}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'transition-all',
        isFollowing && 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-1" />
          팔로잉
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          팔로우
        </>
      )}
    </Button>
  )
}
