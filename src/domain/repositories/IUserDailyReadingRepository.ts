/**
 * IUserDailyReadingRepository
 *
 * 사용자 일일 읽기 정보 Repository 인터페이스입니다.
 */

import { UserDailyReading } from '../entities/UserDailyReading'

export interface IUserDailyReadingRepository {
  /**
   * 사용자의 오늘 읽기 목록을 조회합니다.
   * 모든 그룹/교회의 플랜을 통합하여 반환합니다.
   */
  getUserDailyReadings(userId: string): Promise<UserDailyReading[]>

  /**
   * 특정 플랜의 읽음 체크를 토글합니다.
   * 해당 플랜이 적용된 모든 그룹에 동시에 적용됩니다.
   */
  togglePlanCheck(
    userId: string,
    planId: string,
    dayNumber: number,
    groupIds: string[],
    isChecked: boolean
  ): Promise<boolean>
}
