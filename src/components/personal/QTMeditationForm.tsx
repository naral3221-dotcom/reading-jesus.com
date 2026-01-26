'use client'

/**
 * QTMeditationForm - QT 형식 묵상 폼
 *
 * 두 가지 스타일 지원:
 * - simple: 기본 라벨 + 텍스트영역 (PersonalMeditationEditor용)
 * - colorful: 색상 뱃지가 있는 시각적 스타일 (EditPostDialog용)
 */

import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type QTFormVariant = 'simple' | 'colorful'

/**
 * QT 폼 필드값
 * - oneWord: PersonalMeditationEditor에서 사용
 * - mySentence: EditPostDialog/UnifiedMeditation에서 사용 (동일 의미)
 */
export interface QTFormValues {
  bibleReference?: string
  oneWord: string  // = mySentence (한 문장 요약)
  meditationQuestion?: string
  meditationAnswer: string
  gratitude: string
  myPrayer: string
  dayReview: string
}

interface QTMeditationFormProps {
  // 필드값
  bibleReference?: string
  oneWord: string
  meditationQuestion?: string
  meditationAnswer: string
  gratitude: string
  myPrayer: string
  dayReview: string
  // 핸들러
  onBibleReferenceChange?: (value: string) => void
  onOneWordChange: (value: string) => void
  onMeditationQuestionChange?: (value: string) => void
  onMeditationAnswerChange: (value: string) => void
  onGratitudeChange: (value: string) => void
  onMyPrayerChange: (value: string) => void
  onDayReviewChange: (value: string) => void
  // 스타일 옵션
  variant?: QTFormVariant
  showBibleReference?: boolean
  showMeditationQuestion?: boolean  // 질문 입력란 표시 여부
  displayMeditationQuestion?: string | null  // 읽기 전용 질문 표시
}

// 색상 뱃지 스타일 (colorful variant용) - 미니멀 스타일
const badgeStyles = {
  oneWord: 'w-6 h-6 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm',
  question: 'w-6 h-6 bg-accent text-accent-foreground rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm',
  gratitude: 'w-6 h-6 bg-accent text-accent-foreground rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm',
  prayer: 'w-6 h-6 bg-accent text-accent-foreground rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm',
  review: 'w-6 h-6 bg-accent text-accent-foreground rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm',
}

