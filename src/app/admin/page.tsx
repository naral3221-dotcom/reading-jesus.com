'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import {
  Users,
  MessageSquare,
  Church,
  BookOpen,
  TrendingUp,
  Calendar,
  Loader2,
  UsersRound,
  Database,
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalGroups: number;
  totalChurches: number;
  totalPosts: number;
  todayActiveUsers: number;
  todayPosts: number;
  weeklyGrowth: number;
  // 추가 통계
  totalNotifications: number;
  totalQtPosts: number;
  totalReports: number;
  totalDailyChecks: number;
  totalGroupMembers: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalGroups: 0,
    totalChurches: 0,
    totalPosts: 0,
    todayActiveUsers: 0,
    todayPosts: 0,
    weeklyGrowth: 0,
    totalNotifications: 0,
    totalQtPosts: 0,
    totalReports: 0,
    totalDailyChecks: 0,
    totalGroupMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<
    { type: string; message: string; time: string }[]
  >([]);

  useEffect(() => {
    const loadStats = async () => {
      const supabase = getSupabaseBrowserClient();
      try {
        // 병렬로 통계 데이터 로드
        const [
          usersResult,
          groupsResult,
          churchesResult,
          commentsResult,
          guestCommentsResult,
          notificationsResult,
          qtPostsResult,
          reportsResult,
          dailyChecksResult,
          groupMembersResult,
        ] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('groups').select('id', { count: 'exact', head: true }),
          supabase.from('churches').select('id', { count: 'exact', head: true }),
          supabase.from('comments').select('id', { count: 'exact', head: true }),
          supabase.from('guest_comments').select('id', { count: 'exact', head: true }),
          supabase.from('notifications').select('id', { count: 'exact', head: true }),
          supabase.from('qt_posts').select('id', { count: 'exact', head: true }),
          supabase.from('reports').select('id', { count: 'exact', head: true }),
          supabase.from('daily_checks').select('id', { count: 'exact', head: true }),
          supabase.from('group_members').select('id', { count: 'exact', head: true }),
        ]);

        // 오늘 날짜 계산
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // 오늘 작성된 글 수
        const { count: todayCommentsCount } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', todayISO);

        // 최근 활동 가져오기 (최근 댓글) - 조인 없이 조회
        const { data: recentComments } = await supabase
          .from('comments')
          .select('id, content, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(5);

        // 각 댓글의 author 정보를 별도 조회
        const activities = await Promise.all(
          (recentComments || []).map(async (comment) => {
            let nickname = '익명';
            if (comment.user_id) {
              const { data: author } = await supabase
                .from('profiles')
                .select('nickname')
                .eq('id', comment.user_id)
                .maybeSingle();
              nickname = author?.nickname || '익명';
            }
            return {
              type: 'comment',
              message: `${nickname}님이 새 묵상을 작성했습니다`,
              time: formatTimeAgo(new Date(comment.created_at)),
            };
          })
        );

        setStats({
          totalUsers: usersResult.count || 0,
          totalGroups: groupsResult.count || 0,
          totalChurches: churchesResult.count || 0,
          totalPosts: (commentsResult.count || 0) + (guestCommentsResult.count || 0),
          todayActiveUsers: 0, // 추후 구현
          todayPosts: todayCommentsCount || 0,
          weeklyGrowth: 0, // 추후 구현
          totalNotifications: notificationsResult.count || 0,
          totalQtPosts: qtPostsResult.count || 0,
          totalReports: reportsResult.count || 0,
          totalDailyChecks: dailyChecksResult.count || 0,
          totalGroupMembers: groupMembersResult.count || 0,
        });

        setRecentActivities(activities);
      } catch (err) {
        console.error('통계 로드 에러:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-muted-foreground">Reading Jesus 전체 현황</p>
      </div>

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">총 사용자</p>
                <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-accent/10 dark:bg-accent rounded-full">
                <Users className="w-5 h-5 text-accent dark:text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">그룹</p>
                <p className="text-2xl font-bold">{stats.totalGroups.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-accent/10 dark:bg-accent rounded-full">
                <UsersRound className="w-5 h-5 text-accent dark:text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">교회</p>
                <p className="text-2xl font-bold">{stats.totalChurches.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-accent/10 dark:bg-accent rounded-full">
                <Church className="w-5 h-5 text-accent dark:text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">총 게시글</p>
                <p className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <MessageSquare className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 데이터베이스 통계 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4" />
            데이터베이스 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold">{stats.totalGroupMembers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">그룹 멤버</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold">{stats.totalDailyChecks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">읽기 체크</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold">{stats.totalQtPosts.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">QT 게시글</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold">{stats.totalNotifications.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">알림</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-lg font-bold text-accent">{stats.totalReports.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">신고</p>
            </div>
            <a href="/admin/database" className="text-center p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
              <Database className="w-5 h-5 mx-auto text-primary" />
              <p className="text-xs text-primary mt-1">전체 보기</p>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* 오늘 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              오늘 활동
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">오늘 작성된 글</span>
                <span className="font-semibold">{stats.todayPosts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">활성 사용자</span>
                <span className="font-semibold text-muted-foreground">-</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              성장 지표
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">주간 사용자 증가</span>
                <span className="font-semibold text-muted-foreground">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">주간 게시글 증가</span>
                <span className="font-semibold text-muted-foreground">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            최근 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              최근 활동이 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-sm">{activity.message}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 빠른 링크 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <a
              href="/admin/users"
              className="p-3 text-center rounded-lg border hover:bg-muted transition-colors"
            >
              <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <span className="text-sm">사용자 관리</span>
            </a>
            <a
              href="/admin/groups"
              className="p-3 text-center rounded-lg border hover:bg-muted transition-colors"
            >
              <UsersRound className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <span className="text-sm">그룹 관리</span>
            </a>
            <a
              href="/admin/moderation"
              className="p-3 text-center rounded-lg border hover:bg-muted transition-colors"
            >
              <MessageSquare className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <span className="text-sm">모더레이션</span>
            </a>
            <a
              href="/admin/churches"
              className="p-3 text-center rounded-lg border hover:bg-muted transition-colors"
            >
              <Church className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <span className="text-sm">교회 관리</span>
            </a>
            <a
              href="/admin/database"
              className="p-3 text-center rounded-lg border hover:bg-muted transition-colors"
            >
              <Database className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <span className="text-sm">데이터베이스</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
