/**
 * CreatePersonalMeditation Use Case
 * 개인 프로젝트에 묵상 생성
 */

import type { IPublicMeditationRepository, CreatePublicMeditationInput } from '@/domain/repositories/IPublicMeditationRepository'
import type { PublicMeditationProps, MeditationType } from '@/domain/entities/PublicMeditation'

export interface CreatePersonalMeditationInput {
  userId: string
  projectId: string
  dayNumber: number
  meditationType: MeditationType
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
  // 공개 설정
  isPublic?: boolean
}

export interface CreatePersonalMeditationOutput {
  meditation: PublicMeditationProps | null
  error: string | null
}

export class CreatePersonalMeditation {
  constructor(private repository: IPublicMeditationRepository) {}

  async execute(input: CreatePersonalMeditationInput): Promise<CreatePersonalMeditationOutput> {
    try {
      const { meditationType, content, oneWord, meditationAnswer } = input

      // 형식별 유효성 검사
      if (meditationType === 'free' && !content?.trim()) {
        throw new Error('묵상 내용을 입력해주세요')
      }

      if (meditationType === 'qt') {
        // QT 형식에서는 최소 한 문장 또는 묵상 답변이 필요
        if (!oneWord?.trim() && !meditationAnswer?.trim()) {
          throw new Error('한 문장 요약 또는 묵상 답변을 입력해주세요')
        }
      }

      if (meditationType === 'memo' && !content?.trim()) {
        throw new Error('메모 내용을 입력해주세요')
      }

      // Repository input 구성
      const repositoryInput: CreatePublicMeditationInput = {
        userId: input.userId,
        projectId: input.projectId,
        dayNumber: input.dayNumber,
        meditationType: input.meditationType,
        title: input.title ?? null,
        content: this.buildContent(input),
        bibleReference: input.bibleReference ?? null,
        isAnonymous: false,
        // QT 필드
        oneWord: input.oneWord ?? null,
        meditationQuestion: input.meditationQuestion ?? null,
        meditationAnswer: input.meditationAnswer ?? null,
        gratitude: input.gratitude ?? null,
        myPrayer: input.myPrayer ?? null,
        dayReview: input.dayReview ?? null,
      }

      const meditation = await this.repository.create(repositoryInput)

      return {
        meditation,
        error: null,
      }
    } catch (error) {
      return {
        meditation: null,
        error: error instanceof Error ? error.message : '묵상 생성 중 오류가 발생했습니다',
      }
    }
  }

  /**
   * 형식별 content 필드 구성
   * QT 형식의 경우 각 필드를 조합하여 content 생성
   */
  private buildContent(input: CreatePersonalMeditationInput): string {
    if (input.meditationType === 'qt') {
      const parts: string[] = []

      if (input.oneWord?.trim()) {
        parts.push(`📖 한 문장: ${input.oneWord.trim()}`)
      }
      if (input.meditationQuestion?.trim()) {
        parts.push(`❓ 질문: ${input.meditationQuestion.trim()}`)
      }
      if (input.meditationAnswer?.trim()) {
        parts.push(`💭 묵상: ${input.meditationAnswer.trim()}`)
      }
      if (input.gratitude?.trim()) {
        parts.push(`🙏 감사: ${input.gratitude.trim()}`)
      }
      if (input.myPrayer?.trim()) {
        parts.push(`✝️ 기도: ${input.myPrayer.trim()}`)
      }
      if (input.dayReview?.trim()) {
        parts.push(`📝 하루 점검: ${input.dayReview.trim()}`)
      }

      return parts.join('\n\n')
    }

    // 자유/메모 형식
    return input.content ?? ''
  }
}
