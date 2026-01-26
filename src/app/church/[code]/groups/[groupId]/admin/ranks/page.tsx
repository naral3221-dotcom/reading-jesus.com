'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ChevronLeft, Plus, Pencil, Trash2, Award, MoveUp, MoveDown, MessageSquare, Users, Pin, Settings } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import Link from 'next/link';
import type { MemberRank, RankPermissions } from '@/types';
import { RANK_PERMISSION_PRESETS } from '@/types';
import { ChurchLayout } from '@/components/church/ChurchLayout';

// 권한 라벨 정의
const PERMISSION_LABELS: Record<keyof RankPermissions, { label: string; description: string }> = {
  can_read: { label: '읽기', description: '통독 일정, 묵상 조회' },
  can_comment: { label: '묵상 작성', description: '묵상 나눔 작성 가능' },
  can_create_meeting: { label: '모임 생성', description: '소그룹 모임 만들기' },
  can_pin_comment: { label: '묵상 고정', description: '중요 묵상 상단 고정' },
  can_manage_members: { label: '멤버 관리', description: '멤버 등급 지정, 내보내기' },
};

// 기본 권한
const DEFAULT_PERMISSIONS: RankPermissions = {
  can_read: true,
  can_comment: true,
  can_create_meeting: false,
  can_pin_comment: false,
  can_manage_members: false,
};

// 미리 정의된 색상 팔레트
const COLOR_PALETTE = [
  { name: '파랑', value: '#3b82f6' },
  { name: '초록', value: '#22c55e' },
  { name: '주황', value: '#f59e0b' },
  { name: '보라', value: '#8b5cf6' },
  { name: '분홍', value: '#ec4899' },
  { name: '빨강', value: '#ef4444' },
  { name: '청록', value: '#14b8a6' },
  { name: '남색', value: '#6366f1' },
];

export default function ChurchGroupRankManagementPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const churchCode = params.code as string;
  const groupId = params.groupId as string;

  const [loading, setLoading] = useState(true);
  const [ranks, setRanks] = useState<MemberRank[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_churchName, setChurchName] = useState('');

  // 등급 생성/수정 다이얼로그
  const [rankDialog, setRankDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    rank: MemberRank | null;
  }>({
    open: false,
    mode: 'create',
    rank: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    level: 0,
    permissions: { ...DEFAULT_PERMISSIONS } as RankPermissions,
  });

  // 삭제 다이얼로그
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; rank: MemberRank | null }>({
    open: false,
    rank: null,
  });

  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 교회 정보 로드
    const { data: church } = await supabase
      .from('churches')
      .select('id, name, code, admin_token')
      .eq('code', churchCode.toUpperCase())
      .single();

    if (!church) {
      router.push('/');
      return;
    }
    setChurchName(church.name);

    // 관리자 권한 확인
    const { data: memberData } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single();

    // 교회 관리자 확인
    const storedToken = typeof window !== 'undefined'
      ? localStorage.getItem(`church_admin_${church.code}`)
      : null;
    const isChurchAdmin = storedToken && church.admin_token === storedToken;

    if ((!memberData || memberData.role !== 'admin') && !isChurchAdmin) {
      toast({
        variant: 'error',
        title: '접근 권한이 없습니다',
      });
      router.push(`/church/${churchCode}/groups/${groupId}`);
      return;
    }

    // 등급 목록 가져오기
    const { data: ranksData } = await supabase
      .from('member_ranks')
      .select('*')
      .eq('group_id', groupId)
      .order('level', { ascending: false });

    if (ranksData) {
      setRanks(ranksData);
    }

    setLoading(false);
  }, [churchCode, groupId, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      level: ranks.length > 0 ? Math.max(...ranks.map(r => r.level)) + 1 : 1,
      permissions: { ...DEFAULT_PERMISSIONS },
    });
    setRankDialog({ open: true, mode: 'create', rank: null });
  };

  const openEditDialog = (rank: MemberRank) => {
    setFormData({
      name: rank.name,
      description: rank.description || '',
      color: rank.color,
      level: rank.level,
      permissions: rank.permissions || { ...DEFAULT_PERMISSIONS },
    });
    setRankDialog({ open: true, mode: 'edit', rank });
  };

  const applyPermissionPreset = (presetKey: string) => {
    const preset = RANK_PERMISSION_PRESETS[presetKey];
    if (preset) {
      setFormData({ ...formData, permissions: { ...preset.permissions } });
    }
  };

  const togglePermission = (key: keyof RankPermissions) => {
    if (key === 'can_read') return;
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key],
      },
    });
  };

  const handleSubmit = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!formData.name.trim()) {
      toast({
        variant: 'error',
        title: '등급 이름을 입력하세요',
      });
      return;
    }

    if (rankDialog.mode === 'create') {
      const { error } = await supabase
        .from('member_ranks')
        .insert({
          group_id: groupId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          level: formData.level,
          permissions: formData.permissions,
        });

      if (error) {
        toast({
          variant: 'error',
          title: '등급 생성에 실패했습니다',
          description: error.message,
        });
        return;
      }

      toast({
        variant: 'success',
        title: '등급이 생성되었습니다',
      });
    } else {
      const { error } = await supabase
        .from('member_ranks')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          level: formData.level,
          permissions: formData.permissions,
        })
        .eq('id', rankDialog.rank!.id);

      if (error) {
        toast({
          variant: 'error',
          title: '등급 수정에 실패했습니다',
          description: error.message,
        });
        return;
      }

      toast({
        variant: 'success',
        title: '등급이 수정되었습니다',
      });
    }

    setRankDialog({ open: false, mode: 'create', rank: null });
    loadData();
  };

  const handleDelete = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!deleteDialog.rank) return;

    const { error } = await supabase
      .from('member_ranks')
      .delete()
      .eq('id', deleteDialog.rank.id);

    if (error) {
      toast({
        variant: 'error',
        title: '삭제에 실패했습니다',
        description: error.message,
      });
      return;
    }

    toast({
      variant: 'success',
      title: '등급이 삭제되었습니다',
    });

    setDeleteDialog({ open: false, rank: null });
    loadData();
  };

  const handleChangeLevel = async (rankId: string, newLevel: number) => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('member_ranks')
      .update({ level: newLevel })
      .eq('id', rankId);

    if (!error) {
      loadData();
    }
  };

  if (loading) {
    return (
      <ChurchLayout churchCode={churchCode} >
        <div className="flex flex-col p-4 space-y-4">
          <div className="h-10 w-40 bg-muted rounded animate-pulse" />
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ChurchLayout>
    );
  }

  return (
    <ChurchLayout churchCode={churchCode} >
      <div className="flex flex-col p-4 space-y-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/church/${churchCode}/groups/${groupId}/admin`}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">멤버 등급 관리</h1>
              <p className="text-sm text-muted-foreground">등급을 생성하고 레벨을 설정하세요</p>
            </div>
          </div>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            등급 추가
          </Button>
        </div>

        {/* 등급 목록 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-5 h-5" />
              등급 목록
            </CardTitle>
            <CardDescription>
              레벨이 높을수록 상위 등급입니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {ranks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">등록된 등급이 없습니다</p>
                <p className="text-xs mt-1">등급을 추가하여 멤버를 관리하세요</p>
              </div>
            ) : (
              ranks.map((rank, index) => (
                <div
                  key={rank.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: rank.color }}
                    >
                      {rank.level}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{rank.name}</p>
                        {/* 권한 아이콘 표시 */}
                        <div className="flex items-center gap-0.5" title="권한">
                          {rank.permissions?.can_comment && (
                            <span title="묵상 작성">
                              <MessageSquare className="w-3 h-3 text-muted-foreground" />
                            </span>
                          )}
                          {rank.permissions?.can_create_meeting && (
                            <span title="모임 생성">
                              <Users className="w-3 h-3 text-muted-foreground" />
                            </span>
                          )}
                          {rank.permissions?.can_pin_comment && (
                            <span title="묵상 고정">
                              <Pin className="w-3 h-3 text-muted-foreground" />
                            </span>
                          )}
                          {rank.permissions?.can_manage_members && (
                            <span title="멤버 관리">
                              <Settings className="w-3 h-3 text-muted-foreground" />
                            </span>
                          )}
                        </div>
                      </div>
                      {rank.description && (
                        <p className="text-xs text-muted-foreground">{rank.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* 레벨 조정 버튼 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleChangeLevel(rank.id, rank.level + 1)}
                      disabled={index === 0}
                      title="레벨 올리기"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleChangeLevel(rank.id, rank.level - 1)}
                      disabled={index === ranks.length - 1}
                      title="레벨 내리기"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </Button>

                    {/* 수정/삭제 버튼 */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(rank)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteDialog({ open: true, rank })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 등급 생성/수정 다이얼로그 */}
        <Dialog open={rankDialog.open} onOpenChange={(open) => !open && setRankDialog({ open: false, mode: 'create', rank: null })}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {rankDialog.mode === 'create' ? '등급 추가' : '등급 수정'}
              </DialogTitle>
              <DialogDescription>
                등급 이름, 색상, 권한을 설정하세요
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">등급 이름 *</label>
                <Input
                  placeholder="예: 새싹, 열매, 나무"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">설명</label>
                <Textarea
                  placeholder="등급에 대한 설명을 입력하세요"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  maxLength={100}
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">레벨</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">높을수록 상위 등급</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">색상</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-full h-10 rounded-lg border-2 transition-all ${
                        formData.color === color.value
                          ? 'border-primary scale-105'
                          : 'border-transparent hover:border-muted-foreground/20'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* 권한 설정 섹션 */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-2 block">권한 설정</label>

                {/* 권한 프리셋 버튼 */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {Object.entries(RANK_PERMISSION_PRESETS).map(([key, preset]) => (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => applyPermissionPreset(key)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>

                {/* 개별 권한 토글 */}
                <div className="space-y-2">
                  {(Object.keys(PERMISSION_LABELS) as Array<keyof RankPermissions>).map((key) => (
                    <div
                      key={key}
                      className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                        formData.permissions[key] ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted/50'
                      } ${key === 'can_read' ? 'opacity-60' : ''}`}
                      onClick={() => togglePermission(key)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          formData.permissions[key] ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                        }`}>
                          {formData.permissions[key] && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{PERMISSION_LABELS[key].label}</p>
                          <p className="text-xs text-muted-foreground">{PERMISSION_LABELS[key].description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  * 읽기 권한은 기본으로 제공됩니다
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRankDialog({ open: false, mode: 'create', rank: null })}>
                취소
              </Button>
              <Button onClick={handleSubmit}>
                {rankDialog.mode === 'create' ? '생성' : '수정'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog
          open={deleteDialog.open}
          onOpenChange={(open) => !open && setDeleteDialog({ open: false, rank: null })}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>등급 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                &apos;{deleteDialog.rank?.name}&apos; 등급을 삭제하시겠습니까?
                <span className="block mt-2 text-muted-foreground">
                  이 등급을 가진 멤버들의 등급이 해제됩니다.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ChurchLayout>
  );
}
