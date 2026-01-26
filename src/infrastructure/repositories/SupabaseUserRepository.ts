/**
 * Supabase User Repository Implementation
 *
 * IUserRepository 인터페이스의 Supabase 구현체.
 */

import { User, UserProps } from '@/domain/entities/User'
import { IUserRepository } from '@/domain/repositories/IUserRepository'
import { getSupabaseBrowserClient } from '../supabase/client'

interface ProfileRow {
  id: string
  nickname: string
  avatar_url: string | null
  has_completed_onboarding: boolean
  created_at: string
  updated_at: string
  church_id: string | null
  church_joined_at: string | null
}

function mapRowToUserProps(row: ProfileRow): UserProps {
  return {
    id: row.id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    hasCompletedOnboarding: row.has_completed_onboarding,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    churchId: row.church_id,
    churchJoinedAt: row.church_joined_at ? new Date(row.church_joined_at) : null,
  }
}

function mapUserToRow(user: User): Partial<ProfileRow> {
  return {
    id: user.id,
    nickname: user.nickname,
    avatar_url: user.avatarUrl,
    has_completed_onboarding: user.hasCompletedOnboarding,
    church_id: user.churchId,
    church_joined_at: user.churchJoinedAt?.toISOString() ?? null,
  }
}

export class SupabaseUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return User.create(mapRowToUserProps(data as ProfileRow))
  }

  async getCurrentUser(): Promise<User | null> {
    const supabase = getSupabaseBrowserClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return null
    }

    return this.findById(authUser.id)
  }

  async save(user: User): Promise<User> {
    const supabase = getSupabaseBrowserClient()
    const row = mapUserToRow(user)

    const { data, error } = await supabase
      .from('profiles')
      .upsert(row)
      .select()
      .single()

    if (error) {
      throw new Error(`사용자 저장 실패: ${error.message}`)
    }

    return User.create(mapRowToUserProps(data as ProfileRow))
  }

  async updateChurchMembership(userId: string, churchId: string | null): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const updateData: Partial<ProfileRow> = {
      church_id: churchId,
      church_joined_at: churchId ? new Date().toISOString() : null,
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (error) {
      throw new Error(`교회 가입 정보 업데이트 실패: ${error.message}`)
    }
  }

  async updateOnboardingStatus(userId: string, completed: boolean): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('profiles')
      .update({ has_completed_onboarding: completed })
      .eq('id', userId)

    if (error) {
      throw new Error(`온보딩 상태 업데이트 실패: ${error.message}`)
    }
  }

  async updateNickname(userId: string, nickname: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('id', userId)

    if (error) {
      throw new Error(`닉네임 업데이트 실패: ${error.message}`)
    }
  }

  async updateAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (error) {
      throw new Error(`아바타 업데이트 실패: ${error.message}`)
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const supabase = getSupabaseBrowserClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      throw new Error(`이미지 업로드 실패: ${uploadError.message}`)
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)

    return urlData.publicUrl
  }

  async deleteAvatar(userId: string, avatarUrl: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    // URL에서 파일 경로 추출
    const urlParts = avatarUrl.split('/avatars/')
    if (urlParts.length < 2) {
      return // 유효하지 않은 URL이면 무시
    }

    const filePath = urlParts[1]

    const { error } = await supabase.storage.from('avatars').remove([filePath])

    if (error) {
      console.error('아바타 삭제 실패:', error.message)
      // 삭제 실패는 무시 (파일이 없을 수도 있음)
    }
  }
}
