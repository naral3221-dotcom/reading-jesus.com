'use client';

/**
 * EditPostDialog 컴포넌트
 *
 * 교회 피드에서 묵상/QT 게시물을 수정하는 다이얼로그입니다.
 * QT 폼은 QTMeditationForm 컴포넌트를 재사용합니다.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, BookOpen, PenLine } from 'lucide-react';
import { FeedItem, FeedItemType } from './FeedCard';
import { ReadingDayPicker } from './ReadingDayPicker';
import { QTMeditationForm } from '@/components/personal/QTMeditationForm';
import dynamic from 'next/dynamic';

const RichEditor = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichEditor),
  { ssr: false, loading: () => <div className="h-[150px] border rounded-lg bg-muted/30 animate-pulse" /> }
);

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FeedItem | null;
  onSave: (data: EditPostData) => Promise<void>;
}

export interface EditPostData {
  id: string;
  type: FeedItemType;
  isAnonymous: boolean;
  dayNumber?: number | null;
  // 묵상용
  content?: string;
  // QT용 (mySentence = oneWord 매핑)
  mySentence?: string | null;
  meditationAnswer?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
}

export function EditPostDialog({ open, onOpenChange, item, onSave }: EditPostDialogProps) {
  const [saving, setSaving] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [dayNumber, setDayNumber] = useState<number | null>(null);

  // 묵상 필드
  const [content, setContent] = useState('');

  // QT 필드 (내부적으로 oneWord 사용, 저장 시 mySentence로 매핑)
  const [oneWord, setOneWord] = useState('');
  const [meditationAnswer, setMeditationAnswer] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [myPrayer, setMyPrayer] = useState('');
  const [dayReview, setDayReview] = useState('');

  // item이 변경될 때 폼 초기화
  useEffect(() => {
    if (item) {
      setIsAnonymous(item.isAnonymous);
      setDayNumber(item.dayNumber || null);

      if (item.type === 'meditation') {
        setContent(item.content || '');
      } else {
        // mySentence → oneWord 매핑
        setOneWord(item.mySentence || '');
        setMeditationAnswer(item.meditationAnswer || '');
        setGratitude(item.gratitude || '');
        setMyPrayer(item.myPrayer || '');
        setDayReview(item.dayReview || '');
      }
    }
  }, [item]);

  const handleSave = async () => {
    if (!item) return;

    setSaving(true);
    try {
      const data: EditPostData = {
        id: item.id,
        type: item.type,
        isAnonymous,
        dayNumber,
      };

      if (item.type === 'meditation') {
        data.content = content;
      } else {
        // oneWord → mySentence 매핑 (저장 시)
        data.mySentence = oneWord || null;
        data.meditationAnswer = meditationAnswer || null;
        data.gratitude = gratitude || null;
        data.myPrayer = myPrayer || null;
        data.dayReview = dayReview || null;
      }

      await onSave(data);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.type === 'qt' ? (
              <><BookOpen className="w-5 h-5" /> QT 수정</>
            ) : (
              <><PenLine className="w-5 h-5" /> 묵상 수정</>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 익명 설정 */}
          <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked === true)}
            />
            <Label htmlFor="anonymous" className="flex items-center gap-2 cursor-pointer">
              <Lock className="w-4 h-4" />
              익명으로 게시
            </Label>
          </div>

          {/* 통독일정 (묵상만 해당) */}
          {item.type === 'meditation' && (
            <div className="space-y-2">
              <Label>통독일정</Label>
              <ReadingDayPicker
                value={dayNumber}
                onChange={setDayNumber}
                placeholder="통독일정을 선택하세요"
              />
            </div>
          )}

          {item.type === 'meditation' ? (
            // 묵상 수정
            <div className="space-y-2">
              <Label>묵상 내용</Label>
              <RichEditor
                content={content}
                onChange={setContent}
                placeholder="묵상 내용을 작성해주세요..."
                minHeight="200px"
              />
            </div>
          ) : (
            // QT 수정 - QTMeditationForm 재사용
            <QTMeditationForm
              variant="colorful"
              showBibleReference={false}
              displayMeditationQuestion={item.meditationQuestion}
              oneWord={oneWord}
              meditationAnswer={meditationAnswer}
              gratitude={gratitude}
              myPrayer={myPrayer}
              dayReview={dayReview}
              onOneWordChange={setOneWord}
              onMeditationAnswerChange={setMeditationAnswer}
              onGratitudeChange={setGratitude}
              onMyPrayerChange={setMyPrayer}
              onDayReviewChange={setDayReview}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
