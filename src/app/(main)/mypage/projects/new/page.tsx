'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
  ChevronLeft,
  Calendar,
  Target,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import Link from 'next/link';
import { format, addDays } from 'date-fns';

const READING_PLAN_OPTIONS = [
  { value: '365', label: '365일 (1년)', days: 365 },
  { value: '180', label: '180일 (6개월)', days: 180 },
  { value: '90', label: '90일 (3개월)', days: 90 },
  { value: 'custom', label: '커스텀', days: null },
];

export default function NewPersonalProjectPage() {
  const router = useRouter();
  const { toast } = useToast();

  // React Query 훅 사용
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reading_plan_type: '365' as '365' | '180' | '90' | 'custom',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 364), 'yyyy-MM-dd'),
    goal: '',
  });

  const handlePlanTypeChange = (value: '365' | '180' | '90' | 'custom') => {
    setFormData(prev => {
      const option = READING_PLAN_OPTIONS.find(o => o.value === value);
      let endDate = prev.end_date;

      if (option?.days && prev.start_date) {
        const startDate = new Date(prev.start_date);
        endDate = format(addDays(startDate, option.days - 1), 'yyyy-MM-dd');
      }

      return {
        ...prev,
        reading_plan_type: value,
        end_date: endDate,
      };
    });
  };

  const handleStartDateChange = (value: string) => {
    setFormData(prev => {
      const option = READING_PLAN_OPTIONS.find(o => o.value === prev.reading_plan_type);
      let endDate = prev.end_date;

      if (option?.days && value) {
        const startDate = new Date(value);
        endDate = format(addDays(startDate, option.days - 1), 'yyyy-MM-dd');
      }

      return {
        ...prev,
        start_date: value,
        end_date: endDate,
      };
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: 'error',
        title: '프로젝트 이름을 입력해주세요',
      });
      return;
    }

    if (!userId) {
      router.push('/login');
      return;
    }

    setSaving(true);
    const supabase = getSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('personal_reading_projects')
      .insert({
        user_id: userId,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        reading_plan_type: formData.reading_plan_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        goal: formData.goal.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast({
        variant: 'error',
        title: '프로젝트 생성에 실패했습니다',
        description: error.message,
      });
    } else {
      toast({
        variant: 'success',
        title: '프로젝트가 생성되었습니다',
      });
      router.push(`/mypage/projects/${data.id}`);
    }
  };

  return (
    <div className="flex flex-col p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/mypage">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            새 프로젝트
          </h1>
          <p className="text-sm text-muted-foreground">나만의 성경 읽기 계획</p>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">프로젝트 이름 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 신약 90일 완독"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="이 프로젝트에 대한 간단한 설명"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">목표</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="예: 예수님의 말씀에 집중하며 읽기"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* 읽기 플랜 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            읽기 플랜
          </CardTitle>
          <CardDescription>
            기간과 방식을 설정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>읽기 플랜 유형</Label>
            <Select
              value={formData.reading_plan_type}
              onValueChange={handlePlanTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {READING_PLAN_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                시작일
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                종료 예정일
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                disabled={formData.reading_plan_type !== 'custom'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 생성 버튼 */}
      <Button
        onClick={handleSubmit}
        disabled={saving || !formData.name.trim()}
        className="w-full"
        size="lg"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            생성 중...
          </>
        ) : (
          <>
            <Target className="w-4 h-4 mr-2" />
            프로젝트 시작하기
          </>
        )}
      </Button>
    </div>
  );
}
