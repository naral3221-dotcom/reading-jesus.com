'use client'

/**
 * Profile Root Page - 로그인 사용자의 프로필로 리다이렉트
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useCurrentUser } from '@/presentation/hooks/queries/useUser'

export default function ProfileRootPage() {
  const router = useRouter()
  const { data: userData, isLoading } = useCurrentUser()

  useEffect(() => {
    if (isLoading) return

    if (userData?.user?.id) {
      // 로그인 되어 있으면 내 프로필 페이지로 리다이렉트
      router.replace(`/profile/${userData.user.id}`)
    } else {
      // 로그인 안 되어 있으면 로그인 페이지로
      router.replace('/login')
    }
  }, [userData, isLoading, router])

  return (
    <div className="flex justify-center items-center h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  )
}
