'use client';

import { useMemo, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListSkeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import {
  Bell,
  Heart,
  MessageCircle,
  Users,
  Megaphone,
  Clock,
  Check,
  CheckCheck,
  Trash2,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useInfiniteNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, useUnreadNotificationCount } from '@/presentation/hooks/queries/useNotification';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/types';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';

// 알림 타입별 아이콘 및 색상
const notificationConfig: Record<NotificationType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  like: {
    icon: <Heart className="w-4 h-4" />,
    color: 'text-accent',
    bgColor: 'bg-accent/10'
  },
  comment: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-accent',
    bgColor: 'bg-accent/10'
  },
  reply: {
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'text-accent',
    bgColor: 'bg-accent/10'
  },
  group_invite: {
    icon: <Users className="w-4 h-4" />,
    color: 'text-accent',
    bgColor: 'bg-accent/10'
  },
  group_notice: {
    icon: <Megaphone className="w-4 h-4" />,
    color: 'text-accent',
    bgColor: 'bg-accent/10'
  },
  reminder: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50'
  },
};

// 시간 포맷
function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// 알림 데이터 타입 (UI용)
interface NotificationUI {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // React Query 훅 사용
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  // 무한 스크롤 알림 목록 조회
  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteNotifications(userId, 20);

  // 읽지 않은 알림 개수 조회
  const { data: unreadData } = useUnreadNotificationCount(userId);

  // 뮤테이션 훅들
  const markAsReadMutation = useMarkAsRead(userId ?? '');
  const markAllAsReadMutation = useMarkAllAsRead(userId ?? '');
  const deleteNotificationMutation = useDeleteNotification(userId ?? '');

  // 알림 데이터를 UI 형식으로 변환
  const notifications = useMemo<NotificationUI[]>(() => {
    if (!notificationsData?.pages) return [];
    return notificationsData.pages.flatMap(page =>
      page.notifications.map(n => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt,
      }))
    );
  }, [notificationsData]);

  // 무한 스크롤 IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleMarkAsRead = async (id: string) => {
    await markAsReadMutation.mutateAsync(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
    toast({ title: '모든 알림을 읽음 처리했습니다' });
  };

  const deleteNotification = async (id: string) => {
    await deleteNotificationMutation.mutateAsync(id);
    toast({ title: '알림이 삭제되었습니다' });
  };

  const handleNotificationClick = async (notification: NotificationUI) => {
    // 읽음 처리
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // 링크가 있으면 이동
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const unreadCount = unreadData?.count ?? 0;
  const loading = userLoading || notificationsLoading;
  const markingAllRead = markAllAsReadMutation.isPending;

  if (loading) {
    return (
      <div className="flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded animate-pulse" />
          <div className="h-7 w-16 bg-muted rounded animate-pulse" />
        </div>
        <ListSkeleton count={5} />
      </div>
    );
  }

  if (notificationsError) {
    return (
      <div className="flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            알림
          </h1>
        </div>
        <ErrorState
          title="알림을 불러올 수 없습니다"
          message="네트워크 연결을 확인하고 다시 시도해주세요"
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            알림
            {unreadCount > 0 && (
              <span className="text-sm bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead}
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            모두 읽음
          </Button>
        )}
      </div>

      {/* 알림 목록 */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="알림이 없습니다"
          description="새로운 활동이 있으면 여기에 표시됩니다"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = notificationConfig[notification.type];

            return (
              <Card
                key={notification.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  !notification.isRead && "bg-primary/5 border-primary/20"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* 아이콘 */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      config.bgColor,
                      config.color
                    )}>
                      {config.icon}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn(
                            "text-sm",
                            !notification.isRead && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                              {notification.message}
                            </p>
                          )}
                        </div>

                        {/* 읽지 않음 표시 */}
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.createdAt.toISOString())}
                        </span>

                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* 무한 스크롤 로딩 영역 */}
          <div ref={loadMoreRef} className="py-4">
            {isFetchingNextPage && (
              <div className="flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!hasNextPage && notifications.length > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                모든 알림을 불러왔습니다
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
