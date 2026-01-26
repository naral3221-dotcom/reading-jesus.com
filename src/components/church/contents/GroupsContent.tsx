'use client';

import Link from 'next/link';
import { Users, ChevronRight, Plus, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChurchByCode } from '@/presentation/hooks/queries/useChurch';
import { useChurchGroups } from '@/presentation/hooks/queries/useGroup';

interface GroupsContentProps {
  churchCode: string;
}

export function GroupsContent({ churchCode }: GroupsContentProps) {
  const { data: churchData, isLoading: churchLoading } = useChurchByCode(churchCode);
  const church = churchData?.church;
  const { data: groups = [], isLoading: groupsLoading } = useChurchGroups(church?.id);

  const isLoading = churchLoading || groupsLoading;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-12 bg-accent/10 rounded-lg" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-accent/10 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-background to-muted/30">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-muted via-white to-muted/50 sticky top-0 z-10 border-b border-border">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-muted0 to-blue-600 flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">소그룹</h1>
                <p className="text-xs text-accent">{groups.length}개 그룹</p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="border-accent/30 text-accent">
              <Link href={`/church/${churchCode}/groups/new`}>
                <Plus className="w-4 h-4 mr-1" />
                그룹 만들기
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="p-4 space-y-3">
        {groups.length === 0 ? (
          <Card className="border-dashed border-accent/30">
            <CardContent className="py-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-accent">아직 소그룹이 없습니다</p>
              <p className="text-sm text-accent mt-1">첫 번째 소그룹을 만들어보세요!</p>
            </CardContent>
          </Card>
        ) : (
          groups.map((group) => (
            <Link key={group.id} href={`/church/${churchCode}/groups/${group.id}`}>
              <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{group.name}</h3>
                          {group.is_private && (
                            <Lock className="w-3.5 h-3.5 text-accent" />
                          )}
                        </div>
                        {group.description && (
                          <p className="text-sm text-accent line-clamp-1">{group.description}</p>
                        )}
                        <p className="text-xs text-accent mt-1">멤버 {group.member_count}명</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-accent" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </main>
    </div>
  );
}
