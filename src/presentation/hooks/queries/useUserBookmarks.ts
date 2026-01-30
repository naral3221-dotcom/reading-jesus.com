'use client';

/**
 * 사용자 북마크 관리 훅
 *
 * user_bookmarks 테이블에서 북마크를 관리합니다.
 *
 * 주의: user_bookmarks 테이블은 마이그레이션으로 생성해야 합니다.
 * 테이블이 없으면 graceful하게 빈 배열을 반환합니다.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import type { GridFeedItem } from '@/types';

// Query Key
export const userBookmarksKeys = {
  all: ['userBookmarks'] as const,
  byUser: (userId: string) => [...userBookmarksKeys.all, userId] as const,
  check: (meditationId: string, userId: string) =>
    [...userBookmarksKeys.all, 'check', meditationId, userId] as const,
};

type MeditationSource = 'unified' | 'public';

interface BookmarkRow {
  id: string;
  meditation_id: string;
  meditation_source: MeditationSource;
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
 * 북마크 목록 조회
 */
export function useUserBookmarks(
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
    queryKey: userBookmarksKeys.byUser(userId ?? ''),
    queryFn: async (): Promise<GridFeedItem[]> => {
      if (!userId) return [];

      const supabase = getSupabaseBrowserClient();

      // 1단계: 북마크 목록 조회
      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from('user_bookmarks')
        .select('id, meditation_id, meditation_source, created_at')
        .eq('user_id', userId)
        .eq('meditation_source', 'unified')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // 테이블이 없으면 (404) graceful하게 빈 배열 반환
      if (bookmarksError) {
        if (bookmarksError.code === '42P01' || bookmarksError.message?.includes('does not exist')) {
          console.warn('user_bookmarks 테이블이 아직 생성되지 않았습니다. 마이그레이션을 실행해주세요.');
          return [];
        }
        console.error('북마크 조회 실패:', bookmarksError);
        throw bookmarksError;
      }

      if (!bookmarksData || bookmarksData.length === 0) {
        return [];
      }

      // 2단계: 해당 묵상 데이터 조회
      const meditationIds = (bookmarksData as BookmarkRow[]).map((b) => b.meditation_id);

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

      // meditation_id 순서대로 정렬 (북마크한 순서 유지)
      const meditationMap = new Map(
        (meditationsData as MeditationRow[]).map((m) => [m.id, m])
      );

      // GridFeedItem으로 변환
      return (bookmarksData as BookmarkRow[])
        .map((bookmark): GridFeedItem | null => {
          const m = meditationMap.get(bookmark.meditation_id);
          if (!m) return null;

          // 썸네일 추출
          let thumbnailUrl: string | null = null;
          if (m.content) {
            const imgMatch = m.content.match(/<img[^>]+src=["']([^"']+)["']/);
            if (imgMatch) {
              thumbnailUrl = imgMatch[1];
            }
          }

          // 텍스트 미리보기
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
 * 북마크 여부 확인
 */
export function useIsBookmarked(
  meditationId: string | null,
  userId: string | null,
  source: MeditationSource = 'unified'
) {
  return useQuery({
    queryKey: userBookmarksKeys.check(meditationId ?? '', userId ?? ''),
    queryFn: async (): Promise<boolean> => {
      if (!meditationId || !userId) return false;

      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('meditation_id', meditationId)
        .eq('meditation_source', source)
        .maybeSingle();

      // 테이블이 없으면 false 반환
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return false;
        }
        // 다른 에러도 로깅만 하고 false 반환
        console.error('북마크 확인 에러:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!meditationId && !!userId,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 북마크 토글 (추가/삭제)
 */
export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      meditationId,
      userId,
      source = 'unified' as MeditationSource,
    }: {
      meditationId: string;
      userId: string;
      source?: MeditationSource;
    }) => {
      const supabase = getSupabaseBrowserClient();

      // 현재 북마크 상태 확인
      const { data: existing, error: checkError } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('meditation_id', meditationId)
        .eq('meditation_source', source)
        .maybeSingle();

      // 테이블이 없으면 에러 throw
      if (checkError) {
        if (checkError.code === '42P01') {
          throw new Error('북마크 기능을 사용하려면 먼저 데이터베이스 마이그레이션을 실행해주세요.');
        }
        throw checkError;
      }

      if (existing) {
        // 북마크 삭제
        const { error } = await supabase
          .from('user_bookmarks')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        return { isBookmarked: false };
      } else {
        // 북마크 추가
        const { error } = await supabase.from('user_bookmarks').insert({
          user_id: userId,
          meditation_id: meditationId,
          meditation_source: source,
        });

        if (error) throw error;
        return { isBookmarked: true };
      }
    },
    onSuccess: (_data, variables) => {
      // 북마크 목록 갱신
      queryClient.invalidateQueries({
        queryKey: userBookmarksKeys.byUser(variables.userId),
      });
      // 개별 북마크 상태 갱신
      queryClient.invalidateQueries({
        queryKey: userBookmarksKeys.check(variables.meditationId, variables.userId),
      });
    },
  });
}

/**
 * 텍스트 미리보기 생성
 */
function getTextPreview(meditation: MeditationRow): string {
  if (meditation.content_type === 'qt') {
    if (meditation.my_sentence) return stripHtml(meditation.my_sentence);
    if (meditation.meditation_answer) return stripHtml(meditation.meditation_answer);
    if (meditation.my_prayer) return stripHtml(meditation.my_prayer);
    if (meditation.gratitude) return stripHtml(meditation.gratitude);
    if (meditation.day_review) return stripHtml(meditation.day_review);
  }

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
