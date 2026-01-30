/**
 * SupabaseUserFollowRepository
 * 팔로우 관계 Supabase 구현체
 */

import { getSupabaseBrowserClient } from '../supabase/client'
import type {
  IUserFollowRepository,
  GetFollowersOptions,
  GetFollowingOptions,
  GetSuggestedUsersOptions,
} from '@/domain/repositories/IUserFollowRepository'
import type { UserFollowProps, UserWithFollowStatus } from '@/domain/entities/UserFollow'

export class SupabaseUserFollowRepository implements IUserFollowRepository {
  // 팔로우
  async follow(followerId: string, followingId: string): Promise<UserFollowProps> {
    const supabase = getSupabaseBrowserClient()

    if (followerId === followingId) {
      throw new Error('자기 자신을 팔로우할 수 없습니다')
    }

    const { data, error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('이미 팔로우하고 있습니다')
      }
      throw new Error(`팔로우 실패: ${error.message}`)
    }

    return this.mapToProps(data)
  }

  // 언팔로우
  async unfollow(followerId: string, followingId: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)

    if (error) {
      throw new Error(`언팔로우 실패: ${error.message}`)
    }
  }

  // 팔로우 상태 확인
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()

    const { data } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle()

    return !!data
  }

  // 팔로워 목록 조회
  async getFollowers(options: GetFollowersOptions): Promise<UserWithFollowStatus[]> {
    const supabase = getSupabaseBrowserClient()
    const { userId, limit = 20, offset = 0, currentUserId } = options

    // userId를 팔로우하는 사람들 목록
    const { data, error } = await supabase
      .from('user_follows')
      .select('follower_id, created_at')
      .eq('following_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error || !data || data.length === 0) return []

    const followerIds = data.map(d => d.follower_id)

    // 프로필 정보 별도 조회
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .in('id', followerIds)

    const profileMap = new Map(
      (profiles ?? []).map(p => [p.id, p])
    )

    // 팔로워/팔로잉 수는 실시간으로 계산
    const countsPromises = followerIds.map(async (id) => {
      const [followersCount, followingCount] = await Promise.all([
        this.getFollowersCount(id),
        this.getFollowingCount(id),
      ])
      return { id, followersCount, followingCount }
    })
    const counts = await Promise.all(countsPromises)
    const countsMap = new Map(counts.map(c => [c.id, c]))

    // 현재 사용자의 팔로우 상태 일괄 조회
    let followingIds: Set<string> = new Set()
    let followedByIds: Set<string> = new Set()

    if (currentUserId) {
      // 현재 사용자가 팔로우하는지
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .in('following_id', followerIds)

      if (followingData) {
        followingIds = new Set(followingData.map(f => f.following_id))
      }

      // 현재 사용자를 팔로우하는지
      const { data: followedByData } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', currentUserId)
        .in('follower_id', followerIds)

      if (followedByData) {
        followedByIds = new Set(followedByData.map(f => f.follower_id))
      }
    }

    return data.map(d => {
      const profile = profileMap.get(d.follower_id)
      const countData = countsMap.get(d.follower_id)
      return {
        id: d.follower_id,
        nickname: profile?.nickname ?? '사용자',
        avatarUrl: profile?.avatar_url ?? null,
        followersCount: countData?.followersCount ?? 0,
        followingCount: countData?.followingCount ?? 0,
        isFollowing: followingIds.has(d.follower_id),
        isFollowedBy: followedByIds.has(d.follower_id),
      }
    })
  }

  // 팔로잉 목록 조회
  async getFollowing(options: GetFollowingOptions): Promise<UserWithFollowStatus[]> {
    const supabase = getSupabaseBrowserClient()
    const { userId, limit = 20, offset = 0, currentUserId } = options

    // userId가 팔로우하는 사람들 목록
    const { data, error } = await supabase
      .from('user_follows')
      .select('following_id, created_at')
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error || !data || data.length === 0) return []

    const targetIds = data.map(d => d.following_id)

    // 프로필 정보 별도 조회
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url')
      .in('id', targetIds)

    const profileMap = new Map(
      (profiles ?? []).map(p => [p.id, p])
    )

    // 팔로워/팔로잉 수는 실시간으로 계산
    const countsPromises = targetIds.map(async (id) => {
      const [followersCount, followingCount] = await Promise.all([
        this.getFollowersCount(id),
        this.getFollowingCount(id),
      ])
      return { id, followersCount, followingCount }
    })
    const counts = await Promise.all(countsPromises)
    const countsMap = new Map(counts.map(c => [c.id, c]))

    // 현재 사용자의 팔로우 상태 일괄 조회
    let followingIds: Set<string> = new Set()
    let followedByIds: Set<string> = new Set()

    if (currentUserId && currentUserId !== userId) {
      // 현재 사용자가 팔로우하는지
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUserId)
        .in('following_id', targetIds)

      if (followingData) {
        followingIds = new Set(followingData.map(f => f.following_id))
      }

      // 현재 사용자를 팔로우하는지
      const { data: followedByData } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', currentUserId)
        .in('follower_id', targetIds)

      if (followedByData) {
        followedByIds = new Set(followedByData.map(f => f.follower_id))
      }
    } else if (currentUserId === userId) {
      // 본인의 팔로잉 목록이면 모두 팔로잉 상태
      followingIds = new Set(targetIds)
    }

    return data.map(d => {
      const profile = profileMap.get(d.following_id)
      const countData = countsMap.get(d.following_id)
      return {
        id: d.following_id,
        nickname: profile?.nickname ?? '사용자',
        avatarUrl: profile?.avatar_url ?? null,
        followersCount: countData?.followersCount ?? 0,
        followingCount: countData?.followingCount ?? 0,
        isFollowing: followingIds.has(d.following_id),
        isFollowedBy: followedByIds.has(d.following_id),
      }
    })
  }

  // 팔로잉 ID 목록 조회 (피드 조회용)
  async getFollowingIds(userId: string): Promise<string[]> {
    const supabase = getSupabaseBrowserClient()

    const { data, error } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (error || !data) return []

    return data.map(d => d.following_id)
  }

  // 팔로워 카운트
  async getFollowersCount(userId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    const { count } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId)

    return count ?? 0
  }

  // 팔로잉 카운트
  async getFollowingCount(userId: string): Promise<number> {
    const supabase = getSupabaseBrowserClient()

    const { count } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', userId)

    return count ?? 0
  }

  // 특정 사용자 프로필 + 팔로우 상태
  async getUserWithFollowStatus(targetUserId: string, currentUserId?: string): Promise<UserWithFollowStatus | null> {
    const supabase = getSupabaseBrowserClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        nickname,
        avatar_url,
        church_id,
        church:churches(id, name, code)
      `)
      .eq('id', targetUserId)
      .maybeSingle()

    if (error || !profile) return null

    // 팔로워/팔로잉 수 실시간 계산
    const [followersCount, followingCount] = await Promise.all([
      this.getFollowersCount(targetUserId),
      this.getFollowingCount(targetUserId),
    ])

    let isFollowing = false
    let isFollowedBy = false

    if (currentUserId && currentUserId !== targetUserId) {
      // 현재 사용자가 타겟을 팔로우하는지
      const { data: followingData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle()
      isFollowing = !!followingData

      // 타겟이 현재 사용자를 팔로우하는지
      const { data: followedByData } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', targetUserId)
        .eq('following_id', currentUserId)
        .maybeSingle()
      isFollowedBy = !!followedByData
    }

    // 교회 정보 추출
    const church = profile.church as unknown as { id: string; name: string; code: string } | null

    return {
      id: profile.id,
      nickname: profile.nickname,
      avatarUrl: profile.avatar_url,
      followersCount,
      followingCount,
      isFollowing,
      isFollowedBy,
      churchId: church?.id,
      churchName: church?.name,
      churchCode: church?.code,
    }
  }

  // 추천 사용자 조회 (같은 교회 우선, 이미 팔로우 중인 사용자 제외)
  async getSuggestedUsers(options: GetSuggestedUsersOptions): Promise<UserWithFollowStatus[]> {
    const supabase = getSupabaseBrowserClient()
    const { currentUserId, churchId, limit = 5 } = options

    // 1. 이미 팔로우 중인 사용자 ID 목록 조회
    const followingIds = await this.getFollowingIds(currentUserId)
    const excludeIds = [...followingIds, currentUserId]

    // 2. 같은 교회 사용자 조회 (있는 경우)
    const sameChurchUsers: UserWithFollowStatus[] = []
    if (churchId) {
      const { data: churchUsers } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, followers_count, following_count')
        .eq('church_id', churchId)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('followers_count', { ascending: false })
        .limit(limit)

      if (churchUsers) {
        sameChurchUsers.push(...churchUsers.map(u => ({
          id: u.id,
          nickname: u.nickname ?? '사용자',
          avatarUrl: u.avatar_url,
          followersCount: u.followers_count ?? 0,
          followingCount: u.following_count ?? 0,
          isFollowing: false,
          isFollowedBy: false,
        })))
      }
    }

    // 3. 같은 교회 사용자로 limit 채우지 못하면 인기 사용자 추가
    if (sameChurchUsers.length < limit) {
      const remaining = limit - sameChurchUsers.length
      const alreadyIncluded = sameChurchUsers.map(u => u.id)
      const allExcludeIds = [...excludeIds, ...alreadyIncluded]

      const { data: popularUsers } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url, followers_count, following_count')
        .not('id', 'in', `(${allExcludeIds.join(',')})`)
        .gt('followers_count', 0)
        .order('followers_count', { ascending: false })
        .limit(remaining)

      if (popularUsers) {
        sameChurchUsers.push(...popularUsers.map(u => ({
          id: u.id,
          nickname: u.nickname ?? '사용자',
          avatarUrl: u.avatar_url,
          followersCount: u.followers_count ?? 0,
          followingCount: u.following_count ?? 0,
          isFollowing: false,
          isFollowedBy: false,
        })))
      }
    }

    return sameChurchUsers.slice(0, limit)
  }

  // DB row -> Props 매핑
  private mapToProps(data: Record<string, unknown>): UserFollowProps {
    return {
      id: data.id as string,
      followerId: data.follower_id as string,
      followingId: data.following_id as string,
      createdAt: new Date(data.created_at as string),
    }
  }
}
