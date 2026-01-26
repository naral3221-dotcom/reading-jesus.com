'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Church,
  Settings,
  Menu,
  X,
  LogOut,
  Loader2,
  AlertCircle,
  UsersRound,
  UserCog,
  Database,
} from 'lucide-react';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  superadminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/admin', label: '대시보드', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/admin/users', label: '사용자', icon: <Users className="w-5 h-5" /> },
  { href: '/admin/groups', label: '그룹', icon: <UsersRound className="w-5 h-5" /> },
  { href: '/admin/moderation', label: '모더레이션', icon: <MessageSquare className="w-5 h-5" /> },
  { href: '/admin/churches', label: '교회', icon: <Church className="w-5 h-5" /> },
  { href: '/admin/database', label: '데이터베이스', icon: <Database className="w-5 h-5" />, superadminOnly: true },
  { href: '/admin/admins', label: '관리자 관리', icon: <UserCog className="w-5 h-5" />, superadminOnly: true },
  { href: '/admin/settings', label: '설정', icon: <Settings className="w-5 h-5" /> },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userName, setUserName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = getSupabaseBrowserClient();
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // 프로필에서 nickname, role 확인 (한 번의 쿼리로)
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('nickname, role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.warn('프로필 조회 에러:', profileError);
            setUserName(session.user.email || '');
            setIsAdmin(false);
          } else if (profile) {
            setUserName(profile.nickname || session.user.email || '관리자');
            // superadmin, admin, moderator만 접근 허용
            const userRole = profile.role;
            if (userRole === 'superadmin') {
              setIsAdmin(true);
              setIsSuperAdmin(true);
            } else if (userRole === 'admin' || userRole === 'moderator') {
              setIsAdmin(true);
              setIsSuperAdmin(false);
            } else {
              setIsAdmin(false);
              setIsSuperAdmin(false);
            }
          } else {
            // 프로필이 없는 경우
            setUserName(session.user.email || '');
            setIsAdmin(false);
          }
        } catch {
          // 예외 발생 시 접근 불가
          setUserName(session.user.email || '');
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Admin check error:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-xl font-bold mb-2">접근 권한이 없습니다</h1>
        <p className="text-muted-foreground text-center mb-4">
          관리자 페이지에 접근할 수 없습니다.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin-login')}>
            관리자 로그인
          </Button>
          <Button onClick={() => router.push('/home')}>
            홈으로 이동
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* PC 사이드바 */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64 lg:overflow-y-auto lg:bg-background lg:border-r">
        {/* 로고 */}
        <div className="flex h-16 items-center gap-2 px-6 border-b">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">RJ</span>
          </div>
          <span className="font-semibold">Admin</span>
        </div>

        {/* 네비게이션 */}
        <nav className="flex flex-col gap-1 p-4">
          {navItems
            .filter((item) => !item.superadminOnly || isSuperAdmin)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
        </nav>

        {/* 하단 사용자 정보 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium truncate max-w-[120px]">{userName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* 모바일 헤더 */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">RJ</span>
          </div>
          <span className="font-semibold text-sm">Admin</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </header>

      {/* 모바일 메뉴 오버레이 */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 모바일 사이드 메뉴 */}
      <div
        className={cn(
          "lg:hidden fixed top-14 right-0 bottom-0 z-50 w-64 bg-background transform transition-transform duration-200 ease-out",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          {navItems
            .filter((item) => !item.superadminOnly || isSuperAdmin)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </Button>
        </div>
      </div>

      {/* 모바일 바텀 네비게이션 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-background border-t flex items-center justify-around px-2 safe-area-bottom">
        {navItems.filter((item) => !item.superadminOnly || isSuperAdmin).slice(0, 5).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
              isActive(item.href)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* 메인 콘텐츠 */}
      <main className={cn(
        "lg:pl-64",
        "pt-14 lg:pt-0",
        "pb-20 lg:pb-0"
      )}>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
