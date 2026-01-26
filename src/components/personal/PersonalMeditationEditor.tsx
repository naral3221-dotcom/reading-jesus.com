'use client'

/**
 * PersonalMeditationEditor - 개인 묵상 작성/수정 통합 에디터
 */

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { Loader2 } from 'lucide-react'

import { MeditationTypeSelector } from './MeditationTypeSelector'
import { FreeMeditationForm } from './FreeMeditationForm'
import { QTMeditationForm } from './QTMeditationForm'
import { MemoMeditationForm } from './MemoMeditationForm'

import { useCreatePersonalMeditation, useUpdatePersonalMeditation } from '@/presentation/hooks/queries/usePublicMeditation'
import type { MeditationType, PublicMeditationProps } from '@/domain/entities/PublicMeditation'

interface PersonalMeditationEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  projectId: string
  dayNumber: number
  bibleReference?: string
  // 수정 모드일 때 기존 데이터
  existingMeditation?: PublicMeditationProps | null
  onSuccess?: () => void
}

export function PersonalMeditationEditor({
  open,
  onOpenChange,
  userId,
  projectId,
  dayNumber,
  bibleReference: initialBibleReference = '',
  existingMeditation,
  onSuccess,
}: PersonalMeditationEditorProps) {
  const { toast } = useToast()
  const createMutation = useCreatePersonalMeditation()
  const updateMutation = useUpdatePersonalMeditation()

  const isEditMode = !!existingMeditation

  // 폼 상태
  const [meditationType, setMeditationType] = useState<MeditationType>(
    existingMeditation?.meditationType ?? 'free'
  )
  const [isPublic, setIsPublic] = useState(false)

  // 자유/메모 형식 상태
  const [title, setTitle] = useState(existingMeditation?.title ?? '')
  const [content, setContent] = useState(existingMeditation?.content ?? '')
  const [bibleReference, setBibleReference] = useState(
    existingMeditation?.bibleReference ?? initialBibleReference
  )

  // QT 형식 상태
  const [oneWord, setOneWord] = useState(existingMeditation?.oneWord ?? '')
  const [meditationQuestion, setMeditationQuestion] = useState(
    existingMeditation?.meditationQuestion ?? ''
  )
  const [meditationAnswer, setMeditationAnswer] = useState(
    existingMeditation?.meditationAnswer ?? ''
  )
  const [gratitude, setGratitude] = useState(existingMeditation?.gratitude ?? '')
  const [myPrayer, setMyPrayer] = useState(existingMeditation?.myPrayer ?? '')
  const [dayReview, setDayReview] = useState(existingMeditation?.dayReview ?? '')

  const isPending = createMutation.isPending || updateMutation.isPending

  // 유효성 검사
  const isValid = useCallback(() => {
    if (meditationType === 'free') {
      return content.trim().length > 0
    }
    if (meditationType === 'qt') {
      return oneWord.trim().length > 0 || meditationAnswer.trim().length > 0
    }
    if (meditationType === 'memo') {
      return content.trim().length > 0
    }
    return false
  }, [meditationType, content, oneWord, meditationAnswer])

  const handleSubmit = async () => {
    if (!isValid()) {
      toast({
        title: '내용을 입력해주세요',
        variant: 'error',
      })
      return
    }

    try {
      if (isEditMode && existingMeditation) {
        // 수정 모드
        await updateMutation.mutateAsync({
          id: existingMeditation.id,
          userId,
          projectId,
          meditationType,
          title: meditationType === 'free' ? title : undefined,
          content: meditationType !== 'qt' ? content : undefined,
          bibleReference,
          oneWord: meditationType === 'qt' ? oneWord : undefined,
          meditationQuestion: meditationType === 'qt' ? meditationQuestion : undefined,
          meditationAnswer: meditationType === 'qt' ? meditationAnswer : undefined,
          gratitude: meditationType === 'qt' ? gratitude : undefined,
          myPrayer: meditationType === 'qt' ? myPrayer : undefined,
          dayReview: meditationType === 'qt' ? dayReview : undefined,
        })

        toast({
          title: '묵상이 수정되었습니다',
        })
      } else {
        // 생성 모드
        await createMutation.mutateAsync({
          userId,
          projectId,
          dayNumber,
          meditationType,
          isPublic,
          title: meditationType === 'free' ? title : undefined,
          content: meditationType !== 'qt' ? content : undefined,
          bibleReference,
          oneWord: meditationType === 'qt' ? oneWord : undefined,
          meditationQuestion: meditationType === 'qt' ? meditationQuestion : undefined,
          meditationAnswer: meditationType === 'qt' ? meditationAnswer : undefined,
          gratitude: meditationType === 'qt' ? gratitude : undefined,
          myPrayer: meditationType === 'qt' ? myPrayer : undefined,
          dayReview: meditationType === 'qt' ? dayReview : undefined,
        })

        toast({
          title: '묵상이 저장되었습니다',
          description: isPublic ? '커뮤니티에도 공유됩니다' : undefined,
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast({
        title: '오류가 발생했습니다',
        description: error instanceof Error ? error.message : '다시 시도해주세요',
        variant: 'error',
      })
    }
  }

  const handleClose = () => {
    if (!isPending) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? '묵상 수정' : `Day ${dayNumber} 묵상 작성`}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? '묵상 내용을 수정합니다'
              : '오늘의 말씀을 묵상하고 기록해보세요'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 형식 선택 */}
          <div className="space-y-2">
            <Label>형식 선택</Label>
            <MeditationTypeSelector
              value={meditationType}
              onChange={setMeditationType}
            />
          </div>

          {/* 형식별 폼 */}
          {meditationType === 'free' && (
            <FreeMeditationForm
              title={title}
              content={content}
              bibleReference={bibleReference}
              onTitleChange={setTitle}
              onContentChange={setContent}
              onBibleReferenceChange={setBibleReference}
            />
          )}

          {meditationType === 'qt' && (
            <QTMeditationForm
              bibleReference={bibleReference}
              oneWord={oneWord}
              meditationQuestion={meditationQuestion}
              meditationAnswer={meditationAnswer}
              gratitude={gratitude}
              myPrayer={myPrayer}
              dayReview={dayReview}
              onBibleReferenceChange={setBibleReference}
              onOneWordChange={setOneWord}
              onMeditationQuestionChange={setMeditationQuestion}
              onMeditationAnswerChange={setMeditationAnswer}
              onGratitudeChange={setGratitude}
              onMyPrayerChange={setMyPrayer}
              onDayReviewChange={setDayReview}
            />
          )}

          {meditationType === 'memo' && (
            <MemoMeditationForm
              content={content}
              bibleReference={bibleReference}
              onContentChange={setContent}
              onBibleReferenceChange={setBibleReference}
            />
          )}

          {/* 공개 설정 (생성 모드에서만) */}
          {!isEditMode && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="is-public" className="cursor-pointer">
                  커뮤니티에 공유하기
                </Label>
                <p className="text-xs text-muted-foreground">
                  다른 사용자들과 묵상을 나눕니다
                </p>
              </div>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !isValid()}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : isEditMode ? (
              '수정하기'
            ) : (
              '저장하기'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
