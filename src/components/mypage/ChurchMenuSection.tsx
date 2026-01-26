'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Calendar, ChevronRight, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChurchMenuSectionProps {
  churchCode: string;
  commentCount?: number;
}

export function ChurchMenuSection({
  churchCode,
  commentCount = 0,
}: ChurchMenuSectionProps) {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="p-0">
        <button
          onClick={() => router.push(`/church/${churchCode}/bible`)}
          className="w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors border-b"
        >
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="flex-1 text-left font-medium">성경 읽기</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => router.push(`/church/${churchCode}/sharing`)}
          className="w-full flex items-center gap-3 p-4 hover:bg-accent active:bg-accent/80 transition-colors border-b"
        >
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium">묵상 나눔</span>
            {commentCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/church/${churchCode}/my/comments`);
                }}
                className="ml-2 text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                내 글 {commentCount}개
              </button>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </button>

        <button
          onClick={() => router.push(`/church/${churchCode}/groups`)}
          className="w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="flex-1 text-left font-medium">교회 소그룹</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </CardContent>
    </Card>
  );
}
