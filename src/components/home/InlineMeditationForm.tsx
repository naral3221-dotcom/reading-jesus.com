'use client';

import * as React from 'react';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  BibleVerseSelector,
  formatBibleVerseShort,
  type BibleVerseValue,
} from '@/components/bible/BibleVerseSelector';
import { VisibilitySelector, type ContentVisibility } from '@/components/ui/visibility-selector';
import { useCreatePublicMeditation } from '@/presentation/hooks/queries/usePublicMeditation';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

interface InlineMeditationFormProps {
  userId: string | null;
  className?: string;
  onSuccess?: () => void;
}

/**
 * 인라인 묵상 작성 폼 (트위터 스타일)
 * 홈 페이지에 바로 입력 필드가 보이는 형태
 */
export function InlineMeditationForm({
  userId,
  className,
  onSuccess,
}: InlineMeditationFormProps) {
  const [content, setContent] = React.useState('');
  const [bibleVerse, setBibleVerse] = React.useState<BibleVerseValue | null>(null);
  const [isAnonymous, setIsAnonymous] = React.useState(false);
  const [visibility, setVisibility] = React.useState<ContentVisibility>('public');
  const [isExpanded, setIsExpanded] = React.useState(false);

  const { toast } = useToast();
  const createMeditation = useCreatePublicMeditation();

  const handleSubmit = async () => {
    if (!userId) {
      toast({ title: '로그인이 필요합니다', variant: 'error' });
      return;
    }

    if (!content.trim()) {
      toast({ title: '묵상 내용을 입력해주세요', variant: 'error' });
      return;
    }

    try {
      await createMeditation.mutateAsync({
        userId,
        content: content.trim(),
        bibleReference: bibleVerse ? formatBibleVerseShort(bibleVerse) : undefined,
        isAnonymous,
        visibility,
      });

      // 성공 후 초기화
      setContent('');
      setBibleVerse(null);
      setIsAnonymous(false);
      setVisibility('public');
      setIsExpanded(false);
      toast({ title: '묵상이 나눠졌습니다', variant: 'success' });
      onSuccess?.();
    } catch (error) {
      console.error('묵상 작성 실패:', error);
      toast({ title: '묵상 작성에 실패했습니다', variant: 'error' });
    }
  };

  const isDisabled = !userId || !content.trim() || createMeditation.isPending;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-4 space-y-3',
        'shadow-sm',
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">짧은 묵상 작성하기</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 px-2"
        >
          {isExpanded ? (
            <>
              접기 <ChevronUp className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              펼치기 <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      {/* 묵상 내용 입력 */}
      <Textarea
        placeholder={
          userId
            ? '오늘 말씀을 통해 받은 은혜를 나눠주세요...'
            : '로그인 후 묵상을 작성할 수 있습니다'
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={!userId}
        className="min-h-[80px] resize-none"
        onFocus={() => setIsExpanded(true)}
      />

      {/* 확장 영역: 성경 구절 선택 + 옵션 */}
      {isExpanded && (
        <div className="space-y-4 pt-2 border-t border-border/50">
          {/* 공개 범위 선택 */}
          <VisibilitySelector
            value={visibility}
            onChange={setVisibility}
            allowedOptions={['private', 'public']}
            variant="inline"
          />

          {/* 성경 구절 선택 */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              읽은 말씀 (선택)
            </Label>
            <BibleVerseSelector
              value={bibleVerse}
              onChange={setBibleVerse}
            />
          </div>

          {/* 익명 옵션 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <Label
              htmlFor="anonymous"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              익명으로 작성
            </Label>
          </div>
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isDisabled}
          size="sm"
          className="gap-2"
        >
          <Send className="w-4 h-4" />
          나누기
        </Button>
      </div>
    </div>
  );
}
