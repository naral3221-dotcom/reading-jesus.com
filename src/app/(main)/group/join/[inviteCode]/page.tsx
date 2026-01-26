'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import {
  Users,
  Loader2,
  AlertCircle,
  Calendar,
  UserPlus,
  Check,
  LogIn,
  Clock,
  Lock,
  Unlock,
  Send,
} from 'lucide-react';
import type { Group } from '@/types';

export default function GroupJoinPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const inviteCode = params.inviteCode as string;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 승인제 가입 신청용
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }

      // 초대 코드로 그룹 찾기
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (groupError || !groupData) {
        setError('유효하지 않은 초대 링크입니다');
        return;
      }

      // 교회 그룹인 경우 교회 초대 페이지로 리다이렉트
      if (groupData.church_id) {
        const { data: church } = await supabase
          .from('churches')
          .select('code')
          .eq('id', groupData.church_id)
          .single();

        if (church) {
          setIsRedirecting(true);
          router.replace(`/church/${church.code}/groups/join/${inviteCode}`);
          return;
        }
      }

      setGroup(groupData);

      // 멤버 수 조회
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupData.id);

      setMemberCount(count || 0);

      // 이미 멤버인지 확인
      if (user) {
        const { data: membership } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupData.id)
          .eq('user_id', user.id)
          .single();

        if (membership) {
          setIsMember(true);
        }

        // 대기중인 가입 신청이 있는지 확인
        const { data: pendingRequest } = await supabase
          .from('group_join_requests')
          .select('id')
          .eq('group_id', groupData.id)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .single();

        if (pendingRequest) {
          setHasPendingRequest(true);
        }
      }
    } catch (err) {
      console.error('데이터 로드 에러:', err);
      setError('데이터를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  }, [inviteCode, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 공개 그룹 바로 가입
  const handleJoinGroup = async () => {
    if (!currentUser || !group) return;

    setJoining(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: currentUser.id,
          role: 'member',
        });

      if (joinError) throw joinError;

      toast({
        variant: 'success',
        title: '그룹에 참여했습니다!',
        description: group.name,
      });

      router.push(`/group/${group.id}`);
    } catch (err) {
      console.error('그룹 참여 에러:', err);
      toast({
        variant: 'error',
        title: '그룹 참여에 실패했습니다',
      });
    } finally {
      setJoining(false);
    }
  };

  // 승인제 그룹 가입 신청
  const handleRequestJoin = async () => {
    if (!currentUser || !group) return;

    setJoining(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const { error: requestError } = await supabase
        .from('group_join_requests')
        .insert({
          group_id: group.id,
          user_id: currentUser.id,
          message: requestMessage.trim() || null,
          status: 'pending',
        });

      if (requestError) throw requestError;

      toast({
        variant: 'success',
        title: '가입 신청이 완료되었습니다',
        description: '그룹 관리자가 승인하면 알려드릴게요',
      });

      setHasPendingRequest(true);
      setShowRequestForm(false);
    } catch (err) {
      console.error('가입 신청 에러:', err);
      toast({
        variant: 'error',
        title: '가입 신청에 실패했습니다',
      });
    } finally {
      setJoining(false);
    }
  };

  const handleGoToLogin = () => {
    const currentPath = `/group/join/${inviteCode}`;
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handleGoToGroup = () => {
    if (group) {
      router.push(`/group/${group.id}`);
    }
  };

  // 로딩 중이거나 리다이렉트 중이거나 에러/데이터 없음
  if (loading || isRedirecting || error || !group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        {(loading || isRedirecting) ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        ) : (
          <>
            <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-2">그룹을 찾을 수 없습니다</h1>
            <p className="text-muted-foreground text-center mb-4">
              {error || '유효하지 않은 초대 링크이거나 삭제된 그룹입니다.'}
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/group')}
            >
              그룹 목록으로
            </Button>
          </>
        )}
      </div>
    );
  }

  // join_type이 null인 경우 'open'으로 처리 (기존 그룹 호환)
  const isApprovalGroup = group.join_type === 'approval';

  return (
    <div className="min-h-screen bg-muted/30 pb-20 lg:pb-4">
      <main className="max-w-md mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">그룹 초대</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold">{group.name}</h2>
              {group.description && (
                <p className="text-sm text-muted-foreground">{group.description}</p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{memberCount}명 참여중</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{group.reading_plan_type}일 읽기 플랜</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isApprovalGroup ? (
                  <>
                    <Lock className="w-4 h-4 text-accent" />
                    <span className="text-accent">승인제 그룹</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-accent" />
                    <span className="text-accent">공개 그룹</span>
                  </>
                )}
              </div>
            </div>

            {!currentUser ? (
              // 비로그인
              <div className="space-y-3">
                <Button
                  onClick={handleGoToLogin}
                  className="w-full gap-2"
                  size="lg"
                >
                  <LogIn className="w-4 h-4" />
                  로그인하고 참여하기
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  그룹에 참여하려면 로그인이 필요합니다
                </p>
              </div>
            ) : isMember ? (
              // 이미 멤버
              <div className="space-y-3">
                <Button
                  onClick={handleGoToGroup}
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                >
                  <Check className="w-4 h-4 text-accent" />
                  이미 참여중인 그룹입니다
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  그룹 페이지로 이동합니다
                </p>
              </div>
            ) : hasPendingRequest ? (
              // 이미 가입 신청함
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                  disabled
                >
                  <Clock className="w-4 h-4 text-accent" />
                  가입 승인 대기중
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  그룹 관리자의 승인을 기다리고 있습니다
                </p>
              </div>
            ) : isApprovalGroup ? (
              // 승인제 그룹 - 가입 신청
              showRequestForm ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      가입 신청 메시지 (선택)
                    </label>
                    <Textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="그룹 관리자에게 전달할 메시지를 입력하세요"
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {requestMessage.length}/200
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRequestForm(false)}
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleRequestJoin}
                      disabled={joining}
                      className="flex-1 gap-2"
                    >
                      {joining ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      신청하기
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={() => setShowRequestForm(true)}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <UserPlus className="w-4 h-4" />
                    가입 신청하기
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    그룹 관리자가 승인해야 참여할 수 있습니다
                  </p>
                </div>
              )
            ) : (
              // 공개 그룹 - 바로 가입
              <Button
                onClick={handleJoinGroup}
                disabled={joining}
                className="w-full gap-2"
                size="lg"
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                그룹 참여하기
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
