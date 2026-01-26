/**
 * Prayer Repository Interface
 *
 * 기도제목 저장소 인터페이스 정의.
 */

import { PrayerProps, CreatePrayerInput, UpdatePrayerInput } from '@/domain/entities/Prayer'

export interface PrayerSearchParams {
  groupId: string
  userId?: string | null
}

export interface IPrayerRepository {
  /**
   * 그룹의 기도제목 목록을 조회합니다.
   */
  findByGroupId(params: PrayerSearchParams): Promise<PrayerProps[]>

  /**
   * ID로 기도제목을 조회합니다.
   */
  findById(id: string): Promise<PrayerProps | null>

  /**
   * 새 기도제목을 생성합니다.
   */
  create(input: CreatePrayerInput): Promise<PrayerProps>

  /**
   * 기도제목을 수정합니다.
   */
  update(id: string, input: UpdatePrayerInput): Promise<PrayerProps>

  /**
   * 기도제목을 삭제합니다.
   */
  delete(id: string, userId: string): Promise<void>

  /**
   * 기도제목을 응답됨으로 표시합니다.
   */
  markAsAnswered(id: string, userId: string): Promise<PrayerProps>

  /**
   * 함께 기도를 토글합니다.
   */
  toggleSupport(prayerId: string, userId: string): Promise<{ supported: boolean }>

  /**
   * 사용자가 함께 기도한 목록을 조회합니다.
   */
  getSupportedPrayerIds(userId: string): Promise<string[]>
}
