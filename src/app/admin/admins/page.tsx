'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import {
  Loader2,
  Plus,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  UserCog,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  email: string;
  nickname: string | null;
  role: string;
  created_at: string;
  password?: string; // 생성 시 임시 저장용
}

type AdminRole = 'admin' | 'moderator';

export default function AdminsManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  // 새 관리자 추가 다이얼로그
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('admin');
  const [adding, setAdding] = useState(false);

  // 삭제 다이얼로그
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 권한 변경 다이얼로그
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole>('admin');
  const [changingRole, setChangingRole] = useState(false);

  // 비밀번호 재설정 다이얼로그
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<AdminUser | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // 클립보드 복사 상태
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Superadmin 확인 및 관리자 목록 로드
  const checkSuperAdminAndLoad = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/admin/login');
        return;
      }

      // 현재 사용자가 superadmin인지 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.role !== 'superadmin') {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      setIsSuperAdmin(true);

      // 관리자 목록 로드 (superadmin, admin, moderator)
      const { data: adminProfiles, error } = await supabase
        .from('profiles')
        .select('id, nickname, email, role, created_at')
        .in('role', ['superadmin', 'admin', 'moderator'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      const adminsWithEmail: AdminUser[] = (adminProfiles || []).map((p) => ({
        id: p.id,
        email: p.email || '',
        nickname: p.nickname,
        role: p.role || 'user',
        created_at: p.created_at,
      }));

      setAdmins(adminsWithEmail);
    } catch (err) {
      console.error('Load admins error:', err);
      toast({
        variant: 'error',
        title: '관리자 목록을 불러오는데 실패했습니다',
      });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    checkSuperAdminAndLoad();
  }, [checkSuperAdminAndLoad]);

  // 새 관리자 추가
  const handleAddAdmin = async () => {
    if (!newEmail || !newPassword) {
      toast({
        variant: 'error',
        title: '이메일과 비밀번호를 입력해주세요',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'error',
        title: '비밀번호는 6자 이상이어야 합니다',
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setAdding(true);
    try {
      // Supabase Admin API로 사용자 생성 (service_role 키 필요)
      // 클라이언트에서는 일반 signUp 사용
      const { data, error } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            nickname: newNickname || newEmail.split('@')[0],
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('사용자 생성 실패');

      // 프로필에 role, email 설정
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          nickname: newNickname || newEmail.split('@')[0],
          email: newEmail,
          role: newRole,
        });

      if (profileError) throw profileError;

      toast({
        variant: 'success',
        title: '관리자 계정이 생성되었습니다',
        description: `이메일: ${newEmail} / 비밀번호: ${newPassword}`,
      });

      setAddDialogOpen(false);
      setNewEmail('');
      setNewPassword('');
      setNewNickname('');
      setNewRole('admin');
      checkSuperAdminAndLoad();
    } catch (err) {
      console.error('Add admin error:', err);
      toast({
        variant: 'error',
        title: '관리자 추가 실패',
        description: err instanceof Error ? err.message : '알 수 없는 오류',
      });
    } finally {
      setAdding(false);
    }
  };

  // 관리자 삭제 (role을 user로 변경)
  const handleDeleteAdmin = async () => {
    if (!deleteTarget) return;

    const supabase = getSupabaseBrowserClient();
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('id', deleteTarget.id);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '관리자 권한이 해제되었습니다',
      });

      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      checkSuperAdminAndLoad();
    } catch (err) {
      console.error('Delete admin error:', err);
      toast({
        variant: 'error',
        title: '관리자 삭제 실패',
      });
    } finally {
      setDeleting(false);
    }
  };

  // 권한 변경
  const handleChangeRole = async () => {
    if (!roleTarget) return;

    const supabase = getSupabaseBrowserClient();
    setChangingRole(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', roleTarget.id);

      if (error) throw error;

      toast({
        variant: 'success',
        title: '권한이 변경되었습니다',
      });

      setRoleDialogOpen(false);
      setRoleTarget(null);
      checkSuperAdminAndLoad();
    } catch (err) {
      console.error('Change role error:', err);
      toast({
        variant: 'error',
        title: '권한 변경 실패',
      });
    } finally {
      setChangingRole(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-accent" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-accent" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return '슈퍼 계정';
      case 'admin':
        return '관리자';
      case 'moderator':
        return '모더레이터';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 클립보드 복사
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        variant: 'error',
        title: '복사 실패',
      });
    }
  };

  // 비밀번호 재설정 (랜덤 비밀번호 생성)
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewResetPassword(password);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">접근 권한이 없습니다</h1>
        <p className="text-muted-foreground text-center">
          이 페이지는 슈퍼 계정만 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="w-6 h-6" />
            관리자 계정 관리
          </h1>
          <p className="text-muted-foreground">관리자 계정을 추가하고 권한을 관리합니다</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          관리자 추가
        </Button>
      </div>

      {/* 권한 설명 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              슈퍼 계정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              모든 관리 권한 + 관리자 계정 관리
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              관리자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              사용자, 그룹, 콘텐츠 관리
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              모더레이터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              콘텐츠 관리만 가능
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 관리자 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>관리자 목록</CardTitle>
          <CardDescription>총 {admins.length}명의 관리자</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>닉네임</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>권한</TableHead>
                <TableHead>생성일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    {admin.nickname || '(없음)'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm">{admin.email || '-'}</span>
                      {admin.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(admin.email, `email-${admin.id}`)}
                        >
                          {copiedField === `email-${admin.id}` ? (
                            <Check className="w-3 h-3 text-accent" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(admin.role)}
                      <span>{getRoleLabel(admin.role)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(admin.created_at)}</TableCell>
                  <TableCell className="text-right">
                    {admin.role !== 'superadmin' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResetPasswordTarget(admin);
                            generateRandomPassword();
                            setResetPasswordDialogOpen(true);
                          }}
                        >
                          <KeyRound className="w-4 h-4 mr-1" />
                          비밀번호
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRoleTarget(admin);
                            setSelectedRole(admin.role as AdminRole);
                            setRoleDialogOpen(true);
                          }}
                        >
                          권한 변경
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeleteTarget(admin);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 관리자 추가 다이얼로그 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 관리자 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">이메일 *</Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="admin@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">비밀번호 * (6자 이상)</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newNickname">닉네임</Label>
              <Input
                id="newNickname"
                placeholder="관리자"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>권한</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AdminRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="moderator">모더레이터</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAddAdmin} disabled={adding}>
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  추가 중...
                </>
              ) : (
                '추가'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>관리자 권한 해제</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            <strong>{deleteTarget?.nickname}</strong>의 관리자 권한을 해제하시겠습니까?
            <br />
            계정은 삭제되지 않고 일반 사용자로 변경됩니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdmin} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                '권한 해제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 권한 변경 다이얼로그 */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>권한 변경</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              <strong>{roleTarget?.nickname}</strong>의 권한을 변경합니다.
            </p>
            <div className="space-y-2">
              <Label>새 권한</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AdminRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자</SelectItem>
                  <SelectItem value="moderator">모더레이터</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleChangeRole} disabled={changingRole}>
              {changingRole ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  변경 중...
                </>
              ) : (
                '변경'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 비밀번호 재설정 다이얼로그 */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 재설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              <strong>{resetPasswordTarget?.nickname}</strong> ({resetPasswordTarget?.email})의 비밀번호를 재설정합니다.
            </p>
            <div className="space-y-2">
              <Label>새 비밀번호</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    placeholder="새 비밀번호 입력"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button variant="outline" onClick={generateRandomPassword}>
                  자동 생성
                </Button>
              </div>
              {newResetPassword && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <span className="text-sm font-mono flex-1">{newResetPassword}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(newResetPassword, 'reset-password')}
                  >
                    {copiedField === 'reset-password' ? (
                      <Check className="w-3 h-3 text-accent" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-accent bg-accent/10 p-2 rounded">
              주의: 비밀번호를 복사한 후 해당 관리자에게 전달해주세요. 이 창을 닫으면 비밀번호를 다시 확인할 수 없습니다.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={async () => {
                if (!resetPasswordTarget || !newResetPassword) return;
                if (newResetPassword.length < 6) {
                  toast({ variant: 'error', title: '비밀번호는 6자 이상이어야 합니다' });
                  return;
                }
                setResettingPassword(true);
                const supabase = getSupabaseBrowserClient();
                try {
                  // Note: 클라이언트에서는 다른 사용자의 비밀번호를 직접 변경할 수 없음
                  // Supabase Admin API 또는 서버 사이드 함수가 필요
                  // 여기서는 비밀번호 재설정 이메일을 보내는 방식으로 대체
                  const { error } = await supabase.auth.resetPasswordForEmail(
                    resetPasswordTarget.email,
                    { redirectTo: `${window.location.origin}/auth/callback?redirect=/admin-login` }
                  );
                  if (error) throw error;
                  toast({
                    variant: 'success',
                    title: '비밀번호 재설정 이메일 발송됨',
                    description: `${resetPasswordTarget.email}로 이메일이 발송되었습니다`,
                  });
                  setResetPasswordDialogOpen(false);
                  setNewResetPassword('');
                } catch (err) {
                  console.error('Reset password error:', err);
                  toast({
                    variant: 'error',
                    title: '비밀번호 재설정 실패',
                  });
                } finally {
                  setResettingPassword(false);
                }
              }}
              disabled={resettingPassword}
            >
              {resettingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                '재설정 이메일 발송'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
