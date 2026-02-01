'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenLine, ChevronRight, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import readingPlan from '@/data/reading_plan.json';
import { ReadingPlan } from '@/types';

// day 번호로 날짜 조회
function getDateByDay(dayNumber: number): string | null {
  const plan = (readingPlan as ReadingPlan[]).find(p => p.day === dayNumber);
  return plan?.date || null;
}

interface QTPost {
  id: string;
  content: string;
  day_number: number | null;
  bible_range?: string | null;
  created_at: string;
}

interface RecentQTListProps {
  userId: string;
}

export function RecentQTList({ userId }: RecentQTListProps) {
  const [posts, setPosts] = useState<QTPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecentQTs() {
      const supabase = getSupabaseBrowserClient();
      try {
        // unified_meditations에서 내 QT 글 조회 (최근 5개)
        const { data, error } = await supabase
          .from('unified_meditations')
          .select('id, content, day_number, bible_range, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setPosts(data || []);
      } catch (error) {
        console.error('QT 목록 로드 에러:', error);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadRecentQTs();
    }
  }, [userId]);

  // HTML 태그 제거
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            최근 QT 묵상
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            최근 QT 묵상
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              아직 작성한 묵상이 없습니다
            </p>
            <Link href="/qt">
              <Button variant="outline" size="sm">
                첫 묵상 작성하기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            최근 QT 묵상
          </CardTitle>
          <Link href="/mypage">
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
              전체 보기
              <ChevronRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {posts.map((post) => {
          const qtDate = post.day_number ? getDateByDay(post.day_number) : null;
          return (
          <Link key={post.id} href={qtDate ? `/qt/${qtDate}` : '/qt'}>
            <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-primary">
                  {post.day_number ? `Day ${post.day_number}` : ''}{post.bible_range ? ` · ${post.bible_range}` : ''}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(post.created_at), 'M월 d일', { locale: ko })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {stripHtml(post.content)}
              </p>
            </div>
          </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
