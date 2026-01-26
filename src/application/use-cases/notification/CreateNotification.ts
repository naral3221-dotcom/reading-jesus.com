/**
 * Create Notification Use Case
 *
 * 알림 생성 관련 Use Case들
 */

import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client'
import type { NotificationType } from '@/types'

export interface CreateNotificationInput {
  userId: string           // 알림 받을 사용자
  type: NotificationType
  title: string
  message?: string
  link?: string
  relatedCommentId?: string
  relatedGroupId?: string
  actorId?: string         // 알림을 발생시킨 사용자
}

/**
 * 알림 생성 Use Case
 */
export class CreateNotification {
  async execute(input: CreateNotificationInput): Promise<boolean> {
    const { userId, type, title, message, link, relatedCommentId, relatedGroupId, actorId } = input

    // 자기 자신에게는 알림 X
    if (actorId && userId === actorId) {
      return false
    }

    const supabase = getSupabaseBrowserClient()

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message: message || null,
        link: link || null,
        related_comment_id: relatedCommentId || null,
        related_group_id: relatedGroupId || null,
        actor_id: actorId || null,
        is_read: false,
      })

    if (error) {
      console.error('알림 생성 실패:', error)
      return false
    }

    return true
  }
}

/**
 * 좋아요 알림 생성 Use Case
 */
export class CreateLikeNotification {
  private createNotification = new CreateNotification()

  async execute(
    commentOwnerId: string,
    actorId: string,
    commentId: string,
    groupId: string,
    dayNumber: number
  ): Promise<boolean> {
    return this.createNotification.execute({
      userId: commentOwnerId,
      type: 'like',
      title: '회원님의 묵상에 좋아요가 달렸습니다',
      link: `/community?day=${dayNumber}`,
      relatedCommentId: commentId,
      relatedGroupId: groupId,
      actorId,
    })
  }
}

/**
 * 답글 알림 생성 Use Case
 */
export class CreateReplyNotification {
  private createNotification = new CreateNotification()

  async execute(
    commentOwnerId: string,
    actorId: string,
    commentId: string,
    groupId: string,
    dayNumber: number,
    replyContent: string
  ): Promise<boolean> {
    const truncatedContent = replyContent.length > 50
      ? replyContent.substring(0, 50) + '...'
      : replyContent

    return this.createNotification.execute({
      userId: commentOwnerId,
      type: 'reply',
      title: '회원님의 묵상에 답글이 달렸습니다',
      message: truncatedContent,
      link: `/community?day=${dayNumber}`,
      relatedCommentId: commentId,
      relatedGroupId: groupId,
      actorId,
    })
  }
}

/**
 * 그룹 공지 알림 생성 Use Case (모든 그룹 멤버에게)
 */
export class CreateGroupNoticeNotification {
  async execute(
    groupId: string,
    groupName: string,
    noticeTitle: string,
    authorId: string
  ): Promise<void> {
    const supabase = getSupabaseBrowserClient()

    // 그룹 멤버 조회
    const { data: members, error } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)

    if (error || !members) {
      console.error('그룹 멤버 조회 실패:', error)
      return
    }

    // 각 멤버에게 알림 생성 (작성자 제외)
    const notifications = members
      .filter(m => m.user_id !== authorId)
      .map(member => ({
        user_id: member.user_id,
        type: 'group_notice' as NotificationType,
        title: `[${groupName}] 새 공지가 등록되었습니다`,
        message: noticeTitle,
        link: `/group/${groupId}`,
        related_group_id: groupId,
        actor_id: authorId,
        is_read: false,
      }))

    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        console.error('공지 알림 생성 실패:', insertError)
      }
    }
  }
}
