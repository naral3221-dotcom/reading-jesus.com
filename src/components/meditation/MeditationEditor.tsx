'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RichEditor, isEmptyContent, htmlToPlainText } from '@/components/ui/rich-editor';
import { LinkPreviewList, extractUrls } from '@/components/ui/link-preview';
import { useToast } from '@/components/ui/toast';
import { useMultiDraft } from '@/hooks/useMultiDraft';
import { DraftDropdown } from './DraftDropdown';
import {
  X,
  Send,
  ImageIcon,
  BookOpen,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReadingDayPicker } from '@/components/church/ReadingDayPicker';

// 선택된 구절 타입
export interface SelectedVerse {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  text: string;
}

export interface MeditationEditorProps {
  // 필수 Props
  onSubmit: (data: MeditationSubmitData) => Promise<void>;

  // 선택적 Props
  selectedVerses?: SelectedVerse[];
  onRemoveVerse?: (index: number) => void;
  onClearVerses?: () => void;

  // 카드 생성 기능
  onCreateCard?: (verse: SelectedVerse) => void;
  showCardButton?: boolean;
  // 카드 이미지 삽입 (외부에서 전달)
  cardImageToInsert?: string;
  onCardImageInserted?: () => void;

  // 컨텍스트 정보
  context: 'bible_reader' | 'church_bible' | 'church_sharing';
  identifier?: string; // churchCode, groupId 등

  // 초기값
  initialContent?: string;
  initialAuthorName?: string;
  initialDayNumber?: number | null;

  // 통독일정 선택
  showDayPicker?: boolean;

  // 익명 옵션
  showAnonymous?: boolean;
  defaultAnonymous?: boolean;

  // 발행 텍스트
  submitLabel?: string;

  // 콜백
  onClose?: () => void;
  onDraftSaved?: () => void;

  // 스타일
  className?: string;
  minHeight?: string;

  // 제출 중 상태 (외부에서 관리)
  isSubmitting?: boolean;
}

export interface MeditationSubmitData {
  content: string;
  authorName?: string;
  bibleRange?: string;
  selectedVerses?: SelectedVerse[];
  attachedLinks?: string[];
  isAnonymous: boolean;
  dayNumber?: number | null;
}

