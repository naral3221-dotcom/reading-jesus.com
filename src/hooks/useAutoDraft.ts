'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// 임시저장 데이터 타입
export interface DraftData {
  content: string;
  bibleRange?: string;
  guestName?: string;
  updatedAt: string;
}

// 저장소 키 생성
function getDraftKey(context: string, identifier?: string): string {
  const base = `reading_jesus_draft_${context}`;
  return identifier ? `${base}_${identifier}` : base;
}

// localStorage 헬퍼
function loadDraft(key: string): DraftData | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveDraft(key: string, data: DraftData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({
      ...data,
      updatedAt: new Date().toISOString(),
    }));
  } catch {
    // localStorage 용량 초과 등의 에러 무시
  }
}

function deleteDraft(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // 에러 무시
  }
}

interface UseAutoDraftOptions {
  /** 컨텍스트 식별자 (예: 'church_sharing', 'church_bible', 'community') */
  context: string;
  /** 추가 식별자 (예: churchCode, groupId) */
  identifier?: string;
  /** 자동 저장 딜레이 (ms), 기본 2초 */
  debounceMs?: number;
  /** 자동 저장 활성화 여부 */
  enabled?: boolean;
}

interface UseAutoDraftReturn {
  /** 저장된 임시저장 데이터 */
  draft: DraftData | null;
  /** 임시저장 데이터 존재 여부 */
  hasDraft: boolean;
  /** 마지막 자동 저장 시간 */
  lastSaved: Date | null;
  /** 저장 중 여부 */
  isSaving: boolean;
  /** 임시저장 데이터 업데이트 (자동 저장 트리거) */
  updateDraft: (data: Partial<DraftData>) => void;
  /** 임시저장 즉시 저장 */
  saveDraftNow: () => void;
  /** 임시저장 불러오기 */
  loadDraft: () => DraftData | null;
  /** 임시저장 삭제 */
  clearDraft: () => void;
  /** 임시저장 복원 (draft 데이터 반환 후 삭제) */
  restoreDraft: () => DraftData | null;
}

/**
 * 자동 임시저장 훅
 *
 * 사용 예:
 * ```tsx
 * const { draft, hasDraft, updateDraft, clearDraft, restoreDraft } = useAutoDraft({
 *   context: 'church_sharing',
 *   identifier: churchCode,
 * });
 *
 * // 폼 입력 시
 * useEffect(() => {
 *   updateDraft({ content, bibleRange, guestName });
 * }, [content, bibleRange, guestName]);
 *
 * // 복원
 * if (hasDraft) {
 *   const restored = restoreDraft();
 *   setContent(restored.content);
 * }
 * ```
 */
export function useAutoDraft({
  context,
  identifier,
  debounceMs = 2000,
  enabled = true,
}: UseAutoDraftOptions): UseAutoDraftReturn {
  const storageKey = getDraftKey(context, identifier);

  const [draft, setDraft] = useState<DraftData | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const pendingDataRef = useRef<DraftData | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 초기 로드
  useEffect(() => {
    const savedDraft = loadDraft(storageKey);
    setDraft(savedDraft);
    if (savedDraft?.updatedAt) {
      setLastSaved(new Date(savedDraft.updatedAt));
    }
  }, [storageKey]);

  // 저장 실행
  const executeSave = useCallback(() => {
    if (!pendingDataRef.current || !enabled) return;

    setIsSaving(true);
    saveDraft(storageKey, pendingDataRef.current);
    setDraft(pendingDataRef.current);
    setLastSaved(new Date());
    setIsSaving(false);
  }, [storageKey, enabled]);

  // 디바운스된 업데이트
  const updateDraft = useCallback((data: Partial<DraftData>) => {
    if (!enabled) return;

    // 빈 콘텐츠면 저장하지 않음
    const content = data.content ?? pendingDataRef.current?.content ?? '';
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return;

    pendingDataRef.current = {
      content: data.content ?? pendingDataRef.current?.content ?? '',
      bibleRange: data.bibleRange ?? pendingDataRef.current?.bibleRange,
      guestName: data.guestName ?? pendingDataRef.current?.guestName,
      updatedAt: new Date().toISOString(),
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
  }, [enabled, debounceMs, executeSave]);

  // 즉시 저장
  const saveDraftNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    executeSave();
  }, [executeSave]);

  // 불러오기
  const loadDraftCallback = useCallback((): DraftData | null => {
    return loadDraft(storageKey);
  }, [storageKey]);

  // 삭제
  const clearDraft = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    deleteDraft(storageKey);
    setDraft(null);
    setLastSaved(null);
    pendingDataRef.current = null;
  }, [storageKey]);

  // 복원 (불러온 후 삭제)
  const restoreDraft = useCallback((): DraftData | null => {
    const savedDraft = loadDraft(storageKey);
    if (savedDraft) {
      deleteDraft(storageKey);
      setDraft(null);
      setLastSaved(null);
      pendingDataRef.current = null;
    }
    return savedDraft;
  }, [storageKey]);

  // 언마운트 시 대기 중인 저장 실행
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // 대기 중인 데이터가 있으면 저장
        if (pendingDataRef.current && enabled) {
          saveDraft(storageKey, pendingDataRef.current);
        }
      }
    };
  }, [storageKey, enabled]);

  return {
    draft,
    hasDraft: draft !== null && draft.content.replace(/<[^>]*>/g, '').trim().length > 0,
    lastSaved,
    isSaving,
    updateDraft,
    saveDraftNow,
    loadDraft: loadDraftCallback,
    clearDraft,
    restoreDraft,
  };
}

/**
 * 임시저장 시간 포맷팅
 */
export function formatDraftTime(date: Date | null): string {
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 10) return '방금 저장됨';
  if (diffSec < 60) return `${diffSec}초 전 저장됨`;
  if (diffMin < 60) return `${diffMin}분 전 저장됨`;

  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) + ' 저장됨';
}
