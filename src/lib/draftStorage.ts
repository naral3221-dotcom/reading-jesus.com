import {
  LoadDraftsFromServer,
  SaveDraftToServer,
  DeleteDraftFromServer,
} from '@/application/use-cases/draft'
import type { Draft } from '@/types'

const DRAFT_STORAGE_KEY = 'reading_jesus_drafts'

// Use Case 인스턴스
const loadDraftsFromServerUseCase = new LoadDraftsFromServer()
const saveDraftToServerUseCase = new SaveDraftToServer()
const deleteDraftFromServerUseCase = new DeleteDraftFromServer()

// ============================================
// localStorage 관련 함수들
// ============================================

/**
 * 모든 로컬 드래프트 가져오기
 */
export function getAllDraftsLocal(): Draft[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(DRAFT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * 특정 그룹의 드래프트만 가져오기
 */
export function getDraftsLocalByGroup(groupId: string): Draft[] {
  const allDrafts = getAllDraftsLocal();
  return allDrafts.filter(d => d.group_id === groupId);
}

/**
 * 특정 드래프트 가져오기
 */
export function getDraftLocal(id: string): Draft | null {
  const allDrafts = getAllDraftsLocal();
  return allDrafts.find(d => d.id === id) || null;
}

/**
 * 드래프트 저장 (생성 또는 업데이트)
 */
export function saveDraftLocal(draft: Draft): void {
  if (typeof window === 'undefined') return;

  const allDrafts = getAllDraftsLocal();
  const existingIndex = allDrafts.findIndex(d => d.id === draft.id);

  const updatedDraft = {
    ...draft,
    updated_at: new Date().toISOString(),
    synced: false, // 변경되었으므로 미동기화 상태
  };

  if (existingIndex >= 0) {
    allDrafts[existingIndex] = updatedDraft;
  } else {
    allDrafts.push({
      ...updatedDraft,
      created_at: new Date().toISOString(),
    });
  }

  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(allDrafts));
}

/**
 * 드래프트 삭제
 */
export function deleteDraftLocal(id: string): void {
  if (typeof window === 'undefined') return;

  const allDrafts = getAllDraftsLocal();
  const filtered = allDrafts.filter(d => d.id !== id);
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * 새 드래프트 ID 생성
 */
export function generateDraftId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 새 빈 드래프트 생성
 */
export function createEmptyDraft(userId: string, groupId: string, dayNumber: number): Draft {
  const now = new Date().toISOString();
  return {
    id: generateDraftId(),
    user_id: userId,
    group_id: groupId,
    day_number: dayNumber,
    content: '',
    is_rich_editor: false,
    created_at: now,
    updated_at: now,
    synced: false,
  };
}

// ============================================
// Supabase 관련 함수들 (Use Case 위임)
// ============================================

/**
 * 서버에서 드래프트 목록 가져오기
 */
export async function loadDraftsFromServer(userId: string, groupId: string): Promise<Draft[]> {
  try {
    return await loadDraftsFromServerUseCase.execute(userId, groupId)
  } catch {
    return []
  }
}

/**
 * 드래프트를 서버에 저장
 */
export async function saveDraftToServer(draft: Draft): Promise<boolean> {
  try {
    const success = await saveDraftToServerUseCase.execute(draft)

    if (success) {
      // 로컬에서도 동기화 상태 업데이트
      const allDrafts = getAllDraftsLocal()
      const idx = allDrafts.findIndex(d => d.id === draft.id)
      if (idx >= 0) {
        allDrafts[idx].synced = true
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(allDrafts))
      }
    }

    return success
  } catch {
    return false
  }
}

/**
 * 서버에서 드래프트 삭제
 */
export async function deleteDraftFromServer(id: string): Promise<boolean> {
  try {
    return await deleteDraftFromServerUseCase.execute(id)
  } catch {
    return false
  }
}

/**
 * 미동기화된 로컬 드래프트들을 서버에 동기화
 */
export async function syncDraftsToServer(): Promise<number> {
  const allDrafts = getAllDraftsLocal();
  const unsyncedDrafts = allDrafts.filter(d => !d.synced && d.content.trim());

  let syncedCount = 0;

  for (const draft of unsyncedDrafts) {
    const success = await saveDraftToServer(draft);
    if (success) syncedCount++;
  }

  return syncedCount;
}

/**
 * 서버와 로컬 드래프트 병합 (서버 우선)
 */
export async function mergeDraftsWithServer(userId: string, groupId: string): Promise<Draft[]> {
  const localDrafts = getDraftsLocalByGroup(groupId);
  const serverDrafts = await loadDraftsFromServer(userId, groupId);

  // 서버 드래프트 ID 맵
  const serverDraftMap = new Map(serverDrafts.map(d => [d.id, d]));

  // 결과 배열: 서버 드래프트 우선
  const merged: Draft[] = [...serverDrafts];

  // 로컬에만 있는 드래프트 추가
  for (const local of localDrafts) {
    if (!serverDraftMap.has(local.id)) {
      merged.push(local);
    }
  }

  // 로컬 스토리지 업데이트
  const allLocalDrafts = getAllDraftsLocal();
  const otherGroupDrafts = allLocalDrafts.filter(d => d.group_id !== groupId);
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify([...otherGroupDrafts, ...merged]));

  return merged.sort((a, b) =>
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

// ============================================
// 유틸리티 함수들
// ============================================

/**
 * 드래프트 미리보기 텍스트 생성 (최대 50자)
 */
export function getDraftPreview(draft: Draft): string {
  if (!draft.content) return '빈 묵상';

  // HTML 태그 제거
  const plainText = draft.content
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  if (!plainText) return '빈 묵상';

  return plainText.length > 50
    ? plainText.substring(0, 50) + '...'
    : plainText;
}

/**
 * 드래프트 제목 생성 (Day + 날짜)
 */
export function getDraftTitle(draft: Draft): string {
  if (draft.title) return draft.title;

  const date = new Date(draft.created_at);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
  return `Day ${draft.day_number} 묵상 (${dateStr})`;
}

/**
 * 자동 저장용 디바운스 훅을 위한 타이머
 */
let autoSaveTimer: NodeJS.Timeout | null = null;

export function scheduleAutoSave(draft: Draft, delayMs: number = 3000): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  autoSaveTimer = setTimeout(() => {
    saveDraftLocal(draft);
    autoSaveTimer = null;
  }, delayMs);
}

export function cancelAutoSave(): void {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
}
