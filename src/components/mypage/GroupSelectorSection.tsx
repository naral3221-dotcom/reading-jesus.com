'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users } from 'lucide-react';
import type { Group } from '@/types';

interface GroupSelectorSectionProps {
  groups: Group[];
  activeGroup: Group | null;
  onGroupChange: (group: Group) => void;
}

export function GroupSelectorSection({
  groups,
  activeGroup,
  onGroupChange,
}: GroupSelectorSectionProps) {
  // 그룹이 2개 미만이면 표시하지 않음
  if (groups.length < 2) {
    return null;
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">활성 그룹</span>
          </div>
          <Select
            value={activeGroup?.id || ''}
            onValueChange={(groupId) => {
              const selectedGroup = groups.find((g) => g.id === groupId);
              if (selectedGroup) {
                onGroupChange(selectedGroup);
              }
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="그룹 선택" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          선택한 그룹의 통독 진행 상황이 표시됩니다
        </p>
      </CardContent>
    </Card>
  );
}
