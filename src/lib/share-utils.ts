/**
 * 공유 기능 유틸리티
 */

export interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Web Share API 사용 가능 여부 확인
 */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Web Share API로 공유 시도, 실패 시 클립보드 복사
 */
export async function shareOrCopy(
  data: ShareData,
  onSuccess?: (method: 'share' | 'clipboard') => void,
  onError?: (error: Error) => void
): Promise<boolean> {
  // Web Share API 시도
  if (canShare()) {
    try {
      await navigator.share(data);
      onSuccess?.('share');
      return true;
    } catch (error) {
      // 사용자가 취소한 경우 무시
      if ((error as Error).name === 'AbortError') {
        return false;
      }
      // 다른 에러는 클립보드 폴백으로 진행
    }
  }

  // 폴백: 클립보드 복사
  try {
    await navigator.clipboard.writeText(data.url);
    onSuccess?.('clipboard');
    return true;
  } catch (error) {
    onError?.(error as Error);
    return false;
  }
}

/**
 * 피드 아이템 공유 URL 생성
 */
export function getFeedItemShareUrl(params: {
  type: 'qt' | 'meditation';
  id: string;
  churchCode?: string;
  qtDate?: string;
}): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // QT 타입이고 qtDate가 있으면 교회 QT 페이지로
  if (params.type === 'qt' && params.qtDate && params.churchCode) {
    return `${baseUrl}/church/${params.churchCode}/qt/${params.qtDate}`;
  }

  // 교회 나눔 페이지의 특정 게시물 (쿼리 파라미터 방식)
  if (params.churchCode) {
    return `${baseUrl}/church/${params.churchCode}/sharing?post=${params.id}`;
  }

  // 전역 피드 게시물
  return `${baseUrl}/feed?post=${params.id}`;
}

/**
 * 피드 아이템 공유 데이터 생성
 */
export function getFeedShareData(
  item: {
    type: 'qt' | 'meditation';
    authorName: string;
    content?: string | null;
    mySentence?: string | null;
    isAnonymous: boolean;
  },
  url: string
): ShareData {
  const author = item.isAnonymous ? '익명' : item.authorName;
  const typeLabel = item.type === 'qt' ? 'QT' : '묵상';

  const previewText =
    item.type === 'qt'
      ? item.mySentence?.slice(0, 100) || ''
      : item.content?.replace(/<[^>]*>/g, '').slice(0, 100) || '';

  return {
    title: `${author}님의 ${typeLabel} 나눔`,
    text: previewText,
    url,
  };
}
