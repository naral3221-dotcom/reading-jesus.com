/**
 * IPublicMeditationRepository
 * 공개 묵상 Repository 인터페이스
 */

import type { PublicMeditationProps, PublicMeditationReplyProps, MeditationType, ContentVisibility } from '../entities/PublicMeditation'

export interface GetPublicMeditationsOptions {
  limit?: number
  offset?: number
  userId?: string // 특정 사용자의 묵상만 조회
  currentUserId?: string // 좋아요 상태 확인용
  followingUserIds?: string[] // 팔로잉 사용자들의 묵상만 조회
  // 개인 프로젝트 필터 (신규)
  projectId?: string
  dayNumber?: number
  meditationType?: MeditationType
  // 공개 범위 필터
  visibility?: ContentVisibility[]
}

export interface CreatePublicMeditationInput {
  userId: string
  title?: string | null
  content: string
  bibleReference?: string | null
  isAnonymous?: boolean
  visibility?: ContentVisibility
  // 개인 프로젝트 관련 (신규)
  projectId?: string | null
  dayNumber?: number | null
  meditationType?: MeditationType
  // QT 형식 전용 (신규)
  oneWord?: string | null
  meditationQuestion?: string | null
  meditationAnswer?: string | null
  gratitude?: string | null
  myPrayer?: string | null
  dayReview?: string | null
}

export interface UpdatePublicMeditationInput {
  title?: string | null
  content?: string
  bibleReference?: string | null
  isAnonymous?: boolean
  visibility?: ContentVisibility
  // QT 형식 전용 (신규)
  oneWord?: string | null
  meditationQuestion?: string | null
  meditationAnswer?: string | null
  gratitude?: string | null
  myPrayer?: string | null
  dayReview?: string | null
}

export interface CreatePublicMeditationReplyInput {
  meditationId: string
  userId: string
  content: string
  isAnonymous?: boolean
  parentReplyId?: string | null
  mentionUserId?: string | null
  mentionNickname?: string | null
}

export interface IPublicMeditationRepository {
  // 조회
  findById(id: string, currentUserId?: string): Promise<PublicMeditationProps | null>
  findAll(options: GetPublicMeditationsOptions): Promise<PublicMeditationProps[]>
  findByUserId(userId: string, options?: { limit?: number; offset?: number; currentUserId?: string }): Promise<PublicMeditationProps[]>
  findByFollowing(followingUserIds: string[], options?: { limit?: number; offset?: number; currentUserId?: string }): Promise<PublicMeditationProps[]>
  count(options?: { userId?: string; followingUserIds?: string[] }): Promise<number>

  // 인기 묵상 조회 (좋아요 순)
  findPopular(options?: {
    limit?: number
    currentUserId?: string
    daysAgo?: number // 최근 N일 이내
  }): Promise<PublicMeditationProps[]>

  // 개인 프로젝트 관련 조회 (신규)
  findByProjectId(projectId: string, options?: {
    limit?: number
    offset?: number
    currentUserId?: string
  }): Promise<PublicMeditationProps[]>
  findByProjectDay(projectId: string, dayNumber: number, currentUserId?: string): Promise<PublicMeditationProps | null>
  countByProject(projectId: string): Promise<number>

  // 생성/수정/삭제
  create(input: CreatePublicMeditationInput): Promise<PublicMeditationProps>
  update(id: string, userId: string, input: UpdatePublicMeditationInput): Promise<PublicMeditationProps>
  delete(id: string, userId: string): Promise<void>

  // 좋아요
  toggleLike(meditationId: string, userId: string): Promise<boolean> // 좋아요 상태 반환

  // 댓글
  findReplies(meditationId: string): Promise<PublicMeditationReplyProps[]>
  createReply(input: CreatePublicMeditationReplyInput): Promise<PublicMeditationReplyProps>
  deleteReply(replyId: string, userId: string): Promise<void>
}
