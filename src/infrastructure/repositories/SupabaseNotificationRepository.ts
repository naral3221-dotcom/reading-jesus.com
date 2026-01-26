/**
 * Supabase Notification Repository Implementation
 *
 * INotificationRepository 인터페이스의 Supabase 구현체.
 */

import { Notification, NotificationProps, CreateNotificationInput, NotificationType } from '@/domain/entities/Notification'
import { INotificationRepository, NotificationSearchParams } from '@/domain/repositories/INotificationRepository'
import { getSupabaseBrowserClient } from '../supabase/client'

interface NotificationRow {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  link: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

function mapRowToNotificationProps(row: NotificationRow): NotificationProps {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    link: row.link,
    metadata: row.metadata,
    createdAt: new Date(row.created_at),
  }
}

export class SupabaseNotificationRepository implements INotificationRepository {
  private supabase = getSupabaseBrowserClient()

  async findById(id: string): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return Notification.create(mapRowToNotificationProps(data as NotificationRow))
  }

  async findByUserId(params: NotificationSearchParams): Promise<Notification[]> {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false })

    if (params.unreadOnly) {
      query = query.eq('is_read', false)
    }

    if (params.limit) {
      query = query.limit(params.limit)
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error || !data) {
      return []
    }

    return data.map((row) => Notification.create(mapRowToNotificationProps(row as NotificationRow)))
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      return 0
    }

    return count || 0
  }

  async save(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link ?? null,
        metadata: input.metadata ?? null,
        is_read: false,
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error('알림 생성에 실패했습니다')
    }

    return Notification.create(mapRowToNotificationProps(data as NotificationRow))
  }

  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) {
      throw new Error('알림 읽음 처리에 실패했습니다')
    }

    return Notification.create(mapRowToNotificationProps(data as NotificationRow))
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw new Error('알림 일괄 읽음 처리에 실패했습니다')
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error('알림 삭제에 실패했습니다')
    }
  }

  async deleteAll(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)

    if (error) {
      throw new Error('알림 전체 삭제에 실패했습니다')
    }
  }
}
