'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// 임시저장 데이터 타입
export interface DraftData {
  id: string;
  content: string;
  bibleRange?: string;
  guestName?: string;
  createdAt: string;
  updatedAt: string;
  // 미리보기용 제목 (첫 줄 또는 처음 30자)
  preview: string;
}

// 최대 임시저장 개수
const MAX_DRAFTS = 3;

// 저장소 키 생성
function getDraftKey(context: string, identifier?: string): string {
  const base = `reading_jesus_multi_draft_${context}`;
  return identifier ? `${base}_${identifier}` : base;
}

// ID 생성
function generateDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 미리보기 텍스트 생성
function generatePreview(content: string): string {
  // HTML 태그 제거
  const plainText = content.replace(/<[^>]*>/g, '').trim();
  // 첫 30자 또는 첫 줄
  const firstLine = plainText.split('\n')[0] || '';
  return firstLine.substring(0, 30) + (firstLine.length > 30 ? '...' : '');
}

// localStorage 헬퍼
function loadDrafts(key: string): DraftData[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveDrafts(key: string, drafts: DraftData[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(drafts));
  } catch {
    // localStorage 용량 초과 등의 에러 무시
  }
}

interface UseMultiDraftOptions {
  /** 컨텍스트 식별자 (예: 'church_sharing', 'church_bible', 'community') */
  context: string;
  /** 추가 식별자 (예: churchCode, groupId) */
  identifier?: string;
  /** 자동 저장 딜레이 (ms), 기본 2초 */
  debounceMs?: number;
  /** 자동 저장 활성화 여부 */
  enabled?: boolean;
}

interface UseMultiDraftReturn {
  /** 저장된 임시저장 목록 */
  drafts: DraftData[];
  /** 현재 활성화된 드래프트 ID */
  activeDraftId: string | null;
  /** 임시저장 데이터 존재 여부 */
  hasDrafts: boolean;
  /** 마지막 자동 저장 시간 */
  lastSaved: Date | null;
  /** 저장 중 여부 */
  isSaving: boolean;
  /** 현재 내용을 새 드래프트로 저장 */
  saveAsNewDraft: (data: Omit<DraftData, 'id' | 'createdAt' | 'updatedAt' | 'preview'>) => void;
  /** 현재 드래프트 업데이트 (자동 저장용) */
  updateActiveDraft: (data: Partial<Pick<DraftData, 'content' | 'bibleRange' | 'guestName'>>) => void;
  /** 드래프트 선택 (불러오기) */
  selectDraft: (id: string) => DraftData | null;
  /** 드래프트 삭제 */
  deleteDraft: (id: string) => void;
  /** 모든 드래프트 삭제 */
  clearAllDrafts: () => void;
  /** 활성 드래프트 초기화 (발행 완료 시) */
  clearActiveDraft: () => void;
  /** 새 드래프트 시작 */
  startNewDraft: () => void;
}

/**
 * 다중 임시저장 훅
 *
 * 사용 예:
 * ```tsx
 * const {
 *   drafts,
 *   hasDrafts,
 *   lastSaved,
 *   saveAsNewDraft,
 *   updateActiveDraft,
 *   selectDraft,
 *   deleteDraft,
 *   clearActiveDraft,
 * } = useMultiDraft({
 *   context: 'church_sharing',
 *   identifier: churchCode,
 * });
 * ```
 */
