'use client';

import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, BookOpen } from 'lucide-react';
import { useUserPlans, type PlanOption } from '@/presentation/hooks/queries/useUserPlans';

interface PlanSelectorProps {
  selectedPlanId: string | null;
  onPlanChange: (planId: string, planOption: PlanOption) => void;
}

export function PlanSelector({ selectedPlanId, onPlanChange }: PlanSelectorProps) {
  const { data: plans = [], isLoading } = useUserPlans();

  // 기본 플랜 선택
  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      onPlanChange(plans[0].id, plans[0]);
    }
  }, [plans, selectedPlanId, onPlanChange]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        플랜 로딩 중...
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="w-4 h-4" />
        그룹에 가입하면 플랜을 볼 수 있어요
      </div>
    );
  }

  if (plans.length === 1) {
    // 플랜이 하나면 드롭다운 없이 표시
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">
          {plans[0].type === 'reading_jesus' ? '📖' : '📘'}
        </span>
        <span className="font-medium">{plans[0].name}</span>
      </div>
    );
  }

  return (
    <Select
      value={selectedPlanId || plans[0]?.id}
      onValueChange={(value) => {
        const plan = plans.find(p => p.id === value);
        if (plan) {
          onPlanChange(value, plan);
        }
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="플랜 선택" />
      </SelectTrigger>
      <SelectContent>
        {plans.map((plan) => (
          <SelectItem key={plan.id} value={plan.id}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {plan.type === 'reading_jesus' ? '📖' : '📘'}
              </span>
              <span>{plan.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
