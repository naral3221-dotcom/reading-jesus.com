'use client';

import { useMemo } from 'react';
import { Heart, Loader2, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useReceivedEncouragements,
  useUnreadEncouragementCount,
  useMarkEncouragementAsRead,
  useMarkAllEncouragementAsRead,
} from '@/presentation/hooks/queries/useEncouragement';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface EncouragementListProps {
  userId: string;
  groupId?: string;
  limit?: number;
  showEmpty?: boolean;
}

export function EncouragementList({
  userId,
  groupId,
  limit = 10,
  showEmpty = true,
}: EncouragementListProps) {
  const { data: encouragements = [], isLoading } = useReceivedEncouragements(userId, groupId, limit);
  const markAsReadMutation = useMarkEncouragementAsRead();
  const markAllAsReadMutation = useMarkAllEncouragementAsRead();

  const unreadCount = useMemo(
    () => encouragements.filter((e) => !e.is_read).length,
    [encouragements]
  );

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate({ id, userId, groupId });
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = encouragements.filter((e) => !e.is_read).map((e) => e.id);
    if (unreadIds.length === 0) return;
    markAllAsReadMutation.mutate({ ids: unreadIds, userId, groupId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (encouragements.length === 0) {
    if (!showEmpty) return null;
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Heart className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">받은 격려 메시지가 없어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            새 격려 <span className="text-primary font-medium">{unreadCount}개</span>
          </span>
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="text-xs text-primary hover:underline"
          >
            모두 읽음 처리
          </button>
        </div>
      )}

      {/* 격려 목록 */}
      <div className="space-y-2">
        {encouragements.map((encouragement) => (
          <div
            key={encouragement.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl transition-colors',
              !encouragement.is_read ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
            )}
          >
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={encouragement.sender?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {encouragement.sender?.nickname?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {encouragement.sender?.nickname || '익명'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(encouragement.created_at), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
              <p className="text-sm mt-0.5">{encouragement.message}</p>
            </div>

            {!encouragement.is_read && (
              <button
                type="button"
                onClick={() => handleMarkAsRead(encouragement.id)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                title="읽음 처리"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 격려 알림 뱃지 (헤더용)
interface EncouragementBadgeProps {
  userId: string;
  groupId?: string;
}

export function EncouragementBadge({ userId, groupId }: EncouragementBadgeProps) {
  const { data: unreadCount = 0 } = useUnreadEncouragementCount(userId, groupId);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}
