/**
 * Group Repository Interface
 *
 * 그룹 데이터 접근을 추상화하는 인터페이스입니다.
 * Infrastructure 계층에서 Supabase로 구현됩니다.
 */

import { Group, GroupMember } from '../entities/Group'

export interface GroupSearchParams {
  churchId?: string
  isPublic?: boolean
  query?: string
  limit?: number
  offset?: number
}

export interface IGroupRepository {
  /**
   * ID로 그룹을 조회합니다.
   */
  findById(id: string): Promise<Group | null>

  /**
   * 초대 코드로 그룹을 조회합니다.
   */
  findByInviteCode(inviteCode: string): Promise<Group | null>

  /**
   * 사용자가 속한 그룹 목록을 조회합니다.
   */
  findByUserId(userId: string): Promise<Group[]>

  /**
   * 교회의 그룹 목록을 조회합니다.
   */
  findByChurchId(churchId: string): Promise<Group[]>

  /**
   * 그룹을 검색합니다.
   */
  search(params: GroupSearchParams): Promise<Group[]>

  /**
   * 그룹을 저장합니다. (생성 또는 업데이트)
   */
  save(group: Group): Promise<Group>

  /**
   * 그룹을 삭제합니다.
   */
  delete(id: string): Promise<void>

  /**
   * 그룹 멤버를 조회합니다.
   */
  findMembers(groupId: string): Promise<GroupMember[]>

  /**
   * 그룹 멤버 수를 조회합니다.
   */
  getMemberCount(groupId: string): Promise<number>

  /**
   * 사용자가 그룹 멤버인지 확인합니다.
   */
  isMember(groupId: string, userId: string): Promise<boolean>

  /**
   * 그룹에 멤버를 추가합니다.
   */
  addMember(groupId: string, userId: string, role?: 'admin' | 'member'): Promise<GroupMember>

  /**
   * 그룹에서 멤버를 제거합니다.
   */
  removeMember(groupId: string, userId: string): Promise<void>

  /**
   * 멤버의 역할을 변경합니다.
   */
  updateMemberRole(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void>
}
