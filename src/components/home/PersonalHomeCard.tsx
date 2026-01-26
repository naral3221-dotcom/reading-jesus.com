'use client'

/**
 * PersonalHomeCard - 개인 프로젝트 기반 홈 카드
 *
 * 그룹 없이 개인 프로젝트만 있는 사용자를 위한 오늘의 말씀 카드
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Check,
  Search,
  MessageCircle,
  Flame,
  PenLine,
} from 'lucide-react'
import { PersonalMeditationEditor } from '@/components/personal'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useToast } from '@/components/ui/toast'
import { useToggleProjectCheck, useProjectChecks } from '@/presentation/hooks/queries/usePersonalProject'
import readingPlan from '@/data/reading_plan.json'
import type { ReadingPlan } from '@/types'
import type { PersonalProjectWithStats } from '@/domain/entities/PersonalProject'

interface PersonalHomeCardProps {
  project: PersonalProjectWithStats
  userId: string
}

// Day 번호로 일정 찾기
const findPlanByDay = (day: number): ReadingPlan | undefined => {
  return (readingPlan as ReadingPlan[]).find((p) => p.day === day)
}

export function PersonalHomeCard({ project, userId }: PersonalHomeCardProps) {
  const { toast } = useToast()
  const [currentDay, setCurrentDay] = useState(project.currentDay)
  const [showDayInput, setShowDayInput] = useState(false)
  const [dayInputValue, setDayInputValue] = useState('')
  const [showCheckDialog, setShowCheckDialog] = useState(false)
  const [checkAnimation, setCheckAnimation] = useState(false)
  const [showMeditationEditor, setShowMeditationEditor] = useState(false)

  const currentPlan = findPlanByDay(currentDay)
  const todayDay = project.currentDay
  const isToday = currentDay === todayDay
  const totalDays = project.totalDays

  // 체크 상태 조회
  const { data: checkedDays = [] } = useProjectChecks(project.id)
  const toggleCheck = useToggleProjectCheck()

  const isRead = checkedDays.includes(currentDay)

  const goToPrevDay = () => {
    if (currentDay > 1) {
      setCurrentDay(currentDay - 1)
    }
  }

  const goToNextDay = () => {
    if (currentDay < totalDays) {
      setCurrentDay(currentDay + 1)
    }
  }

  const handleCheckClick = () => {
    setShowCheckDialog(true)
  }

  const handleConfirmCheck = async () => {
    const willBeRead = !isRead

    if (willBeRead) {
      setCheckAnimation(true)
      setTimeout(() => setCheckAnimation(false), 600)
    }

    try {
      await toggleCheck.mutateAsync({
        projectId: project.id,
        dayNumber: currentDay,
        userId,
      })

      const now = new Date()
      toast({
        title: willBeRead ? '읽음 완료 처리되었습니다' : '읽음 완료가 해제되었습니다',
        description: willBeRead
          ? `${format(now, 'yyyy년 M월 d일 HH:mm', { locale: ko })} 기준`
          : undefined,
      })
    } catch {
      toast({
        title: '오류가 발생했습니다',
        description: '다시 시도해주세요',
        variant: 'error',
      })
    }

    setShowCheckDialog(false)
  }

  if (!currentPlan) {
    return null
  }

  return (
    <>
      {/* 프로젝트 정보 헤더 */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold">리딩지저스</h1>
        <p className="text-muted-foreground text-sm mt-1">{project.name}</p>
        {project.currentStreak > 0 && (
          <div className="flex items-center justify-center gap-1 text-accent mt-2">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">{project.currentStreak}일 연속</span>
          </div>
        )}
      </div>

      {/* Day Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevDay}
          disabled={currentDay <= 1}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="text-center">
          {showDayInput ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={totalDays}
                value={dayInputValue}
                onChange={(e) => setDayInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const day = parseInt(dayInputValue)
                    if (day >= 1 && day <= totalDays) {
                      setCurrentDay(day)
                    }
                    setShowDayInput(false)
                    setDayInputValue('')
                  } else if (e.key === 'Escape') {
                    setShowDayInput(false)
                    setDayInputValue('')
                  }
                }}
                onBlur={() => {
                  setShowDayInput(false)
                  setDayInputValue('')
                }}
                placeholder="Day"
                className="w-20 h-8 text-center"
                autoFocus
              />
              <span className="text-muted-foreground text-sm">/ {totalDays}</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowDayInput(true)
                  setDayInputValue(currentDay.toString())
                }}
                className="flex items-center gap-2 hover:bg-accent rounded-md px-2 py-1 transition-colors"
                title="Day 번호를 클릭해서 빠르게 이동"
              >
                <span className="text-lg font-semibold">Day {currentDay}</span>
                <span className="text-muted-foreground text-sm">/ {totalDays}</span>
                {isToday && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    오늘
                  </span>
                )}
                <Search className="w-3 h-3 text-muted-foreground" />
              </button>
              {!isToday && (
                <button
                  onClick={() => setCurrentDay(todayDay)}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  오늘로 이동 (Day {todayDay})
                </button>
              )}
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextDay}
          disabled={currentDay >= totalDays}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Today's Reading Card */}
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            오늘의 말씀
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-primary">{currentPlan.book}</p>
              <p className="text-muted-foreground">{currentPlan.reading}</p>
              {currentPlan.memory_verse && (
                <p className="text-sm text-primary mt-2">
                  📖 암송: {currentPlan.memory_verse}
                </p>
              )}
            </div>

            <div className="pt-4 border-t space-y-3">
              {/* 성경 읽기 버튼 */}
              <Link href={`/bible-reader?book=${currentPlan.book.split(' ')[0]}&chapter=1`}>
                <Button variant="default" className="w-full" size="lg">
                  <BookOpen className="w-4 h-4 mr-2" />
                  성경 읽기
                </Button>
              </Link>

              {/* 묵상 작성하기 버튼 */}
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => setShowMeditationEditor(true)}
              >
                <PenLine className="w-4 h-4 mr-2" />
                묵상 작성하기
              </Button>

              {/* 커뮤니티 피드 바로가기 */}
              <Link href="/community">
                <Button variant="ghost" className="w-full text-muted-foreground" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  묵상 나눔 보러가기
                </Button>
              </Link>

              {/* 읽음 체크 버튼 */}
              <button
                onClick={handleCheckClick}
                className={cn(
                  'flex items-center gap-3 w-full p-3 rounded-lg transition-all',
                  isRead
                    ? 'bg-accent/10 border border-accent'
                    : 'bg-muted/50 border border-transparent hover:bg-muted'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all',
                    isRead
                      ? 'bg-accent border-accent'
                      : 'border-muted-foreground/30',
                    checkAnimation && 'scale-110'
                  )}
                >
                  {isRead && (
                    <Check
                      className={cn(
                        'w-4 h-4 text-accent-foreground',
                        checkAnimation && 'animate-in zoom-in-50 duration-300'
                      )}
                    />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isRead ? 'text-accent-foreground' : 'text-foreground'
                    )}
                  >
                    {isRead ? '읽음 완료!' : '읽음 체크하기'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">진행률</span>
            <span className="font-medium">{project.progressPercentage}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-primary/80 rounded-full h-3 transition-all duration-500 ease-out"
              style={{ width: `${project.progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {project.completedDays}일 완료 / {totalDays}일
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-12"
          onClick={() => setShowMeditationEditor(true)}
        >
          <PenLine className="w-4 h-4 mr-2" />
          묵상 작성
        </Button>
        <Link href="/bible">
          <Button variant="outline" className="h-12 w-full">
            성경 전체 보기
          </Button>
        </Link>
      </div>

      {/* 읽음 완료 확인 다이얼로그 */}
      <AlertDialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRead ? '읽음 완료를 해제하시겠습니까?' : '읽음 완료 처리하시겠습니까?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRead
                ? `Day ${currentDay} - ${currentPlan.book}의 읽음 완료 표시가 해제됩니다.`
                : `Day ${currentDay} - ${currentPlan.book}을(를) 읽음 완료로 표시합니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCheck}>
              {isRead ? '해제하기' : '완료하기'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 묵상 작성 에디터 */}
      <PersonalMeditationEditor
        open={showMeditationEditor}
        onOpenChange={setShowMeditationEditor}
        userId={userId}
        projectId={project.id}
        dayNumber={currentDay}
        bibleReference={currentPlan?.reading}
      />
    </>
  )
}
