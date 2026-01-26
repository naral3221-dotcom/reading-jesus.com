/**
 * ToggleChurchQTPostLike Use Case
 *
 * QT 나눔 좋아요를 토글하는 Use Case.
 */

import { IChurchQTPostRepository } from '@/domain/repositories/IChurchQTPostRepository'

export interface ToggleChurchQTPostLikeInput {
  postId: string
  userId: string
}

export interface ToggleChurchQTPostLikeOutput {
  isLiked: boolean
  error: string | null
}

export class ToggleChurchQTPostLike {
  constructor(private readonly churchQTPostRepository: IChurchQTPostRepository) {}

  async execute(input: ToggleChurchQTPostLikeInput): Promise<ToggleChurchQTPostLikeOutput> {
    try {
      const hasLiked = await this.churchQTPostRepository.hasLiked(input.postId, input.userId)

      if (hasLiked) {
        await this.churchQTPostRepository.removeLike(input.postId, input.userId)
        return { isLiked: false, error: null }
      } else {
        await this.churchQTPostRepository.addLike(input.postId, input.userId)
        return { isLiked: true, error: null }
      }
    } catch (error) {
      return {
        isLiked: false,
        error: error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다',
      }
    }
  }
}
