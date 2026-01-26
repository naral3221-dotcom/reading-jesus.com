/**
 * Church Repository Interface
 *
 * 교회 데이터 접근을 위한 추상화 인터페이스.
 * Infrastructure 레이어에서 구현됩니다.
 */

import { Church } from '../entities/Church'

export interface ChurchSearchParams {
  query?: string
  regionCode?: string
  denomination?: string
  limit?: number
  offset?: number
}

export interface IChurchRepository {
  /**
   * ID로 교회를 조회합니다.
   */
  findById(id: string): Promise<Church | null>

  /**
   * 코드로 교회를 조회합니다.
   */
  findByCode(code: string): Promise<Church | null>

  /**
   * 교회를 검색합니다.
   */
  search(params: ChurchSearchParams): Promise<Church[]>

  /**
   * 교회를 저장합니다 (생성 또는 업데이트).
   */
  save(church: Church): Promise<Church>

  /**
   * 교회를 삭제합니다.
   */
  delete(id: string): Promise<void>

  /**
   * 교회의 활성화 상태를 변경합니다.
   */
  updateActiveStatus(id: string, isActive: boolean): Promise<void>

  /**
   * 교회의 익명 허용 설정을 변경합니다.
   */
  updateAnonymousAllowed(id: string, allowAnonymous: boolean): Promise<void>

  /**
   * 교회 코드가 사용 가능한지 확인합니다.
   */
  isCodeAvailable(code: string): Promise<boolean>

  /**
   * 교회의 멤버 수를 조회합니다.
   */
  getMemberCount(churchId: string): Promise<number>

  /**
   * 교회의 멤버 목록을 조회합니다.
   */
  findMembers(
    churchId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<
    Array<{
      userId: string
      displayName: string | null
      avatarUrl: string | null
      joinedAt: Date
    }>
  >

  /**
   * 교회에서 멤버를 제거합니다 (탈퇴).
   */
  removeMember(churchId: string, userId: string): Promise<void>

  /**
   * 사용자가 교회 멤버인지 확인합니다.
   */
  isMember(churchId: string, userId: string): Promise<boolean>
}
