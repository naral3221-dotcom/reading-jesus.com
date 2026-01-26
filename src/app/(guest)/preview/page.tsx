'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Lock } from 'lucide-react';
import readingPlan from '@/data/reading_plan.json';
import { useState } from 'react';
import Link from 'next/link';

export default function GuestHomePage() {
  const [currentDay, setCurrentDay] = useState(1);
  const totalDays = readingPlan.length;
  const todayPlan = readingPlan.find((p) => p.day === currentDay);

  if (!todayPlan) {
    return null;
  }

  return (
    <div className="flex flex-col p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold">365일 통독 계획</h1>
        <p className="text-muted-foreground text-sm mt-1">
          체계적인 성경 읽기로 1년 완독
        </p>
      </div>

      {/* Day Preview Card */}
      <Card className="border-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Day {currentDay}
            </span>
            <span className="text-sm text-muted-foreground font-normal">
              / {totalDays}일
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-primary">{todayPlan.book}</p>
              <p className="text-muted-foreground">{todayPlan.reading}</p>
            </div>

            <div className="pt-4 border-t">
              <Link href="/explore">
                <Button variant="default" className="w-full" size="lg">
                  <BookOpen className="w-4 h-4 mr-2" />
                  성경 읽기
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Preview */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">진행률 예시</span>
            <span className="font-medium">{Math.round((currentDay / totalDays) * 100)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-primary/80 rounded-full h-3 transition-all duration-500"
              style={{ width: `${(currentDay / totalDays) * 100}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-3 p-3 bg-muted/50 rounded-lg">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              로그인하면 진행 상황이 자동으로 저장됩니다
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features Preview */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">이런 기능이 있어요</h3>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/50 flex items-center justify-center">
            <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-4 py-2">
              <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs font-medium">로그인 필요</p>
            </div>
          </div>
          <CardContent className="pt-4 opacity-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium mb-1">묵상 그룹</h4>
                <p className="text-sm text-muted-foreground">
                  친구들과 함께 묵상을 나누고 서로 격려하세요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/50 flex items-center justify-center">
            <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-4 py-2">
              <Lock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs font-medium">로그인 필요</p>
            </div>
          </div>
          <CardContent className="pt-4 opacity-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium mb-1">읽기 체크</h4>
                <p className="text-sm text-muted-foreground">
                  매일의 읽기를 기록하고 진행률을 확인하세요
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Day Navigation */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setCurrentDay(Math.max(1, currentDay - 1))}
          disabled={currentDay <= 1}
        >
          이전
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setCurrentDay(Math.min(totalDays, currentDay + 1))}
          disabled={currentDay >= totalDays}
        >
          다음
        </Button>
      </div>
    </div>
  );
}
