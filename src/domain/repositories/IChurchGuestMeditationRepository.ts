/**
 * Guest Comment Repository Interface
 *
 * 교회 게스트 댓글 데이터 접근을 위한 인터페이스입니다.
 * Infrastructure 레이어에서 구현됩니다.
 */

import {
  GuestComment,
  GuestCommentReply,
  CreateGuestCommentInput,
  UpdateGuestCommentInput,
  CreateGuestCommentReplyInput,
} from '../entities/ChurchGuestMeditation'

export interface GuestCommentSearchParams {
  churchId: string
  dayNumber?: number | null
  limit?: number
  offset?: number
}

export interface GuestCommentWithLikeStatus {
  comment: GuestComment
  isLiked: boolean
}

export interface IGuestCommentRepository {
  /**
   * ID로 댓글을 조회합니다.
   */
  findById(id: string): Promise<GuestComment | null>

  /**
   * 교회의 댓글 목록을 조회합니다.
   * 고정 우선, 최신순으로 정렬됩니다.
   */
  findByChurchId(params: GuestCommentSearchParams): Promise<GuestComment[]>

  /**
   * 특정 날짜의 댓글을 조회합니다.
   */
  findByDay(churchId: string, dayNumber: number): Promise<GuestComment[]>

  /**
   * 댓글을 저장합니다. (생성 또는 수정)
   */
  save(comment: GuestComment | CreateGuestCommentInput): Promise<GuestComment>

  /**
   * 댓글을 수정합니다.
   */
  update(id: string, input: UpdateGuestCommentInput): Promise<GuestComment>

  /**
   * 댓글을 삭제합니다.
   */
  delete(id: string): Promise<void>

  /**
   * 고정 상태를 토글합니다.
   */
  togglePin(id: string): Promise<GuestComment>

  // 좋아요 관련

  /**
   * 좋아요를 추가합니다.
   */
  addLike(commentId: string, userId: string): Promise<void>

  /**
   * 좋아요를 제거합니다.
   */
  removeLike(commentId: string, userId: string): Promise<void>

  /**
   * 사용자가 좋아요를 눌렀는지 확인합니다.
   */
  hasLiked(commentId: string, userId: string): Promise<boolean>

  /**
   * 여러 댓글에 대한 사용자의 좋아요 상태를 확인합니다.
   */
  getLikedCommentIds(commentIds: string[], userId: string): Promise<string[]>

  // 답글 관련

  /**
   * 댓글의 답글 목록을 조회합니다.
   */
  findReplies(commentId: string): Promise<GuestCommentReply[]>

  /**
   * 답글을 추가합니다.
   */
  addReply(input: CreateGuestCommentReplyInput): Promise<GuestCommentReply>

  /**
   * 답글을 삭제합니다.
   */
  deleteReply(replyId: string): Promise<void>
}

// ===== 새 명명 체계 별칭 =====

/** IChurchGuestMeditationRepository = IGuestCommentRepository */
export type IChurchGuestMeditationRepository = IGuestCommentRepository

/** ChurchGuestMeditationSearchParams = GuestCommentSearchParams */
export type ChurchGuestMeditationSearchParams = GuestCommentSearchParams

/** ChurchGuestMeditationWithLikeStatus = GuestCommentWithLikeStatus */
export type ChurchGuestMeditationWithLikeStatus = GuestCommentWithLikeStatus