export function MeditationEditor({
  onSubmit,
  selectedVerses = [],
  onRemoveVerse,
  onClearVerses,
  onCreateCard,
  showCardButton = false,
  cardImageToInsert,
  onCardImageInserted,
  context,
  identifier = '',
  initialContent = '',
  initialAuthorName = '',
  initialDayNumber = null,
  showDayPicker = false,
  showAnonymous = false,
  defaultAnonymous = false,
  submitLabel = '발행하기',
  onClose,
  onDraftSaved,
  className,
  minHeight = '200px',
  isSubmitting = false,
}: MeditationEditorProps) {
  const { toast } = useToast();

  // 상태
  const [content, setContent] = useState(initialContent);
  const [authorName, setAuthorName] = useState(initialAuthorName);
  const [dayNumber, setDayNumber] = useState<number | null>(initialDayNumber);
  const [isAnonymous, setIsAnonymous] = useState(defaultAnonymous);
  const [showVerses, setShowVerses] = useState(false); // 기본 접힌 상태
  const [showDraftRestore, setShowDraftRestore] = useState(false);
  const [attachedLinks, setAttachedLinks] = useState<string[]>([]);
  const [showLinks, setShowLinks] = useState(true);

  // 구절 삽입 관련 상태
  const [insertContent, setInsertContent] = useState<string>('');
  // 이미지 삽입 상태
  const [insertImage, setInsertImage] = useState<string>('');
  // 마지막으로 삽입한 구절 ID 추적 (중복 삽입 방지)
  const lastInsertedVerseRef = useRef<string | null>(null);
  const prevVersesLengthRef = useRef(selectedVerses.length);

  // 콘텐츠에서 링크 감지 (디바운스 적용)
  // HTML에서 직접 추출하여 href 속성도 감지하고, 플레인 텍스트에서도 추출
  const detectedLinks = useMemo(() => {
    const plainText = htmlToPlainText(content);
    const fromPlainText = extractUrls(plainText);
    const fromHtml = extractUrls(content); // HTML에서도 추출 (href 속성 포함)
    return Array.from(new Set([...fromPlainText, ...fromHtml]));
  }, [content]);

  // 새로운 링크 감지 시 자동 추가
  useEffect(() => {
    if (detectedLinks.length > 0) {
      setAttachedLinks(prev => {
        const newLinks = detectedLinks.filter(link => !prev.includes(link));
        if (newLinks.length > 0) {
          return [...prev, ...newLinks];
        }
        return prev;
      });
    }
  }, [detectedLinks]);

  // 링크 제거 핸들러
  const handleRemoveLink = useCallback((url: string) => {
    setAttachedLinks(prev => prev.filter(link => link !== url));
  }, []);

  // 다중 임시저장
  const {
    drafts,
    activeDraftId,
    hasDrafts,
    lastSaved,
    updateActiveDraft,
    selectDraft,
    deleteDraft,
    clearActiveDraft,
    startNewDraft,
  } = useMultiDraft({
    context,
    identifier,
    debounceMs: 2000,
    enabled: true,
  });

  // 구절 범위 텍스트 생성
  const getBibleRange = useCallback(() => {
    if (selectedVerses.length === 0) return '';

    const verse = selectedVerses[0];
    if (selectedVerses.length === 1) {
      if (verse.startVerse === verse.endVerse) {
        return `${verse.book} ${verse.chapter}:${verse.startVerse}`;
      }
      return `${verse.book} ${verse.chapter}:${verse.startVerse}-${verse.endVerse}`;
    }

    // 여러 구절 선택 시
    return selectedVerses
      .map(v => {
        if (v.startVerse === v.endVerse) {
          return `${v.book} ${v.chapter}:${v.startVerse}`;
        }
        return `${v.book} ${v.chapter}:${v.startVerse}-${v.endVerse}`;
      })
      .join(', ');
  }, [selectedVerses]);

  // 드래프트 복원 여부 확인
  useEffect(() => {
    if (hasDrafts && !initialContent) {
      setShowDraftRestore(true);
    }
  }, [hasDrafts, initialContent]);

  // 콘텐츠 변경 시 자동 저장
  useEffect(() => {
    if (content || authorName) {
      updateActiveDraft({
        content,
        guestName: authorName,
        bibleRange: getBibleRange(),
      });
      onDraftSaved?.();
    }
  }, [content, authorName, updateActiveDraft, onDraftSaved, getBibleRange]);

  // 드래프트 선택 핸들러
  const handleSelectDraft = useCallback((id: string) => {
    const draft = selectDraft(id);
    if (draft) {
      setContent(draft.content || '');
      setAuthorName(draft.guestName || '');
      toast({
        variant: 'success',
        title: '임시저장된 내용을 불러왔습니다',
      });
    }
    setShowDraftRestore(false);
  }, [selectDraft, toast]);

  // 드래프트 복원 (가장 최근 것)
  const handleRestoreDraft = useCallback(() => {
    if (drafts.length > 0) {
      const mostRecent = drafts.reduce((a, b) =>
        new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
      );
      handleSelectDraft(mostRecent.id);
    }
    setShowDraftRestore(false);
  }, [drafts, handleSelectDraft]);

  // 드래프트 무시 (새로 작성)
  const handleIgnoreDraft = useCallback(() => {
    startNewDraft();
    setShowDraftRestore(false);
  }, [startNewDraft]);

  // 새 드래프트 시작
  const handleNewDraft = useCallback(() => {
    startNewDraft();
    setContent('');
    setAuthorName(initialAuthorName);
    setAttachedLinks([]);
  }, [startNewDraft, initialAuthorName]);

  // 구절이 새로 추가되면 에디터에 자동 삽입
  useEffect(() => {
    if (selectedVerses.length > prevVersesLengthRef.current) {
      // 새로 추가된 구절 (마지막 구절)
      const newVerse = selectedVerses[selectedVerses.length - 1];
      const verseRange = newVerse.startVerse === newVerse.endVerse
        ? `${newVerse.book} ${newVerse.chapter}:${newVerse.startVerse}`
        : `${newVerse.book} ${newVerse.chapter}:${newVerse.startVerse}-${newVerse.endVerse}`;

      // 중복 삽입 방지: 같은 구절 ID인지 확인
      const verseId = `${newVerse.book}-${newVerse.chapter}-${newVerse.startVerse}-${newVerse.endVerse}`;
      if (lastInsertedVerseRef.current !== verseId) {
        // blockquote 형태로 삽입할 HTML 생성
        const htmlToInsert = `<blockquote><strong>${verseRange}</strong><br/>${newVerse.text}</blockquote><p></p>`;
        setInsertContent(htmlToInsert);
        lastInsertedVerseRef.current = verseId;
      }
    }
    prevVersesLengthRef.current = selectedVerses.length;
  }, [selectedVerses]);

  // 삽입 완료 후 상태 초기화
  const handleInsertComplete = useCallback(() => {
    setInsertContent('');
  }, []);

  // 이미지 삽입 완료 후 상태 초기화
  const handleInsertImageComplete = useCallback(() => {
    setInsertImage('');
  }, []);

  // 외부에서 카드 이미지가 전달되면 삽입
  useEffect(() => {
    if (cardImageToInsert) {
      setInsertImage(cardImageToInsert);
      onCardImageInserted?.();
    }
  }, [cardImageToInsert, onCardImageInserted]);

  // 발행
  const handleSubmit = async () => {
    if (isEmptyContent(content)) {
      toast({
        variant: 'error',
        title: '묵상 내용을 입력해주세요',
      });
      return;
    }

    try {
      await onSubmit({
        content,
        authorName: authorName.trim() || undefined,
        bibleRange: getBibleRange(),
        selectedVerses,
        attachedLinks: attachedLinks.length > 0 ? attachedLinks : undefined,
        isAnonymous,
        dayNumber,
      });

      // 성공 시 초기화
      setContent('');
      setAttachedLinks([]);
      clearActiveDraft();
    } catch (error) {
      // 에러는 부모에서 처리
      console.error('Submit error:', error);
    }
  };

  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      {/* 드래프트 복원 알림 */}
      {showDraftRestore && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-3">
          <p className="text-sm text-foreground mb-2">
            작성 중이던 묵상이 있습니다. 복원하시겠습니까?
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleRestoreDraft}>
              복원하기
            </Button>
            <Button size="sm" variant="outline" onClick={handleIgnoreDraft}>
              새로 작성
            </Button>
          </div>
        </div>
      )}

      {/* 선택된 구절 - 기본 접힌 상태, 1개만 미리보기 */}
      {selectedVerses.length > 0 && (
        <div className="flex-shrink-0 mb-3">
          <button
            onClick={() => setShowVerses(!showVerses)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <BookOpen className="w-4 h-4" />
            <span>선택한 구절 ({selectedVerses.length})</span>
            {showVerses ? (
              <ChevronUp className="w-4 h-4 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto" />
            )}
          </button>

          {/* 접힌 상태: 첫 번째 구절만 간략히 표시 */}
          {!showVerses && selectedVerses.length > 0 && (
            <div className="mt-2 bg-muted/50 rounded-lg p-2 text-xs text-muted-foreground">
              <span className="font-medium text-primary">
                {selectedVerses[0].book} {selectedVerses[0].chapter}:
                {selectedVerses[0].startVerse === selectedVerses[0].endVerse
                  ? selectedVerses[0].startVerse
                  : `${selectedVerses[0].startVerse}-${selectedVerses[0].endVerse}`}
              </span>
              <span className="ml-2 line-clamp-1">{selectedVerses[0].text.slice(0, 50)}...</span>
              {selectedVerses.length > 1 && (
                <span className="ml-1 text-primary">외 {selectedVerses.length - 1}개</span>
              )}
            </div>
          )}

          {/* 펼친 상태: 모든 구절 표시 */}
          {showVerses && (
            <div className="mt-2 space-y-2 max-h-[25vh] overflow-y-auto scrollbar-hide">
              {selectedVerses.map((verse, index) => (
                <div
                  key={index}
                  className="bg-muted/50 rounded-lg p-3 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-primary mb-1">
                        {verse.book} {verse.chapter}:
                        {verse.startVerse === verse.endVerse
                          ? verse.startVerse
                          : `${verse.startVerse}-${verse.endVerse}`}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {verse.text}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {showCardButton && onCreateCard && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => onCreateCard(verse)}
                          title="말씀 카드 만들기"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {onRemoveVerse && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveVerse(index)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {onClearVerses && selectedVerses.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={onClearVerses}
                >
                  모두 지우기
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 작성자 이름 (교회 컨텍스트) */}
      {context !== 'bible_reader' && (
        <div className="mb-3">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="이름을 입력하세요"
            className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}

      {/* 통독일정 선택 */}
      {showDayPicker && (
        <div className="mb-3">
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
            통독일정 <span className="font-normal">(선택)</span>
          </label>
          <ReadingDayPicker
            value={dayNumber}
            onChange={setDayNumber}
            placeholder="통독일정을 선택하세요"
          />
        </div>
      )}

      {/* 에디터 - flex-1로 남은 공간 채우고 스크롤 가능, 스크롤바 숨김 */}
      <div className="flex-1 min-h-[150px] overflow-y-auto scrollbar-hide">
        <RichEditor
          content={content}
          onChange={setContent}
          placeholder="묵상 내용을 작성해주세요..."
          minHeight={minHeight}
          className="h-full"
          insertContent={insertContent}
          onInsertComplete={handleInsertComplete}
          insertImage={insertImage}
          onInsertImageComplete={handleInsertImageComplete}
        />
      </div>

      {/* 첨부된 링크 미리보기 */}
      {attachedLinks.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowLinks(!showLinks)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full mb-2"
          >
            <Link2 className="w-4 h-4" />
            <span>첨부된 링크 ({attachedLinks.length})</span>
            {showLinks ? (
              <ChevronUp className="w-4 h-4 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto" />
            )}
          </button>

          {showLinks && (
            <LinkPreviewList
              urls={attachedLinks}
              onRemove={handleRemoveLink}
              compact={attachedLinks.length > 2}
              maxDisplay={3}
            />
          )}
        </div>
      )}

      {/* 하단 툴바 - 항상 표시 */}
      <div className="flex-shrink-0 mt-3 pt-3 border-t flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* 익명 옵션 */}
          {showAnonymous && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-input"
              />
              <span className="text-muted-foreground">익명</span>
            </label>
          )}

          {/* 임시저장 드롭다운 */}
          <DraftDropdown
            drafts={drafts}
            activeDraftId={activeDraftId}
            lastSaved={lastSaved}
            onSelectDraft={handleSelectDraft}
            onDeleteDraft={deleteDraft}
            onNewDraft={handleNewDraft}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* 카드 만들기 버튼 (구절 선택 시) */}
          {showCardButton && selectedVerses.length > 0 && onCreateCard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCreateCard(selectedVerses[0])}
              className="gap-1"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">카드</span>
            </Button>
          )}

          {/* 닫기 버튼 */}
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              닫기
            </Button>
          )}

          {/* 발행 버튼 */}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || isEmptyContent(content)}
            className="gap-1"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
