'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import {
  Plus,
  Church,
  Copy,
  RefreshCw,
  Loader2,
  ExternalLink,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Download,
  Settings,
  Key,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Check,
} from 'lucide-react';
import { readingSchedule2026 } from '@/data/reading-schedule-2026';
import { getTodayDateString } from '@/lib/date-utils';

interface RegionCode {
  code: string;
  name: string;
}

interface ChurchData {
  id: string;
  code: string;
  name: string;
  denomination: string | null;
  region_code: string;
  address: string | null;
  pastor_name: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  write_token: string | null;
  admin_token: string | null;
  is_active: boolean;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

// QR 다운로드 다이얼로그 상태 타입
type ImageType = 'qr' | 'heart';

interface QRDownloadState {
  church: ChurchData | null;
  isOpen: boolean;
  isGenerating: boolean;
  progress: number;
  total: number;
  selectedMonth: number | 'all';
  imageType: ImageType;
}

export default function AdminChurchesPage() {
  const { toast } = useToast();

  const [churches, setChurches] = useState<ChurchData[]>([]);
  const [regionCodes, setRegionCodes] = useState<RegionCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // QR 다운로드 상태
  const [qrDownload, setQrDownload] = useState<QRDownloadState>({
    church: null,
    isOpen: false,
    isGenerating: false,
    progress: 0,
    total: 0,
    selectedMonth: 'all',
    imageType: 'qr',
  });

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    denomination: '',
    region_code: 'SE',
    address: '',
    pastor_name: '',
    contact_person: '',
    contact_phone: '',
    // 관리자 계정 정보
    admin_email: '',
    admin_password: '',
    admin_nickname: '',
  });

  // 비밀번호 표시/숨김
  const [showPassword, setShowPassword] = useState(false);

  // 자동 생성된 비밀번호 복사 상태
  const [copiedPassword, setCopiedPassword] = useState(false);

  // 비밀번호 자동 생성
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, admin_password: password }));
    setShowPassword(true);
  };

  // 클립보드 복사
  const copyPassword = async () => {
    if (!formData.admin_password) return;
    try {
      await navigator.clipboard.writeText(formData.admin_password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch {
      toast({ variant: 'error', title: '복사 실패' });
    }
  };

  // 지역 코드 로드
  const loadRegionCodes = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase
        .from('region_codes')
        .select('*')
        .order('order_num');

      if (error) throw error;
      setRegionCodes(data || []);
    } catch (err) {
      console.error('지역 코드 로드 에러:', err);
    }
  }, []);

  // 교회 목록 로드
  const loadChurches = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    try {
      let query = supabase
        .from('churches')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // 검색 필터
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%`);
      }

      // 페이지네이션
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      setChurches(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('교회 목록 로드 에러:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage]);

  useEffect(() => {
    loadRegionCodes();
  }, [loadRegionCodes]);

  useEffect(() => {
    loadChurches();
  }, [loadChurches]);

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 교회 코드 생성 (클라이언트)
  const generateChurchCode = async (regionCode: string): Promise<string> => {
    const supabase = getSupabaseBrowserClient();
    const yearPart = new Date().getFullYear().toString().slice(-2);

    // 해당 지역+연도의 마지막 순번 찾기
    const { data } = await supabase
      .from('churches')
      .select('code')
      .like('code', `${regionCode}${yearPart}%`)
      .order('code', { ascending: false })
      .limit(1);

    let seqNum = 1;
    if (data && data.length > 0) {
      const lastCode = data[0].code;
      const lastSeq = parseInt(lastCode.slice(4), 10);
      seqNum = lastSeq + 1;
    }

    return `${regionCode}${yearPart}${seqNum.toString().padStart(3, '0')}`;
  };

  // 작성 토큰 생성 (클라이언트)
  const generateWriteToken = (churchCode: string): string => {
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${churchCode.toLowerCase()}-${randomPart}`;
  };

  // 교회 등록
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        variant: 'error',
        title: '교회 이름을 입력해주세요',
      });
      return;
    }

    // 관리자 계정 정보 검증
    if (formData.admin_email && !formData.admin_password) {
      toast({
        variant: 'error',
        title: '관리자 비밀번호를 입력해주세요',
      });
      return;
    }

    if (formData.admin_password && formData.admin_password.length < 8) {
      toast({
        variant: 'error',
        title: '비밀번호는 8자 이상이어야 합니다',
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setSubmitting(true);

    try {
      // 1. 코드 생성 (클라이언트에서)
      const churchCode = await generateChurchCode(formData.region_code);

      // 2. 토큰 생성 (클라이언트에서)
      const writeToken = generateWriteToken(churchCode);

      // 3. 교회 등록
      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .insert({
          code: churchCode,
          write_token: writeToken,
          name: formData.name.trim(),
          denomination: formData.denomination.trim() || null,
          region_code: formData.region_code,
          address: formData.address.trim() || null,
          pastor_name: formData.pastor_name.trim() || null,
          contact_person: formData.contact_person.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
        })
        .select('id')
        .single();

      if (churchError) throw churchError;

      // 4. 관리자 계정 생성 (이메일이 입력된 경우)
      let adminCreated = false;
      if (formData.admin_email && formData.admin_password) {
        // 4-1. Supabase Auth로 사용자 생성
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.admin_email.trim(),
          password: formData.admin_password,
          options: {
            data: {
              nickname: formData.admin_nickname.trim() || formData.admin_email.split('@')[0],
            },
          },
        });

        if (authError) {
          // 교회는 등록됐지만 관리자 생성 실패
          console.error('관리자 계정 생성 에러:', authError);
          toast({
            variant: 'info',
            title: '교회는 등록되었으나 관리자 계정 생성 실패',
            description: authError.message,
          });
        } else if (authData.user) {
          // 4-2. church_admins 테이블에 등록
          const { error: adminError } = await supabase
            .from('church_admins')
            .insert({
              id: authData.user.id,
              church_id: churchData.id,
              email: formData.admin_email.trim(),
              nickname: formData.admin_nickname.trim() || formData.admin_email.split('@')[0],
              role: 'church_admin',
            });

          if (adminError) {
            console.error('church_admins 등록 에러:', adminError);
            toast({
              variant: 'info',
              title: '교회는 등록되었으나 관리자 정보 저장 실패',
              description: adminError.message,
            });
          } else {
            adminCreated = true;
          }
        }
      }

      // 성공 메시지
      if (adminCreated) {
        toast({
          variant: 'success',
          title: '교회 및 관리자 계정이 등록되었습니다',
          description: `코드: ${churchCode}\n이메일: ${formData.admin_email}\n비밀번호: ${formData.admin_password}`,
        });
      } else {
        toast({
          variant: 'success',
          title: '교회가 등록되었습니다',
          description: `코드: ${churchCode}`,
        });
      }

      // 폼 초기화 및 다이얼로그 닫기
      setFormData({
        name: '',
        denomination: '',
        region_code: 'SE',
        address: '',
        pastor_name: '',
        contact_person: '',
        contact_phone: '',
        admin_email: '',
        admin_password: '',
        admin_nickname: '',
      });
      setShowPassword(false);
      setDialogOpen(false);
      loadChurches();
    } catch (err) {
      console.error('교회 등록 에러:', err);
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      toast({
        variant: 'error',
        title: '등록에 실패했습니다',
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 토큰 재생성
  const handleRegenerateToken = async (church: ChurchData) => {
    const confirmed = confirm(
      `⚠️ 토큰 재생성 경고\n\n` +
      `"${church.name}" 교회의 토큰을 재생성하면:\n\n` +
      `• 기존에 배포한 모든 QR 코드가 무효화됩니다\n` +
      `• 기존 URL 링크도 작동하지 않습니다\n` +
      `• QR 코드를 다시 다운로드해서 배포해야 합니다\n\n` +
      `정말 토큰을 재생성하시겠습니까?`
    );

    if (!confirmed) return;

    const supabase = getSupabaseBrowserClient();
    try {
      const newToken = generateWriteToken(church.code);

      const { error } = await supabase
        .from('churches')
        .update({ write_token: newToken })
        .eq('id', church.id);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '토큰이 재생성되었습니다',
        description: 'QR 코드를 다시 다운로드하세요',
      });

      loadChurches();
    } catch (err) {
      console.error('토큰 재생성 에러:', err);
      toast({
        variant: 'error',
        title: '토큰 재생성 실패',
      });
    }
  };

  // URL 복사
  const copyUrl = (church: ChurchData) => {
    const url = `${window.location.origin}/church/${church.code}?token=${church.write_token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'URL이 복사되었습니다',
    });
  };

  // 관리자 URL 복사
  const copyAdminToken = (church: ChurchData) => {
    if (!church.admin_token) {
      toast({
        variant: 'error',
        title: '관리자 토큰이 없습니다',
        description: 'DB 마이그레이션을 실행해주세요',
      });
      return;
    }
    const adminUrl = `${window.location.origin}/church/${church.code}/admin?token=${church.admin_token}`;
    navigator.clipboard.writeText(adminUrl);
    toast({
      title: '관리자 URL이 복사되었습니다',
      description: '교회 담당자에게 전달하세요',
    });
  };

  // 교회 삭제
  const handleDelete = async (church: ChurchData) => {
    if (!confirm(`"${church.name}"을(를) 삭제하시겠습니까?`)) return;

    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('churches')
        .delete()
        .eq('id', church.id);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '교회가 삭제되었습니다',
      });

      loadChurches();
    } catch (err) {
      console.error('교회 삭제 에러:', err);
      toast({
        variant: 'error',
        title: '삭제에 실패했습니다',
      });
    }
  };

  // QR 다운로드 다이얼로그 열기
  const openQRDownloadDialog = (church: ChurchData) => {
    setQrDownload({
      church,
      isOpen: true,
      isGenerating: false,
      progress: 0,
      total: 0,
      selectedMonth: 'all',
      imageType: 'qr',
    });
  };

  // 이미지 일괄 생성 및 다운로드
  const handleQRDownload = async () => {
    if (!qrDownload.church) return;

    setQrDownload(prev => ({ ...prev, isGenerating: true, progress: 0 }));

    try {
      const schedules = readingSchedule2026
        .filter(s => s.reading) // 보충 주간 제외
        .map(s => ({ date: s.date, reading: s.reading }));

      // 월별 필터링
      let targetSchedules = schedules;
      if (qrDownload.selectedMonth !== 'all') {
        const monthStr = qrDownload.selectedMonth.toString().padStart(2, '0');
        targetSchedules = schedules.filter(s => s.date.startsWith(`2026-${monthStr}`));
      }

      setQrDownload(prev => ({ ...prev, total: targetSchedules.length }));

      if (qrDownload.imageType === 'heart') {
        // 하트 QR 다운로드
        const { downloadHeartQRBatch } = await import('@/lib/qr-generator');
        const baseUrl = window.location.origin;

        await downloadHeartQRBatch(
          {
            churchCode: qrDownload.church.code,
            writeToken: qrDownload.church.write_token || '',
            schedules: targetSchedules,
            churchName: qrDownload.church.name,
            baseUrl,
          },
          (current, total) => {
            setQrDownload(prev => ({ ...prev, progress: current, total }));
          }
        );

        toast({
          variant: 'success',
          title: '하트 QR이 다운로드되었습니다',
        });
      } else {
        // QR 코드 다운로드
        const { downloadQRBatch } = await import('@/lib/qr-generator');
        const baseUrl = window.location.origin;

        await downloadQRBatch(
          {
            churchCode: qrDownload.church.code,
            writeToken: qrDownload.church.write_token || '',
            schedules: targetSchedules,
            churchName: qrDownload.church.name,
            baseUrl,
          },
          (current, total) => {
            setQrDownload(prev => ({ ...prev, progress: current, total }));
          }
        );

        toast({
          variant: 'success',
          title: 'QR 코드가 다운로드되었습니다',
        });
      }
    } catch (err) {
      console.error('이미지 생성 에러:', err);
      toast({
        variant: 'error',
        title: '이미지 생성에 실패했습니다',
      });
    } finally {
      setQrDownload(prev => ({ ...prev, isGenerating: false }));
    }
  };

  // 미리보기
  const [previewQR, setPreviewQR] = useState<string | null>(null);
  const handleQRPreview = async () => {
    if (!qrDownload.church) return;

    try {
      const today = getTodayDateString();
      const todaySchedule = readingSchedule2026.find(s => s.date === today && s.reading);
      const sampleSchedule = todaySchedule || readingSchedule2026.find(s => s.reading);

      if (!sampleSchedule) return;

      let dataUrl: string;

      if (qrDownload.imageType === 'heart') {
        const { generateHeartQRImage } = await import('@/lib/qr-generator');
        dataUrl = await generateHeartQRImage({
          url: `${window.location.origin}/church/${qrDownload.church.code}?token=${qrDownload.church.write_token}&date=${sampleSchedule.date}`,
          reading: sampleSchedule.reading,
          date: sampleSchedule.date,
        });
      } else {
        const { generateQRImage } = await import('@/lib/qr-generator');
        dataUrl = await generateQRImage({
          url: `${window.location.origin}/church/${qrDownload.church.code}?token=${qrDownload.church.write_token}&date=${sampleSchedule.date}`,
          reading: sampleSchedule.reading,
          date: sampleSchedule.date,
        });
      }

      setPreviewQR(dataUrl);
    } catch (err) {
      console.error('미리보기 에러:', err);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">교회 관리</h1>
          <p className="text-muted-foreground">
            총 {totalCount}개의 교회
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              교회 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>새 교회 등록</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">교회 이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 00교회"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="denomination">교단</Label>
                <Input
                  id="denomination"
                  value={formData.denomination}
                  onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                  placeholder="예: 예장통합"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">지역 *</Label>
                <Select
                  value={formData.region_code}
                  onValueChange={(value) => setFormData({ ...formData, region_code: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regionCodes.map((region) => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="교회 주소"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pastor">담임목사</Label>
                <Input
                  id="pastor"
                  value={formData.pastor_name}
                  onChange={(e) => setFormData({ ...formData, pastor_name: e.target.value })}
                  placeholder="목사님 성함"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">담당자</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="담당자 이름"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">연락처</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              {/* 관리자 계정 정보 */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Key className="w-4 h-4 text-primary" />
                  <span className="font-medium">관리자 계정 (선택)</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  관리자 계정을 생성하면 이메일/비밀번호로 관리자 페이지에 로그인할 수 있습니다.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_email">관리자 이메일</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="admin_email"
                        type="email"
                        value={formData.admin_email}
                        onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                        placeholder="admin@church.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_password">관리자 비밀번호 (8자 이상)</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="admin_password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.admin_password}
                          onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                          placeholder="비밀번호"
                          className="pl-10 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button type="button" variant="outline" onClick={generateRandomPassword}>
                        자동 생성
                      </Button>
                    </div>
                    {formData.admin_password && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <span className="text-sm font-mono flex-1">{formData.admin_password}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={copyPassword}
                        >
                          {copiedPassword ? (
                            <Check className="w-3 h-3 text-accent" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_nickname">관리자 닉네임 (선택)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="admin_nickname"
                        value={formData.admin_nickname}
                        onChange={(e) => setFormData({ ...formData, admin_nickname: e.target.value })}
                        placeholder="관리자"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Church className="w-4 h-4 mr-2" />
                )}
                등록하기
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="교회 이름 또는 코드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-sm text-muted-foreground">등록된 교회</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {churches.filter(c => c.is_active).length}
            </div>
            <p className="text-sm text-muted-foreground">활성 교회</p>
          </CardContent>
        </Card>
      </div>

      {/* 교회 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : churches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Church className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 교회가 없습니다'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* PC 테이블 뷰 */}
          <div className="hidden lg:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">교회</th>
                      <th className="text-left p-4 font-medium">코드</th>
                      <th className="text-left p-4 font-medium">지역</th>
                      <th className="text-left p-4 font-medium">담임목사</th>
                      <th className="text-left p-4 font-medium">등록일</th>
                      <th className="text-right p-4 font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {churches.map((church) => (
                      <tr key={church.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4">
                          <div>
                            <span className="font-medium">{church.name}</span>
                            {church.denomination && (
                              <p className="text-sm text-muted-foreground">{church.denomination}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono">
                            {church.code}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {regionCodes.find(r => r.code === church.region_code)?.name || church.region_code}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {church.pastor_name || '-'}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {formatDate(church.created_at)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openQRDownloadDialog(church)}
                              title="QR 코드 다운로드"
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyUrl(church)}
                              title="URL 복사"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyAdminToken(church)}
                              title="관리자 토큰 복사"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRegenerateToken(church)}
                              title="토큰 재생성"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="공개 페이지 열기"
                            >
                              <a
                                href={`/church/${church.code}?token=${church.write_token}`}
                                target="_blank"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="관리자 페이지 열기"
                            >
                              <a
                                href={`/church/${church.code}/admin?token=${church.admin_token}`}
                                target="_blank"
                              >
                                <Settings className="w-4 h-4" />
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(church)}
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* 모바일 카드 뷰 */}
          <div className="lg:hidden space-y-3">
            {churches.map((church) => (
              <Card key={church.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{church.name}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
                          {church.code}
                        </span>
                      </div>
                      {church.denomination && (
                        <p className="text-sm text-muted-foreground">{church.denomination}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(church)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {church.address && (
                    <p className="text-sm text-muted-foreground mb-3">{church.address}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openQRDownloadDialog(church)}
                    >
                      <QrCode className="w-3 h-3 mr-1" />
                      QR 코드
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyUrl(church)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      URL 복사
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateToken(church)}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      토큰 재생성
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`/church/${church.code}?token=${church.write_token}`}
                        target="_blank"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        공개 페이지
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`/church/${church.code}/admin?token=${church.admin_token}`}
                        target="_blank"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        관리자
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyAdminToken(church)}
                    >
                      <Key className="w-3 h-3 mr-1" />
                      토큰
                    </Button>
                  </div>

                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    등록일: {formatDate(church.created_at)}
                    {church.pastor_name && ` · 담임: ${church.pastor_name}`}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* 이미지 다운로드 다이얼로그 */}
      <Dialog
        open={qrDownload.isOpen}
        onOpenChange={(open) => {
          if (!qrDownload.isGenerating) {
            setQrDownload(prev => ({ ...prev, isOpen: open }));
            setPreviewQR(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              이미지 다운로드
            </DialogTitle>
          </DialogHeader>

          {qrDownload.church && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{qrDownload.church.name}</p>
                <p className="text-sm text-muted-foreground">
                  코드: {qrDownload.church.code}
                </p>
              </div>

              {/* 이미지 타입 선택 */}
              <div className="space-y-2">
                <Label>이미지 타입</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQrDownload(prev => ({ ...prev, imageType: 'qr' }));
                      setPreviewQR(null);
                    }}
                    disabled={qrDownload.isGenerating}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      qrDownload.imageType === 'qr'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <QrCode className="w-8 h-8 mx-auto mb-1" />
                    <p className="font-medium text-sm">QR 코드</p>
                    <p className="text-xs text-muted-foreground">스캔 가능</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQrDownload(prev => ({ ...prev, imageType: 'heart' }));
                      setPreviewQR(null);
                    }}
                    disabled={qrDownload.isGenerating}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      qrDownload.imageType === 'heart'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <span className="text-3xl block mb-1">♥</span>
                    <p className="font-medium text-sm">하트</p>
                    <p className="text-xs text-muted-foreground">하트 QR</p>
                  </button>
                </div>
              </div>

              {/* 월 선택 */}
              <div className="space-y-2">
                <Label>다운로드 범위</Label>
                <Select
                  value={qrDownload.selectedMonth.toString()}
                  onValueChange={(value) =>
                    setQrDownload(prev => ({
                      ...prev,
                      selectedMonth: value === 'all' ? 'all' : parseInt(value),
                    }))
                  }
                  disabled={qrDownload.isGenerating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 (264일)</SelectItem>
                    <SelectItem value="1">1월</SelectItem>
                    <SelectItem value="2">2월</SelectItem>
                    <SelectItem value="3">3월</SelectItem>
                    <SelectItem value="4">4월</SelectItem>
                    <SelectItem value="5">5월</SelectItem>
                    <SelectItem value="6">6월</SelectItem>
                    <SelectItem value="7">7월</SelectItem>
                    <SelectItem value="8">8월</SelectItem>
                    <SelectItem value="9">9월</SelectItem>
                    <SelectItem value="10">10월</SelectItem>
                    <SelectItem value="11">11월</SelectItem>
                    <SelectItem value="12">12월</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 진행 상태 */}
              {qrDownload.isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>이미지 생성 중...</span>
                    <span className="text-muted-foreground">
                      {qrDownload.progress} / {qrDownload.total}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${(qrDownload.progress / qrDownload.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 미리보기 */}
              {previewQR && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground">미리보기</p>
                  <div className="relative w-48 h-48 rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src={previewQR}
                      alt="미리보기"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleQRPreview}
                  disabled={qrDownload.isGenerating}
                >
                  미리보기
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleQRDownload}
                  disabled={qrDownload.isGenerating}
                >
                  {qrDownload.isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      ZIP 다운로드
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                1080x1080 크기의 QR 코드 이미지가 ZIP 파일로 다운로드됩니다.
                <br />
                각 이미지에는 날짜와 성경 구절 정보가 포함됩니다.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