export function QTMeditationForm({
  bibleReference = '',
  oneWord,
  meditationQuestion = '',
  meditationAnswer,
  gratitude,
  myPrayer,
  dayReview,
  onBibleReferenceChange,
  onOneWordChange,
  onMeditationQuestionChange,
  onMeditationAnswerChange,
  onGratitudeChange,
  onMyPrayerChange,
  onDayReviewChange,
  variant = 'simple',
  showBibleReference = true,
  showMeditationQuestion = false,
  displayMeditationQuestion,
}: QTMeditationFormProps) {
  const isColorful = variant === 'colorful'

  return (
    <div className="space-y-4">
      {/* 성경 구절 */}
      {showBibleReference && onBibleReferenceChange && (
        <div className="space-y-2">
          <Label htmlFor="bibleReference">성경 구절</Label>
          <Input
            id="bibleReference"
            placeholder="예: 창세기 1:1-10"
            value={bibleReference}
            onChange={(e) => onBibleReferenceChange(e.target.value)}
          />
        </div>
      )}

      {/* 한 문장 요약 (oneWord/mySentence) */}
      <div className="space-y-2">
        {isColorful ? (
          <Label className="flex items-center gap-2">
            <span className={badgeStyles.oneWord}>1</span>
            내 말로 한 문장
          </Label>
        ) : (
          <Label htmlFor="oneWord" className="flex items-center gap-2">
            <span>한 문장 요약</span>
            <span className="text-xs text-muted-foreground">(오늘의 핵심 말씀)</span>
          </Label>
        )}
        <Textarea
          id="oneWord"
          placeholder={isColorful ? '오늘 본문을 내 말로 정리해보세요...' : '오늘 말씀에서 가장 와닿는 한 문장을 적어주세요'}
          value={oneWord}
          onChange={(e) => onOneWordChange(e.target.value)}
          className="min-h-[60px] resize-none"
          rows={isColorful ? 2 : undefined}
        />
      </div>

      {/* 묵상 질문 (입력 가능) */}
      {showMeditationQuestion && onMeditationQuestionChange && (
        <div className="space-y-2">
          <Label htmlFor="meditationQuestion" className="flex items-center gap-2">
            <span>묵상 질문</span>
            <span className="text-xs text-muted-foreground">(선택)</span>
          </Label>
          <Textarea
            id="meditationQuestion"
            placeholder="말씀을 통해 떠오른 질문이 있나요?"
            value={meditationQuestion}
            onChange={(e) => onMeditationQuestionChange(e.target.value)}
            className="min-h-[60px] resize-none"
          />
        </div>
      )}

      {/* 묵상 질문 답변 */}
      <div className="space-y-2">
        {isColorful ? (
          <Label className="flex items-center gap-2">
            <span className={badgeStyles.question}>?</span>
            묵상 질문 답변
          </Label>
        ) : (
          <Label htmlFor="meditationAnswer" className="flex items-center gap-2">
            <span>묵상</span>
            <span className="text-xs text-muted-foreground">(말씀을 통한 깨달음)</span>
          </Label>
        )}
        {/* 읽기 전용 질문 표시 (colorful variant) */}
        {isColorful && displayMeditationQuestion && (
          <p className="text-xs text-accent italic pl-2 border-l-2 border-accent">
            Q. {displayMeditationQuestion}
          </p>
        )}
        <Textarea
          id="meditationAnswer"
          placeholder={isColorful ? '묵상 질문에 대한 답변을 작성해주세요...' : '오늘 말씀을 통해 깨달은 점, 적용할 점을 적어주세요'}
          value={meditationAnswer}
          onChange={(e) => onMeditationAnswerChange(e.target.value)}
          className={isColorful ? '' : 'min-h-[100px] resize-none'}
          rows={isColorful ? 3 : undefined}
        />
      </div>

      {/* 감사 */}
      <div className="space-y-2">
        {isColorful ? (
          <Label className="flex items-center gap-2">
            <span className={badgeStyles.gratitude}>♥</span>
            감사와 적용
          </Label>
        ) : (
          <Label htmlFor="gratitude" className="flex items-center gap-2">
            <span>감사</span>
            <span className="text-xs text-muted-foreground">(선택)</span>
          </Label>
        )}
        <Textarea
          id="gratitude"
          placeholder={isColorful ? '감사한 점과 적용할 점을 적어주세요...' : '오늘 감사한 것은 무엇인가요?'}
          value={gratitude}
          onChange={(e) => onGratitudeChange(e.target.value)}
          className="min-h-[60px] resize-none"
          rows={isColorful ? 2 : undefined}
        />
      </div>

      {/* 기도 */}
      <div className="space-y-2">
        {isColorful ? (
          <Label className="flex items-center gap-2">
            <span className={badgeStyles.prayer}>🙏</span>
            나의 기도
          </Label>
        ) : (
          <Label htmlFor="myPrayer" className="flex items-center gap-2">
            <span>기도</span>
            <span className="text-xs text-muted-foreground">(선택)</span>
          </Label>
        )}
        <Textarea
          id="myPrayer"
          placeholder="오늘의 기도를 적어주세요"
          value={myPrayer}
          onChange={(e) => onMyPrayerChange(e.target.value)}
          className={isColorful ? '' : 'min-h-[80px] resize-none'}
          rows={isColorful ? 2 : undefined}
        />
      </div>

      {/* 하루 점검 */}
      <div className="space-y-2">
        {isColorful ? (
          <Label className="flex items-center gap-2">
            <span className={badgeStyles.review}>✦</span>
            하루 점검
          </Label>
        ) : (
          <Label htmlFor="dayReview" className="flex items-center gap-2">
            <span>하루 점검</span>
            <span className="text-xs text-muted-foreground">(선택)</span>
          </Label>
        )}
        <Textarea
          id="dayReview"
          placeholder="오늘 하루를 돌아보며..."
          value={dayReview}
          onChange={(e) => onDayReviewChange(e.target.value)}
          className="min-h-[60px] resize-none"
          rows={isColorful ? 2 : undefined}
        />
      </div>
    </div>
  )
}
