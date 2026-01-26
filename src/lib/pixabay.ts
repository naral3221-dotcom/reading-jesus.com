// Pixabay API 유틸리티
// API 키: https://pixabay.com/api/docs/ 에서 무료 발급
// 환경 변수 설정 필요: NEXT_PUBLIC_PIXABAY_API_KEY

const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;

export interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  fullHDURL?: string;
  imageURL?: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

export interface PixabaySearchResult {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}

// Pixabay API 카테고리 (실제 지원 카테고리)
export type PixabayCategory =
  | 'backgrounds' | 'fashion' | 'nature' | 'science' | 'education'
  | 'feelings' | 'health' | 'people' | 'religion' | 'places'
  | 'animals' | 'industry' | 'computer' | 'food' | 'sports'
  | 'transportation' | 'travel' | 'buildings' | 'business' | 'music';

// 말씀 카드용 추천 검색어 (Pixabay 카테고리 활용)
export const VERSE_CARD_CATEGORIES = [
  { label: '자연', query: 'nature landscape', category: 'nature' as PixabayCategory, icon: '🌿' },
  { label: '하늘', query: 'sky clouds sunrise', category: 'nature' as PixabayCategory, icon: '☁️' },
  { label: '종교', query: 'church cross bible', category: 'religion' as PixabayCategory, icon: '✝️' },
  { label: '바다', query: 'ocean sea waves', category: 'nature' as PixabayCategory, icon: '🌊' },
  { label: '산', query: 'mountain peak', category: 'nature' as PixabayCategory, icon: '⛰️' },
  { label: '꽃', query: 'flowers bloom', category: 'nature' as PixabayCategory, icon: '🌸' },
  { label: '빛', query: 'light rays sunlight', category: 'backgrounds' as PixabayCategory, icon: '✨' },
  { label: '여행', query: 'journey path', category: 'travel' as PixabayCategory, icon: '🛤️' },
];

export interface SearchOptions {
  page?: number;
  perPage?: number;
  category?: PixabayCategory;
  orientation?: 'all' | 'horizontal' | 'vertical';
  colors?: string;
  editorsChoice?: boolean;
  order?: 'popular' | 'latest';
  minWidth?: number;
  minHeight?: number;
}

// 이미지 검색
export async function searchPhotos(
  query: string,
  page: number = 1,
  perPage: number = 12,
  options?: SearchOptions
): Promise<PixabaySearchResult | null> {
  if (!PIXABAY_API_KEY) {
    console.warn('Pixabay API 키가 설정되지 않았습니다.');
    return null;
  }

  try {
    const params = new URLSearchParams({
      key: PIXABAY_API_KEY,
      q: query,
      page: page.toString(),
      per_page: perPage.toString(),
      image_type: 'photo',
      orientation: options?.orientation || 'vertical', // 세로 이미지 (카드용)
      safesearch: 'true',
      lang: 'ko', // 한국어 지원
      order: options?.order || 'popular',
    });

    // 선택적 파라미터 추가
    if (options?.category) {
      params.append('category', options.category);
    }
    if (options?.colors) {
      params.append('colors', options.colors);
    }
    if (options?.editorsChoice) {
      params.append('editors_choice', 'true');
    }
    if (options?.minWidth) {
      params.append('min_width', options.minWidth.toString());
    }
    if (options?.minHeight) {
      params.append('min_height', options.minHeight.toString());
    }

    const response = await fetch(
      `https://pixabay.com/api/?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Pixabay 검색 실패:', error);
    return null;
  }
}

// 랜덤 이미지 가져오기 (특정 주제)
export async function getRandomPhoto(query: string = 'nature'): Promise<PixabayImage | null> {
  const result = await searchPhotos(query, 1, 20);

  if (!result || result.hits.length === 0) {
    return null;
  }

  // 랜덤하게 하나 선택
  const randomIndex = Math.floor(Math.random() * result.hits.length);
  return result.hits[randomIndex];
}

// Unsplash 형식과 호환되는 포맷으로 변환
export function toUnsplashFormat(image: PixabayImage) {
  return {
    id: image.id.toString(),
    urls: {
      raw: image.largeImageURL,
      full: image.largeImageURL,
      regular: image.webformatURL,
      small: image.previewURL,
      thumb: image.previewURL,
    },
    alt_description: image.tags,
    user: {
      name: image.user,
      username: image.user,
    },
    color: '#666666',
    blur_hash: '',
  };
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

// API 키 확인
export function hasApiKey(): boolean {
  return !!PIXABAY_API_KEY;
}
