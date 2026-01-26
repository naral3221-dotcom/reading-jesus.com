/**
 * User Repository Interface
 *
 * 사용자 데이터 접근을 위한 추상화 인터페이스.
 * Infrastructure 레이어에서 구현됩니다.
 */

import { User } from '../entities/User'

export interface IUserRepository {
  /**
   * ID로 사용자를 조회합니다.
   */
  findById(id: string): Promise<User | null>

  /**
   * 현재 로그인한 사용자를 조회합니다.
   */
  getCurrentUser(): Promise<User | null>

  /**
   * 사용자를 저장합니다 (생성 또는 업데이트).
   */
  save(user: User): Promise<User>

  /**
   * 사용자의 교회 가입 정보를 업데이트합니다.
   */
  updateChurchMembership(userId: string, churchId: string | null): Promise<void>

  /**
   * 사용자의 온보딩 완료 상태를 업데이트합니다.
   */
  updateOnboardingStatus(userId: string, completed: boolean): Promise<void>

  /**
   * 사용자의 닉네임을 업데이트합니다.
   */
  updateNickname(userId: string, nickname: string): Promise<void>

  /**
   * 사용자의 아바타 URL을 업데이트합니다.
   */
  updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<void>

  /**
   * 아바타 이미지를 업로드하고 URL을 반환합니다.
   */
  uploadAvatar(userId: string, file: File): Promise<string>

  /**
   * 기존 아바타 이미지를 삭제합니다.
   */
  deleteAvatar(userId: string, avatarUrl: string): Promise<void>
}
