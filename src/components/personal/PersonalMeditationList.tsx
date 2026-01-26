'use client'

/**
 * PersonalMeditationList - 개인 프로젝트 묵상 목록
 */

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Pencil, Trash2, Globe, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useProjectMeditations } from '@/presentation/hooks/queries/usePublicMeditation'
import type { PublicMeditationProps, MeditationType } from '@/domain/entities/PublicMeditation'

interface PersonalMeditationListProps {
  projectId: string
  currentUserId?: string
  onEdit?: (meditation: PublicMeditationProps) => void
  onDelete?: (meditation: PublicMeditationProps) => void
}

const MEDITATION_TYPE_LABELS: Record<MeditationType, string> = {
  free: '자유',
  qt: 'QT',
  memo: '메모',
}

const MEDITATION_TYPE_COLORS: Record<MeditationType, string> = {
  free: 'bg-accent/10 text-foreground dark:bg-accent dark:text-muted-foreground',
  qt: 'bg-accent/10 text-foreground dark:bg-accent dark:text-accent-foreground',
  memo: 'bg-gray-100 text-gray-800 dark:bg-background dark:text-gray-200',
}

export function PersonalMeditationList({
  projectId,
  currentUserId,
  onEdit,
  onDelete,
}: PersonalMeditationListProps) {
  const { data, isLoading, error } = useProjectMeditations(projectId, {
    currentUserId,
    limit: 50,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          묵상 목록을 불러오는데 실패했습니다
        </CardContent>
      </Card>
    )
  }

  const meditations = data?.meditations ?? []

  if (meditations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            아직 작성된 묵상이 없습니다
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            오늘의 말씀을 읽고 묵상을 남겨보세요
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">내 묵상 기록</h3>
        <span className="text-sm text-muted-foreground">
          총 {data?.total ?? 0}개
        </span>
      </div>

      {meditations.map((meditation) => (
        <MeditationCard
          key={meditation.id}
          meditation={meditation}
          isOwner={meditation.userId === currentUserId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

interface MeditationCardProps {
  meditation: PublicMeditationProps
  isOwner: boolean
  onEdit?: (meditation: PublicMeditationProps) => void
  onDelete?: (meditation: PublicMeditationProps) => void
}

function MeditationCard({
  meditation,
  isOwner,
  onEdit,
  onDelete,
}: MeditationCardProps) {
  const displayContent = getDisplayContent(meditation)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {meditation.dayNumber && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-md">
                Day {meditation.dayNumber}
              </span>
            )}
            <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md', MEDITATION_TYPE_COLORS[meditation.meditationType])}>
              {MEDITATION_TYPE_LABELS[meditation.meditationType]}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            {meditation.isAnonymous ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Globe className="w-3 h-3" />
            )}
          </div>
        </div>
        {meditation.title && (
          <CardTitle className="text-base mt-2">{meditation.title}</CardTitle>
        )}
        {meditation.bibleReference && (
          <p className="text-sm text-primary">{meditation.bibleReference}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
          {displayContent}
        </p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {format(meditation.createdAt, 'yyyy년 M월 d일 HH:mm', { locale: ko })}
          </span>

          {isOwner && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(meditation)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(meditation)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function getDisplayContent(meditation: PublicMeditationProps): string {
  if (meditation.meditationType === 'qt') {
    const parts: string[] = []
    if (meditation.oneWord) parts.push(meditation.oneWord)
    if (meditation.meditationAnswer) parts.push(meditation.meditationAnswer)
    return parts.join('\n\n') || meditation.content
  }
  return meditation.content
}