export function useMultiDraft({
  context,
  identifier,
  debounceMs = 2000,
  enabled = true,
}: UseMultiDraftOptions): UseMultiDraftReturn {
  const storageKey = getDraftKey(context, identifier);

  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pendingDataRef = useRef<Partial<Pick<DraftData, 'content' | 'bibleRange' | 'guestName'>> | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 초기 로드
  useEffect(() => {
    const savedDrafts = loadDrafts(storageKey);
    setDrafts(savedDrafts);

    // 가장 최근 드래프트를 활성화
    if (savedDrafts.length > 0) {
      const mostRecent = savedDrafts.reduce((a, b) =>
        new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b
      );
      setActiveDraftId(mostRecent.id);
      setLastSaved(new Date(mostRecent.updatedAt));
    }
  }, [storageKey]);

  // 저장 실행
  const executeSave = useCallback(() => {
    if (!pendingDataRef.current || !enabled || !activeDraftId) return;

    setIsSaving(true);

    setDrafts(prevDrafts => {
      const now = new Date().toISOString();
      const updatedDrafts = prevDrafts.map(draft => {
        if (draft.id === activeDraftId) {
          const newContent = pendingDataRef.current?.content ?? draft.content;
          return {
            ...draft,
            content: newContent,
            bibleRange: pendingDataRef.current?.bibleRange ?? draft.bibleRange,
            guestName: pendingDataRef.current?.guestName ?? draft.guestName,
            updatedAt: now,
            preview: generatePreview(newContent),
          };
        }
        return draft;
      });

      saveDrafts(storageKey, updatedDrafts);
      return updatedDrafts;
    });

    setLastSaved(new Date());
    setIsSaving(false);
  }, [storageKey, enabled, activeDraftId]);

  // 디바운스된 업데이트
  const updateActiveDraft = useCallback((data: Partial<Pick<DraftData, 'content' | 'bibleRange' | 'guestName'>>) => {
    if (!enabled) return;

    // 빈 콘텐츠면 저장하지 않음
    const content = data.content ?? pendingDataRef.current?.content ?? '';
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return;

    // 활성 드래프트가 없으면 새로 생성
    if (!activeDraftId) {
      saveAsNewDraft({
        content: data.content || '',
        bibleRange: data.bibleRange,
        guestName: data.guestName,
      });
      return;
    }

    pendingDataRef.current = {
      ...pendingDataRef.current,
      ...data,
    };

    // 기존 타이머 취소
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 새 타이머 설정
    timerRef.current = setTimeout(() => {
      executeSave();
      timerRef.current = null;
    }, debounceMs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, debounceMs, executeSave, activeDraftId]);

  // 새 드래프트로 저장
  const saveAsNewDraft = useCallback((data: Omit<DraftData, 'id' | 'createdAt' | 'updatedAt' | 'preview'>) => {
    const content = data.content || '';
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return;

    const now = new Date().toISOString();
    const newDraft: DraftData = {
      id: generateDraftId(),
      content: data.content,
      bibleRange: data.bibleRange,
      guestName: data.guestName,
      createdAt: now,
      updatedAt: now,
      preview: generatePreview(content),
    };

    setDrafts(prevDrafts => {
      let updatedDrafts = [...prevDrafts, newDraft];

      // 최대 개수 초과 시 가장 오래된 것 삭제
      if (updatedDrafts.length > MAX_DRAFTS) {
        updatedDrafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        updatedDrafts = updatedDrafts.slice(0, MAX_DRAFTS);
      }

      saveDrafts(storageKey, updatedDrafts);
      return updatedDrafts;
    });

    setActiveDraftId(newDraft.id);
    setLastSaved(new Date());
  }, [storageKey]);

  // 드래프트 선택
  const selectDraft = useCallback((id: string): DraftData | null => {
    const draft = drafts.find(d => d.id === id);
    if (draft) {
      setActiveDraftId(id);
      pendingDataRef.current = null;
    }
    return draft ?? null;
  }, [drafts]);

  // 드래프트 삭제
  const deleteDraft = useCallback((id: string) => {
    setDrafts(prevDrafts => {
      const updatedDrafts = prevDrafts.filter(d => d.id !== id);
      saveDrafts(storageKey, updatedDrafts);
      return updatedDrafts;
    });

    if (activeDraftId === id) {
      setActiveDraftId(null);
      pendingDataRef.current = null;
    }
  }, [storageKey, activeDraftId]);

  // 모든 드래프트 삭제
  const clearAllDrafts = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    saveDrafts(storageKey, []);
    setDrafts([]);
    setActiveDraftId(null);
    setLastSaved(null);
    pendingDataRef.current = null;
  }, [storageKey]);

  // 활성 드래프트만 삭제 (발행 완료 시)
  const clearActiveDraft = useCallback(() => {
    if (activeDraftId) {
      deleteDraft(activeDraftId);
    }
    pendingDataRef.current = null;
  }, [activeDraftId, deleteDraft]);

  // 새 드래프트 시작
  const startNewDraft = useCallback(() => {
    setActiveDraftId(null);
    pendingDataRef.current = null;
  }, []);

  // 언마운트 시 대기 중인 저장 실행
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        if (pendingDataRef.current && enabled && activeDraftId) {
          // 동기적으로 저장
          const savedDrafts = loadDrafts(storageKey);
          const now = new Date().toISOString();
          const updatedDrafts = savedDrafts.map(draft => {
            if (draft.id === activeDraftId) {
              const newContent = pendingDataRef.current?.content ?? draft.content;
              return {
                ...draft,
                content: newContent,
                bibleRange: pendingDataRef.current?.bibleRange ?? draft.bibleRange,
                guestName: pendingDataRef.current?.guestName ?? draft.guestName,
                updatedAt: now,
                preview: generatePreview(newContent),
              };
            }
            return draft;
          });
          saveDrafts(storageKey, updatedDrafts);
        }
      }
    };
  }, [storageKey, enabled, activeDraftId]);

  return {
    drafts,
    activeDraftId,
    hasDrafts: drafts.length > 0,
    lastSaved,
    isSaving,
    saveAsNewDraft,
    updateActiveDraft,
    selectDraft,
    deleteDraft,
    clearAllDrafts,
    clearActiveDraft,
    startNewDraft,
  };
}

/**
 * 임시저장 시간 포맷팅
 */
export function formatDraftTime(dateStr: string | Date | null): string {
  if (!dateStr) return '';

  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return '방금 전';
  if (diffSec < 60) return `${diffSec}초 전`;
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
