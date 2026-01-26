'use client'

/**
 * PublicMeditationCard - 공개 묵상 카드
 *
 * 전체 피드에서 표시되는 공개 묵상 카드 컴포넌트
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Heart, MessageCircle, MoreVertical, User, Pencil, Trash2, BookOpen, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { PublicMeditationProps, MeditationType } from '@/domain/entities/PublicMeditation'

const MEDITATION_TYPE_LABELS: Record<MeditationType, string> = {
  free: '자유',
  qt: 'QT',
  memo: '메모',
}

const MEDITATION_TYPE_COLORS: Record<MeditationType, string> = {
  free: 'bg-accent/10 text-accent dark:bg-accent/50 dark:text-accent-foreground',
  qt: 'bg-accent/10 text-accent dark:bg-accent/50 dark:text-accent-foreground',
  memo: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

interface PublicMeditationCardProps {
  meditation: PublicMeditationProps & {
    isLiked?: boolean
    profile?: {
      nickname: string
      avatarUrl: string | null
    } | null
  }
  currentUserId: string | null
  onLike: (meditationId: string) => void
  onDelete?: (meditationId: string) => void
  onEdit?: (meditation: PublicMeditationProps) => void
  likeAnimating?: boolean
}

export function PublicMeditationCard({
  meditation,
  currentUserId,
  onLike,
  onDelete,
  onEdit,
  likeAnimating,
}: PublicMeditationCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const isOwn = meditation.userId === currentUserId
  const isAnonymous = meditation.isAnonymous

  // 표시 정보
  const displayInfo = {
    nickname: isAnonymous && !isOwn
      ? '익명'
      : isAnonymous
        ? `${meditation.profile?.nickname || '익명'} (익명)`
        : meditation.profile?.nickname || '익명',
    avatarUrl: isAnonymous && !isOwn ? null : meditation.profile?.avatarUrl || null,
    showAvatar: !(isAnonymous && !isOwn),
  }

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ko })
  }

  const handleDelete = () => {
    onDelete?.(meditation.id)
    setDeleteDialogOpen(false)
  }

  return (
    <>
      <Card className="hover:shadow-sm transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            {/* 프로필 클릭 시 사용자 프로필로 이동 */}
            {displayInfo.showAvatar && !isAnonymous ? (
              <Link href={`/profile/${meditation.userId}`}>
                <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                  <AvatarImage src={displayInfo.avatarUrl || undefined} />
                  <AvatarFallback>{displayInfo.nickname[0]}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-muted">
                  <User className="w-5 h-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {displayInfo.showAvatar && !isAnonymous ? (
                  <Link
                    href={`/profile/${meditation.userId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {displayInfo.nickname}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">{displayInfo.nickname}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTime(meditation.createdAt)}
                {meditation.updatedAt &&
                  meditation.updatedAt.getTime() !== meditation.createdAt.getTime() &&
                  ' (수정됨)'}
              </p>
            </div>

            {isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(meditation)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    수정
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* 개인 프로젝트 정보 */}
          {(meditation.dayNumber || meditation.meditationType !== 'free') && (
            <div className="flex items-center gap-2 mb-2">
              {meditation.dayNumber && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-md">
                  <Calendar className="w-3 h-3" />
                  Day {meditation.dayNumber}
                </span>
              )}
              {meditation.meditationType && meditation.meditationType !== 'free' && (
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md',
                  MEDITATION_TYPE_COLORS[meditation.meditationType]
                )}>
                  {MEDITATION_TYPE_LABELS[meditation.meditationType]}
                </span>
              )}
            </div>
          )}

          {/* 성경 구절 참조 */}
          {meditation.bibleReference && (
            <div className="flex items-center gap-1.5 mb-2 text-sm text-primary">
              <BookOpen className="w-4 h-4" />
              <span className="font-medium">{meditation.bibleReference}</span>
            </div>
          )}

          {/* 제목 */}
          {meditation.title && (
            <h3 className="font-semibold mb-2">{meditation.title}</h3>
          )}

          {/* QT 형식 한 문장 요약 표시 */}
          {meditation.meditationType === 'qt' && meditation.oneWord && (
            <div className="mb-3 p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
              <p className="text-sm font-medium text-primary">한 문장</p>
              <p className="text-sm mt-1">{meditation.oneWord}</p>
            </div>
          )}

          {/* 내용 */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {meditation.content}
          </p>

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 transition-all',
                meditation.isLiked && 'text-red-500'
              )}
              onClick={() => onLike(meditation.id)}
            >
              <Heart
                className={cn(
                  'w-4 h-4 mr-1 transition-transform',
                  meditation.isLiked && 'fill-current',
                  likeAnimating && 'scale-125'
                )}
              />
              <span className="text-xs">{meditation.likesCount}</span>
            </Button>

            <Button variant="ghost" size="sm" className="h-8 px-2">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">{meditation.repliesCount}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>묵상 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 묵상을 정말 삭제하시겠습니까? 모든 댓글도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
