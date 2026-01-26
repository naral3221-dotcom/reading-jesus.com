'use client';

/**
 * /mypage/church - 내 교회 페이지
 *
 * 소속 교회 정보, 교회 탈퇴/검색, 교회 내 내 활동 기록을 표시합니다.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Church,
  Search,
  ExternalLink,
  UserMinus,
  ChevronLeft,
  Plus,
  Loader2,
  BookOpen,
  PenLine,
  Calendar,
} from 'lucide-react';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useSearchChurches, useJoinChurch, useLeaveChurch } from '@/presentation/hooks/queries/useChurch';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function MyChurchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: userData, isLoading: userLoading } = useCurrentUser();

  const user = userData?.user;
  const church = userData?.church;

  // 교회 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  // 탈퇴 확인 다이얼로그
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  // 교회 검색 훅
  const { data: searchResults, isLoading: searchLoading } = useSearchChurches(
    searchQuery,
    { enabled: searchDialogOpen && searchQuery.length >= 2 }
  );

  // 교회 가입/탈퇴 뮤테이션
  const joinChurchMutation = useJoinChurch();
  const leaveChurchMutation = useLeaveChurch();

  // 교회 가입
  const handleJoinChurch = async (churchCode: string) => {
    if (!user?.id) return;

    try {
      await joinChurchMutation.mutateAsync({ userId: user.id, churchCode });
      setSearchDialogOpen(false);
      setSearchQuery('');
      toast({
        variant: 'success',
        title: '교회에 가입되었습니다',
      });
    } catch (error) {
      toast({
        variant: 'error',
        title: '가입에 실패했습니다',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요',
      });
    }
  };

  // 교회 탈퇴
  const handleLeaveChurch = async () => {
    if (!user?.id || !church?.id) return;

    try {
      await leaveChurchMutation.mutateAsync({ userId: user.id, churchId: church.id });
      setLeaveDialogOpen(false);
      toast({
        variant: 'success',
        title: '교회에서 탈퇴되었습니다',
      });
    } catch (error) {
      toast({
        variant: 'error',
        title: '탈퇴에 실패했습니다',
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해주세요',
      });
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-2 p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">내 교회</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 현재 교회 정보 */}
        {church ? (
          <>
            {/* 교회 카드 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Church className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{church.name}</h2>
                    {church.denomination && (
                      <p className="text-sm text-muted-foreground">{church.denomination}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      교회 코드: {church.code}
                    </p>
                    {user?.churchJoinedAt && (
                      <p className="text-xs text-muted-foreground">
                        가입일: {formatDistanceToNow(new Date(user.churchJoinedAt), { addSuffix: true, locale: ko })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-6">
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => router.push(`/church/${church.code}`)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    교회 페이지
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:text-destructive"
                    onClick={() => setLeaveDialogOpen(true)}
                  >
                    <UserMinus className="w-4 h-4 mr-2" />
                    탈퇴
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 교회 내 활동 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">교회 내 활동</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 활동 통계 */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <BookOpen className="w-5 h-5 mx-auto text-accent mb-1" />
                    <p className="text-lg font-bold">0</p>
                    <p className="text-xs text-muted-foreground">QT 작성</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <PenLine className="w-5 h-5 mx-auto text-accent mb-1" />
                    <p className="text-lg font-bold">0</p>
                    <p className="text-xs text-muted-foreground">묵상 작성</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-5 h-5 mx-auto text-accent mb-1" />
                    <p className="text-lg font-bold">0</p>
                    <p className="text-xs text-muted-foreground">참여 일수</p>
                  </div>
                </div>

                <p className="text-sm text-center text-muted-foreground py-4">
                  활동 통계는 추후 업데이트됩니다
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          /* 교회 미등록 상태 */
          <Card>
            <CardContent className="py-12 text-center">
              <Church className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-lg font-semibold mb-2">등록된 교회가 없습니다</h2>
              <p className="text-sm text-muted-foreground mb-6">
                교회에 가입하여 함께 묵상을 나눠보세요
              </p>
              <Button onClick={() => setSearchDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                교회 검색하기
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 다른 교회 검색 (교회가 있어도 표시) */}
        {church && (
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground text-center mb-3">
                다른 교회로 변경하시겠습니까?
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSearchDialogOpen(true)}
              >
                <Search className="w-4 h-4 mr-2" />
                다른 교회 검색
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 교회 검색 다이얼로그 */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>교회 검색</DialogTitle>
            <DialogDescription>
              교회명 또는 교회 코드로 검색하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="교회명 또는 교회 코드"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 검색 결과 */}
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : searchQuery.length < 2 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  2글자 이상 입력하세요
                </p>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((searchChurch) => (
                  <div
                    key={searchChurch.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Church className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{searchChurch.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {searchChurch.denomination || searchChurch.code}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={searchChurch.id === church?.id ? 'secondary' : 'default'}
                      disabled={searchChurch.id === church?.id || joinChurchMutation.isPending}
                      onClick={() => handleJoinChurch(searchChurch.code)}
                    >
                      {searchChurch.id === church?.id ? '현재 교회' : '가입'}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  검색 결과가 없습니다
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 탈퇴 확인 다이얼로그 */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>교회 탈퇴</AlertDialogTitle>
            <AlertDialogDescription>
              {church?.name}에서 탈퇴하시겠습니까?
              <br />
              탈퇴 후에도 언제든 다시 가입할 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveChurch}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              탈퇴하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
