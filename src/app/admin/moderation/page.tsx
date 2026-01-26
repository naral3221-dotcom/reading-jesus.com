'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import {
  MessageSquare,
  Flag,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  User,
} from 'lucide-react';

interface PostData {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    nickname: string | null;
  } | null;
  group: {
    id: string;
    name: string;
  } | null;
}

interface GuestCommentData {
  id: string;
  content: string;
  guest_name: string;
  created_at: string;
  church: {
    id: string;
    name: string;
  } | null;
}

interface ReportData {
  id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  reporter: {
    nickname: string | null;
  } | null;
  post: PostData | null;
}

const ITEMS_PER_PAGE = 10;

export default function AdminModerationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);

  // 게시글 관련
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalCount, setPostsTotalCount] = useState(0);

  // 비회원 댓글 관련
  const [guestComments, setGuestComments] = useState<GuestCommentData[]>([]);
  const [guestCommentsPage, setGuestCommentsPage] = useState(1);
  const [guestCommentsTotalCount, setGuestCommentsTotalCount] = useState(0);

  // 신고 관련 (추후 활성화)
  const [, setReports] = useState<ReportData[]>([]);
  const [reportsTotalCount, setReportsTotalCount] = useState(0);

  // 삭제 다이얼로그
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'post' | 'guest_comment';
    id: string;
    content: string;
  } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  // 게시글 로드
  const loadPosts = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    try {
      const from = (postsPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // 조인 없이 기본 데이터만 조회
      const { data, error, count } = await supabase
        .from('comments')
        .select('id, content, created_at, user_id, group_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // 각 게시글의 author, group 정보를 별도 조회
      const formattedPosts: PostData[] = await Promise.all(
        (data || []).map(async (post) => {
          let authorData = null;
          let groupData = null;

          if (post.user_id) {
            const { data: author } = await supabase
              .from('profiles')
              .select('id, nickname')
              .eq('id', post.user_id)
              .maybeSingle();
            authorData = author;
          }

          if (post.group_id) {
            const { data: group } = await supabase
              .from('groups')
              .select('id, name')
              .eq('id', post.group_id)
              .maybeSingle();
            groupData = group;
          }

          return {
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            author: authorData,
            group: groupData,
          };
        })
      );

      setPosts(formattedPosts);
      setPostsTotalCount(count || 0);
    } catch (err) {
      console.error('게시글 로드 에러:', err);
    } finally {
      setLoading(false);
    }
  }, [postsPage]);

  // 비회원 댓글 로드
  const loadGuestComments = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    try {
      const from = (guestCommentsPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // 조인 없이 기본 데이터만 조회
      const { data, error, count } = await supabase
        .from('guest_comments')
        .select('id, content, guest_name, created_at, church_id', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // 각 댓글의 church 정보를 별도 조회
      const formattedComments: GuestCommentData[] = await Promise.all(
        (data || []).map(async (comment) => {
          let churchData = null;

          if (comment.church_id) {
            const { data: church } = await supabase
              .from('churches')
              .select('id, name')
              .eq('id', comment.church_id)
              .maybeSingle();
            churchData = church;
          }

          return {
            id: comment.id,
            content: comment.content,
            guest_name: comment.guest_name,
            created_at: comment.created_at,
            church: churchData,
          };
        })
      );

      setGuestComments(formattedComments);
      setGuestCommentsTotalCount(count || 0);
    } catch (err) {
      console.error('비회원 댓글 로드 에러:', err);
    } finally {
      setLoading(false);
    }
  }, [guestCommentsPage]);

  // 신고 로드 (추후 테이블 생성 시 활성화)
  const loadReports = useCallback(async () => {
    setLoading(true);
    // 신고 테이블이 아직 없으므로 빈 배열
    setReports([]);
    setReportsTotalCount(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'posts') {
      loadPosts();
    } else if (activeTab === 'guest') {
      loadGuestComments();
    } else if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab, loadPosts, loadGuestComments, loadReports]);

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!deleteTarget) return;

    const supabase = getSupabaseBrowserClient();
    setDeleting(true);
    try {
      const table = deleteTarget.type === 'post' ? 'comments' : 'guest_comments';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '삭제되었습니다',
      });

      // 목록 새로고침
      if (deleteTarget.type === 'post') {
        loadPosts();
      } else {
        loadGuestComments();
      }

      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setDeleteReason('');
    } catch (err) {
      console.error('삭제 에러:', err);
      toast({
        variant: 'error',
        title: '삭제에 실패했습니다',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const postsTotalPages = Math.ceil(postsTotalCount / ITEMS_PER_PAGE);
  const guestCommentsTotalPages = Math.ceil(guestCommentsTotalCount / ITEMS_PER_PAGE);
  // reportsTotalCount는 추후 신고 기능 활성화 시 사용
  void reportsTotalCount;

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold">모더레이션</h1>
        <p className="text-muted-foreground">콘텐츠 관리 및 신고 처리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{postsTotalCount}</div>
            <p className="text-sm text-muted-foreground">전체 게시글</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{guestCommentsTotalCount}</div>
            <p className="text-sm text-muted-foreground">비회원 댓글</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-accent">{reportsTotalCount}</div>
            <p className="text-sm text-muted-foreground">대기중 신고</p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="posts">게시글</TabsTrigger>
          <TabsTrigger value="guest">비회원 댓글</TabsTrigger>
          <TabsTrigger value="reports">신고</TabsTrigger>
        </TabsList>

        {/* 게시글 탭 */}
        <TabsContent value="posts" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">게시글이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">
                              {post.author?.nickname || '알 수 없음'}
                            </span>
                            {post.group && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                {post.group.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {truncateContent(post.content)}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteTarget({
                              type: 'post',
                              id: post.id,
                              content: post.content,
                            });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 페이지네이션 */}
              {postsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                    disabled={postsPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    {postsPage} / {postsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPostsPage((p) => Math.min(postsTotalPages, p + 1))}
                    disabled={postsPage === postsTotalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* 비회원 댓글 탭 */}
        <TabsContent value="guest" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : guestComments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">비회원 댓글이 없습니다</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {guestComments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{comment.guest_name}</span>
                            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
                              비회원
                            </span>
                            {comment.church && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                {comment.church.name}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {truncateContent(comment.content)}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteTarget({
                              type: 'guest_comment',
                              id: comment.id,
                              content: comment.content,
                            });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* 페이지네이션 */}
              {guestCommentsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGuestCommentsPage((p) => Math.max(1, p - 1))}
                    disabled={guestCommentsPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    {guestCommentsPage} / {guestCommentsTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGuestCommentsPage((p) => Math.min(guestCommentsTotalPages, p + 1))}
                    disabled={guestCommentsPage === guestCommentsTotalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* 신고 탭 */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardContent className="py-12 text-center">
              <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">신고 기능은 준비 중입니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                신고 테이블이 생성되면 활성화됩니다
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              콘텐츠 삭제
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              이 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            {deleteTarget && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                {truncateContent(deleteTarget.content, 200)}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">삭제 사유 (선택)</label>
              <Textarea
                placeholder="삭제 사유를 입력하세요..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteTarget(null);
                setDeleteReason('');
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
