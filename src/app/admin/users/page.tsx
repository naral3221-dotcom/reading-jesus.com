'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Users,
  Mail,
  Calendar,
  MoreVertical,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface UserProfile {
  id: string;
  nickname: string | null;
  email: string | null;
  avatar_url: string | null;
  role?: string;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 20;

const roleLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  superadmin: { label: '슈퍼 계정', color: 'bg-accent/10 text-accent', icon: <ShieldAlert className="w-3 h-3" /> },
  admin: { label: '관리자', color: 'bg-red-100 text-red-700', icon: <ShieldAlert className="w-3 h-3" /> },
  moderator: { label: '모더레이터', color: 'bg-accent/10 text-accent', icon: <ShieldCheck className="w-3 h-3" /> },
  user: { label: '일반 사용자', color: 'bg-muted text-muted-foreground', icon: <Shield className="w-3 h-3" /> },
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // 검색 필터
      if (searchQuery) {
        query = query.or(`nickname.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      // 역할 필터
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      // 페이지네이션
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('사용자 로드 에러:', err);
      toast({
        variant: 'error',
        title: '사용자 목록을 불러올 수 없습니다',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, roleFilter, currentPage, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '역할이 변경되었습니다',
      });

      loadUsers();
      setDetailDialogOpen(false);
    } catch (err) {
      console.error('역할 변경 에러:', err);
      toast({
        variant: 'error',
        title: '역할 변경에 실패했습니다',
      });
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getRoleInfo = (role?: string) => {
    return roleLabels[role || 'user'] || roleLabels.user;
  };

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
        <h1 className="text-2xl font-bold">사용자 관리</h1>
        <p className="text-muted-foreground">
          총 {totalCount.toLocaleString()}명의 사용자
        </p>
      </div>

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="닉네임 또는 이메일 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="역할 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="superadmin">슈퍼 계정</SelectItem>
            <SelectItem value="admin">관리자</SelectItem>
            <SelectItem value="moderator">모더레이터</SelectItem>
            <SelectItem value="user">일반 사용자</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 사용자 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? '검색 결과가 없습니다' : '사용자가 없습니다'}
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
                      <th className="text-left p-4 font-medium">사용자</th>
                      <th className="text-left p-4 font-medium">이메일</th>
                      <th className="text-left p-4 font-medium">역할</th>
                      <th className="text-left p-4 font-medium">가입일</th>
                      <th className="text-right p-4 font-medium">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const roleInfo = getRoleInfo(user.role);
                      return (
                        <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                {user.avatar_url ? (
                                  <Image
                                    src={user.avatar_url}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <Users className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              <span className="font-medium">
                                {user.nickname || '이름 없음'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {user.email || '-'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                              {roleInfo.icon}
                              {roleInfo.label}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* 모바일 카드 뷰 */}
          <div className="lg:hidden space-y-3">
            {users.map((user) => {
              const roleInfo = getRoleInfo(user.role);
              return (
                <Card key={user.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Users className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.nickname || '이름 없음'}</p>
                          <p className="text-sm text-muted-foreground">{user.email || '-'}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.icon}
                        {roleInfo.label}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(user.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

      {/* 사용자 상세 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 상세</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {selectedUser.avatar_url ? (
                    <Image
                      src={selectedUser.avatar_url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Users className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold">
                    {selectedUser.nickname || '이름 없음'}
                  </p>
                  <p className="text-muted-foreground">{selectedUser.email || '-'}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">가입일:</span>
                  <span>{formatDate(selectedUser.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-xs">{selectedUser.id}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium">역할 변경</p>
                <div className="flex gap-2">
                  <Button
                    variant={selectedUser.role === 'user' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRoleChange(selectedUser.id, 'user')}
                  >
                    일반 사용자
                  </Button>
                  <Button
                    variant={selectedUser.role === 'moderator' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRoleChange(selectedUser.id, 'moderator')}
                  >
                    모더레이터
                  </Button>
                  <Button
                    variant={selectedUser.role === 'admin' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRoleChange(selectedUser.id, 'admin')}
                  >
                    관리자
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
