/**
 * Church QT Post Repository Interface
 *
 * 교회 QT 나눔 데이터 접근을 위한 인터페이스입니다.
 * Infrastructure 레이어에서 구현됩니다.
 */

import {
  ChurchQTPost,
  ChurchQTPostReply,
  CreateChurchQTPostInput,
  UpdateChurchQTPostInput,
  CreateChurchQTPostReplyInput,
} from '../entities/ChurchQTPost'

export interface ChurchQTPostSearchParams {
  churchId: string
  dayNumber?: number | null
  qtDate?: string | null
  limit?: number
  offset?: number
}

export interface IChurchQTPostRepository {
  /**
   * ID로 QT 나눔을 조회합니다.
   */
  findById(id: string): Promise<ChurchQTPost | null>

  /**
   * 교회의 QT 나눔 목록을 조회합니다.
   * 고정 우선, 최신순으로 정렬됩니다.
   */
  findByChurchId(params: ChurchQTPostSearchParams): Promise<ChurchQTPost[]>

  /**
   * 특정 날짜의 QT 나눔을 조회합니다.
   */
  findByDate(churchId: string, qtDate: string): Promise<ChurchQTPost[]>

  /**
   * QT 나눔을 저장합니다. (생성 또는 수정)
   */
  save(post: ChurchQTPost | CreateChurchQTPostInput): Promise<ChurchQTPost>

  /**
   * QT 나눔을 수정합니다.
   */
  update(id: string, input: UpdateChurchQTPostInput): Promise<ChurchQTPost>

  /**
   * QT 나눔을 삭제합니다.
   */
  delete(id: string): Promise<void>

  /**
   * 고정 상태를 토글합니다.
   */
  togglePin(id: string): Promise<ChurchQTPost>

  // 좋아요 관련

  /**
   * 좋아요를 추가합니다.
   */
  addLike(postId: string, userId: string): Promise<void>

  /**
   * 좋아요를 제거합니다.
   */
  removeLike(postId: string, userId: string): Promise<void>

  /**
   * 사용자가 좋아요를 눌렀는지 확인합니다.
   */
  hasLiked(postId: string, userId: string): Promise<boolean>

  /**
   * 여러 QT에 대한 사용자의 좋아요 상태를 확인합니다.
   */
  getLikedPostIds(postIds: string[], userId: string): Promise<string[]>

  // 답글 관련

  /**
   * QT의 답글 목록을 조회합니다.
   */
  findReplies(postId: string): Promise<ChurchQTPostReply[]>

  /**
   * 답글을 추가합니다.
   */
  addReply(input: CreateChurchQTPostReplyInput): Promise<ChurchQTPostReply>

  /**
   * 답글을 삭제합니다.
   */
  deleteReply(replyId: string): Promise<void>
}
