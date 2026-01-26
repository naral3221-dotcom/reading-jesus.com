// Unsplash API 유틸리티
// API 키: https://unsplash.com/developers 에서 무료 발급

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    username: string;
  };
  color: string;
  blur_hash: string;
}

export interface SearchResult {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

// 말씀 카드용 추천 검색어
export const VERSE_CARD_CATEGORIES = [
  { label: '자연', query: 'nature landscape', icon: '🌿' },
  { label: '하늘', query: 'sky clouds sunrise', icon: '☁️' },
  { label: '바다', query: 'ocean sea waves', icon: '🌊' },
  { label: '산', query: 'mountain peak', icon: '⛰️' },
  { label: '꽃', query: 'flowers bloom', icon: '🌸' },
  { label: '빛', query: 'light rays sunlight', icon: '✨' },
  { label: '길', query: 'path road journey', icon: '🛤️' },
  { label: '숲', query: 'forest trees woods', icon: '🌲' },
];

// 랜덤 이미지 가져오기 (특정 주제)
export async function getRandomPhoto(query: string = 'nature'): Promise<UnsplashPhoto | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API 키가 설정되지 않았습니다.');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=portrait&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Unsplash 이미지 로드 실패:', error);
    return null;
  }
}

// 이미지 검색
export async function searchPhotos(
  query: string,
  page: number = 1,
  perPage: number = 12
): Promise<SearchResult | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API 키가 설정되지 않았습니다.');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=portrait&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Unsplash 검색 실패:', error);
    return null;
  }
}

// 기본 그라데이션 배경 (API 키 없을 때 폴백)
export const FALLBACK_GRADIENTS = [
  { id: 'gradient-1', colors: ['#667eea', '#764ba2'], name: '보라빛 하늘' },
  { id: 'gradient-2', colors: ['#f093fb', '#f5576c'], name: '핑크 노을' },
  { id: 'gradient-3', colors: ['#4facfe', '#00f2fe'], name: '맑은 바다' },
  { id: 'gradient-4', colors: ['#43e97b', '#38f9d7'], name: '초록 숲' },
  { id: 'gradient-5', colors: ['#fa709a', '#fee140'], name: '따뜻한 아침' },
  { id: 'gradient-6', colors: ['#a8edea', '#fed6e3'], name: '부드러운 봄' },
  { id: 'gradient-7', colors: ['#d299c2', '#fef9d7'], name: '라벤더 들판' },
  { id: 'gradient-8', colors: ['#89f7fe', '#66a6ff'], name: '청명한 하늘' },
  { id: 'gradient-9', colors: ['#ffecd2', '#fcb69f'], name: '복숭아빛' },
  { id: 'gradient-10', colors: ['#a1c4fd', '#c2e9fb'], name: '새벽녘' },
];

// CSS 그라데이션 생성
export function createGradientStyle(colors: string[]): string {
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
}
