'use client'

/**
 * FeedDetailModal - 피드 상세 보기 모달
 *
 * 피드 카드 클릭 시 표시되는 상세 모달입니다.
 * 전체 내용 보기 + 댓글 섹션을 포함합니다.
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, X, Lock, BookOpen, PenLine, Users, User, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/date-utils'
import { CommentSection } from '@/components/comment'
import { QTContentRenderer } from '@/components/church/QTContentRenderer'
import QTViewer from '@/components/qt/QTViewer'
import { findReadingByDay } from '@/components/church/ReadingDayPicker'
import { getQTByDate } from '@/lib/qt-content'
import type { UnifiedFeedItem, FeedSource } from './UnifiedFeedCard'
import type { MeditationType } from '@/domain/entities/PublicMeditationComment'
import type { QTDailyContent } from '@/types'

interface FeedDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: UnifiedFeedItem | null
  currentUserId: string | null
  onLike?: (id: string, source: FeedSource) => void
  onAuthorClick?: (authorId: string) => void
}

export function FeedDetailModal({
  open,
  onOpenChange,
  item,
  currentUserId,
  onLike,
  onAuthorClick,
}: FeedDetailModalProps) {
  // QT 원문 데이터 상태
  const [qtContent, setQtContent] = useState<QTDailyContent | null>(null)

  // QT 날짜가 있으면 원문 데이터 로드
  useEffect(() => {
    if (item?.type === 'qt' && item.qtDate) {
      getQTByDate(item.qtDate).then(setQtContent)
    } else {
      setQtContent(null)
    }
  }, [item?.type, item?.qtDate])

  if (!item) return null

  const displayName = item.isAnonymous ? '익명' : item.authorName
  const avatarColor = item.isAnonymous ? 'bg-gray-400' : getAvatarColor(item.authorName)
  const initials = item.isAnonymous ? '?' : getInitials(item.authorName)

  // 댓글 시스템용 타입 변환
  const meditationType: MeditationType = item.source

  const handleAuthorClick = () => {
    if (!item.isAnonymous && onAuthorClick) {
      onAuthorClick(item.authorId)
    }
  }

  const handleLike = () => {
    if (onLike) {
      onLike(item.id, item.source)
    }
  }

  // 소스 표시 텍스트
  const getSourceLabel = () => {
    switch (item.source) {
      case 'group':
        return item.sourceName ? `${item.sourceName} 그룹` : '그룹'
      case 'church':
        return item.sourceName ? `${item.sourceName}` : '교회'
      case 'personal':
        return '개인 묵상'
      default:
        return ''
    }
  }

  const getSourceIcon = () => {
    switch (item.source) {
      case 'group':
        return <Users className="w-4 h-4" />
      case 'church':
        return <BookOpen className="w-4 h-4" />
      case 'personal':
        return <User className="w-4 h-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* 헤더 */}
        <DialogHeader className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              {getSourceIcon()}
              <span>{getSourceLabel()}</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="hidden lg:flex"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* 작성자 정보 */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handleAuthorClick}
              disabled={item.isAnonymous}
              className={cn(
                'relative shrink-0 ring-2 ring-background overflow-hidden rounded-full',
                !item.isAnonymous && 'cursor-pointer hover:ring-primary/50 transition-all'
              )}
            >
              {item.authorAvatarUrl && !item.isAnonymous ? (
                <Avatar className="w-12 h-12">
                  <AvatarImage src={item.authorAvatarUrl} />
                  <AvatarFallback className={avatarColor}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', avatarColor)}>
                  <span className="text-white font-medium">{initials}</span>
                </div>
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleAuthorClick}
                  disabled={item.isAnonymous}
                  className={cn(
                    'font-semibold',
                    !item.isAnonymous && 'hover:text-primary hover:underline transition-colors'
                  )}
                >
                  {displayName}
                </button>
                {item.isAnonymous && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-sm',
                  item.type === 'qt'
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-accent/10 text-accent border border-accent/20'
                )}>
                  {item.type === 'qt' ? (
                    <><BookOpen className="w-2.5 h-2.5" /> QT</>
                  ) : (
                    <><PenLine className="w-2.5 h-2.5" /> 묵상</>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span>{formatRelativeTime(item.createdAt)}</span>
                {item.dayNumber && (
                  <>
                    <span>·</span>
                    <span className="text-primary font-medium">
                      {item.dayNumber}일차
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 내용 */}
          <div className="space-y-4">
            {/* QT 타입인 경우 */}
            {item.type === 'qt' && (
              <>
                {/* QT 원문 정보 표시 */}
                {qtContent && (
                  <QTViewer qt={qtContent} />
                )}

                {/* QT 날짜/통독 범위 헤더 (QT 원문이 없는 경우만) */}
                {!qtContent && (
                  <div className="bg-gradient-to-r from-muted to-muted/50 rounded-xl p-4 border">
                    <p className="text-sm text-accent-foreground font-medium">
                      {item.qtDate}
                    </p>
                    {item.dayNumber && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {item.dayNumber}일차
                        {(() => {
                          const reading = findReadingByDay(item.dayNumber);
                          return reading ? ` · ${reading.reading}` : '';
                        })()}
                      </p>
                    )}
                  </div>
                )}

                {/* 나의 QT 기록 섹션 헤더 */}
                <div className="pt-2">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <PenLine className="w-4 h-4" />
                    나의 QT 기록
                  </h4>
                </div>

                {/* QT 콘텐츠 - QTContentRenderer 사용 */}
                <QTContentRenderer
                  data={{
                    mySentence: item.mySentence,
                    meditationAnswer: item.meditationAnswer,
                    gratitude: item.gratitude,
                    myPrayer: item.myPrayer,
                    dayReview: item.dayReview,
                  }}
                  qtContent={qtContent}
                />
              </>
            )}

            {/* 묵상 타입인 경우 (일반 묵상 내용) */}
            {item.type === 'meditation' && item.content && (
              <p className="text-sm whitespace-pre-wrap">{item.content}</p>
            )}
          </div>

          {/* 인터랙션 */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                'h-9 px-4 gap-2 rounded-full',
                item.isLiked
                  ? 'text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
                  : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
              )}
            >
              <Heart className={cn('w-4 h-4', item.isLiked && 'fill-current')} />
              <span className="text-sm font-medium">{item.likesCount}</span>
            </Button>

            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{item.repliesCount}</span>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              댓글
            </h3>
            <CommentSection
              meditationId={item.id}
              meditationType={meditationType}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
