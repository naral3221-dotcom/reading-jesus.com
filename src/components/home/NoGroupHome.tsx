'use client'

/**
 * NoGroupHome - 그룹/프로젝트 없는 사용자용 온보딩 화면
 *
 * 그룹도 없고 개인 프로젝트도 없는 사용자에게 시작 방법을 안내합니다.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookOpen, Users, Church, User, Sparkles, Calendar, MessageCircle, Heart } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { useCreateProject } from '@/presentation/hooks/queries/usePersonalProject'
import type { PersonalReadingPlanType } from '@/domain/entities/PersonalProject'

interface NoGroupHomeProps {
  userId: string
  onProjectCreated?: () => void
}

export function NoGroupHome({ userId, onProjectCreated }: NoGroupHomeProps) {
  const { toast } = useToast()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [projectName, setProjectName] = useState('나의 성경 통독')
  const [planType, setPlanType] = useState<PersonalReadingPlanType>('365')
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  const createProject = useCreateProject()

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: '프로젝트 이름을 입력해주세요',
        variant: 'error',
      })
      return
    }

    try {
      await createProject.mutateAsync({
        userId,
        name: projectName.trim(),
        readingPlanType: planType,
        startDate: new Date(startDate),
      })

      toast({
        title: '프로젝트가 생성되었습니다',
        description: '이제 성경 통독을 시작할 수 있습니다!',
      })

      setShowCreateDialog(false)
      onProjectCreated?.()
    } catch {
      toast({
        title: '프로젝트 생성에 실패했습니다',
        description: '다시 시도해주세요',
        variant: 'error',
      })
    }
  }

  const planOptions = [
    { value: '365', label: '365일 플랜', description: '하루 3-4장, 1년 완독' },
    { value: '180', label: '180일 플랜', description: '하루 6-7장, 6개월 완독' },
    { value: '90', label: '90일 플랜', description: '하루 12-13장, 3개월 완독' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-background to-muted/30">
      {/* Hero Header - 개선된 환영 메시지 */}
      <div className="text-center py-12 lg:py-16 px-4">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-primary/10 flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 lg:w-12 lg:h-12 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-3">
          리딩지저스에 오신 것을 환영합니다!
        </h1>
        <p className="text-muted-foreground text-base lg:text-lg max-w-md mx-auto leading-relaxed">
          365일 성경 통독의 여정을 시작해보세요
        </p>
        
        {/* 3단계 프로세스 안내 */}
        <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary text-xs">
              1
            </div>
            <span className="hidden sm:inline">선택</span>
          </div>
          <div className="w-8 h-0.5 bg-border"></div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary text-xs">
              2
            </div>
            <span className="hidden sm:inline">시작</span>
          </div>
          <div className="w-8 h-0.5 bg-border"></div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-primary text-xs">
              3
            </div>
            <span className="hidden sm:inline">묵상</span>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6 pb-24 lg:pb-6 max-w-3xl mx-auto">

      {/* 시작 옵션들 - 시각적 강조 개선 */}
      <div className="space-y-4">
        {/* 개인 통독 시작 - Primary 강조 */}
        <Card className="border-2 border-primary/40 bg-primary/5 hover:border-primary/60 transition-all shadow-md hover:shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl mb-1">
                    개인 통독 시작하기
                  </CardTitle>
                  <CardDescription className="text-base">
                    나만의 속도로 성경을 읽어보세요
                  </CardDescription>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-semibold bg-accent text-accent-foreground rounded-full">
                추천
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span>365일, 180일, 90일 플랜 선택</span>
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary shrink-0" />
                <span>나만의 진행 상황 추적</span>
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span>언제 어디서나 묵상 기록</span>
              </li>
            </ul>
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold"
              onClick={() => setShowCreateDialog(true)}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              지금 바로 시작하기
            </Button>
          </CardContent>
        </Card>

        {/* 그룹 참여 */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle className="text-xl mb-1">
                  그룹과 함께하기
                </CardTitle>
                <CardDescription className="text-base">
                  함께 읽으면 더 힘이 됩니다
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent shrink-0" />
                <span>그룹 일정에 맞춰 함께 읽기</span>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-accent shrink-0" />
                <span>그룹 멤버들과 묵상 나눔</span>
              </li>
              <li className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-accent shrink-0" />
                <span>서로 격려하며 완독하기</span>
              </li>
            </ul>
            <Link href="/group" className="block">
              <Button variant="outline" size="lg" className="w-full h-12 text-base">
                <Users className="w-5 h-5 mr-2" />
                그룹 찾아보기
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 교회와 함께 */}
        <Card className="hover:shadow-md transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Church className="w-6 h-6 text-accent" />
              </div>
              <div>
                <CardTitle className="text-xl mb-1">
                  교회와 함께하기
                </CardTitle>
                <CardDescription className="text-base">
                  교회 공동체와 성경 통독
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2 mb-6">
              <li className="flex items-center gap-2">
                <Church className="w-4 h-4 text-accent shrink-0" />
                <span>소속 교회 검색 및 가입</span>
              </li>
              <li className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent shrink-0" />
                <span>교회 전체 통독 현황 확인</span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent shrink-0" />
                <span>교회 커뮤니티 참여</span>
              </li>
            </ul>
            <div className="flex gap-3">
              <Link href="/church" className="flex-1">
                <Button variant="outline" size="lg" className="w-full h-12 text-base">
                  <Church className="w-5 h-5 mr-2" />
                  교회 찾기
                </Button>
              </Link>
              <Link href="/church/register" className="flex-1">
                <Button size="lg" className="w-full h-12 text-base">
                  등록하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 커뮤니티 둘러보기 */}
      <div className="text-center pt-4 border-t">
        <p className="text-sm text-muted-foreground mb-3">
          먼저 둘러보고 싶으신가요?
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/community">
            <Button variant="ghost" size="sm">
              커뮤니티 둘러보기
            </Button>
          </Link>
          <Link href="/bible">
            <Button variant="ghost" size="sm">
              성경 보기
            </Button>
          </Link>
        </div>
      </div>
      </div>

      {/* 개인 프로젝트 생성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>개인 통독 프로젝트 만들기</DialogTitle>
            <DialogDescription>
              나만의 성경 통독 프로젝트를 시작하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 프로젝트 이름 */}
            <div className="space-y-2">
              <Label htmlFor="project-name">프로젝트 이름</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="예: 2026년 성경 통독"
                maxLength={50}
              />
            </div>

            {/* 플랜 선택 */}
            <div className="space-y-2">
              <Label>읽기 플랜</Label>
              <Select value={planType} onValueChange={(v) => setPlanType(v as PersonalReadingPlanType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 시작일 */}
            <div className="space-y-2">
              <Label htmlFor="start-date">
                <Calendar className="w-4 h-4 inline mr-1" />
                시작일
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={createProject.isPending}
            >
              {createProject.isPending ? '생성 중...' : '시작하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
