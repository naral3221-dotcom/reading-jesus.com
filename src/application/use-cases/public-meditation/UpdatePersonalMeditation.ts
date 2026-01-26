/**
 * UpdatePersonalMeditation Use Case
 * 개인 프로젝트 묵상 수정
 */

import type { IPublicMeditationRepository, UpdatePublicMeditationInput } from '@/domain/repositories/IPublicMeditationRepository'
import type { PublicMeditationProps, MeditationType } from '@/domain/entities/PublicMeditation'

export interface UpdatePersonalMeditationInput {
  id: string
  userId: string
  meditationType?: MeditationType
  // 자유 형식
  title?: string | null
  content?: string
  bibleReference?: string | null
  // QT 형식
  oneWord?: string | null
  meditationQuestion?: string | null
  meditationAnswer?: string | null
  gratitude?: string | null
  myPrayer?: string | null
  dayReview?: string | null
}

export interface UpdatePersonalMeditationOutput {
  meditation: PublicMeditationProps | null
  error: string | null
}

export class UpdatePersonalMeditation {
  constructor(private repository: IPublicMeditationRepository) {}

  async execute(input: UpdatePersonalMeditationInput): Promise<UpdatePersonalMeditationOutput> {
    try {
      const { id, userId, meditationType } = input

      // 기존 묵상 조회
      const existing = await this.repository.findById(id, userId)
      if (!existing) {
        throw new Error('묵상을 찾을 수 없습니다')
      }

      // 본인 확인
      if (existing.userId !== userId) {
        throw new Error('수정 권한이 없습니다')
      }

      const actualType = meditationType ?? existing.meditationType

      // 형식별 유효성 검사
      if (actualType === 'free' && input.content !== undefined && !input.content.trim()) {
        throw new Error('묵상 내용을 입력해주세요')
      }

      // Repository input 구성
      const repositoryInput: UpdatePublicMeditationInput = {
        title: input.title,
        content: actualType === 'qt' ? this.buildContent(input, existing) : input.content,
        bibleReference: input.bibleReference,
        // QT 필드
        oneWord: input.oneWord,
        meditationQuestion: input.meditationQuestion,
        meditationAnswer: input.meditationAnswer,
        gratitude: input.gratitude,
        myPrayer: input.myPrayer,
        dayReview: input.dayReview,
      }

      const meditation = await this.repository.update(id, userId, repositoryInput)

      return {
        meditation,
        error: null,
      }
    } catch (error) {
      return {
        meditation: null,
        error: error instanceof Error ? error.message : '묵상 수정 중 오류가 발생했습니다',
      }
    }
  }

  /**
   * QT 형식의 content 재구성
   */
  private buildContent(
    input: UpdatePersonalMeditationInput,
    existing: PublicMeditationProps
  ): string {
    const parts: string[] = []

    const oneWord = input.oneWord ?? existing.oneWord
    const question = input.meditationQuestion ?? existing.meditationQuestion
    const answer = input.meditationAnswer ?? existing.meditationAnswer
    const gratitude = input.gratitude ?? existing.gratitude
    const prayer = input.myPrayer ?? existing.myPrayer
    const review = input.dayReview ?? existing.dayReview

    if (oneWord?.trim()) {
      parts.push(`📖 한 문장: ${oneWord.trim()}`)
    }
    if (question?.trim()) {
      parts.push(`❓ 질문: ${question.trim()}`)
    }
    if (answer?.trim()) {
      parts.push(`💭 묵상: ${answer.trim()}`)
    }
    if (gratitude?.trim()) {
      parts.push(`🙏 감사: ${gratitude.trim()}`)
    }
    if (prayer?.trim()) {
      parts.push(`✝️ 기도: ${prayer.trim()}`)
    }
    if (review?.trim()) {
      parts.push(`📝 하루 점검: ${review.trim()}`)
    }

    return parts.join('\n\n')
  }
}
