'use client';

import Link from 'next/link';
import { MessageCircle, Heart, ChevronRight, FileEdit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChurchByCode } from '@/presentation/hooks/queries/useChurch';
import { useRecentChurchPosts } from '@/presentation/hooks/queries/useChurchStats';
import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/date-utils';

interface SharingContentProps {
  churchCode: string;
}

export function SharingContent({ churchCode }: SharingContentProps) {
  const { data: churchData, isLoading: churchLoading } = useChurchByCode(churchCode);
  const church = churchData?.church;
  const { data: posts = [], isLoading: postsLoading } = useRecentChurchPosts(church?.id, 10);

  const isLoading = churchLoading || postsLoading;

  // HTML 태그 제거
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-12 bg-muted rounded-lg" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted/50 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-muted/30 via-background to-accent/5">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-accent/10 via-background to-accent/5 sticky top-0 z-10 border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-md">
                <MessageCircle className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">나눔</h1>
                <p className="text-xs text-muted-foreground">묵상 나눔</p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-accent hover:bg-accent/90">
              <Link href={`/church/${churchCode}/sharing?writeQt=true`}>
                <FileEdit className="w-4 h-4 mr-1" />
                글쓰기
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="p-4 space-y-3">
        {posts.length === 0 ? (
          <Card className="border-dashed border-border">
            <CardContent className="py-8 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">아직 작성된 나눔이 없습니다</p>
              <p className="text-sm text-muted-foreground/80 mt-1">첫 번째 나눔을 작성해보세요!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => {
            const displayName = post.is_anonymous ? '익명' : post.guest_name;
            const avatarColor = post.is_anonymous ? 'bg-muted' : getAvatarColor(post.guest_name);
            const initials = post.is_anonymous ? '?' : getInitials(post.guest_name);
            const contentPreview = stripHtml(post.content).slice(0, 100);

            return (
              <Card key={post.id} className="border-border/60 hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center shrink-0`}>
                      <span className="text-white font-semibold text-sm">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-foreground">{displayName}</span>
                        <span className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {contentPreview}
                        {contentPreview.length >= 100 && '...'}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Heart className="w-3.5 h-3.5" />
                          {post.likes_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {posts.length > 0 && (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/church/${churchCode}/sharing`}>
              더 보기
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        )}
      </main>
    </div>
  );
}
