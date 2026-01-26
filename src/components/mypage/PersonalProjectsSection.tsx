'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Plus, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PersonalProjectWithStats } from '@/types';

interface PersonalProjectsSectionProps {
  projects: PersonalProjectWithStats[];
  churchCode?: string;
}

export function PersonalProjectsSection({
  projects,
  churchCode,
}: PersonalProjectsSectionProps) {
  const router = useRouter();

  // 컨텍스트에 따라 경로 생성
  const basePath = churchCode ? `/church/${churchCode}/my` : '/mypage';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            나만의 리딩지저스
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => router.push(`${basePath}/projects/new`)}
          >
            <Plus className="w-4 h-4 mr-1" />
            새 프로젝트
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-6">
            <Target className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              개인 성경 읽기 프로젝트를 만들어보세요
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`${basePath}/projects/new`)}
            >
              <Plus className="w-4 h-4 mr-1" />
              프로젝트 만들기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <button
                key={project.id}
                className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                onClick={() => router.push(`${basePath}/projects/${project.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{project.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    Day {project.currentDay}
                  </span>
                </div>
                {project.goal && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    {project.goal}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Progress
                    value={project.progressPercentage}
                    className="h-2 flex-1"
                  />
                  <span className="text-xs font-medium text-primary w-10 text-right">
                    {project.progressPercentage}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{project.completedDays}일 완료</span>
                  <span>
                    {project.reading_plan_type === '365' && '365일 플랜'}
                    {project.reading_plan_type === '180' && '180일 플랜'}
                    {project.reading_plan_type === '90' && '90일 플랜'}
                    {project.reading_plan_type === 'custom' && '커스텀'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
