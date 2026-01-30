'use client';

/**
 * 사용자가 좋아요한 묵상 조회 훅
 *
 * unified_meditation_likes 테이블에서 사용자가 좋아요한 묵상을 조회합니다.
 *
 * 참고: Supabase PostgREST의 embed 쿼리는 foreign key 관계가 명시적으로
 * 정의되어 있어야 작동합니다. unified_meditations의 user_id는 auth.users를
 * 참조하므로 profiles embed가 작동하지 않습니다. 따라서 2단계 쿼리로 처리합니다.
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import type { GridFeedItem } from '@/types';

// Query Key
export const userLikedMeditationsKeys = {
  all: ['userLikedMeditations'] as const,
  byUser: (userId: string) => [...userLikedMeditationsKeys.all, userId] as const,
};

interface LikeRow {
  meditation_id: string;
  created_at: string;
}

interface MeditationRow {
  id: string;
  content_type: 'free' | 'qt';
  source_type: 'church' | 'group';
  source_id: string;
  day_number: number | null;
  content: string | null;
  my_sentence: string | null;
  meditation_answer: string | null;
  gratitude: string | null;
  my_prayer: string | null;
  day_review: string | null;
  bible_range: string | null;
  likes_count: number;
  replies_count: number;
  created_at: string;
  is_anonymous: boolean;
  user_id: string | null;
  author_name: string;
}

/**
 * 좋아요한 묵상 목록 조회
 */
export function useUserLikedMeditations(
  userId: string | null,
  options?: {
    limit?: number;
    offset?: number;
    enabled?: boolean;
  }
) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  return useQuery({
    queryKey: userLikedMeditationsKeys.byUser(userId ?? ''),
    queryFn: async (): Promise<GridFeedItem[]> => {
      if (!userId) return [];

      const supabase = getSupabaseBrowserClient();

      // 1단계: 좋아요한 meditation_id 목록 조회
      const { data: likesData, error: likesError } = await supabase
        .from('unified_meditation_likes')
        .select('meditation_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (likesError) {
        console.error('좋아요 목록 조회 실패:', likesError);
        throw likesError;
      }

      if (!likesData || likesData.length === 0) {
        return [];
      }

      // 2단계: 해당 묵상 데이터 조회
      const meditationIds = (likesData as LikeRow[]).map((l) => l.meditation_id);

      const { data: meditationsData, error: meditationsError } = await supabase
        .from('unified_meditations')
        .select(`
          id,
          content_type,
          source_type,
          source_id,
          day_number,
          content,
          my_sentence,
          meditation_answer,
          gratitude,
          my_prayer,
          day_review,
          bible_range,
          likes_count,
          replies_count,
          created_at,
          is_anonymous,
          user_id,
          author_name
        `)
        .in('id', meditationIds);

      if (meditationsError) {
        console.error('묵상 데이터 조회 실패:', meditationsError);
        throw meditationsError;
      }

      // meditation_id 순서대로 정렬 (좋아요한 순서 유지)
      const meditationMap = new Map(
        (meditationsData as MeditationRow[]).map((m) => [m.id, m])
      );

      // GridFeedItem으로 변환
      return (likesData as LikeRow[])
        .map((like): GridFeedItem | null => {
          const m = meditationMap.get(like.meditation_id);
          if (!m) return null;

          // 썸네일 추출 (content에서 첫 번째 이미지)
          let thumbnailUrl: string | null = null;
          if (m.content) {
            const imgMatch = m.content.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch) {
              thumbnailUrl = imgMatch[1];
            }
          }

          // 텍스트 미리보기 생성
          const textPreview = getTextPreview(m);

          // content_type 변환 (DB의 'free' → UI의 'meditation')
          const displayType: 'meditation' | 'qt' = m.content_type === 'qt' ? 'qt' : 'meditation';

          return {
            id: m.id,
            type: displayType,
            source: m.source_type,
            sourceId: m.source_id,
            sourceName: undefined, // 추가 쿼리 없이 생략
            thumbnailUrl,
            textPreview,
            likesCount: m.likes_count,
            repliesCount: m.replies_count,
            dayNumber: m.day_number,
            bibleRange: m.bible_range,
            createdAt: m.created_at,
            fullData: {
              authorId: m.user_id || '',
              authorName: m.author_name,
              authorAvatarUrl: undefined, // 추가 쿼리 없이 생략
              isAnonymous: m.is_anonymous,
              content: m.content ?? undefined,
              mySentence: m.my_sentence,
              meditationAnswer: m.meditation_answer,
              gratitude: m.gratitude,
              myPrayer: m.my_prayer,
              dayReview: m.day_review,
            },
          };
        })
        .filter((item): item is GridFeedItem => item !== null);
    },
    enabled: (options?.enabled ?? true) && !!userId,
    staleTime: 1000 * 60, // 1분
  });
}

/**
 * 텍스트 미리보기 생성
 */
function getTextPreview(meditation: MeditationRow): string {
  // QT 타입: my_sentence 우선
  if (meditation.content_type === 'qt') {
    if (meditation.my_sentence) return stripHtml(meditation.my_sentence);
    if (meditation.meditation_answer) return stripHtml(meditation.meditation_answer);
    if (meditation.my_prayer) return stripHtml(meditation.my_prayer);
    if (meditation.gratitude) return stripHtml(meditation.gratitude);
    if (meditation.day_review) return stripHtml(meditation.day_review);
  }

  // 묵상 타입: content 사용
  if (meditation.content) {
    return stripHtml(meditation.content);
  }

  return '내용 없음';
}

/**
 * HTML 태그 제거
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
    .slice(0, 100);
}
