'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import {
  Loader2,
  Check,
  X,
  Clock,
  MessageSquare,
} from 'lucide-react';
import type { GroupJoinRequestWithProfile } from '@/types';

interface JoinRequestsManagerProps {
  groupId: string;
}

export function JoinRequestsManager({ groupId }: JoinRequestsManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<GroupJoinRequestWithProfile[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('group_join_requests')
        .select(`
          *,
          profile:profiles!group_join_requests_user_id_fkey (
            nickname,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (err) {
      console.error('가입 신청 목록 로드 에러:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    const supabase = getSupabaseBrowserClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('approve_group_join_request', {
        p_request_id: requestId,
        p_admin_id: user.id,
      });

      if (error) throw error;

      toast({
        variant: 'success',
        title: '가입을 승인했습니다',
      });

      // 목록에서 제거
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('승인 에러:', err);
      toast({
        variant: 'error',
        title: '승인에 실패했습니다',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    const supabase = getSupabaseBrowserClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('reject_group_join_request', {
        p_request_id: requestId,
        p_admin_id: user.id,
        p_reason: null,
      });

      if (error) throw error;

      toast({
        title: '가입 신청을 거절했습니다',
      });

      // 목록에서 제거
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('거절 에러:', err);
      toast({
        variant: 'error',
        title: '거절에 실패했습니다',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4" />
          가입 대기중
          <span className="ml-1 px-2 py-0.5 text-xs bg-muted text-foreground rounded-full">
            {requests.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={request.profile?.avatar_url || undefined} />
              <AvatarFallback>
                {request.profile?.nickname?.[0] || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {request.profile?.nickname || '알 수 없음'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
              {request.message && (
                <div className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{request.message}</span>
                </div>
              )}
            </div>

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handleReject(request.id)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4 text-destructive" />
                )}
              </Button>
              <Button
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleApprove(request.id)}
                disabled={processingId === request.id}
              >
                {processingId === request.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
