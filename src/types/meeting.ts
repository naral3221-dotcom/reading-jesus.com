// 모임 목적 타입
export type MeetingPurpose = 'worship' | 'bible_study' | 'prayer' | 'fellowship' | 'mission' | 'other';

export const MEETING_PURPOSES: { value: MeetingPurpose; label: string; emoji: string }[] = [
  { value: 'worship', label: '찬양', emoji: '🎵' },
  { value: 'bible_study', label: '성경공부', emoji: '📖' },
  { value: 'prayer', label: '기도', emoji: '🙏' },
  { value: 'fellowship', label: '친교', emoji: '🤝' },
  { value: 'mission', label: '선교/봉사', emoji: '❤️' },
  { value: 'other', label: '기타', emoji: '✨' },
];

export interface GroupMeeting {
  id: string;
  group_id: string;
  host_id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  location: string | null;
  max_participants: number;
  is_online: boolean;
  online_link: string | null;
  purpose: MeetingPurpose | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  joined_at: string;
}

export interface GroupMeetingWithHost extends GroupMeeting {
  host: {
    nickname: string;
    avatar_url: string | null;
  };
  participant_count?: number;
  is_participant?: boolean;
  my_participation?: MeetingParticipant;
}
