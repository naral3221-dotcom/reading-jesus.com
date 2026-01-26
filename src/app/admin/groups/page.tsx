'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import {
  Search,
  UsersRound,
  Users,
  MessageSquare,
  Calendar,
  MoreVertical,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  image_url: string | null;
  created_at: string;
  owner: {
    id: string;
    nickname: string | null;
  } | null;
  _count?: {
    members: number;
    posts: number;
  };
}

const ITEMS_PER_PAGE = 20;

export default function AdminGroupsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const loadGroups = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    try {
      let query = supabase
        .from('groups')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // 검색 필터
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // 페이지네이션
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // 각 그룹의 멤버 수, 묵상 수, owner 정보 가져오기
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          // 멤버 수와 댓글 수는 항상 조회
          const [membersResult, commentsResult] = await Promise.all([
            supabase
              .from('group_members')
              .select('id', { count: 'exact', head: true })
              .eq('group_id', group.id),
            supabase
              .from('comments')
              .select('id', { count: 'exact', head: true })
              .eq('group_id', group.id),
          ]);

          // owner_id가 있을 때만 owner 정보 조회
          let ownerData = null;
          if (group.owner_id) {
            const { data: owner } = await supabase
              .from('profiles')
              .select('id, nickname')
              .eq('id', group.owner_id)
              .maybeSingle();
            ownerData = owner;
          }

          return {
            ...group,
            owner: ownerData,
            _count: {
              members: membersResult.count || 0,
              posts: commentsResult.count || 0,
            },
          };
        })
      );

      setGroups(groupsWithCounts as GroupData[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('그룹 로드 에러:', err);
      toast({
        variant: 'error',
        title: '그룹 목록을 불러올 수 없습니다',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, toast]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">그룹 관리</h1>
        <p className="text-muted-foreground">
          총 {totalCount.toLocaleString()}개의 그룹
        </p>
      </div>

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="그룹 이름 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 그룹 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UsersRound className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다' : '그룹이 없습니다'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* PC 테이블 뷰 */}
          <div className="hidden lg:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">그룹</th>
                      <th className="text-left p-4 font-medium">그룹장</th>
                      <th className="text-center p-4 font-medium">공개</th>
                      <th className="text-center p-4 font-medium">멤버</th>
                      <th className="text-center p-4 font-medium">게시글</th>
                      <th className="text-left p-4 font-medium">생성일</th>
                      <th className="text-right p-4 font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr key={group.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                              {group.image_url ? (
                                <Image
                                  src={group.image_url}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <UsersRound className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <span className="font-medium">{group.name}</span>
                              {group.description && (
                                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {group.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {group.owner?.nickname || '-'}
                        </td>
                        <td className="p-4 text-center">
                          {group.is_public ? (
                            <Globe className="w-4 h-4 text-accent mx-auto" />
                          ) : (
                            <Lock className="w-4 h-4 text-accent mx-auto" />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {group._count?.members || 0}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {group._count?.posts || 0}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {formatDate(group.created_at)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <Link href={`/group/${group.id}`} target="_blank">
                                <ExternalLink className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedGroup(group);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* 모바일 카드 뷰 */}
          <div className="lg:hidden space-y-3">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {group.image_url ? (
                          <Image
                            src={group.image_url}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <UsersRound className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{group.name}</p>
                          {group.is_public ? (
                            <Globe className="w-3 h-3 text-accent" />
                          ) : (
                            <Lock className="w-3 h-3 text-accent" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {group.owner?.nickname || '그룹장 없음'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedGroup(group);
                        setDetailDialogOpen(true);
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {group._count?.members || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {group._count?.posts || 0}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(group.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* 그룹 상세 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>그룹 상세</DialogTitle>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {selectedGroup.image_url ? (
                    <Image
                      src={selectedGroup.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <UsersRound className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">{selectedGroup.name}</p>
                    {selectedGroup.is_public ? (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">공개</span>
                    ) : (
                      <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">비공개</span>
                    )}
                  </div>
                  {selectedGroup.description && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {selectedGroup.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{selectedGroup._count?.members || 0}</p>
                  <p className="text-sm text-muted-foreground">멤버</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{selectedGroup._count?.posts || 0}</p>
                  <p className="text-sm text-muted-foreground">게시글</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">그룹장:</span>
                  <span>{selectedGroup.owner?.nickname || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">생성일:</span>
                  <span>{formatDate(selectedGroup.created_at)}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button asChild className="w-full">
                  <Link href={`/group/${selectedGroup.id}`} target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    그룹 페이지 열기
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
