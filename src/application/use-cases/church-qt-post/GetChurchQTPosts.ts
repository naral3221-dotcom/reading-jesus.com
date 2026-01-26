/**
 * GetChurchQTPosts Use Case
 *
 * 교회의 QT 나눔 목록을 조회하는 Use Case.
 */

import { ChurchQTPost } from '@/domain/entities/ChurchQTPost'
import { IChurchQTPostRepository } from '@/domain/repositories/IChurchQTPostRepository'

export interface GetChurchQTPostsInput {
  churchId: string
  dayNumber?: number | null
  qtDate?: string | null
  limit?: number
  offset?: number
  userId?: string | null // 좋아요 상태 확인용
}

export interface GetChurchQTPostsOutput {
  posts: Array<{
    post: ChurchQTPost
    isLiked: boolean
  }>
  error: string | null
}

export class GetChurchQTPosts {
  constructor(private readonly churchQTPostRepository: IChurchQTPostRepository) {}

  async execute(input: GetChurchQTPostsInput): Promise<GetChurchQTPostsOutput> {
    try {
      const posts = await this.churchQTPostRepository.findByChurchId({
        churchId: input.churchId,
        dayNumber: input.dayNumber,
        qtDate: input.qtDate,
        limit: input.limit,
        offset: input.offset,
      })

      // 사용자의 좋아요 상태 확인
      let likedIds: string[] = []
      if (input.userId) {
        likedIds = await this.churchQTPostRepository.getLikedPostIds(
          posts.map((p) => p.id),
          input.userId
        )
      }

      return {
        posts: posts.map((post) => ({
          post,
          isLiked: likedIds.includes(post.id),
        })),
        error: null,
      }
    } catch (error) {
      return {
        posts: [],
        error: error instanceof Error ? error.message : 'QT 나눔 목록 조회 중 오류가 발생했습니다',
      }
    }
  }
}
