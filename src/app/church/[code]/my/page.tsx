'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UnifiedMyPage } from '@/components/mypage';
import { ChurchBottomNav } from '@/components/church/ChurchBottomNav';
import { ChurchLayout } from '@/components/church/ChurchLayout';
import { ProfileSkeleton, StatsSkeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import type { Church } from '@/types';

export default function ChurchMyPage() {
  const params = useParams();
  const router = useRouter();
  const churchCode = params.code as string;

  const [loading, setLoading] = useState(true);
  const [church, setChurch] = useState<Church | null>(null);

  useEffect(() => {
    const loadChurch = async () => {
      const supabase = getSupabaseBrowserClient();
      try {
        const { data: churchData, error } = await supabase
          .from('churches')
          .select('*')
          .eq('code', churchCode.toUpperCase())
          .eq('is_active', true)
          .single();

        if (error || !churchData) {
          router.push('/');
          return;
        }

        setChurch(churchData);
      } catch (err) {
        console.error('교회 정보 로드 에러:', err);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadChurch();
  }, [churchCode, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-4 lg:ml-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <ProfileSkeleton />
            </CardContent>
          </Card>
          <StatsSkeleton />
        </div>
        <ChurchBottomNav churchCode={churchCode} />
      </div>
    );
  }

  if (!church) {
    return null;
  }

  return (
    <ChurchLayout churchCode={churchCode} churchId={church.id}>
      <UnifiedMyPage
        churchContext={{
          churchCode,
          church,
        }}
      />
    </ChurchLayout>
  );
}
