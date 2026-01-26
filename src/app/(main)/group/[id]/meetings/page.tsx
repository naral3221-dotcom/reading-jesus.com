'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Calendar, MapPin, Users, Plus, Check, X, Video, Clock, Target, ArrowLeft } from 'lucide-react';
import type { MeetingPurpose } from '@/types/meeting';
import { MEETING_PURPOSES } from '@/types/meeting';
import { format, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getTodayDateString } from '@/lib/date-utils';

// React Query Hooks
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useGroupMemberPermissions } from '@/presentation/hooks/queries/useGroup';
import {
  useGroupMeetings,
  useCreateMeeting,
  useJoinMeeting,
  useCancelMeetingParticipation,
} from '@/presentation/hooks/queries/useGroupMeeting';

export default function GroupMeetingsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const groupId = params.id as string;

  // React Query 훅 사용
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id ?? null;

  const { data: permissionsData } = useGroupMemberPermissions(groupId, userId);
  const userPermissions = permissionsData?.permissions ?? {
    can_read: true,
    can_comment: true,
    can_create_meeting: false,
    can_pin_comment: false,
    can_manage_members: false,
  };

  const { data: meetings = [], isLoading: loading } = useGroupMeetings(groupId, userId);

  // Mutations
  const createMeetingMutation = useCreateMeeting();
  const joinMeetingMutation = useJoinMeeting();
  const cancelParticipationMutation = useCancelMeetingParticipation();

  // 모달 상태
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [onlineLink, setOnlineLink] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [purpose, setPurpose] = useState<MeetingPurpose | ''>('');
  const [error, setError] = useState('');

  const handleCreateMeeting = async () => {
    setError('');
    if (!title.trim()) {
      setError('제목을 입력해주세요');
      return;
    }
    if (!meetingDate) {
      setError('날짜를 선택해주세요');
      return;
    }

    // 과거 날짜/시간 검증
    const meetingDateTime = new Date(`${meetingDate}T${meetingTime}`);
    const now = new Date();
    if (meetingDateTime <= now) {
      setError('과거 날짜/시간은 선택할 수 없습니다');
      return;
    }

    if (isOnline && !onlineLink.trim()) {
      setError('온라인 링크를 입력해주세요');
      return;
    }
    if (!isOnline && !location.trim()) {
      setError('장소를 입력해주세요');
      return;
    }

    if (!userId) {
      setError('로그인이 필요합니다');
      return;
    }

    try {
      await createMeetingMutation.mutateAsync({
        groupId,
        hostId: userId,
        title: title.trim(),
        description: description.trim() || null,
        meetingDate: meetingDateTime,
        location: !isOnline ? location.trim() : null,
        isOnline,
        onlineLink: isOnline ? onlineLink.trim() : null,
        maxParticipants: parseInt(maxParticipants),
        purpose: purpose || null,
      });

      resetForm();
      setCreateModalOpen(false);
      toast({
        variant: 'success',
        title: '모임 일정이 생성되었습니다',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '잠시 후 다시 시도해주세요';
      toast({
        variant: 'error',
        title: '생성에 실패했습니다',
        description: errorMessage,
      });
    }
  };

  const handleJoinMeeting = async (meetingId: string) => {
    if (!userId) return;

    // 해당 모임 찾기
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    // 참가자 수 제한 확인
    if ((meeting.participant_count ?? 0) >= meeting.max_participants) {
      toast({
        variant: 'error',
        title: '참여할 수 없습니다',
        description: '최대 참가 인원에 도달했습니다',
      });
      return;
    }

    try {
      await joinMeetingMutation.mutateAsync({
        meetingId,
        userId,
        groupId,
      });
      toast({
        variant: 'success',
        title: '모임에 참여 신청했습니다',
      });
    } catch {
      toast({
        variant: 'error',
        title: '참여 신청에 실패했습니다',
      });
    }
  };

  const handleCancelMeeting = async (participationId: string) => {
    try {
      await cancelParticipationMutation.mutateAsync({
        participationId,
        groupId,
      });
      toast({
        variant: 'success',
        title: '참여가 취소되었습니다',
      });
    } catch {
      toast({
        variant: 'error',
        title: '취소에 실패했습니다',
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMeetingDate('');
    setMeetingTime('14:00');
    setLocation('');
    setIsOnline(false);
    setOnlineLink('');
    setMaxParticipants('20');
    setPurpose('');
    setError('');
  };

  // 목적 정보 가져오기
  const getPurposeInfo = (purposeValue: MeetingPurpose | null) => {
    if (!purposeValue) return null;
    return MEETING_PURPOSES.find(p => p.value === purposeValue);
  };

  const submitting = createMeetingMutation.isPending;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">소그룹 모임</h1>
              <p className="text-sm text-muted-foreground mt-1">
                함께 모여 묵상을 나눠요
              </p>
            </div>
          </div>
          {userPermissions.can_create_meeting && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              모임 만들기
            </Button>
          )}
        </div>

        {/* 모임 목록 */}
        <div className="space-y-3">
          {loading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                로딩 중...
              </CardContent>
            </Card>
          ) : meetings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">아직 예정된 모임이 없습니다</p>
                <p className="text-sm text-muted-foreground mt-1">
                  첫 모임을 만들어보세요!
                </p>
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting) => {
              const meetingDateValue = new Date(meeting.meeting_date);
              const isPastMeeting = isPast(meetingDateValue);
              const isFull = (meeting.participant_count ?? 0) >= meeting.max_participants;

              return (
                <Card key={meeting.id} className={cn(
                  "hover:shadow-md transition-shadow",
                  isPastMeeting && "opacity-60"
                )}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {meeting.purpose && getPurposeInfo(meeting.purpose) && (
                            <span className="text-lg" title={getPurposeInfo(meeting.purpose)?.label}>
                              {getPurposeInfo(meeting.purpose)?.emoji}
                            </span>
                          )}
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                        </div>
                        <CardDescription className="mt-1">
                          by {meeting.host.nickname}
                          {meeting.purpose && getPurposeInfo(meeting.purpose) && (
                            <span className="ml-2 text-xs">• {getPurposeInfo(meeting.purpose)?.label}</span>
                          )}
                        </CardDescription>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        meeting.status === 'upcoming' && "bg-accent/10 text-accent",
                        meeting.status === 'completed' && "bg-gray-100 text-gray-700",
                        meeting.status === 'cancelled' && "bg-red-100 text-red-700"
                      )}>
                        {meeting.status === 'upcoming' && '예정'}
                        {meeting.status === 'completed' && '완료'}
                        {meeting.status === 'cancelled' && '취소'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {meeting.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {meeting.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {format(meetingDateValue, 'yyyy년 M월 d일 (E) HH:mm', { locale: ko })}
                      </div>
                      {meeting.is_online ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Video className="w-4 h-4" />
                          <span>온라인 모임</span>
                        </div>
                      ) : meeting.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {meeting.location}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {meeting.participant_count} / {meeting.max_participants}명 참여
                      </div>
                    </div>

                    {/* 참여 버튼 */}
                    {!isPastMeeting && meeting.status === 'upcoming' && (
                      <div className="pt-2">
                        {meeting.is_participant ? (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              disabled
                            >
                              <Check className="w-4 h-4 mr-2" />
                              참여 신청됨
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => meeting.my_participation && handleCancelMeeting(meeting.my_participation.id)}
                              disabled={cancelParticipationMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={() => handleJoinMeeting(meeting.id)}
                            disabled={isFull || meeting.host_id === userId || joinMeetingMutation.isPending}
                          >
                            {isFull ? '인원 마감' : meeting.host_id === userId ? '내가 만든 모임' : '참여 신청'}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* 모임 만들기 모달 */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>새 모임 만들기</DialogTitle>
            <DialogDescription>
              그룹원들과 함께할 모임을 만들어보세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">제목 *</label>
              <Input
                placeholder="예: 이번 주 토요일 묵상 모임"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* 모임 목적 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4" />
                모임 목적 (선택)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MEETING_PURPOSES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPurpose(purpose === p.value ? '' : p.value)}
                    disabled={submitting}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border transition-colors",
                      purpose === p.value
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <span className="text-xl mb-1">{p.emoji}</span>
                    <span className="text-xs">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">설명 (선택)</label>
              <Textarea
                placeholder="모임에 대한 설명을 입력하세요"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">날짜 *</label>
                <Input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  disabled={submitting}
                  min={getTodayDateString()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">시간 *</label>
                <Input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="online"
                checked={isOnline}
                onCheckedChange={(checked) => setIsOnline(checked as boolean)}
                disabled={submitting}
              />
              <label htmlFor="online" className="text-sm cursor-pointer">
                온라인 모임
              </label>
            </div>

            {isOnline ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">온라인 링크 *</label>
                <Input
                  placeholder="Zoom, Google Meet 링크 등"
                  value={onlineLink}
                  onChange={(e) => setOnlineLink(e.target.value)}
                  disabled={submitting}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">장소 *</label>
                <Input
                  placeholder="예: 교회 소그룹실"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={submitting}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">최대 인원</label>
              <Input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                disabled={submitting}
                min="2"
                max="100"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={submitting}>
              취소
            </Button>
            <Button onClick={handleCreateMeeting} disabled={submitting}>
              {submitting ? '생성 중...' : '모임 만들기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
