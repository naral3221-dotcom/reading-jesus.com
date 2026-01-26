/**
 * Supabase ChurchAdmin Repository Implementation
 *
 * 교회 관리자 Supabase 구현체.
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type { IChurchAdminRepository } from '@/domain/repositories/IChurchAdminRepository'
import type {
  ChurchAdminProps,
  CreateChurchAdminInput,
  ChurchAdminAuthResult,
} from '@/domain/entities/ChurchAdmin'

// DB Row 타입
interface AdminRow {
  id: string
  email: string
  church_id: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string | null
  churches?: {
    id: string
    name: string
    code: string
  }
}

interface ChurchRow {
  id: string
  name: string
  code: string
  admin_token: string | null
}

export class SupabaseChurchAdminRepository implements IChurchAdminRepository {
  /**
   * Row를 Props로 변환
   */
  private toProps(row: AdminRow): ChurchAdminProps {
    return {
      id: row.id,
      email: row.email,
      churchId: row.church_id,
      isActive: row.is_active,
      lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
      church: row.churches
        ? {
            id: row.churches.id,
            name: row.churches.name,
            code: row.churches.code,
          }
        : undefined,
    }
  }

  /**
   * 이메일/비밀번호로 교회 관리자 인증
   */
  async authenticateWithEmail(
    email: string,
    password: string,
    churchCode: string
  ): Promise<ChurchAdminAuthResult> {
    const supabase = getSupabaseBrowserClient()
    try {
      // 1. 교회 정보 조회
      const church = await this.getChurchByCode(churchCode)
      if (!church) {
        return {
          admin: null,
          churchId: null,
          churchName: null,
          error: '교회를 찾을 수 없습니다',
        }
      }

      // 2. Supabase Auth 로그인
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        return {
          admin: null,
          churchId: null,
          churchName: null,
          error: '이메일 또는 비밀번호가 올바르지 않습니다',
        }
      }

      // 3. 교회 관리자인지 확인
      const { data: admin, error: adminError } = await supabase
        .from('church_admins')
        .select('*, churches(id, name, code)')
        .eq('id', authData.user.id)
        .eq('church_id', church.id)
        .single()

      if (adminError || !admin) {
        await supabase.auth.signOut()
        return {
          admin: null,
          churchId: null,
          churchName: null,
          error: '이 교회의 관리자가 아닙니다',
        }
      }

      if (!admin.is_active) {
        await supabase.auth.signOut()
        return {
          admin: null,
          churchId: null,
          churchName: null,
          error: '비활성화된 계정입니다',
        }
      }

      // 4. 마지막 로그인 시간 업데이트
      await this.updateLastLogin(admin.id)

      return {
        admin: this.toProps(admin as AdminRow),
        churchId: church.id,
        churchName: church.name,
        error: null,
      }
    } catch {
      return {
        admin: null,
        churchId: null,
        churchName: null,
        error: '인증 중 오류가 발생했습니다',
      }
    }
  }

  /**
   * 토큰으로 교회 인증 (레거시)
   */
  async authenticateWithToken(
    token: string,
    churchCode: string
  ): Promise<ChurchAdminAuthResult> {
    try {
      const church = await this.getChurchByCode(churchCode)
      if (!church) {
        return {
          admin: null,
          churchId: null,
          churchName: null,
          error: '교회를 찾을 수 없습니다',
        }
      }

      if (!church.adminToken || church.adminToken !== token.trim()) {
        return {
          admin: null,
          churchId: null,
          churchName: null,
          error: '토큰이 일치하지 않습니다',
        }
      }

      return {
        admin: null, // 토큰 인증은 admin 객체 없음
        churchId: church.id,
        churchName: church.name,
        error: null,
      }
    } catch {
      return {
        admin: null,
        churchId: null,
        churchName: null,
        error: '인증 중 오류가 발생했습니다',
      }
    }
  }

  /**
   * 교회 관리자 생성
   */
  async create(input: CreateChurchAdminInput): Promise<ChurchAdminProps> {
    const supabase = getSupabaseBrowserClient()
    // 1. Supabase Auth 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
    })

    if (authError || !authData.user) {
      throw new Error(`관리자 계정 생성 실패: ${authError?.message || '알 수 없는 오류'}`)
    }

    // 2. church_admins 테이블에 레코드 생성
    const { data, error } = await supabase
      .from('church_admins')
      .insert({
        id: authData.user.id,
        email: input.email,
        church_id: input.churchId,
        is_active: true,
      })
      .select('*, churches(id, name, code)')
      .single()

    if (error) {
      throw new Error(`관리자 정보 저장 실패: ${error.message}`)
    }

    return this.toProps(data as AdminRow)
  }

  /**
   * 교회 관리자 조회 (ID)
   */
  async findById(id: string): Promise<ChurchAdminProps | null> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('church_admins')
      .select('*, churches(id, name, code)')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.toProps(data as AdminRow)
  }

  /**
   * 교회별 관리자 목록 조회
   */
  async findByChurchId(churchId: string): Promise<ChurchAdminProps[]> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('church_admins')
      .select('*, churches(id, name, code)')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return (data as AdminRow[]).map((row) => this.toProps(row))
  }

  /**
   * 교회 관리자 삭제
   */
  async delete(id: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from('church_admins').delete().eq('id', id)

    if (error) {
      throw new Error(`관리자 삭제 실패: ${error.message}`)
    }
  }

  /**
   * 관리자 활성화/비활성화 토글
   */
  async toggleActive(id: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    // 현재 상태 조회
    const { data: current } = await supabase
      .from('church_admins')
      .select('is_active')
      .eq('id', id)
      .single()

    if (!current) {
      throw new Error('관리자를 찾을 수 없습니다')
    }

    const newIsActive = !current.is_active

    const { error } = await supabase
      .from('church_admins')
      .update({
        is_active: newIsActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new Error(`상태 변경 실패: ${error.message}`)
    }

    return newIsActive
  }

  /**
   * 마지막 로그인 시간 업데이트
   */
  async updateLastLogin(id: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    await supabase
      .from('church_admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', id)
  }

  /**
   * 비밀번호 재설정 이메일 발송
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/church/admin/reset-password`,
    })

    if (error) {
      throw new Error(`비밀번호 재설정 이메일 발송 실패: ${error.message}`)
    }
  }

  /**
   * 교회 코드로 교회 정보 조회
   */
  async getChurchByCode(
    code: string
  ): Promise<{ id: string; name: string; code: string; adminToken: string | null } | null> {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('churches')
      .select('id, name, code, admin_token')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !data) return null

    const church = data as ChurchRow
    return {
      id: church.id,
      name: church.name,
      code: church.code,
      adminToken: church.admin_token,
    }
  }

  /**
   * 현재 세션의 관리자가 특정 교회의 관리자인지 확인
   */
  async isAdminOfChurch(userId: string, churchId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from('church_admins')
      .select('id')
      .eq('id', userId)
      .eq('church_id', churchId)
      .eq('is_active', true)
      .single()

    return !!data
  }

  /**
   * 이메일 사용 가능 여부 확인
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase
      .from('church_admins')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    return !data
  }

  /**
   * 로그아웃
   */
  async signOut(): Promise<void> {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
  }
}
