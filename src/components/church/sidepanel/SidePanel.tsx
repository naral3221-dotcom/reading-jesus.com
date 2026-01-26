'use client';

import { ReadingProgress } from './ReadingProgress';
import { TodayStats } from './TodayStats';
import { ReadingCalendar } from './ReadingCalendar';
import { QuickActions } from './QuickActions';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';

interface SidePanelProps {
  churchCode: string;
  churchId?: string;
}

export function SidePanel({ churchCode, churchId }: SidePanelProps) {
  const { data } = useCurrentUser();
  const userId = data?.user?.id ?? null;

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 border-l border-border/60 bg-gradient-to-b from-muted/30 to-background h-screen sticky top-0 overflow-y-auto">
      <div className="p-4 space-y-4">
        <ReadingProgress churchCode={churchCode} churchId={churchId} userId={userId} />
        <TodayStats churchCode={churchCode} churchId={churchId} />
        <ReadingCalendar churchCode={churchCode} churchId={churchId} userId={userId} />
        <QuickActions churchCode={churchCode} />
      </div>
    </aside>
  );
}
