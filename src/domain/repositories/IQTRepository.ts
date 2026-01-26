/**
 * QT Repository Interface
 *
 * QT(묵상) 데이터 접근을 위한 추상화 인터페이스.
 * Infrastructure 레이어에서 구현됩니다.
 */

import { QT } from '../entities/QT'

export interface IQTRepository {
  /**
   * 날짜로 QT를 조회합니다.
   */
  findByDate(date: Date): Promise<QT | null>

  /**
   * 일차로 QT를 조회합니다.
   */
  findByDayNumber(dayNumber: number): Promise<QT | null>

  /**
   * 월별 QT 목록을 조회합니다.
   */
  findByMonth(year: number, month: number): Promise<QT[]>

  /**
   * 오늘의 QT를 조회합니다.
   */
  findToday(): Promise<QT | null>

  /**
   * QT 범위를 조회합니다 (시작일~종료일).
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<QT[]>
}
