'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Church, Users, ChevronRight } from 'lucide-react';
import type { Church as ChurchEntity } from '@/domain/entities/Church';
import type { Group } from '@/domain/entities/Group';

interface DashboardQuickLinksProps {
  church: ChurchEntity | null;
  activeGroup: Group | null;
}

export function DashboardQuickLinks({ church, activeGroup }: DashboardQuickLinksProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 우리교회 바로가기 */}
      {church ? (
        <Link href={`/church/${church.code}`}>
          <Card className="h-full border-border/60 bg-gradient-to-br from-muted via-orange-50 to-muted/80/80 hover:shadow-lg hover:border-border/80 transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center mb-3 shadow-sm">
                  <Church className="w-5 h-5 text-white" />
                </div>
                <ChevronRight className="w-4 h-4 text-accent" />
              </div>
              <p className="text-xs text-accent/80 mb-0.5">우리교회</p>
              <p className="font-semibold text-sm text-foreground truncate">{church.name}</p>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <div className="h-full flex flex-col gap-2">
          <Link href="/church" className="flex-1">
            <Card className="h-full border-dashed border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Church className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">기존 교회</p>
                    <p className="font-medium text-sm text-foreground">교회 검색하기</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/church/register" className="flex-1">
            <Card className="h-full border-border/60 bg-gradient-to-br from-muted to-muted hover:shadow-md hover:border-border transition-all cursor-pointer">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center">
                    <Church className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-accent/80">새 교회</p>
                    <p className="font-medium text-sm text-foreground">교회 등록하기</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-accent" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* 내 소속그룹 바로가기 */}
      {activeGroup ? (
        <Link href={church ? `/church/${church.code}/groups/${activeGroup.id}` : `/group/${activeGroup.id}`}>
          <Card className="h-full border-accent/30/50 bg-gradient-to-br from-muted to-blue-100/50 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <ChevronRight className="w-4 h-4 text-accent" />
              </div>
              <p className="text-xs text-muted-foreground mb-0.5">내 소속그룹</p>
              <p className="font-semibold text-sm text-foreground truncate">{activeGroup.name}</p>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Link href={church ? `/church/${church.code}/groups` : '/group'}>
          <Card className="h-full border-dashed border-border hover:border-accent hover:shadow-md transition-all cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mb-0.5">그룹 찾기</p>
              <p className="font-semibold text-sm text-muted-foreground">그룹 참여하기</p>
            </CardContent>
          </Card>
        </Link>
      )}
    </div>
  );
}
