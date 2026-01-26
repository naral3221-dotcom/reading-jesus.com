'use client'

/**
 * ReadingStatsCard - 읽기 통계 요약 카드
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flame, BookOpen, TrendingUp, Calendar } from 'lucide-react'
import type { PersonalProjectWithStats } from '@/domain/entities/PersonalProject'

interface ReadingStatsCardProps {
  project: PersonalProjectWithStats
  meditationCount?: number
}

export function ReadingStatsCard({ project, meditationCount = 0 }: ReadingStatsCardProps) {
  const stats = [
    {
      label: '연속 읽기',
      value: `${project.currentStreak}일`,
      icon: Flame,
      color: 'text-accent',
      bgColor: 'bg-accent/10 dark:bg-accent/20/30',
    },
    {
      label: '완료된 일수',
      value: `${project.completedDays}일`,
      icon: BookOpen,
      color: 'text-accent',
      bgColor: 'bg-accent/10 dark:bg-accent/20/30',
    },
    {
      label: '진행률',
      value: `${project.progressPercentage}%`,
      icon: TrendingUp,
      color: 'text-accent',
      bgColor: 'bg-accent/10 dark:bg-accent/20/30',
    },
    {
      label: '묵상 기록',
      value: `${meditationCount}개`,
      icon: Calendar,
      color: 'text-accent',
      bgColor: 'bg-accent/10 dark:bg-accent/20/30',
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">통계</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`p-3 rounded-lg ${stat.bgColor}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
