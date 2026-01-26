/**
 * GetMainPageData Use Case
 *
 * 메인 페이지에서 필요한 모든 데이터를 병렬로 로드합니다.
 * - 사용자 정보
 * - 교회 정보
 * - 그룹 목록
 * - 개인 프로젝트
 * - 일일 읽기 정보
 */

import type { User } from '@/domain/entities/User'
import type { Church } from '@/domain/entities/Church'
import type { Group } from '@/domain/entities/Group'
import type { UserDailyReading } from '@/domain/entities/UserDailyReading'
import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { IChurchRepository } from '@/domain/repositories/IChurchRepository'
import type { IGroupRepository } from '@/domain/repositories/IGroupRepository'
import type { IUserDailyReadingRepository } from '@/domain/repositories/IUserDailyReadingRepository'

// 개인 프로젝트 타입 (PersonalProject 엔티티가 없어서 임시 정의)
export interface PersonalProjectData {
  id: string
  name: string
  planType: string
  startDate: string
  status: 'active' | 'paused' | 'completed'
  currentDay: number
  totalDays: number
}

export interface GetMainPageDataInput {
  userId: string | null
}

export interface GroupWithMemberCount {
  group: Group
  memberCount: number
}

export interface GetMainPageDataOutput {
  user: User | null
  church: Church | null
  groups: GroupWithMemberCount[]
  personalProjects: PersonalProjectData[]
  dailyReadings: UserDailyReading[]
  error: string | null
}

export class GetMainPageData {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly churchRepository: IChurchRepository,
    private readonly groupRepository: IGroupRepository,
    private readonly userDailyReadingRepository: IUserDailyReadingRepository
  ) {}

  async execute(input: GetMainPageDataInput): Promise<GetMainPageDataOutput> {
    const { userId } = input

    // 로그인하지 않은 경우
    if (!userId) {
      return {
        user: null,
        church: null,
        groups: [],
        personalProjects: [],
        dailyReadings: [],
        error: null,
      }
    }

    try {
      // 병렬로 모든 데이터 로드
      const [
        user,
        groups,
        dailyReadings,
      ] = await Promise.all([
        this.userRepository.findById(userId),
        this.groupRepository.findByUserId(userId),
        this.userDailyReadingRepository.getUserDailyReadings(userId),
      ])

      // 교회 정보 로드 (사용자의 churchId가 있는 경우)
      let church: Church | null = null
      if (user?.churchId) {
        church = await this.churchRepository.findById(user.churchId)
      }

      // 그룹 멤버 수 가져오기 (병렬)
      const groupsWithMemberCount: GroupWithMemberCount[] = await Promise.all(
        groups.map(async (group) => {
          const memberCount = await this.groupRepository.getMemberCount(group.id)
          return { group, memberCount }
        })
      )

      return {
        user,
        church,
        groups: groupsWithMemberCount,
        personalProjects: [], // TODO: 개인 프로젝트 Repository 연동
        dailyReadings,
        error: null,
      }
    } catch (error) {
      console.error('Failed to load main page data:', error)
      return {
        user: null,
        church: null,
        groups: [],
        personalProjects: [],
        dailyReadings: [],
        error: error instanceof Error ? error.message : '데이터 로드 실패',
      }
    }
  }
}
