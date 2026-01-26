'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Hand, Check, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { PrayerRequestWithProfile } from '@/types';

interface PrayerCardProps {
  prayer: PrayerRequestWithProfile;
  currentUserId: string | null;
  onSupport: (prayerId: string) => Promise<void>;
  onMarkAnswered: (prayerId: string) => Promise<void>;
  onDelete: (prayerId: string) => Promise<void>;
}

export function PrayerCard({
  prayer,
  currentUserId,
  onSupport,
  onMarkAnswered,
  onDelete,
}: PrayerCardProps) {
  const [isSupporting, setIsSupporting] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  const isOwner = currentUserId === prayer.user_id;
  const displayName = prayer.is_anonymous
    ? '익명'
    : prayer.profile?.nickname || '알 수 없음';
  const initial = displayName.charAt(0);

  const handleSupport = async () => {
    if (isSupporting) return;
    setIsSupporting(true);
    try {
      await onSupport(prayer.id);
    } finally {
      setIsSupporting(false);
    }
  };

  const handleMarkAnswered = async () => {
    if (isMarking) return;
    setIsMarking(true);
    try {
      await onMarkAnswered(prayer.id);
    } finally {
      setIsMarking(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('이 기도제목을 삭제하시겠습니까?')) {
      await onDelete(prayer.id);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all',
        prayer.is_answered && 'bg-accent/10/50 border-accent/30'
      )}
    >
      <CardContent className="pt-4">
        {/* 헤더: 작성자 정보 + 메뉴 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {!prayer.is_anonymous && prayer.profile?.avatar_url ? (
              <Avatar className="w-8 h-8">
                <AvatarImage src={prayer.profile.avatar_url} alt={displayName} />
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {initial}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(prayer.created_at), 'M월 d일 a h:mm', {
                  locale: ko,
                })}
              </p>
            </div>
          </div>

          {/* 응답됨 배지 또는 메뉴 */}
          <div className="flex items-center gap-2">
            {prayer.is_answered && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                <Check className="w-3 h-3" />
                응답됨
              </span>
            )}

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!prayer.is_answered && (
                    <DropdownMenuItem onClick={handleMarkAnswered} disabled={isMarking}>
                      <Check className="mr-2 h-4 w-4 text-accent" />
                      응답 받았어요
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* 기도제목 내용 */}
        <p className="text-sm whitespace-pre-wrap mb-4">{prayer.content}</p>

        {/* 하단: 함께 기도합니다 버튼 */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Button
            variant={prayer.is_supported ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleSupport}
            disabled={isSupporting || !currentUserId}
            className={cn(
              'gap-1.5 transition-colors',
              prayer.is_supported && 'bg-primary/10 text-primary border-primary/20'
            )}
          >
            <Hand
              className={cn(
                'h-4 w-4',
                prayer.is_supported && 'fill-primary text-primary'
              )}
            />
            함께 기도합니다
          </Button>

          {prayer.support_count > 0 && (
            <span className="text-sm text-muted-foreground">
              {prayer.support_count}명이 함께 기도
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
