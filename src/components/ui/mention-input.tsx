'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';

interface GroupMember {
  user_id: string;
  profile: {
    nickname: string;
    avatar_url: string | null;
  } | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (userId: string, nickname: string) => void;
  groupId: string;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
}

export function MentionInput({
  value,
  onChange,
  onMention,
  groupId,
  placeholder = '내용을 입력하세요...',
  className,
  multiline = false,
  rows = 2,
  disabled = false,
  onKeyDown,
  autoFocus = false,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<GroupMember[]>([]);
  const [allMembers, setAllMembers] = useState<GroupMember[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 그룹 멤버 로드
  useEffect(() => {
    const loadMembers = async () => {
      if (!groupId) return;

      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (error || !data) return;

      // 프로필 정보 별도 조회
      const membersWithProfile = await Promise.all(
        data.map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', member.user_id)
            .maybeSingle();
          return { user_id: member.user_id, profile };
        })
      );

      setAllMembers(membersWithProfile.filter(m => m.profile?.nickname));
    };

    loadMembers();
  }, [groupId]);

  // 멘션 쿼리에 따라 추천 목록 필터링
  useEffect(() => {
    if (mentionQuery === '') {
      setSuggestions(allMembers.slice(0, 5));
    } else {
      const filtered = allMembers.filter(m =>
        m.profile?.nickname.toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
    }
    setSelectedIndex(0);
  }, [mentionQuery, allMembers]);

  // @ 감지 및 멘션 모드 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);

    // @ 뒤의 텍스트 찾기
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // 공백이 없으면 멘션 모드
      if (!textAfterAt.includes(' ')) {
        setMentionStartPos(lastAtIndex);
        setMentionQuery(textAfterAt);
        setShowSuggestions(true);
        return;
      }
    }

    setShowSuggestions(false);
    setMentionStartPos(null);
    setMentionQuery('');
  };

  // 멘션 선택
  const selectMention = useCallback((member: GroupMember) => {
    if (mentionStartPos === null || !member.profile) return;

    const beforeMention = value.slice(0, mentionStartPos);
    const afterMention = value.slice(mentionStartPos + 1 + mentionQuery.length);
    const newValue = `${beforeMention}@${member.profile.nickname} ${afterMention}`;

    onChange(newValue);
    onMention?.(member.user_id, member.profile.nickname);

    setShowSuggestions(false);
    setMentionStartPos(null);
    setMentionQuery('');

    // 커서 위치 조정
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = beforeMention.length + member.profile!.nickname.length + 2;
        inputRef.current.setSelectionRange(newPos, newPos);
        inputRef.current.focus();
      }
    }, 0);
  }, [mentionStartPos, mentionQuery, value, onChange, onMention]);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(suggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    onKeyDown?.(e);
  };

  // 외부 클릭 시 추천 목록 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="relative">
      <InputComponent
        ref={inputRef as React.RefObject<HTMLInputElement & HTMLTextAreaElement>}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={multiline ? rows : undefined}
      />

      {/* 멘션 추천 목록 */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 bottom-full mb-1 bg-popover border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {suggestions.map((member, index) => (
            <button
              key={member.user_id}
              type="button"
              onClick={() => selectMention(member)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors",
                index === selectedIndex && "bg-accent"
              )}
            >
              <Avatar className="w-6 h-6">
                {member.profile?.avatar_url ? (
                  <AvatarImage src={member.profile.avatar_url} />
                ) : null}
                <AvatarFallback className="text-xs">
                  {member.profile?.nickname?.[0] || <User className="w-3 h-3" />}
                </AvatarFallback>
              </Avatar>
              <span>{member.profile?.nickname}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// 멘션된 텍스트를 하이라이트 표시하는 컴포넌트
export function MentionText({ text, className }: { text: string; className?: string }) {
  // @닉네임 패턴 찾기
  const parts = text.split(/(@\S+)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return (
            <span key={index} className="text-primary font-medium">
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}
