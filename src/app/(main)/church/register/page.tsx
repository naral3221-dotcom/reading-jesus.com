'use client';

/**
 * /church/register - 교회 등록 페이지
 *
 * 새로운 교회를 등록하고 관리자 계정을 생성하는 페이지입니다.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
  Church,
  ChevronLeft,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { useRegisterChurch } from '@/presentation/hooks/queries/useChurch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// 지역 코드 목록
const REGION_CODES = [
  { code: 'SE', name: '서울' },
  { code: 'GG', name: '경기' },
  { code: 'IC', name: '인천' },
  { code: 'BS', name: '부산' },
  { code: 'DG', name: '대구' },
  { code: 'GJ', name: '광주' },
  { code: 'DJ', name: '대전' },
  { code: 'US', name: '울산' },
  { code: 'SJ', name: '세종' },
  { code: 'GW', name: '강원' },
  { code: 'CB', name: '충북' },
  { code: 'CN', name: '충남' },
  { code: 'JB', name: '전북' },
  { code: 'JN', name: '전남' },
  { code: 'GB', name: '경북' },
  { code: 'GN', name: '경남' },
  { code: 'JJ', name: '제주' },
  { code: 'OV', name: '해외' },
];

export default function ChurchRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const registerChurchMutation = useRegisterChurch();

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    regionCode: '',
    denomination: '',
    address: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  // 비밀번호 표시 상태
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 성공 모달 상태
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdChurchCode, setCreatedChurchCode] = useState('');

  // 폼 유효성 검사
  const validateForm = () => {
    if (!formData.name || formData.name.trim().length < 2) {
      toast({ variant: 'error', title: '교회 이름을 2자 이상 입력해주세요' });
      return false;
    }
    if (!formData.regionCode) {
      toast({ variant: 'error', title: '지역을 선택해주세요' });
      return false;
    }
    if (!formData.denomination) {
      toast({ variant: 'error', title: '교단을 선택해주세요' });
      return false;
    }
    if (!formData.address || formData.address.trim().length < 5) {
      toast({ variant: 'error', title: '주소를 5자 이상 입력해주세요' });
      return false;
    }
    if (!formData.adminEmail || !formData.adminEmail.includes('@')) {
      toast({ variant: 'error', title: '올바른 이메일 주소를 입력해주세요' });
      return false;
    }
    if (!formData.adminPassword || formData.adminPassword.length < 8) {
      toast({ variant: 'error', title: '비밀번호는 8자 이상이어야 합니다' });
      return false;
    }
    if (formData.adminPassword !== formData.confirmPassword) {
      toast({ variant: 'error', title: '비밀번호가 일치하지 않습니다' });
      return false;
    }
    if (!formData.agreeTerms) {
      toast({ variant: 'error', title: '이용약관에 동의해주세요' });
      return false;
    }
    return true;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const result = await registerChurchMutation.mutateAsync({
        name: formData.name.trim(),
        regionCode: formData.regionCode,
        denomination: formData.denomination,
        address: formData.address.trim(),
        adminEmail: formData.adminEmail.toLowerCase().trim(),
        adminPassword: formData.adminPassword,
      });

      if (result.church) {
        setCreatedChurchCode(result.church.code);
        setSuccessModalOpen(true);
      }
    } catch (error) {
      toast({
        variant: 'error',
        title: '교회 등록 실패',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요',
      });
    }
  };

  // 교회 코드 복사
  const handleCopyCode = () => {
    navigator.clipboard.writeText(createdChurchCode);
    toast({ variant: 'success', title: '교회 코드가 복사되었습니다' });
  };

  // 관리자 로그인 페이지로 이동
  const handleGoToLogin = () => {
    router.push(`/church/${createdChurchCode}/admin/login`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">교회 등록</h1>
            <p className="text-xs text-muted-foreground">새로운 교회를 등록하세요</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 교회 정보 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Church className="w-5 h-5 text-primary" />
                교회 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 교회 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  교회 이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="예: 영동중앙교회"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-12"
                />
              </div>

              {/* 지역 */}
              <div className="space-y-2">
                <Label htmlFor="region">
                  지역 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.regionCode}
                  onValueChange={(value) => setFormData({ ...formData, regionCode: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="지역을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_CODES.map((region) => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 교단 */}
              <div className="space-y-2">
                <Label htmlFor="denomination">
                  교단 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="denomination"
                  placeholder="예: 대한예수교장로회(통합)"
                  value={formData.denomination}
                  onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                  className="h-12"
                />
              </div>

              {/* 주소 */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  주소 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="예: 서울시 강남구 역삼동 123-45"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-12"
                />
              </div>
            </CardContent>
          </Card>

          {/* 관리자 계정 섹션 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">관리자 계정</CardTitle>
              <p className="text-sm text-muted-foreground">
                교회 관리를 위한 관리자 계정을 만듭니다
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  이메일 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@church.com"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="h-12"
                />
              </div>

              {/* 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  비밀번호 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8자 이상"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  비밀번호 확인 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword && formData.adminPassword !== formData.confirmPassword && (
                  <p className="text-sm text-red-500">비밀번호가 일치하지 않습니다</p>
                )}
                {formData.confirmPassword && formData.adminPassword === formData.confirmPassword && (
                  <p className="text-sm text-accent flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    비밀번호가 일치합니다
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 이용약관 동의 */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, agreeTerms: checked as boolean })
                  }
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  <span className="text-red-500">*</span> 이용약관 및 개인정보처리방침에 동의합니다.
                  교회 정보는 서비스 제공 목적으로만 사용되며, 제3자에게 제공되지 않습니다.
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold"
            disabled={registerChurchMutation.isPending}
          >
            {registerChurchMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                등록 중...
              </>
            ) : (
              '교회 등록하기'
            )}
          </Button>
        </form>
      </main>

      {/* 성공 모달 */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-accent" />
            </div>
            <DialogTitle className="text-center text-xl">교회 등록 완료!</DialogTitle>
            <DialogDescription className="text-center">
              교회가 성공적으로 등록되었습니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 교회 코드 표시 */}
            <div className="bg-slate-100 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">교회 코드</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-primary">{createdChurchCode}</span>
                <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                이 코드로 교회를 검색하거나 공유할 수 있습니다
              </p>
            </div>

            {/* 안내 메시지 */}
            <div className="bg-muted rounded-lg p-3 text-sm text-foreground">
              등록하신 이메일과 비밀번호로 관리자 페이지에 로그인하세요.
            </div>
          </div>

          {/* 버튼 */}
          <div className="space-y-2">
            <Button className="w-full" onClick={handleGoToLogin}>
              관리자 로그인
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/church')}>
              교회 찾기로 돌아가기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
