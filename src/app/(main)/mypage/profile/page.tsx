'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, Camera, Check, Trash2, Upload, X } from 'lucide-react';
import { useCurrentUser, useUpdateProfile, useUploadAvatar } from '@/presentation/hooks/queries/useUser';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ProfileEditPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Query 훅 사용
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const user = userData?.user ?? null;
  const userId = user?.id ?? null;

  const [nickname, setNickname] = useState('');
  const [originalNickname, setOriginalNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  // 이미지 미리보기 모달
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const loading = userLoading;
  const saving = updateProfile.isPending;
  const uploading = uploadAvatar.isPending;

  const hasChanges = nickname.trim() !== originalNickname || avatarUrl !== originalAvatarUrl;

  // 프로필 데이터 로드 시 상태 초기화
  useEffect(() => {
    if (!userLoading && userData) {
      if (!user) {
        router.push('/login');
        return;
      }

      // User 엔티티에서 닉네임과 아바타 URL 가져오기
      setNickname(user.nickname || '');
      setOriginalNickname(user.nickname || '');
      setAvatarUrl(user.avatarUrl || null);
      setOriginalAvatarUrl(user.avatarUrl || null);
    }
  }, [userLoading, userData, user, router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        variant: 'error',
        title: '지원하지 않는 파일 형식입니다',
        description: 'JPG, PNG, WEBP, GIF 파일만 업로드 가능합니다',
      });
      return;
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'error',
        title: '파일이 너무 큽니다',
        description: '5MB 이하의 파일만 업로드 가능합니다',
      });
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
      setPreviewFile(file);
      setPreviewModalOpen(true);
    };
    reader.readAsDataURL(file);

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadConfirm = async () => {
    if (!previewFile || !userId) return;

    setPreviewModalOpen(false);

    try {
      const result = await uploadAvatar.mutateAsync({
        userId,
        file: previewFile,
      });

      if (result) {
        // 캐시 무효화를 위해 타임스탬프 추가
        const newAvatarUrl = `${result}?t=${Date.now()}`;
        setAvatarUrl(newAvatarUrl);

        toast({
          variant: 'success',
          title: '이미지가 업로드되었습니다',
          description: '저장 버튼을 눌러 변경사항을 저장하세요',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'error',
        title: '업로드에 실패했습니다',
        description: '잠시 후 다시 시도해주세요',
      });
    } finally {
      setPreviewImage(null);
      setPreviewFile(null);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl(null);
    toast({
      title: '프로필 이미지가 제거되었습니다',
      description: '저장 버튼을 눌러 변경사항을 저장하세요',
    });
  };

  const handleSave = async () => {
    if (!userId) return;
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요');
      return;
    }

    if (nickname.trim().length < 2) {
      setError('닉네임은 2자 이상이어야 합니다');
      return;
    }

    setError('');

    try {
      await updateProfile.mutateAsync({
        userId,
        nickname: nickname.trim(),
        avatarUrl: avatarUrl,
      });

      toast({
        variant: 'success',
        title: '프로필이 저장되었습니다',
      });

      router.push('/mypage');
    } catch {
      setError('저장에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="h-7 w-28 bg-muted rounded animate-pulse" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 bg-muted rounded-full animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-12 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/mypage">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">프로필 수정</h1>
        </div>
        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !nickname.trim()}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                저장
              </>
            )}
          </Button>
        )}
      </div>

      {/* Avatar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="w-24 h-24 ring-2 ring-primary/20 ring-offset-2">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {nickname?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-primary rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-1" />
                사진 변경
              </Button>
              {avatarUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              JPG, PNG, WEBP, GIF (최대 5MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">닉네임</label>
            <Input
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
              disabled={saving}
              className={cn(
                error && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <div className="flex justify-between items-center">
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">2-20자 사이로 입력해주세요</p>
              )}
              <p className={cn(
                "text-xs",
                nickname.length >= 18 ? "text-accent" : "text-muted-foreground"
              )}>
                {nickname.length}/20
              </p>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || !hasChanges || !nickname.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장하기'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 이미지 미리보기 모달 */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>프로필 사진 미리보기</DialogTitle>
            <DialogDescription>
              이 사진을 프로필 사진으로 사용하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {previewImage && (
              <div className="relative w-32 h-32 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-2">
                <Image
                  src={previewImage}
                  alt="Preview"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreviewModalOpen(false);
                setPreviewImage(null);
                setPreviewFile(null);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              취소
            </Button>
            <Button onClick={handleUploadConfirm}>
              <Upload className="w-4 h-4 mr-1" />
              업로드
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
