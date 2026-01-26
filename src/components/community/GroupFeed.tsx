'use client'

/**
 * GroupFeed - 그룹별 피드 컴포넌트
 *
 * 기존 커뮤니티 페이지의 그룹 나눔 기능을 분리한 컴포넌트
 * 그룹 선택 드롭다운 + Day 기반 묵상 나눔
 */

import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { useGroupCompat } from '@/presentation/hooks/stores/useGroupStore'

export function GroupFeed() {
  const { activeGroup, loading: groupLoading } = useGroupCompat()

  if (groupLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!activeGroup) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Users className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center mb-4">
          그룹에 참여해야 그룹 나눔을 볼 수 있습니다.
        </p>
        <Link href="/group">
          <Button>그룹 참여하기</Button>
        </Link>
      </div>
    )
  }

  // 그룹이 있으면 기존 커뮤니티 페이지로 리다이렉트
  // 또는 여기서 기존 로직을 재사용
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <p className="text-muted-foreground text-center mb-4">
        {activeGroup.name} 그룹의 묵상 나눔
      </p>
      <p className="text-sm text-muted-foreground text-center">
        그룹 피드는 기존 커뮤니티 기능에서 Day별로 확인할 수 있습니다.
      </p>
      <p className="text-xs text-muted-foreground mt-4">
        (전체 탭 구조 통합 후 이 컴포넌트에서 Day별 피드를 직접 표시할 예정)
      </p>
    </div>
  )
}
