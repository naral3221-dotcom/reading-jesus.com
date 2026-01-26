/**
 * ChurchAdmin Repository Interface
 *
 * 교회 관리자 저장소 인터페이스.
 */

import type {
  ChurchAdminProps,
  CreateChurchAdminInput,
  ChurchAdminAuthResult,
} from '../entities/ChurchAdmin'

/**
 * 교회 관리자 저장소 인터페이스
 */
export interface IChurchAdminRepository {
  /**
   * 이메일/비밀번호로 교회 관리자 인증
   */
  authenticateWithEmail(
    email: string,
    password: string,
    churchCode: string
  ): Promise<ChurchAdminAuthResult>

  /**
   * 토큰으로 교회 인증 (레거시)
   */
  authenticateWithToken(token: string, churchCode: string): Promise<ChurchAdminAuthResult>

  /**
   * 교회 관리자 생성
   */
  create(input: CreateChurchAdminInput): Promise<ChurchAdminProps>

  /**
   * 교회 관리자 조회 (ID)
   */
  findById(id: string): Promise<ChurchAdminProps | null>

  /**
   * 교회별 관리자 목록 조회
   */
  findByChurchId(churchId: string): Promise<ChurchAdminProps[]>

  /**
   * 교회 관리자 삭제
   */
  delete(id: string): Promise<void>

  /**
   * 관리자 활성화/비활성화 토글
   */
  toggleActive(id: string): Promise<boolean>

  /**
   * 마지막 로그인 시간 업데이트
   */
  updateLastLogin(id: string): Promise<void>

  /**
   * 비밀번호 재설정 이메일 발송
   */
  sendPasswordResetEmail(email: string): Promise<void>

  /**
   * 교회 코드로 교회 정보 조회
   */
  getChurchByCode(code: string): Promise<{
    id: string
    name: string
    code: string
    adminToken: string | null
  } | null>

  /**
   * 현재 세션의 관리자가 특정 교회의 관리자인지 확인
   */
  isAdminOfChurch(userId: string, churchId: string): Promise<boolean>

  /**
   * 이메일 사용 가능 여부 확인
   */
  isEmailAvailable(email: string): Promise<boolean>

  /**
   * 로그아웃
   */
  signOut(): Promise<void>
}
