'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, MessageSquare, Calendar, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/presentation/hooks/queries/useUser';
import { useUserGroups } from '@/presentation/hooks/queries/useGroup';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import Link from 'next/link';
import type { CommentWithProfile } from '@/types';
import { searchBible, type BibleSearchResult } from '@/lib/bibleLoader';
import { NoSearchResultsEmpty } from '@/components/ui/empty-state';
import { InlineError } from '@/components/ui/error-state';

const PAGE_SIZE = 20;

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'bible' | 'comments'>('bible');
  const [searching, setSearching] = useState(false);

  // 사용자 정보 및 그룹 (React Query)
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id ?? null;
  const { data: userGroups } = useUserGroups(userId);

  // 성경 검색 결과 (전체 결과 저장)
  const [allBibleResults, setAllBibleResults] = useState<BibleSearchResult[]>([]);
  const [bibleDisplayCount, setBibleDisplayCount] = useState(PAGE_SIZE);

  // 묵상 검색 결과 (전체 결과 저장)
  const [allCommentResults, setAllCommentResults] = useState<CommentWithProfile[]>([]);
  const [commentDisplayCount, setCommentDisplayCount] = useState(PAGE_SIZE);

  // 에러 상태
  const [searchError, setSearchError] = useState<string | null>(null);

  // 현재 표시할 결과 (슬라이스)
  const bibleResults = allBibleResults.slice(0, bibleDisplayCount);
  const commentResults = allCommentResults.slice(0, commentDisplayCount);

  // 더 보기 가능 여부
  const hasMoreBible = bibleDisplayCount < allBibleResults.length;
  const hasMoreComments = commentDisplayCount < allCommentResults.length;

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setSearching(true);
    setSearchError(null);

    try {
      if (searchType === 'bible') {
        // 성경 본문 검색 (200개까지 검색하여 저장)
        const results = await searchBible(query, 'revised', 200);
        setAllBibleResults(results);
        setBibleDisplayCount(PAGE_SIZE);
      } else {
        // 묵상(댓글) 검색 - 사용자가 속한 그룹만 검색
        if (!userId) {
          setSearchError('로그인이 필요합니다');
          return;
        }

        // userGroups 훅에서 가져온 그룹 ID 사용
        const groupIds = userGroups?.map(g => g.group.id) || [];

        if (groupIds.length === 0) {
          // 속한 그룹이 없으면 검색 결과 없음
          setAllCommentResults([]);
          setCommentDisplayCount(PAGE_SIZE);
          return;
        }

        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .in('group_id', groupIds)
          .ilike('content', `%${query}%`)
          .order('created_at', { ascending: false })
          .limit(200);

        if (error) {
          console.error('Comment search error:', error);
          setSearchError('검색 중 오류가 발생했습니다');
          return;
        }

        // profile 정보를 별도로 조회
        const commentsWithProfile = await Promise.all(
          (data || []).map(async (comment) => {
            let profile = null;
            if (comment.user_id) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('nickname, avatar_url')
                .eq('id', comment.user_id)
                .maybeSingle();
              profile = profileData;
            }
            return { ...comment, profile };
          })
        );

        setAllCommentResults(commentsWithProfile as CommentWithProfile[]);
        setCommentDisplayCount(PAGE_SIZE);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSearching(false);
    }
  }, [query, searchType, userId, userGroups]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 더 보기 핸들러
  const handleLoadMoreBible = useCallback(() => {
    setBibleDisplayCount(prev => Math.min(prev + PAGE_SIZE, allBibleResults.length));
  }, [allBibleResults.length]);

  const handleLoadMoreComments = useCallback(() => {
    setCommentDisplayCount(prev => Math.min(prev + PAGE_SIZE, allCommentResults.length));
  }, [allCommentResults.length]);

  return (
    <div className="flex flex-col p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Search className="w-5 h-5" />
        <h1 className="text-xl font-bold">검색</h1>
      </div>

      {/* 검색창 */}
      <div className="flex gap-2">
        <Input
          placeholder="검색어를 입력하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={searching || !query.trim()}>
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* 탭 */}
      <Tabs value={searchType} onValueChange={(v) => setSearchType(v as 'bible' | 'comments')}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="bible">
            <BookOpen className="w-4 h-4 mr-2" />
            성경 본문
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="w-4 h-4 mr-2" />
            묵상 나눔
          </TabsTrigger>
        </TabsList>

        {/* 성경 본문 검색 결과 */}
        <TabsContent value="bible" className="space-y-3">
          {searchError && searchType === 'bible' && (
            <InlineError message={searchError} onRetry={handleSearch} />
          )}

          {bibleResults.length === 0 && query && !searching && !searchError && (
            <NoSearchResultsEmpty query={query} />
          )}

          {allBibleResults.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {allBibleResults.length}개 중 {bibleResults.length}개 표시
            </p>
          )}

          {bibleResults.map((result, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <Link href={`/bible-reader?book=${result.book}&chapter=${result.chapter}`}>
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-primary mb-1">
                        {result.book} {result.chapter}:{result.verse}
                      </p>
                      <p className="text-sm leading-relaxed">{result.text}</p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}

          {/* 더 보기 버튼 */}
          {hasMoreBible && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLoadMoreBible}
            >
              더 보기 ({allBibleResults.length - bibleDisplayCount}개 더)
            </Button>
          )}
        </TabsContent>

        {/* 묵상 나눔 검색 결과 */}
        <TabsContent value="comments" className="space-y-3">
          {searchError && searchType === 'comments' && (
            <InlineError message={searchError} onRetry={handleSearch} />
          )}

          {commentResults.length === 0 && query && !searching && !searchError && (
            <NoSearchResultsEmpty query={query} />
          )}

          {allCommentResults.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {allCommentResults.length}개 중 {commentResults.length}개 표시
            </p>
          )}

          {commentResults.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <Link href={`/community?day=${comment.day_number}`}>
                  <div className="space-y-2">
                    {/* 작성자 정보 */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {comment.is_anonymous ? '익명' : comment.profile?.nickname || '알 수 없음'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>Day {comment.day_number}</span>
                          <span>·</span>
                          <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* 내용 */}
                    <p className="text-sm leading-relaxed line-clamp-3">
                      {comment.content}
                    </p>

                    {/* 통계 */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>좋아요 {comment.likes_count}</span>
                      <span>댓글 {comment.replies_count}</span>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}

          {/* 더 보기 버튼 */}
          {hasMoreComments && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLoadMoreComments}
            >
              더 보기 ({allCommentResults.length - commentDisplayCount}개 더)
            </Button>
          )}
        </TabsContent>
      </Tabs>

      {/* 검색 전 안내 */}
      {!query && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            성경 본문이나 묵상 나눔을 검색해보세요
          </p>
          <p className="text-xs text-muted-foreground">
            검색어를 입력하고 엔터를 누르거나 검색 버튼을 클릭하세요
          </p>
        </div>
      )}

      {/* 검색 중 */}
      {searching && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">검색 중...</p>
        </div>
      )}
    </div>
  );
}

function User({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
