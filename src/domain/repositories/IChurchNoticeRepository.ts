/**
 * Church Notice Repository Interface
 *
 * 교회 공지사항 데이터 접근을 위한 인터페이스입니다.
 * Infrastructure 레이어에서 구현됩니다.
 */

import { ChurchNotice, CreateChurchNoticeInput } from '../entities/ChurchNotice'

export interface ChurchNoticeSearchParams {
  churchId: string
  activeOnly?: boolean
  includeScheduled?: boolean
  limit?: number
  offset?: number
}

export interface IChurchNoticeRepository {
  /**
   * ID로 공지사항을 조회합니다.
   */
  findById(id: string): Promise<ChurchNotice | null>

  /**
   * 교회의 공지사항 목록을 조회합니다.
   * 기본적으로 고정 우선, 최신순으로 정렬됩니다.
   */
  findByChurchId(params: ChurchNoticeSearchParams): Promise<ChurchNotice[]>

  /**
   * 교회의 활성화된 공지사항만 조회합니다. (메인 페이지용)
   * 현재 시간 기준으로 표시 가능한 공지만 반환합니다.
   */
  findActiveByChurchId(churchId: string): Promise<ChurchNotice[]>

  /**
   * 공지사항을 저장합니다. (생성 또는 수정)
   */
  save(notice: ChurchNotice | CreateChurchNoticeInput): Promise<ChurchNotice>

  /**
   * 공지사항을 삭제합니다.
   */
  delete(id: string): Promise<void>

  /**
   * 고정 상태를 토글합니다.
   */
  togglePin(id: string): Promise<ChurchNotice>

  /**
   * 활성 상태를 토글합니다.
   */
  toggleActive(id: string): Promise<ChurchNotice>
}
