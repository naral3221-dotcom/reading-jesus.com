/**
 * UnifiedMeditation Repository Interface
 *
 * 통합 묵상 저장소 인터페이스.
 * 그룹 묵상, 교회 묵상, QT 나눔을 통합 관리.
 */

import type {
  SourceType,
  ContentType,
  UnifiedMeditationProps,
  CreateUnifiedMeditationInput,
  UpdateUnifiedMeditationInput,
  UnifiedMeditationReplyProps,
  CreateUnifiedMeditationReplyInput,
} from '../entities/UnifiedMeditation'

/**
 * 통합 묵상 검색 파라미터
 */
export interface UnifiedMeditationSearchParams {
  sourceType: SourceType
  sourceId: string
  dayNumber?: number | null
  contentType?: ContentType | null // 'free' | 'qt' | null (전체)
  userId?: string | null // 좋아요 상태 확인용
  filter?: 'all' | 'mine' | 'pinned'
  limit?: number
  offset?: number
  orderBy?: 'created_at' | 'likes_count'
  orderDir?: 'asc' | 'desc'
}

/**
 * 사용자 묵상 검색 파라미터
 */
export interface UserMeditationSearchParams {
  userId: string
  sourceType?: SourceType | null // null이면 전체
  contentType?: ContentType | null
  limit?: number
  offset?: number
}

/**
 * 통합 묵상 (좋아요 상태 포함)
 */
export interface UnifiedMeditationWithLikeStatus extends UnifiedMeditationProps {
  isLiked: boolean
}

/**
 * 통합 묵상 저장소 인터페이스
 */
export interface IUnifiedMeditationRepository {
  /**
   * 출처별 묵상 조회
   */
  findBySource(params: UnifiedMeditationSearchParams): Promise<UnifiedMeditationWithLikeStatus[]>

  /**
   * 묵상 ID로 조회
   */
  findById(id: string, userId?: string | null): Promise<UnifiedMeditationWithLikeStatus | null>

  /**
   * 사용자의 모든 묵상 조회 (mypage용)
   */
  findByUser(params: UserMeditationSearchParams): Promise<UnifiedMeditationProps[]>

  /**
   * 사용자의 묵상 수 조회
   */
  getUserMeditationCount(userId: string, sourceType?: SourceType | null): Promise<number>

  /**
   * 묵상 생성
   */
  create(input: CreateUnifiedMeditationInput): Promise<UnifiedMeditationProps>

  /**
   * 묵상 수정
   */
  update(
    id: string,
    userId: string | null,
    guestToken: string | null,
    input: UpdateUnifiedMeditationInput
  ): Promise<UnifiedMeditationProps>

  /**
   * 묵상 삭제
   */
  delete(id: string, userId: string | null, guestToken: string | null): Promise<void>

  /**
   * 좋아요 토글
   */
  toggleLike(
    meditationId: string,
    userId: string | null,
    guestToken: string | null
  ): Promise<boolean>

  /**
   * 고정 토글 (관리자용)
   */
  togglePin(meditationId: string): Promise<boolean>

  /**
   * 묵상의 답글 조회
   */
  findReplies(meditationId: string): Promise<UnifiedMeditationReplyProps[]>

  /**
   * 답글 생성
   */
  createReply(input: CreateUnifiedMeditationReplyInput): Promise<UnifiedMeditationReplyProps>

  /**
   * 답글 수정
   */
  updateReply(
    id: string,
    userId: string | null,
    guestToken: string | null,
    content: string
  ): Promise<UnifiedMeditationReplyProps>

  /**
   * 답글 삭제
   */
  deleteReply(id: string, userId: string | null, guestToken: string | null): Promise<void>

  /**
   * 묵상 수 조회
   */
  getCount(sourceType: SourceType, sourceId: string, dayNumber?: number | null): Promise<number>

  /**
   * 좋아요 여부 확인
   */
  isLiked(
    meditationId: string,
    userId: string | null,
    guestToken: string | null
  ): Promise<boolean>
}
