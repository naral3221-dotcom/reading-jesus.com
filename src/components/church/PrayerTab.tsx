'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PrayerCard } from './PrayerCard';
import {
  usePrayers,
  useCreatePrayer,
  useDeletePrayer,
  useMarkPrayerAsAnswered,
  useTogglePrayerSupport,
} from '@/presentation/hooks/queries';
import type { PrayerRequestWithProfile } from '@/types';

interface PrayerTabProps {
  groupId: string;
  currentUserId: string | null;
  isMember: boolean;
}

export function PrayerTab({ groupId, currentUserId, isMember }: PrayerTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // React Query 훅 사용
  const { data, isLoading } = usePrayers(groupId, { userId: currentUserId });
  const createPrayer = useCreatePrayer(groupId);
  const deletePrayer = useDeletePrayer(groupId);
  const markAsAnswered = useMarkPrayerAsAnswered(groupId);
  const toggleSupport = useTogglePrayerSupport(groupId);

  // PrayerProps를 PrayerRequestWithProfile로 변환
  const prayers: PrayerRequestWithProfile[] = (data?.prayers || []).map((p) => ({
    id: p.id,
    group_id: p.groupId,
    user_id: p.userId,
    content: p.content,
    is_anonymous: p.isAnonymous,
    is_answered: p.isAnswered,
    answered_at: p.answeredAt?.toISOString() || null,
    support_count: p.supportCount,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
    profile: p.profile,
    is_supported: p.isSupported,
  }));

  // 기도제목 작성
  const handleSubmit = async () => {
    if (!content.trim() || !currentUserId || createPrayer.isPending) return;

    try {
      await createPrayer.mutateAsync({
        userId: currentUserId,
        content: content.trim(),
        isAnonymous,
      });
      setContent('');
      setIsAnonymous(false);
      setShowForm(false);
    } catch (err) {
      console.error('기도제목 작성 에러:', err);
      alert('기도제목 작성에 실패했습니다.');
    }
  };

  // 함께 기도합니다 토글
  const handleSupport = async (prayerId: string) => {
    if (!currentUserId) return;

    try {
      await toggleSupport.mutateAsync({ prayerId, userId: currentUserId });
    } catch (err) {
      console.error('함께 기도 에러:', err);
    }
  };

  // 응답됨 표시
  const handleMarkAnswered = async (prayerId: string) => {
    if (!currentUserId) return;

    try {
      await markAsAnswered.mutateAsync({ id: prayerId, userId: currentUserId });
    } catch (err) {
      console.error('응답 표시 에러:', err);
    }
  };

  // 기도제목 삭제
  const handleDelete = async (prayerId: string) => {
    if (!currentUserId) return;

    try {
      await deletePrayer.mutateAsync({ id: prayerId, userId: currentUserId });
    } catch (err) {
      console.error('기도제목 삭제 에러:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 기도제목 작성 폼 */}
      {isMember && currentUserId && (
        <>
          {showForm ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">기도제목 나누기</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="기도제목을 나눠주세요..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                  />
                  <Label htmlFor="anonymous" className="text-sm text-muted-foreground">
                    익명으로 작성하기
                  </Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setContent('');
                      setIsAnonymous(false);
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!content.trim() || createPrayer.isPending}
                  >
                    {createPrayer.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        작성 중...
                      </>
                    ) : (
                      '나누기'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              기도제목 나누기
            </Button>
          )}
        </>
      )}

      {/* 기도제목 목록 */}
      {prayers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">아직 기도제목이 없습니다</p>
          <p className="text-sm">첫 번째 기도제목을 나눠주세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {prayers.map((prayer) => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              currentUserId={currentUserId}
              onSupport={handleSupport}
              onMarkAnswered={handleMarkAnswered}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
