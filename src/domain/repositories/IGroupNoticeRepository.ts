/**
 * Group Notice Repository Interface
 *
 * 그룹 공지사항 데이터 접근을 위한 인터페이스입니다.
 * Infrastructure 레이어에서 구현됩니다.
 */

import { GroupNotice, CreateGroupNoticeInput } from '../entities/GroupNotice'

export interface GroupNoticeSearchParams {
  groupId: string
  limit?: number
  offset?: number
}

export interface IGroupNoticeRepository {
  /**
   * ID로 공지사항을 조회합니다.
   */
  findById(id: string): Promise<GroupNotice | null>

  /**
   * 그룹의 공지사항 목록을 조회합니다.
   * 고정 우선, 최신순으로 정렬됩니다.
   */
  findByGroupId(params: GroupNoticeSearchParams): Promise<GroupNotice[]>

  /**
   * 공지사항을 저장합니다. (생성 또는 수정)
   */
  save(notice: GroupNotice | CreateGroupNoticeInput): Promise<GroupNotice>

  /**
   * 공지사항을 삭제합니다.
   */
  delete(id: string): Promise<void>

  /**
   * 고정 상태를 토글합니다.
   */
  togglePin(id: string): Promise<GroupNotice>
}
