'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/toast';
import {
  ChevronLeft,
  Settings,
  Calendar,
  Target,
  BookOpen,
  Users,
  Shield,
  Trash2,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import type { Group } from '@/types';

const READING_PLAN_OPTIONS = [
  { value: '365', label: '365일 (1년)', days: 365 },
  { value: '180', label: '180일 (6개월)', days: 180 },
  { value: '90', label: '90일 (3개월)', days: 90 },
  { value: 'custom', label: '커스텀', days: null },
];

export default function GroupSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const groupId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reading_plan_type: '365' as '365' | '180' | '90' | 'custom',
    start_date: '',
    end_date: '',
    goal: '',
    rules: '',
    is_public: true,
    max_members: 100,
    allow_anonymous: true,
    require_daily_reading: false,
    join_type: 'open' as 'open' | 'approval',
    is_private: true, // 그룹 게시글 공개 여부 (true=멤버만 열람)
  });

  const loadGroup = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 그룹 정보
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (!groupData) {
      router.push('/group');
      return;
    }

    // 관리자 권한 확인
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    if (membership?.role !== 'admin') {
      toast({
        variant: 'error',
        title: '접근 권한이 없습니다',
      });
      router.push(`/group/${groupId}`);
      return;
    }

    setGroup(groupData);
    setFormData({
      name: groupData.name || '',
      description: groupData.description || '',
      reading_plan_type: groupData.reading_plan_type || '365',
      start_date: groupData.start_date || '',
      end_date: groupData.end_date || '',
      goal: groupData.goal || '',
      rules: groupData.rules || '',
      is_public: groupData.is_public ?? true,
      max_members: groupData.max_members || 100,
      allow_anonymous: groupData.allow_anonymous ?? true,
      require_daily_reading: groupData.require_daily_reading ?? false,
      join_type: groupData.join_type || 'open',
      is_private: groupData.is_private ?? true,
    });

    setLoading(false);
  }, [groupId, router, toast]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  // 읽기 플랜 타입 변경 시 종료일 자동 계산
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

  // 시작일 변경 시 종료일 자동 계산
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

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: 'error',
        title: '그룹 이름을 입력해주세요',
      });
      return;
    }

    setSaving(true);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('groups')
      .update({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        reading_plan_type: formData.reading_plan_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        goal: formData.goal.trim() || null,
        rules: formData.rules.trim() || null,
        is_public: formData.is_public,
        max_members: formData.max_members,
        allow_anonymous: formData.allow_anonymous,
        require_daily_reading: formData.require_daily_reading,
        join_type: formData.join_type,
        is_private: formData.is_private,
      })
      .eq('id', groupId);

    setSaving(false);

    if (error) {
      toast({
        variant: 'error',
        title: '저장에 실패했습니다',
        description: error.message,
      });
    } else {
      toast({
        variant: 'success',
        title: '설정이 저장되었습니다',
      });
    }
  };

  const handleDeleteGroup = async () => {
    const supabase = getSupabaseBrowserClient();
    try {
      // DB에 ON DELETE CASCADE 설정되어 있으므로 groups만 삭제하면
      // 관련된 모든 자식 테이블 데이터가 자동으로 삭제됨
      // (group_members, group_notices, group_meetings, comments, daily_checks,
      //  member_ranks, qt_posts, group_join_requests 등)
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error('그룹 삭제 에러:', error);
        toast({
          variant: 'error',
          title: '그룹 삭제에 실패했습니다',
          description: error.message,
        });
      } else {
        toast({
          variant: 'success',
          title: '그룹이 삭제되었습니다',
        });
        router.push('/group');
      }
    } catch (err) {
      console.error('그룹 삭제 중 예외:', err);
      toast({
        variant: 'error',
        title: '그룹 삭제에 실패했습니다',
        description: '잠시 후 다시 시도해주세요',
      });
    }
  };

  const copyInviteLink = async () => {
    if (!group) return;
    // 그룹이 교회 소속인지 확인하여 적절한 URL 생성
    const inviteUrl = group.church_id
      ? `${window.location.origin}/group/join/${group.invite_code}`
      : `${window.location.origin}/group/join/${group.invite_code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: '초대 링크가 복사되었습니다',
      description: '링크를 공유하여 그룹원을 초대하세요',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="h-7 w-40 bg-muted rounded animate-pulse" />
        </div>
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="flex flex-col p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/group/${groupId}/admin`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            그룹 설정
          </h1>
          <p className="text-sm text-muted-foreground">{group.name}</p>
        </div>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">그룹 이름 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 우리교회 청년부"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">그룹 설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="그룹에 대한 간단한 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>초대 링크</Label>
            <div className="flex gap-2">
              <Input
                value={typeof window !== 'undefined' ? `${window.location.origin}/group/join/${group.invite_code}` : '초대 링크'}
                readOnly
                className="text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyInviteLink}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-accent" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              이 링크를 공유하면 누구나 그룹에 참여할 수 있습니다
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 읽기 플랜 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            읽기 플랜
          </CardTitle>
          <CardDescription>
            성경 읽기 방식과 기간을 설정합니다
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

      {/* 목표 및 규칙 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            목표 및 규칙
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal">그룹 목표</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              placeholder="예: 1년 안에 성경 전체 통독 완료하기"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">그룹 규칙</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="규칙을 줄바꿈으로 구분하여 입력하세요&#10;예:&#10;1. 매일 묵상 나누기&#10;2. 서로 격려하기"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* 멤버 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            멤버 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="max_members">최대 멤버 수</Label>
            <Input
              id="max_members"
              type="number"
              min={1}
              max={1000}
              value={formData.max_members}
              onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) || 100 })}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>공개 그룹</Label>
              <p className="text-sm text-muted-foreground">
                검색으로 그룹을 찾을 수 있습니다
              </p>
            </div>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>가입 승인제</Label>
              <p className="text-sm text-muted-foreground">
                {formData.join_type === 'approval'
                  ? '관리자가 승인해야 가입됩니다'
                  : '초대 링크로 바로 가입할 수 있습니다'
                }
              </p>
            </div>
            <Switch
              checked={formData.join_type === 'approval'}
              onCheckedChange={(checked) => setFormData({ ...formData, join_type: checked ? 'approval' : 'open' })}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>게시글 비공개</Label>
              <p className="text-sm text-muted-foreground">
                {formData.is_private
                  ? '그룹 멤버만 게시글을 볼 수 있습니다'
                  : '누구나 그룹 게시글을 볼 수 있습니다'
                }
              </p>
            </div>
            <Switch
              checked={formData.is_private}
              onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 커뮤니티 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            커뮤니티 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>익명 댓글 허용</Label>
              <p className="text-sm text-muted-foreground">
                멤버가 익명으로 묵상을 나눌 수 있습니다
              </p>
            </div>
            <Switch
              checked={formData.allow_anonymous}
              onCheckedChange={(checked) => setFormData({ ...formData, allow_anonymous: checked })}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>매일 읽기 필수</Label>
              <p className="text-sm text-muted-foreground">
                리마인더 알림에 사용됩니다
              </p>
            </div>
            <Switch
              checked={formData.require_daily_reading}
              onCheckedChange={(checked) => setFormData({ ...formData, require_daily_reading: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
        size="lg"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            저장 중...
          </>
        ) : (
          '변경사항 저장'
        )}
      </Button>

      {/* 위험 영역 */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            위험 영역
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            그룹을 삭제하면 모든 멤버, 댓글, 읽기 기록이 함께 삭제됩니다.
            이 작업은 되돌릴 수 없습니다.
          </p>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            그룹 삭제
          </Button>
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>그룹 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 &apos;{group.name}&apos; 그룹을 삭제하시겠습니까?
              <span className="block mt-2 font-medium text-destructive">
                모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
