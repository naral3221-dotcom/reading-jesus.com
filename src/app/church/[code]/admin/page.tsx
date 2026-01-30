'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { getTodayDateString } from '@/lib/date-utils';
import { getTotalReadingDays } from '@/components/church/ReadingDayPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Church,
  BarChart3,
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  Eye,
  Trash2,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  RefreshCw,
  BookOpen,
  Loader2,
  UserCheck,
  UserPlus,
  Settings,
  Copy,
  QrCode,
  Link as LinkIcon,
  UserMinus,
  MoreVertical,
  Target,
  UsersRound,
  Plus,
  FileText,
  PlayCircle,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Bell,
  Pin,
  PinOff,
  EyeOff,
  Pencil,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type ChartPeriod = 7 | 30 | 90 | 0; // 0 = 전체

interface ChurchInfo {
  id: string;
  code: string;
  name: string;
  denomination: string | null;
  address: string | null;
  write_token: string | null;
  admin_token: string | null;
  is_active: boolean;
  allow_anonymous: boolean;
  schedule_year: number | null;
}

interface GuestComment {
  id: string;
  guest_name: string;
  content: string;
  day_number: number | null;
  bible_range: string | null;
  schedule_date: string | null;
  is_anonymous: boolean;
  created_at: string;
}

interface QtPost {
  id: string;
  author_name: string;
  qt_date: string;
  day_number: number | null;
  my_sentence: string | null;
  meditation_answer: string | null;
  gratitude: string | null;
  my_prayer: string | null;
  day_review: string | null;
  is_anonymous: boolean;
  created_at: string;
  likes_count: number;
  replies_count: number;
}

interface DailyStats {
  date: string;
  count: number;
}

interface WriterStats {
  name: string;
  count: number;
  lastWriteDate: string;
}

interface RegisteredMember {
  id: string;
  nickname: string;
  email: string | null;
  avatar_url: string | null;
  church_joined_at: string;
  last_comment_at: string | null;
  comment_count: number;
  qt_count: number;
  // 리딩지저스 진척도
  reading_progress?: {
    groupName: string;
    completedDays: number;
    totalDays: number;
    progressPercent: number;
  } | null;
}

interface ChurchNotice {
  id: string;
  church_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

const ITEMS_PER_PAGE = 20;
const MEMBERS_PER_PAGE = 10;

// 로컬 스토리지 키
function getAdminTokenKey(churchCode: string) {
  return `church_admin_token_${churchCode}`;
}

export default function ChurchAdminPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const churchCode = params.code as string;
  const tokenFromUrl = searchParams.get('token');

  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState('');
  const [authMethod, setAuthMethod] = useState<'login' | 'token' | null>(null); // 인증 방식

  // 데이터 상태
  const [church, setChurch] = useState<ChurchInfo | null>(null);
  const [comments, setComments] = useState<GuestComment[]>([]);
  const [qtPosts, setQtPosts] = useState<QtPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 통계 상태
  const [totalComments, setTotalComments] = useState(0);
  const [totalQtPosts, setTotalQtPosts] = useState(0);
  const [totalWriters, setTotalWriters] = useState(0);
  const [todayComments, setTodayComments] = useState(0);
  const [todayQtPosts, setTodayQtPosts] = useState(0);
  const [weekComments, setWeekComments] = useState(0);
  const [weekQtPosts, setWeekQtPosts] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [writerStats, setWriterStats] = useState<WriterStats[]>([]);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(30);

  // 등록 교인 통계
  const [registeredMembers, setRegisteredMembers] = useState(0);
  const [newMembersWeek, setNewMembersWeek] = useState(0);
  const [linkedComments, setLinkedComments] = useState(0);

  // 필터 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterWriter, setFilterWriter] = useState<string>('all');
  const [filterPostType, setFilterPostType] = useState<'all' | 'meditation' | 'qt'>('all');

  // 다이얼로그 상태
  const [selectedComment, setSelectedComment] = useState<GuestComment | null>(null);
  const [selectedQtPost, setSelectedQtPost] = useState<QtPost | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteQtConfirmOpen, setDeleteQtConfirmOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailType, setDetailType] = useState<'meditation' | 'qt' | null>(null);

  // 현재 탭
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // 설정 상태
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDenomination, setEditDenomination] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAllowAnonymous, setEditAllowAnonymous] = useState(true);
  const [editScheduleYear, setEditScheduleYear] = useState<number>(new Date().getFullYear());
  const [tokenRegenConfirmOpen, setTokenRegenConfirmOpen] = useState(false);
  const [tokenType, setTokenType] = useState<'write' | 'admin'>('write');

  // 등록 교인 목록
  const [members, setMembers] = useState<RegisteredMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberPage, setMemberPage] = useState(1);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<RegisteredMember | null>(null);
  const [removeMemberConfirmOpen, setRemoveMemberConfirmOpen] = useState(false);

  // 그룹 관리 상태
  interface ChurchGroup {
    id: string;
    name: string;
    description: string | null;
    member_count: number;
    progress_percentage: number;
    start_date: string;
    reading_plan_type: string;
    invite_code: string;
  }
  const [churchGroups, setChurchGroups] = useState<ChurchGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // Shorts 관리 상태
  interface ChurchShort {
    id: string;
    youtube_url: string;
    video_id: string;
    title: string | null;
    description: string | null;
    thumbnail_url: string | null;
    display_order: number;
    is_active: boolean;
  }
  const [shorts, setShorts] = useState<ChurchShort[]>([]);
  const [shortsLoading, setShortsLoading] = useState(false);
  const [newShortUrl, setNewShortUrl] = useState('');
  const [newShortTitle, setNewShortTitle] = useState('');
  const [deleteShortConfirmOpen, setDeleteShortConfirmOpen] = useState(false);
  const [shortToDelete, setShortToDelete] = useState<ChurchShort | null>(null);

  // 공지사항 상태
  const [notices, setNotices] = useState<ChurchNotice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<ChurchNotice | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeIsPinned, setNoticeIsPinned] = useState(false);
  const [noticeIsActive, setNoticeIsActive] = useState(true);
  const [deleteNoticeConfirmOpen, setDeleteNoticeConfirmOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<ChurchNotice | null>(null);
  const [noticeSaving, setNoticeSaving] = useState(false);

  // 관리자 계정 관리 상태
  interface AdminInfo {
    id: string;
    email: string;
    nickname: string | null;
    password_changed_at: string | null;
    last_login_at: string | null;
  }
  interface ChurchAdminInfo {
    id: string;
    email: string;
    nickname: string | null;
    role: string;
    is_active: boolean;
    created_at: string;
    last_login_at: string | null;
  }
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [churchAdmins, setChurchAdmins] = useState<ChurchAdminInfo[]>([]);
  const [churchAdminsLoading, setChurchAdminsLoading] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChanging, setPasswordChanging] = useState(false);
  // 새 관리자 추가
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminNickname, setNewAdminNickname] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // 인증 확인 (로그인 또는 토큰)
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      // 1. URL에서 토큰이 오면 저장하고 인증 (기존 QR 코드 방식)
      if (tokenFromUrl) {
        const isValid = await verifyToken(tokenFromUrl);
        if (isValid) {
          localStorage.setItem(getAdminTokenKey(churchCode), tokenFromUrl);
          setIsAuthenticated(true);
          setAuthMethod('token');
          // URL에서 토큰 제거 (보안)
          router.replace(`/church/${churchCode}/admin`);
        }
        setAuthLoading(false);
        return;
      }

      // 2. Supabase 세션 확인 (로그인 방식)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // 현재 교회 ID 조회
        const { data: churchData } = await supabase
          .from('churches')
          .select('id')
          .eq('code', churchCode)
          .single();

        if (churchData) {
          // 2-1. 시스템 관리자 확인 (슈퍼계정)
          const { data: systemAdmin } = await supabase
            .from('system_admins')
            .select('id, email, nickname')
            .eq('id', session.user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (systemAdmin) {
            // 시스템 관리자는 모든 교회 관리자 페이지 접근 가능
            setIsAuthenticated(true);
            setAuthMethod('login');
            setIsSystemAdmin(true);
            setAdminInfo({
              id: systemAdmin.id,
              email: systemAdmin.email,
              nickname: systemAdmin.nickname || '시스템 관리자',
              password_changed_at: null,
              last_login_at: null,
            });
            setAuthLoading(false);
            return;
          }

          // 2-2. church_admins 테이블에서 권한 확인
          const { data: admin } = await supabase
            .from('church_admins')
            .select('id, email, nickname, is_active, password_changed_at, last_login_at')
            .eq('id', session.user.id)
            .eq('church_id', churchData.id)
            .maybeSingle();

          if (admin && admin.is_active) {
            setIsAuthenticated(true);
            setAuthMethod('login');
            setAdminInfo({
              id: admin.id,
              email: admin.email,
              nickname: admin.nickname,
              password_changed_at: admin.password_changed_at,
              last_login_at: admin.last_login_at,
            });
            setAuthLoading(false);
            return;
          }
        }
      }

      // 3. 로컬 스토리지에서 토큰 확인 (기존 방식)
      const savedToken = localStorage.getItem(getAdminTokenKey(churchCode));
      if (savedToken) {
        const isValid = await verifyToken(savedToken);
        if (isValid) {
          setIsAuthenticated(true);
          setAuthMethod('token');
        } else {
          localStorage.removeItem(getAdminTokenKey(churchCode));
        }
      }
      setAuthLoading(false);
    };

    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churchCode, tokenFromUrl, router]);

  // 토큰 검증
  const verifyToken = async (token: string): Promise<boolean> => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase
        .from('churches')
        .select('id, admin_token')
        .eq('code', churchCode)
        .single();

      if (error || !data) return false;
      return data.admin_token === token;
    } catch {
      return false;
    }
  };

  // 수동 로그인
  const handleLogin = async () => {
    const isValid = await verifyToken(tokenInput);
    if (isValid) {
      localStorage.setItem(getAdminTokenKey(churchCode), tokenInput);
      setIsAuthenticated(true);
      toast({ variant: 'success', title: '로그인 성공' });
    } else {
      toast({ variant: 'error', title: '잘못된 관리자 토큰입니다' });
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    if (authMethod === 'login') {
      // 세션 로그아웃
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    }
    // 토큰 삭제
    localStorage.removeItem(getAdminTokenKey(churchCode));
    setIsAuthenticated(false);
    setAuthMethod(null);
  };

  // 비밀번호 변경
  const handleChangePassword = async () => {
    if (!adminInfo || !church) return;

    if (newPassword.length < 6) {
      toast({ variant: 'error', title: '비밀번호는 6자 이상이어야 합니다' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ variant: 'error', title: '비밀번호가 일치하지 않습니다' });
      return;
    }

    setPasswordChanging(true);
    try {
      const response = await fetch('/api/church-admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminInfo.id,
          newPassword,
          churchId: church.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '비밀번호 변경 실패');
      }

      toast({ variant: 'success', title: '비밀번호가 변경되었습니다' });
      setPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');

      // 변경 시간 업데이트
      setAdminInfo(prev => prev ? {
        ...prev,
        password_changed_at: new Date().toISOString()
      } : null);
    } catch (err) {
      console.error('비밀번호 변경 에러:', err);
      toast({
        variant: 'error',
        title: err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다'
      });
    } finally {
      setPasswordChanging(false);
    }
  };

  // 교회 정보 로드
  const loadChurchInfo = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .eq('code', churchCode)
        .single();

      if (error) throw error;
      setChurch(data);
    } catch (err) {
      console.error('교회 정보 로드 에러:', err);
    }
  }, [churchCode]);

  // 교회 관리자 목록 로드 (시스템 관리자용)
  const loadChurchAdmins = useCallback(async () => {
    if (!church || !isSystemAdmin) return;

    setChurchAdminsLoading(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase
        .from('church_admins')
        .select('id, email, nickname, role, is_active, created_at, last_login_at')
        .eq('church_id', church.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChurchAdmins(data || []);
    } catch (err) {
      console.error('교회 관리자 목록 로드 에러:', err);
    } finally {
      setChurchAdminsLoading(false);
    }
  }, [church, isSystemAdmin]);

  // 새 관리자 추가
  const handleAddAdmin = async () => {
    if (!church || !newAdminEmail || !newAdminPassword) return;

    setAddingAdmin(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // 1. Supabase Auth로 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdminEmail.trim(),
        password: newAdminPassword,
        options: {
          data: {
            nickname: newAdminNickname.trim() || newAdminEmail.split('@')[0],
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('사용자 생성 실패');

      // 2. church_admins 테이블에 등록
      const { error: adminError } = await supabase
        .from('church_admins')
        .insert({
          id: authData.user.id,
          church_id: church.id,
          email: newAdminEmail.trim(),
          nickname: newAdminNickname.trim() || newAdminEmail.split('@')[0],
          role: 'church_admin',
        });

      if (adminError) throw adminError;

      toast({
        variant: 'success',
        title: '관리자가 추가되었습니다',
        description: `이메일: ${newAdminEmail}`,
      });

      // 초기화 및 새로고침
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminNickname('');
      setAddAdminDialogOpen(false);
      loadChurchAdmins();
    } catch (err) {
      console.error('관리자 추가 에러:', err);
      toast({
        variant: 'error',
        title: '관리자 추가 실패',
        description: err instanceof Error ? err.message : '알 수 없는 오류',
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  // 관리자 활성화/비활성화 토글
  const handleToggleAdminActive = async (adminId: string, currentStatus: boolean) => {
    if (!church) return;

    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('church_admins')
        .update({ is_active: !currentStatus })
        .eq('id', adminId)
        .eq('church_id', church.id);

      if (error) throw error;

      toast({
        variant: 'success',
        title: currentStatus ? '관리자가 비활성화되었습니다' : '관리자가 활성화되었습니다',
      });
      loadChurchAdmins();
    } catch (err) {
      console.error('관리자 상태 변경 에러:', err);
      toast({
        variant: 'error',
        title: '상태 변경 실패',
      });
    }
  };

  // 통계 로드
  const loadStats = useCallback(async () => {
    if (!church) return;

    const supabase = getSupabaseBrowserClient();
    try {
      // 전체 댓글 수
      const { count: total } = await supabase
        .from('guest_comments')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id);
      setTotalComments(total || 0);

      // 전체 QT 글 수
      const { count: totalQt } = await supabase
        .from('church_qt_posts')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id);
      setTotalQtPosts(totalQt || 0);

      // 고유 작성자 수 (묵상 + QT 합산)
      const { data: writers } = await supabase
        .from('guest_comments')
        .select('guest_name')
        .eq('church_id', church.id);
      const { data: qtWriters } = await supabase
        .from('church_qt_posts')
        .select('author_name')
        .eq('church_id', church.id);
      const uniqueWriters = new Set([
        ...(writers?.map(w => w.guest_name) || []),
        ...(qtWriters?.map(w => w.author_name) || [])
      ]);
      setTotalWriters(uniqueWriters.size);

      // 오늘 댓글 수
      const today = getTodayDateString();
      const { count: todayCount } = await supabase
        .from('guest_comments')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      setTodayComments(todayCount || 0);

      // 오늘 QT 글 수
      const { count: todayQtCount } = await supabase
        .from('church_qt_posts')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      setTodayQtPosts(todayQtCount || 0);

      // 이번 주 댓글 수
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: weekCount } = await supabase
        .from('guest_comments')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id)
        .gte('created_at', weekAgo.toISOString());
      setWeekComments(weekCount || 0);

      // 이번 주 QT 글 수
      const { count: weekQtCount } = await supabase
        .from('church_qt_posts')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id)
        .gte('created_at', weekAgo.toISOString());
      setWeekQtPosts(weekQtCount || 0);

      // 일별 통계 (최근 30일)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: dailyData } = await supabase
        .from('guest_comments')
        .select('created_at')
        .eq('church_id', church.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // 데이터가 있든 없든 최근 30일 차트 생성
      const dailyMap = new Map<string, number>();
      if (dailyData) {
        dailyData.forEach(item => {
          const date = item.created_at.split('T')[0];
          dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
        });
      }

      // 최근 30일 전체 날짜를 채워서 빈 날짜도 0으로 표시
      const last30Days: DailyStats[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last30Days.push({
          date: dateStr,
          count: dailyMap.get(dateStr) || 0
        });
      }
      setDailyStats(last30Days);

      // 작성자별 통계
      const { data: writerData } = await supabase
        .from('guest_comments')
        .select('guest_name, created_at')
        .eq('church_id', church.id)
        .order('created_at', { ascending: false });

      if (writerData) {
        const writerMap = new Map<string, { count: number; lastDate: string }>();
        writerData.forEach(item => {
          const existing = writerMap.get(item.guest_name);
          if (!existing) {
            writerMap.set(item.guest_name, {
              count: 1,
              lastDate: item.created_at,
            });
          } else {
            writerMap.set(item.guest_name, {
              count: existing.count + 1,
              lastDate: existing.lastDate,
            });
          }
        });
        setWriterStats(
          Array.from(writerMap.entries())
            .map(([name, data]) => ({
              name,
              count: data.count,
              lastWriteDate: data.lastDate,
            }))
            .sort((a, b) => b.count - a.count)
        );
      }

      // 등록 교인 통계
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id);
      setRegisteredMembers(memberCount || 0);

      // 이번 주 신규 등록
      const { count: newMemberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id)
        .gte('church_joined_at', weekAgo.toISOString());
      setNewMembersWeek(newMemberCount || 0);

      // 등록 교인이 작성한 묵상 수
      const { count: linkedCount } = await supabase
        .from('guest_comments')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', church.id)
        .not('linked_user_id', 'is', null);
      setLinkedComments(linkedCount || 0);
    } catch (err) {
      console.error('통계 로드 에러:', err);
    }
  }, [church]);

  // 댓글 로드
  const loadComments = useCallback(async () => {
    if (!church) return;
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    try {
      let query = supabase
        .from('guest_comments')
        .select('*')
        .eq('church_id', church.id)
        .order('created_at', { ascending: false });

      // 검색 필터
      if (searchQuery) {
        query = query.or(`guest_name.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      // 월별 필터
      if (filterMonth !== 'all') {
        const year = new Date().getFullYear();
        const monthStart = `${year}-${filterMonth.padStart(2, '0')}-01`;
        const nextMonth = parseInt(filterMonth) + 1;
        const monthEnd = nextMonth > 12
          ? `${year + 1}-01-01`
          : `${year}-${nextMonth.toString().padStart(2, '0')}-01`;
        query = query.gte('created_at', monthStart).lt('created_at', monthEnd);
      }

      // 작성자 필터
      if (filterWriter !== 'all') {
        query = query.eq('guest_name', filterWriter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('댓글 로드 에러:', err);
    } finally {
      setLoading(false);
    }
  }, [church, searchQuery, filterMonth, filterWriter]);

  // QT 글 로드
  const loadQtPosts = useCallback(async () => {
    if (!church) return;

    const supabase = getSupabaseBrowserClient();
    try {
      let query = supabase
        .from('church_qt_posts')
        .select('*')
        .eq('church_id', church.id)
        .order('created_at', { ascending: false });

      // 검색 필터
      if (searchQuery) {
        query = query.or(`author_name.ilike.%${searchQuery}%,my_sentence.ilike.%${searchQuery}%,meditation_answer.ilike.%${searchQuery}%`);
      }

      // 월별 필터
      if (filterMonth !== 'all') {
        const year = new Date().getFullYear();
        const monthStart = `${year}-${filterMonth.padStart(2, '0')}-01`;
        const nextMonth = parseInt(filterMonth) + 1;
        const monthEnd = nextMonth > 12
          ? `${year + 1}-01-01`
          : `${year}-${nextMonth.toString().padStart(2, '0')}-01`;
        query = query.gte('created_at', monthStart).lt('created_at', monthEnd);
      }

      // 작성자 필터
      if (filterWriter !== 'all') {
        query = query.eq('author_name', filterWriter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQtPosts(data || []);
    } catch (err) {
      console.error('QT 글 로드 에러:', err);
    }
  }, [church, searchQuery, filterMonth, filterWriter]);

  // 공지사항 로드
  const loadNotices = useCallback(async () => {
    if (!church) return;
    setNoticesLoading(true);

    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase
        .from('church_notices')
        .select('*')
        .eq('church_id', church.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (err) {
      console.error('공지사항 로드 에러:', err);
    } finally {
      setNoticesLoading(false);
    }
  }, [church]);

  // 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadChurchInfo();
    }
  }, [isAuthenticated, loadChurchInfo]);

  useEffect(() => {
    if (church) {
      loadStats();
      loadComments();
      loadQtPosts();
      loadNotices();
      loadChurchAdmins();
      // 설정 초기화
      setEditName(church.name);
      setEditDenomination(church.denomination || '');
      setEditAddress(church.address || '');
      setEditAllowAnonymous(church.allow_anonymous);
      setEditScheduleYear(church.schedule_year || new Date().getFullYear());
    }
  }, [church, loadStats, loadComments, loadQtPosts, loadNotices, loadChurchAdmins]);

  // 등록 교인 목록 로드
  const loadMembers = useCallback(async () => {
    if (!church) return;
    setMembersLoading(true);

    const supabase = getSupabaseBrowserClient();
    try {
      // 등록 교인 목록 가져오기
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nickname, email, avatar_url, church_joined_at')
        .eq('church_id', church.id)
        .order('church_joined_at', { ascending: false });

      if (profilesError) throw profilesError;

      // 각 교인의 댓글 수, QT 수, 마지막 활동, 리딩지저스 진척도 가져오기
      const membersWithStats = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // 묵상글 개수
          const { count } = await supabase
            .from('guest_comments')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', church.id)
            .eq('linked_user_id', profile.id);

          // QT 글 개수 (church_qt_posts 테이블에서 조회)
          const { count: qtCount } = await supabase
            .from('church_qt_posts')
            .select('*', { count: 'exact', head: true })
            .eq('church_id', church.id)
            .eq('user_id', profile.id);

          const { data: lastComment } = await supabase
            .from('guest_comments')
            .select('created_at')
            .eq('church_id', church.id)
            .eq('linked_user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // 리딩지저스 진척도 가져오기
          // 1순위: church_reading_checks (교회 등록 교인용)
          // 2순위: 그룹 멤버십 기반 daily_checks
          let readingProgress = null;
          try {
            // 교회 리딩지저스 일정 총 일수 (reading_plan.json 기준)
            const churchTotalDays = getTotalReadingDays();

            // 교회 읽음 체크 데이터 확인
            const { count: churchCompletedCount } = await supabase
              .from('church_reading_checks')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id)
              .eq('church_id', church.id);

            if (churchCompletedCount && churchCompletedCount > 0) {
              // 교회 등록 교인의 리딩지저스 진행률
              readingProgress = {
                groupName: '리딩지저스',
                completedDays: churchCompletedCount,
                totalDays: churchTotalDays,
                progressPercent: Math.round((churchCompletedCount / churchTotalDays) * 100),
              };
            } else {
              // 그룹 멤버십 기반 진행률 (fallback)
              const { data: membership } = await supabase
                .from('group_members')
                .select('group_id, groups(name, start_date, reading_plan_type)')
                .eq('user_id', profile.id)
                .order('joined_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (membership?.group_id) {
                const { count: completedCount } = await supabase
                  .from('daily_checks')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', profile.id)
                  .eq('group_id', membership.group_id)
                  .eq('is_read', true);

                const groupData = membership.groups as unknown;
                const group = groupData as { name: string; start_date: string; reading_plan_type: string } | null;
                // 그룹 reading_plan_type에 따른 총 일수 결정
                // 기본값은 리딩지저스 통독 일정 총 일수
                let totalDays = getTotalReadingDays();
                if (group?.reading_plan_type === '180') totalDays = 180;
                else if (group?.reading_plan_type === '90') totalDays = 90;

                const completed = completedCount || 0;
                readingProgress = {
                  groupName: group?.name || '그룹',
                  completedDays: completed,
                  totalDays,
                  progressPercent: Math.round((completed / totalDays) * 100),
                };
              }
            }
          } catch {
            // 진척도 로드 실패 시 무시
          }

          return {
            ...profile,
            comment_count: count || 0,
            qt_count: qtCount || 0,
            last_comment_at: lastComment?.created_at || null,
            reading_progress: readingProgress,
          };
        })
      );

      setMembers(membersWithStats);
    } catch (err) {
      console.error('교인 목록 로드 에러:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [church]);

  // 교인 탭 선택 시 목록 로드
  useEffect(() => {
    if (activeTab === 'members' && church) {
      loadMembers();
    }
  }, [activeTab, church, loadMembers]);

  // 그룹 목록 로드
  const loadChurchGroups = useCallback(async () => {
    if (!church) return;
    setGroupsLoading(true);

    const supabase = getSupabaseBrowserClient();
    try {
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select('*')
        .eq('church_id', church.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 각 그룹의 멤버 수 및 진행률 계산
      const groupsWithStats = await Promise.all(
        (groupsData || []).map(async (group: { id: string; name: string; description: string | null; start_date: string; reading_plan_type: string; invite_code: string }) => {
          // 멤버 수
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // 진행률 계산
          const { data: checks } = await supabase
            .from('daily_checks')
            .select('is_read')
            .eq('group_id', group.id);

          // 그룹 reading_plan_type에 따른 총 일수 결정
          // '365' 또는 기본값은 리딩지저스 통독 일정 총 일수 사용
          const totalDays = group.reading_plan_type === '180' ? 180 :
                           group.reading_plan_type === '90' ? 90 : getTotalReadingDays();
          const completedChecks = checks?.filter(c => c.is_read).length || 0;
          const totalMembers = memberCount || 1;
          const expectedTotal = totalDays * totalMembers;
          const progressPercentage = expectedTotal > 0
            ? Math.round((completedChecks / expectedTotal) * 100)
            : 0;

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            member_count: memberCount || 0,
            progress_percentage: progressPercentage,
            start_date: group.start_date,
            reading_plan_type: group.reading_plan_type,
            invite_code: group.invite_code,
          };
        })
      );

      setChurchGroups(groupsWithStats);
    } catch (err) {
      console.error('그룹 목록 로드 에러:', err);
    } finally {
      setGroupsLoading(false);
    }
  }, [church]);

  // 그룹 탭 선택 시 목록 로드
  useEffect(() => {
    if (activeTab === 'groups' && church) {
      loadChurchGroups();
    }
  }, [activeTab, church, loadChurchGroups]);

  // YouTube Video ID 추출 함수
  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /youtu\.be\/([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Shorts 로드
  const loadShorts = useCallback(async () => {
    if (!church) return;
    setShortsLoading(true);

    const supabase = getSupabaseBrowserClient();
    try {
      const { data, error } = await supabase
        .from('church_shorts')
        .select('*')
        .eq('church_id', church.id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setShorts(data || []);
    } catch (err) {
      console.error('Shorts 로드 에러:', err);
    } finally {
      setShortsLoading(false);
    }
  }, [church]);

  // Shorts 탭에서 Shorts 로드
  useEffect(() => {
    if (activeTab === 'shorts' && church) {
      loadShorts();
    }
  }, [activeTab, church, loadShorts]);

  // Shorts 추가
  const handleAddShort = async () => {
    if (!church || !newShortUrl.trim()) return;

    const videoId = extractYouTubeVideoId(newShortUrl.trim());
    if (!videoId) {
      toast({ variant: 'error', title: '올바른 YouTube URL을 입력해주세요' });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setShortsLoading(true);
    try {
      const maxOrder = shorts.length > 0 ? Math.max(...shorts.map(s => s.display_order)) : 0;

      const { error } = await supabase
        .from('church_shorts')
        .insert({
          church_id: church.id,
          youtube_url: newShortUrl.trim(),
          video_id: videoId,
          title: newShortTitle.trim() || null,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          display_order: maxOrder + 1,
          is_active: true,
        });

      if (error) throw error;

      toast({ variant: 'success', title: 'Shorts가 추가되었습니다' });
      setNewShortUrl('');
      setNewShortTitle('');
      loadShorts();
    } catch (err) {
      console.error('Shorts 추가 에러:', err);
      toast({ variant: 'error', title: 'Shorts 추가 실패' });
    } finally {
      setShortsLoading(false);
    }
  };

  // Shorts 삭제
  const handleDeleteShort = async () => {
    if (!shortToDelete) return;

    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('church_shorts')
        .delete()
        .eq('id', shortToDelete.id);

      if (error) throw error;

      toast({ variant: 'success', title: 'Shorts가 삭제되었습니다' });
      setDeleteShortConfirmOpen(false);
      setShortToDelete(null);
      loadShorts();
    } catch (err) {
      console.error('Shorts 삭제 에러:', err);
      toast({ variant: 'error', title: 'Shorts 삭제 실패' });
    }
  };

  // Shorts 활성화/비활성화 토글
  const handleToggleShortActive = async (short: ChurchShort) => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('church_shorts')
        .update({ is_active: !short.is_active })
        .eq('id', short.id);

      if (error) throw error;
      loadShorts();
    } catch (err) {
      console.error('Shorts 상태 변경 에러:', err);
      toast({ variant: 'error', title: '상태 변경 실패' });
    }
  };

  // Shorts 순서 변경 (위로)
  const handleMoveShortUp = async (index: number) => {
    if (index <= 0) return;

    const currentShort = shorts[index];
    const prevShort = shorts[index - 1];

    const supabase = getSupabaseBrowserClient();
    try {
      await Promise.all([
        supabase.from('church_shorts').update({ display_order: prevShort.display_order }).eq('id', currentShort.id),
        supabase.from('church_shorts').update({ display_order: currentShort.display_order }).eq('id', prevShort.id),
      ]);
      loadShorts();
    } catch (err) {
      console.error('순서 변경 에러:', err);
    }
  };

  // Shorts 순서 변경 (아래로)
  const handleMoveShortDown = async (index: number) => {
    if (index >= shorts.length - 1) return;

    const currentShort = shorts[index];
    const nextShort = shorts[index + 1];

    const supabase = getSupabaseBrowserClient();
    try {
      await Promise.all([
        supabase.from('church_shorts').update({ display_order: nextShort.display_order }).eq('id', currentShort.id),
        supabase.from('church_shorts').update({ display_order: currentShort.display_order }).eq('id', nextShort.id),
      ]);
      loadShorts();
    } catch (err) {
      console.error('순서 변경 에러:', err);
    }
  };

  // 공지사항 저장/수정
  const handleSaveNotice = async () => {
    if (!church || !noticeTitle.trim() || !noticeContent.trim()) {
      toast({ variant: 'error', title: '제목과 내용을 입력해주세요' });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    setNoticeSaving(true);
    try {
      if (editingNotice) {
        // 수정
        const { error } = await supabase
          .from('church_notices')
          .update({
            title: noticeTitle.trim(),
            content: noticeContent.trim(),
            is_pinned: noticeIsPinned,
            is_active: noticeIsActive,
          })
          .eq('id', editingNotice.id);

        if (error) throw error;
        toast({ variant: 'success', title: '공지사항이 수정되었습니다' });
      } else {
        // 새로 추가
        const { error } = await supabase
          .from('church_notices')
          .insert({
            church_id: church.id,
            title: noticeTitle.trim(),
            content: noticeContent.trim(),
            is_pinned: noticeIsPinned,
            is_active: noticeIsActive,
          });

        if (error) throw error;
        toast({ variant: 'success', title: '공지사항이 등록되었습니다' });
      }

      setNoticeDialogOpen(false);
      resetNoticeForm();
      loadNotices();
    } catch (err) {
      console.error('공지사항 저장 에러:', err);
      toast({ variant: 'error', title: '공지사항 저장에 실패했습니다' });
    } finally {
      setNoticeSaving(false);
    }
  };

  // 공지사항 삭제
  const handleDeleteNotice = async () => {
    if (!noticeToDelete) return;

    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('church_notices')
        .delete()
        .eq('id', noticeToDelete.id);

      if (error) throw error;

      toast({ variant: 'success', title: '공지사항이 삭제되었습니다' });
      setDeleteNoticeConfirmOpen(false);
      setNoticeToDelete(null);
      loadNotices();
    } catch (err) {
      console.error('공지사항 삭제 에러:', err);
      toast({ variant: 'error', title: '공지사항 삭제에 실패했습니다' });
    }
  };

  // 공지사항 고정 토글
  const handleToggleNoticePin = async (notice: ChurchNotice) => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('church_notices')
        .update({ is_pinned: !notice.is_pinned })
        .eq('id', notice.id);

      if (error) throw error;
      loadNotices();
    } catch (err) {
      console.error('공지사항 고정 토글 에러:', err);
    }
  };

  // 공지사항 활성화 토글
  const handleToggleNoticeActive = async (notice: ChurchNotice) => {
    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('church_notices')
        .update({ is_active: !notice.is_active })
        .eq('id', notice.id);

      if (error) throw error;
      loadNotices();
    } catch (err) {
      console.error('공지사항 활성화 토글 에러:', err);
    }
  };

  // 공지사항 폼 초기화
  const resetNoticeForm = () => {
    setEditingNotice(null);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticeIsPinned(false);
    setNoticeIsActive(true);
  };

  // 공지사항 수정 다이얼로그 열기
  const openEditNoticeDialog = (notice: ChurchNotice) => {
    setEditingNotice(notice);
    setNoticeTitle(notice.title);
    setNoticeContent(notice.content);
    setNoticeIsPinned(notice.is_pinned);
    setNoticeIsActive(notice.is_active);
    setNoticeDialogOpen(true);
  };

  // 교회 설정 저장
  const handleSaveSettings = async () => {
    if (!church) return;

    const supabase = getSupabaseBrowserClient();
    setSettingsLoading(true);

    try {
      const { error } = await supabase
        .from('churches')
        .update({
          name: editName.trim(),
          denomination: editDenomination.trim() || null,
          address: editAddress.trim() || null,
          allow_anonymous: editAllowAnonymous,
          schedule_year: editScheduleYear,
        })
        .eq('id', church.id);

      if (error) throw error;

      toast({ variant: 'success', title: '설정이 저장되었습니다' });
      loadChurchInfo();
    } catch (err) {
      console.error('설정 저장 에러:', err);
      toast({ variant: 'error', title: '설정 저장에 실패했습니다' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // 토큰 재생성
  const handleRegenerateToken = async () => {
    if (!church) return;

    const supabase = getSupabaseBrowserClient();
    setSettingsLoading(true);

    try {
      const newToken = tokenType === 'write'
        ? `write-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`
        : `admin-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;

      const updateField = tokenType === 'write' ? 'write_token' : 'admin_token';

      const { error } = await supabase
        .from('churches')
        .update({ [updateField]: newToken })
        .eq('id', church.id);

      if (error) throw error;

      // admin 토큰 재생성 시 로컬 스토리지도 업데이트
      if (tokenType === 'admin') {
        localStorage.setItem(getAdminTokenKey(churchCode), newToken);
      }

      toast({ variant: 'success', title: `${tokenType === 'write' ? '작성' : '관리자'} 토큰이 재생성되었습니다` });
      setTokenRegenConfirmOpen(false);
      loadChurchInfo();
    } catch (err) {
      console.error('토큰 재생성 에러:', err);
      toast({ variant: 'error', title: '토큰 재생성에 실패했습니다' });
    } finally {
      setSettingsLoading(false);
    }
  };

  // 링크 복사
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ variant: 'success', title: `${label}가 복사되었습니다` });
    } catch {
      toast({ variant: 'error', title: '복사에 실패했습니다' });
    }
  };

  // 교인 해제
  const handleRemoveMember = async () => {
    if (!selectedMember || !church) return;

    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ church_id: null, church_joined_at: null })
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast({ variant: 'success', title: `${selectedMember.nickname}님이 교회에서 해제되었습니다` });
      setRemoveMemberConfirmOpen(false);
      setSelectedMember(null);
      loadMembers();
      loadStats();
    } catch (err) {
      console.error('교인 해제 에러:', err);
      toast({ variant: 'error', title: '교인 해제에 실패했습니다' });
    }
  };

  // 필터링된 교인 목록
  const filteredMembers = members.filter(m =>
    memberSearchQuery
      ? m.nickname.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(memberSearchQuery.toLowerCase()))
      : true
  );
  const paginatedMembers = filteredMembers.slice(
    (memberPage - 1) * MEMBERS_PER_PAGE,
    memberPage * MEMBERS_PER_PAGE
  );
  const totalMemberPages = Math.ceil(filteredMembers.length / MEMBERS_PER_PAGE);

  // 댓글 삭제
  const handleDeleteComment = async () => {
    if (!selectedComment) return;

    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('guest_comments')
        .delete()
        .eq('id', selectedComment.id);

      if (error) throw error;

      toast({ variant: 'success', title: '삭제되었습니다' });
      setDeleteConfirmOpen(false);
      setSelectedComment(null);
      loadComments();
      loadStats();
    } catch (err) {
      console.error('삭제 에러:', err);
      toast({ variant: 'error', title: '삭제에 실패했습니다' });
    }
  };

  // QT 글 삭제
  const handleDeleteQtPost = async () => {
    if (!selectedQtPost) return;

    const supabase = getSupabaseBrowserClient();
    try {
      const { error } = await supabase
        .from('church_qt_posts')
        .delete()
        .eq('id', selectedQtPost.id);

      if (error) throw error;

      toast({ variant: 'success', title: 'QT 글이 삭제되었습니다' });
      setDeleteQtConfirmOpen(false);
      setSelectedQtPost(null);
      loadQtPosts();
      loadStats();
    } catch (err) {
      console.error('QT 글 삭제 에러:', err);
      toast({ variant: 'error', title: '삭제에 실패했습니다' });
    }
  };

  // CSV 내보내기 (글 목록)
  const exportToCSV = () => {
    if (!comments.length) return;

    const headers = ['작성자', '내용', '성경 범위', '익명', '작성일'];
    const rows = comments.map(c => [
      c.is_anonymous ? '익명' : c.guest_name,
      `"${c.content.replace(/"/g, '""')}"`,
      c.bible_range || '',
      c.is_anonymous ? 'Y' : 'N',
      new Date(c.created_at).toLocaleString('ko-KR'),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${churchCode}_묵상글_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 통계 CSV 내보내기 (대시보드)
  const exportStatsToCSV = () => {
    const filteredStats = chartPeriod === 0
      ? dailyStats
      : dailyStats.slice(-chartPeriod);

    if (!filteredStats.length) return;

    const headers = ['날짜', '작성 수'];
    const rows = filteredStats.map(s => [
      s.date,
      s.count.toString(),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const periodLabel = chartPeriod === 0 ? '전체' : `${chartPeriod}일`;
    link.download = `${churchCode}_통계_${periodLabel}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 페이지네이션
  const paginatedComments = comments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(comments.length / ITEMS_PER_PAGE);

  // 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 로그인 화면 - 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 lg:ml-20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>교회 관리자 페이지</CardTitle>
            <CardDescription>
              관리자 인증이 필요합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 로그인 페이지로 이동 버튼 */}
            <Button
              className="w-full"
              onClick={() => router.push(`/church/${churchCode}/admin/login`)}
            >
              <Lock className="w-4 h-4 mr-2" />
              관리자 로그인
            </Button>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  또는 토큰 입력
                </span>
              </div>
            </div>

            {/* 기존 토큰 입력 방식 */}
            <div className="space-y-2">
              <Label htmlFor="token">관리자 토큰</Label>
              <Input
                id="token"
                type="password"
                placeholder="admin-xxxxx-xxxxxxxx"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button variant="outline" className="w-full" onClick={handleLogin}>
              토큰으로 접근
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              관리자 계정이 없으시면 시스템 관리자에게 문의하세요
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 lg:ml-20">
      {/* 헤더 */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Church className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-base md:text-lg">{church?.name || '교회'}</h1>
                <p className="text-xs md:text-sm text-muted-foreground">관리자 대시보드</p>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 md:px-3"
                onClick={() => router.push(`/church/${churchCode}`)}
              >
                <Eye className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">공개 페이지</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 md:px-3"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-7 h-auto">
            <TabsTrigger value="dashboard" className="text-xs md:text-sm py-2 gap-1 md:gap-2">
              <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">대시보드</span>
              <span className="md:hidden">통계</span>
            </TabsTrigger>
            <TabsTrigger value="notices" className="text-xs md:text-sm py-2 gap-1 md:gap-2">
              <Bell className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">공지</span>
              <span className="md:hidden">공지</span>
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-xs md:text-sm py-2 gap-1 md:gap-2">
              <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">묵상/QT</span>
              <span className="md:hidden">글</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs md:text-sm py-2 gap-1 md:gap-2">
              <UsersRound className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">그룹</span>
              <span className="md:hidden">그룹</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs md:text-sm py-2 gap-1 md:gap-2">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">교인</span>
              <span className="md:hidden">교인</span>
            </TabsTrigger>
            <TabsTrigger value="shorts" className="text-xs md:text-sm py-2 gap-1 md:gap-2">
              <PlayCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">쇼츠</span>
              <span className="md:hidden">쇼츠</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs md:text-sm py-2 gap-1 md:gap-2">
              <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden md:inline">설정</span>
              <span className="md:hidden">설정</span>
            </TabsTrigger>
          </TabsList>

          {/* 대시보드 탭 */}
          <TabsContent value="dashboard" className="space-y-4 md:space-y-6">
            {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground truncate">짧은 묵상</p>
                  <p className="text-xl md:text-2xl font-bold">{totalComments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground truncate">QT 글</p>
                  <p className="text-xl md:text-2xl font-bold">{totalQtPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground truncate">오늘 작성</p>
                  <p className="text-xl md:text-2xl font-bold">{todayComments + todayQtPosts}</p>
                  <p className="text-[10px] text-muted-foreground">묵상 {todayComments} / QT {todayQtPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground truncate">주간 작성</p>
                  <p className="text-xl md:text-2xl font-bold">{weekComments + weekQtPosts}</p>
                  <p className="text-[10px] text-muted-foreground">묵상 {weekComments} / QT {weekQtPosts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 참여자 통계 */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm text-muted-foreground truncate">총 참여자 수</p>
                <p className="text-xl md:text-2xl font-bold">{totalWriters}명</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>전체 글: {totalComments + totalQtPosts}개</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 등록 교인 통계 */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <UserCheck className="w-4 h-4 md:w-5 md:h-5" />
              등록 교인 현황
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              교회 코드를 통해 등록한 교인들의 통계입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-1.5 md:mb-2">
                  <UserCheck className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                </div>
                <p className="text-xl md:text-2xl font-bold">{registeredMembers}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">등록 교인</p>
              </div>

              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-1.5 md:mb-2">
                  <UserPlus className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                </div>
                <p className="text-xl md:text-2xl font-bold">{newMembersWeek}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">이번 주 신규</p>
              </div>

              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-1.5 md:mb-2">
                  <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                </div>
                <p className="text-xl md:text-2xl font-bold">{linkedComments}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">교인 작성 묵상</p>
              </div>

              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-1.5 md:mb-2">
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                </div>
                <p className="text-xl md:text-2xl font-bold">
                  {totalComments > 0 ? Math.round((linkedComments / totalComments) * 100) : 0}%
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">교인 작성 비율</p>
              </div>
            </div>

            {registeredMembers === 0 && (
              <p className="text-center text-muted-foreground mt-3 md:mt-4 text-xs md:text-sm">
                아직 등록 교인이 없습니다. 교인들에게 교회 코드({church?.code})를 안내해주세요.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 기간 필터 + CSV 내보내기 */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">기간:</span>
            {([7, 30, 90, 0] as const).map((period) => (
              <Button
                key={period}
                variant={chartPeriod === period ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setChartPeriod(period)}
              >
                {period === 0 ? '전체' : `${period}일`}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={exportStatsToCSV}
            disabled={dailyStats.length === 0}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            CSV 다운로드
          </Button>
        </div>

        {/* 차트 & 랭킹 (PC에서 2열) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* 일별 작성 추이 차트 (AreaChart) */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                일별 작성 추이
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const filteredStats = chartPeriod === 0
                  ? dailyStats
                  : dailyStats.slice(-chartPeriod);

                if (filteredStats.length === 0) {
                  return (
                    <p className="text-center text-muted-foreground py-6 md:py-8 text-sm">
                      아직 작성된 묵상글이 없습니다
                    </p>
                  );
                }

                return (
                  <div className="h-48 md:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={filteredStats}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(value) => {
                            const d = new Date(value);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }}
                          interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip
                          labelFormatter={(value) => {
                            const d = new Date(value as string);
                            return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
                          }}
                          formatter={(value) => [`${value}개`, '작성 수']}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorCount)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* 작성자 랭킹 */}
          <Card>
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                작성자 순위 (TOP 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {writerStats.length > 0 ? (
                <div className="space-y-1.5 md:space-y-2 max-h-[280px] md:max-h-none overflow-y-auto">
                  {writerStats.slice(0, 10).map((writer, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 md:gap-3 p-1.5 md:p-2 rounded-lg hover:bg-muted/50"
                    >
                      <span className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs md:text-sm font-bold shrink-0 ${
                        idx === 0 ? 'bg-accent/20 text-foreground' :
                        idx === 1 ? 'bg-gray-100 text-gray-700' :
                        idx === 2 ? 'bg-accent/10 text-accent' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="flex-1 font-medium text-sm md:text-base truncate">{writer.name}</span>
                      <span className="text-xs md:text-sm text-muted-foreground shrink-0">
                        {writer.count}개
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  아직 참여자가 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 요일별 작성 분포 (BarChart) */}
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              요일별 작성 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
              const filteredStats = chartPeriod === 0
                ? dailyStats
                : dailyStats.slice(-chartPeriod);

              if (filteredStats.length === 0) {
                return (
                  <p className="text-center text-muted-foreground py-6 md:py-8 text-sm">
                    데이터가 없습니다
                  </p>
                );
              }

              // 요일별 집계
              const dayData = dayNames.map((name, idx) => {
                const count = filteredStats
                  .filter(s => new Date(s.date).getDay() === idx)
                  .reduce((sum, s) => sum + s.count, 0);
                return { name, count };
              });

              return (
                <div className="h-48 md:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip formatter={(value) => [`${value}개`, '작성 수']} />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </CardContent>
        </Card>
          </TabsContent>

          {/* 공지사항 관리 탭 */}
          <TabsContent value="notices" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Bell className="w-4 h-4 md:w-5 md:h-5" />
                    공지사항 관리
                    <span className="text-sm font-normal text-muted-foreground">
                      ({notices.length}개)
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs md:text-sm" onClick={loadNotices}>
                      <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
                      <span className="hidden md:inline">새로고침</span>
                    </Button>
                    <Button size="sm" className="h-8 text-xs md:text-sm" onClick={() => { resetNoticeForm(); setNoticeDialogOpen(true); }}>
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
                      <span className="hidden md:inline">공지 등록</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {noticesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : notices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>등록된 공지사항이 없습니다</p>
                    <p className="text-sm mt-1">새 공지사항을 등록해 보세요</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notices.map((notice) => (
                      <div
                        key={notice.id}
                        className={`border rounded-lg p-4 ${!notice.is_active ? 'opacity-50 bg-muted/50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {notice.is_pinned && (
                                <Pin className="w-3.5 h-3.5 text-accent" />
                              )}
                              <h4 className="font-medium truncate">{notice.title}</h4>
                              {!notice.is_active && (
                                <span className="text-xs px-2 py-0.5 bg-muted rounded-full">비활성</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{notice.content}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{new Date(notice.created_at).toLocaleDateString('ko-KR')}</span>
                              {notice.starts_at && (
                                <span>시작: {new Date(notice.starts_at).toLocaleDateString('ko-KR')}</span>
                              )}
                              {notice.ends_at && (
                                <span>종료: {new Date(notice.ends_at).toLocaleDateString('ko-KR')}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleNoticePin(notice)}
                              title={notice.is_pinned ? '고정 해제' : '상단 고정'}
                            >
                              {notice.is_pinned ? (
                                <PinOff className="w-4 h-4 text-accent" />
                              ) : (
                                <Pin className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleNoticeActive(notice)}
                              title={notice.is_active ? '비활성화' : '활성화'}
                            >
                              {notice.is_active ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditNoticeDialog(notice)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => { setNoticeToDelete(notice); setDeleteNoticeConfirmOpen(true); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 묵상글 관리 탭 */}
          <TabsContent value="posts" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                    글 관리
                    <span className="text-sm font-normal text-muted-foreground">
                      (묵상 {totalComments}개 / QT {totalQtPosts}개)
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs md:text-sm" onClick={() => { loadComments(); loadQtPosts(); }}>
                      <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
                      <span className="hidden md:inline">새로고침</span>
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs md:text-sm" onClick={exportToCSV}>
                      <Download className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
                      <span className="hidden md:inline">CSV 내보내기</span>
                      <span className="md:hidden">CSV</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
            {/* 필터 */}
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="이름 또는 내용 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterPostType} onValueChange={(v) => setFilterPostType(v as 'all' | 'meditation' | 'qt')}>
                  <SelectTrigger className="w-[90px] md:w-[100px] h-9 text-sm">
                    <SelectValue placeholder="글 타입" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="meditation">묵상</SelectItem>
                    <SelectItem value="qt">QT</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger className="w-[80px] md:w-[100px] h-9 text-sm">
                    <SelectValue placeholder="월" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <SelectItem key={m} value={m.toString()}>{m}월</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterWriter} onValueChange={setFilterWriter}>
                  <SelectTrigger className="w-[110px] md:w-[130px] h-9 text-sm">
                    <SelectValue placeholder="작성자" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 작성자</SelectItem>
                    {(writerStats || []).map(w => (
                      <SelectItem key={w.name} value={w.name}>
                        {w.name} ({w.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 묵상글 목록 */}
            {(filterPostType === 'all' || filterPostType === 'meditation') && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <h3 className="font-medium text-sm">짧은 묵상 ({paginatedComments.length}개)</h3>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-6 md:py-8">
                    <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : paginatedComments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    묵상글이 없습니다
                  </p>
                ) : (
                  <div className="space-y-2">
                    {paginatedComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 md:p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedComment(comment);
                          setDetailType('meditation');
                          setDetailDialogOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] bg-accent/10 text-accent dark:bg-accent dark:text-accent-foreground px-1.5 py-0.5 rounded">묵상</span>
                              <span className="font-medium text-sm md:text-base">
                                {comment.is_anonymous ? '익명' : comment.guest_name}
                              </span>
                              {comment.bible_range && (
                                <span className="text-[10px] md:text-xs bg-primary/10 text-primary px-1.5 md:px-2 py-0.5 rounded">
                                  {comment.bible_range}
                                </span>
                              )}
                              {comment.day_number && (
                                <span className="text-[10px] text-muted-foreground">
                                  {comment.day_number}일차
                                </span>
                              )}
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                              {comment.content.replace(/<[^>]*>/g, '')}
                            </p>
                            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                              {new Date(comment.created_at).toLocaleString('ko-KR')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComment(comment);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs md:text-sm text-muted-foreground min-w-[60px] text-center">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* QT 글 목록 */}
            {(filterPostType === 'all' || filterPostType === 'qt') && (
              <>
                <div className="flex items-center gap-2 pt-4 border-t">
                  <FileText className="w-4 h-4 text-accent" />
                  <h3 className="font-medium text-sm">QT 글 ({qtPosts.length}개)</h3>
                </div>
                {qtPosts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    QT 글이 없습니다
                  </p>
                ) : (
                  <div className="space-y-2">
                    {qtPosts.slice(0, 20).map((qtPost) => (
                      <div
                        key={qtPost.id}
                        className="p-3 md:p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedQtPost(qtPost);
                          setDetailType('qt');
                          setDetailDialogOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] bg-muted text-foreground dark:bg-primary dark:text-accent px-1.5 py-0.5 rounded">QT</span>
                              <span className="font-medium text-sm md:text-base">
                                {qtPost.is_anonymous ? '익명' : qtPost.author_name}
                              </span>
                              <span className="text-[10px] md:text-xs bg-primary/10 text-primary px-1.5 md:px-2 py-0.5 rounded">
                                {qtPost.qt_date}
                              </span>
                              {qtPost.day_number && (
                                <span className="text-[10px] text-muted-foreground">
                                  {qtPost.day_number}일차
                                </span>
                              )}
                            </div>
                            {qtPost.my_sentence && (
                              <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 mb-0.5">
                                <span className="text-primary font-medium">마음에 남는 말씀:</span> {qtPost.my_sentence}
                              </p>
                            )}
                            {qtPost.meditation_answer && (
                              <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                                <span className="text-primary font-medium">묵상:</span> {qtPost.meditation_answer}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-[10px] md:text-xs text-muted-foreground">
                                {new Date(qtPost.created_at).toLocaleString('ko-KR')}
                              </p>
                              <span className="text-[10px] text-muted-foreground">
                                ❤️ {qtPost.likes_count} · 💬 {qtPost.replies_count}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQtPost(qtPost);
                              setDeleteQtConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 그룹 관리 탭 */}
          <TabsContent value="groups" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <UsersRound className="w-4 h-4 md:w-5 md:h-5" />
                    소그룹 관리
                    <span className="text-sm font-normal text-muted-foreground">
                      ({churchGroups.length}개)
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs md:text-sm" onClick={loadChurchGroups}>
                      <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
                      <span className="hidden md:inline">새로고침</span>
                    </Button>
                    <Button size="sm" className="h-8 text-xs md:text-sm" onClick={() => router.push(`/church/${churchCode}/groups`)}>
                      <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
                      <span className="hidden md:inline">그룹 만들기</span>
                      <span className="md:hidden">추가</span>
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs md:text-sm">
                  교회 소속 그룹들의 진행 현황을 확인하고 관리합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : churchGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <UsersRound className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">
                      아직 소그룹이 없습니다
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      첫 번째 소그룹을 만들어보세요
                    </p>
                    <Button size="sm" onClick={() => router.push(`/church/${churchCode}/groups`)}>
                      <Plus className="w-4 h-4 mr-1" />
                      그룹 만들기
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {churchGroups.map((group) => (
                      <div
                        key={group.id}
                        className="p-3 md:p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/church/${churchCode}/groups/${group.id}`)}
                      >
                        <div className="flex items-center justify-between gap-2 md:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-sm md:text-base">{group.name}</h3>
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                공식
                              </span>
                            </div>
                            {group.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                {group.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {group.member_count}명
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {group.reading_plan_type}일
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                진행률 {group.progress_percentage}%
                              </span>
                            </div>
                            <div className="mt-2">
                              <Progress value={group.progress_percentage} className="h-1.5" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(group.invite_code);
                                toast({ variant: 'success', title: '초대 코드가 복사되었습니다', description: group.invite_code });
                              }}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/group/${group.id}/admin`);
                              }}
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </Button>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 그룹별 진척도 요약 */}
            {churchGroups.length > 0 && (
              <Card>
                <CardHeader className="pb-3 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                    그룹별 진행률 비교
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {churchGroups
                      .sort((a, b) => b.progress_percentage - a.progress_percentage)
                      .map((group, index) => (
                        <div key={group.id} className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-accent/20 text-foreground' :
                            index === 1 ? 'bg-gray-100 text-gray-700' :
                            index === 2 ? 'bg-accent/10 text-accent' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">{group.name}</span>
                              <span className="text-sm text-primary font-semibold">
                                {group.progress_percentage}%
                              </span>
                            </div>
                            <Progress value={group.progress_percentage} className="h-1.5" />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 교인 관리 탭 */}
          <TabsContent value="members" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Users className="w-4 h-4 md:w-5 md:h-5" />
                    등록 교인 관리
                    <span className="text-sm font-normal text-muted-foreground">
                      ({registeredMembers}명)
                    </span>
                  </CardTitle>
                  <Button variant="outline" size="sm" className="h-8 text-xs md:text-sm" onClick={loadMembers}>
                    <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
                    <span className="hidden md:inline">새로고침</span>
                  </Button>
                </div>
                <CardDescription className="text-xs md:text-sm">
                  교회 코드({church?.code})로 등록한 교인들을 관리합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 검색 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="이름 또는 이메일로 검색..."
                    value={memberSearchQuery}
                    onChange={(e) => {
                      setMemberSearchQuery(e.target.value);
                      setMemberPage(1);
                    }}
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                {/* 교인 목록 */}
                {membersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : paginatedMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">
                      {memberSearchQuery ? '검색 결과가 없습니다' : '아직 등록된 교인이 없습니다'}
                    </p>
                    {!memberSearchQuery && (
                      <p className="text-xs text-muted-foreground mt-1">
                        교인들에게 교회 코드를 안내해주세요
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 md:p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 md:gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              {member.avatar_url ? (
                                <Image
                                  src={member.avatar_url}
                                  alt={member.nickname}
                                  fill
                                  className="rounded-full object-cover"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-sm font-medium text-primary">
                                  {member.nickname.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm md:text-base truncate">
                                {member.nickname}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email || '이메일 없음'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-[10px] md:text-xs text-muted-foreground">
                                  가입: {new Date(member.church_joined_at).toLocaleDateString('ko-KR')}
                                </span>
                                <span className="text-[10px] md:text-xs text-muted-foreground">
                                  • 묵상 {member.comment_count}개
                                </span>
                                <span className="text-[10px] md:text-xs text-muted-foreground">
                                  • QT {member.qt_count}개
                                </span>
                                {member.last_comment_at && (
                                  <span className="text-[10px] md:text-xs text-muted-foreground">
                                    • 최근 활동 {new Date(member.last_comment_at).toLocaleDateString('ko-KR')}
                                  </span>
                                )}
                              </div>
                              {/* 리딩지저스 진척도 */}
                              {member.reading_progress && (
                                <div className="mt-2 p-2 bg-primary/5 rounded-md">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1">
                                      <Target className="w-3 h-3" />
                                      {member.reading_progress.groupName}
                                    </span>
                                    <span className="text-[10px] md:text-xs font-medium text-primary">
                                      {member.reading_progress.completedDays}/{member.reading_progress.totalDays}일 ({member.reading_progress.progressPercent}%)
                                    </span>
                                  </div>
                                  <Progress value={member.reading_progress.progressPercent} className="h-1.5" />
                                </div>
                              )}
                              {member.reading_progress === null && (
                                <p className="text-[10px] text-muted-foreground mt-1.5 italic">
                                  리딩지저스 그룹 미참여
                                </p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setRemoveMemberConfirmOpen(true);
                                }}
                              >
                                <UserMinus className="w-4 h-4 mr-2" />
                                교회에서 해제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 페이지네이션 */}
                {totalMemberPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setMemberPage(p => Math.max(1, p - 1))}
                      disabled={memberPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs md:text-sm text-muted-foreground min-w-[60px] text-center">
                      {memberPage} / {totalMemberPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setMemberPage(p => Math.min(totalMemberPages, p + 1))}
                      disabled={memberPage === totalMemberPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 쇼츠 탭 */}
          <TabsContent value="shorts" className="space-y-4 md:space-y-6">
            {/* YouTube Shorts 관리 */}
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <PlayCircle className="w-4 h-4 md:w-5 md:h-5" />
                  YouTube Shorts 관리
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  교회 홈페이지에 표시할 YouTube Shorts를 관리합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Shorts 추가 폼 */}
                <div className="p-3 md:p-4 bg-muted/50 rounded-lg space-y-3">
                  <p className="text-sm font-medium">새 Shorts 추가</p>
                  <div className="space-y-2">
                    <Input
                      placeholder="YouTube Shorts URL (예: https://youtube.com/shorts/...)"
                      value={newShortUrl}
                      onChange={(e) => setNewShortUrl(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Input
                      placeholder="제목 (선택사항)"
                      value={newShortTitle}
                      onChange={(e) => setNewShortTitle(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleAddShort}
                    disabled={shortsLoading || !newShortUrl.trim()}
                    size="sm"
                    className="w-full gap-1"
                  >
                    {shortsLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        추가 중...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Shorts 추가
                      </>
                    )}
                  </Button>
                </div>

                {/* Shorts 목록 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">등록된 Shorts ({shorts.length})</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadShorts}
                      className="h-7 text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      새로고침
                    </Button>
                  </div>

                  {shortsLoading && shorts.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : shorts.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      등록된 Shorts가 없습니다
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shorts.map((short, index) => (
                        <div
                          key={short.id}
                          className={`flex items-center gap-3 p-3 bg-muted/30 rounded-lg ${
                            !short.is_active ? 'opacity-50' : ''
                          }`}
                        >
                          {/* 썸네일 */}
                          <div className="relative w-16 h-28 flex-shrink-0 rounded overflow-hidden bg-muted">
                            <Image
                              src={short.thumbnail_url || `https://img.youtube.com/vi/${short.video_id}/hqdefault.jpg`}
                              alt={short.title || 'Shorts'}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>

                          {/* 정보 */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {short.title || `Shorts #${index + 1}`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {short.youtube_url}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                short.is_active
                                  ? 'bg-accent/10 text-accent'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {short.is_active ? '표시 중' : '숨김'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                순서: {index + 1}
                              </span>
                            </div>
                          </div>

                          {/* 액션 버튼들 */}
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleMoveShortUp(index)}
                                disabled={index === 0}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleMoveShortDown(index)}
                                disabled={index === shorts.length - 1}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => window.open(short.youtube_url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleToggleShortActive(short)}
                              >
                                <Eye className={`w-4 h-4 ${short.is_active ? '' : 'text-muted-foreground'}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-destructive"
                                onClick={() => {
                                  setShortToDelete(short);
                                  setDeleteShortConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 설정 탭 */}
          <TabsContent value="settings" className="space-y-4 md:space-y-6">
            {/* 교회 정보 설정 */}
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Church className="w-4 h-4 md:w-5 md:h-5" />
                  교회 정보
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  교회 기본 정보를 수정합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="church-name" className="text-sm">교회 이름</Label>
                    <Input
                      id="church-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="교회 이름"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="denomination" className="text-sm">교단</Label>
                    <Input
                      id="denomination"
                      value={editDenomination}
                      onChange={(e) => setEditDenomination(e.target.value)}
                      placeholder="교단 (선택)"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm">주소</Label>
                  <Textarea
                    id="address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="교회 주소 (선택)"
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-year" className="text-sm">일정 년도</Label>
                    <Select
                      value={editScheduleYear.toString()}
                      onValueChange={(v) => setEditScheduleYear(parseInt(v))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026, 2027].map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}년</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between space-x-2 p-3 rounded-lg bg-muted/50">
                    <div>
                      <Label htmlFor="allow-anonymous" className="text-sm font-medium">익명 작성 허용</Label>
                      <p className="text-xs text-muted-foreground">묵상글 작성 시 익명 선택 가능</p>
                    </div>
                    <Switch
                      id="allow-anonymous"
                      checked={editAllowAnonymous}
                      onCheckedChange={setEditAllowAnonymous}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveSettings}
                  disabled={settingsLoading || !editName.trim()}
                  className="w-full md:w-auto"
                >
                  {settingsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    '설정 저장'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* 링크 및 토큰 관리 */}
            <Card>
              <CardHeader className="pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <LinkIcon className="w-4 h-4 md:w-5 md:h-5" />
                  링크 및 토큰 관리
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  공유 링크를 복사하거나 토큰을 재발급합니다
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 교회 코드 */}
                <div className="p-3 md:p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">교회 코드</p>
                      <p className="text-xs text-muted-foreground">교인 등록에 사용되는 코드</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-background px-2 py-1 rounded border">{church?.code}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => copyToClipboard(church?.code || '', '교회 코드')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 공개 페이지 링크 */}
                <div className="p-3 md:p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">공개 페이지</p>
                      <p className="text-xs text-muted-foreground break-all">
                        {typeof window !== 'undefined' ? `${window.location.origin}/church/${church?.code}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => copyToClipboard(`${window.location.origin}/church/${church?.code}`, '공개 페이지 링크')}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        <span className="hidden md:inline">복사</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => window.open(`/church/${church?.code}`, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden md:inline">열기</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 작성 토큰 링크 */}
                <div className="p-3 md:p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">작성 권한 링크</p>
                      <p className="text-xs text-muted-foreground">이 링크로 접속하면 묵상글 작성 가능</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => copyToClipboard(
                          `${window.location.origin}/church/${church?.code}?token=${church?.write_token}`,
                          '작성 권한 링크'
                        )}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        <span className="hidden md:inline">복사</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-accent hover:text-foreground"
                        onClick={() => {
                          setTokenType('write');
                          setTokenRegenConfirmOpen(true);
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        <span className="hidden md:inline">재발급</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 관리자 토큰 링크 */}
                <div className="p-3 md:p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">관리자 링크</p>
                      <p className="text-xs text-muted-foreground">이 링크로 관리자 페이지 접근 가능</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => copyToClipboard(
                          `${window.location.origin}/church/${church?.code}/admin?token=${church?.admin_token}`,
                          '관리자 링크'
                        )}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        <span className="hidden md:inline">복사</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-red-600 hover:text-red-700"
                        onClick={() => {
                          setTokenType('admin');
                          setTokenRegenConfirmOpen(true);
                        }}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        <span className="hidden md:inline">재발급</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* QR 코드 생성 버튼 */}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => router.push(`/church/${churchCode}`)}
                >
                  <QrCode className="w-4 h-4" />
                  교회 페이지에서 QR 코드 생성
                </Button>
              </CardContent>
            </Card>

            {/* 관리자 계정 관리 - 로그인 방식인 경우만 표시 */}
            {authMethod === 'login' && adminInfo && (
              <Card>
                <CardHeader className="pb-3 md:pb-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Lock className="w-4 h-4 md:w-5 md:h-5" />
                    관리자 계정 관리
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {isSystemAdmin
                      ? '이 교회의 관리자 계정을 관리합니다'
                      : '관리자 계정 정보 및 비밀번호를 관리합니다'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 시스템 관리자용: 교회 관리자 목록 */}
                  {isSystemAdmin && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">등록된 관리자 ({churchAdmins.length}명)</p>
                        <Button
                          size="sm"
                          onClick={() => setAddAdminDialogOpen(true)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          관리자 추가
                        </Button>
                      </div>

                      {churchAdminsLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : churchAdmins.length === 0 ? (
                        <div className="p-4 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
                          등록된 관리자가 없습니다
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {churchAdmins.map((admin) => (
                            <div
                              key={admin.id}
                              className={`p-3 rounded-lg border ${admin.is_active ? 'bg-background' : 'bg-muted/30 opacity-60'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {admin.nickname || admin.email.split('@')[0]}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                      admin.is_active
                                        ? 'bg-accent/10 text-accent'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      {admin.is_active ? '활성' : '비활성'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(admin.created_at).toLocaleDateString('ko-KR')} 등록
                                    </span>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleToggleAdminActive(admin.id, admin.is_active)}
                                    >
                                      {admin.is_active ? (
                                        <>
                                          <EyeOff className="w-4 h-4 mr-2" />
                                          비활성화
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="w-4 h-4 mr-2" />
                                          활성화
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 일반 관리자용: 본인 계정 정보 */}
                  {!isSystemAdmin && (
                    <>
                      <div className="p-3 md:p-4 bg-muted/50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">로그인 이메일</p>
                            <p className="text-xs text-muted-foreground">{adminInfo.email}</p>
                          </div>
                        </div>
                        {adminInfo.nickname && (
                          <div>
                            <p className="text-sm font-medium">닉네임</p>
                            <p className="text-xs text-muted-foreground">{adminInfo.nickname}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">마지막 비밀번호 변경</p>
                          <p className="text-xs text-muted-foreground">
                            {adminInfo.password_changed_at
                              ? new Date(adminInfo.password_changed_at).toLocaleString('ko-KR')
                              : '변경 기록 없음'}
                          </p>
                        </div>
                        {adminInfo.last_login_at && (
                          <div>
                            <p className="text-sm font-medium">마지막 로그인</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(adminInfo.last_login_at).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 비밀번호 변경 버튼 */}
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        <Lock className="w-4 h-4" />
                        비밀번호 변경
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* 비밀번호 변경 다이얼로그 */}
      <Dialog open={passwordDialogOpen} onOpenChange={(open) => {
        setPasswordDialogOpen(open);
        if (!open) {
          setNewPassword('');
          setConfirmPassword('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
            <DialogDescription>
              새 비밀번호를 입력해주세요 (6자 이상)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="새 비밀번호 입력"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="비밀번호 다시 입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              disabled={passwordChanging}
            >
              취소
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={passwordChanging || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {passwordChanging ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  변경 중...
                </>
              ) : (
                '비밀번호 변경'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 관리자 추가 다이얼로그 (시스템 관리자용) */}
      <Dialog open={addAdminDialogOpen} onOpenChange={(open) => {
        setAddAdminDialogOpen(open);
        if (!open) {
          setNewAdminEmail('');
          setNewAdminPassword('');
          setNewAdminNickname('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 관리자 추가</DialogTitle>
            <DialogDescription>
              {church?.name} 관리자 계정을 생성합니다
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">이메일 *</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@church.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">비밀번호 * (6자 이상)</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="비밀번호 입력"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-nickname">닉네임 (선택)</Label>
              <Input
                id="admin-nickname"
                placeholder="관리자"
                value={newAdminNickname}
                onChange={(e) => setNewAdminNickname(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddAdminDialogOpen(false)}
              disabled={addingAdmin}
            >
              취소
            </Button>
            <Button
              onClick={handleAddAdmin}
              disabled={addingAdmin || !newAdminEmail || !newAdminPassword || newAdminPassword.length < 6}
            >
              {addingAdmin ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  추가 중...
                </>
              ) : (
                '관리자 추가'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 묵상글 삭제 확인 다이얼로그 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>묵상글 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            이 묵상글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          {selectedComment && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">
                {selectedComment.is_anonymous ? '익명' : selectedComment.guest_name}
              </p>
              <p className="text-muted-foreground line-clamp-2">
                {selectedComment.content}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteComment}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QT 글 삭제 확인 다이얼로그 */}
      <Dialog open={deleteQtConfirmOpen} onOpenChange={setDeleteQtConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QT 글 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            이 QT 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </p>
          {selectedQtPost && (
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p className="font-medium">
                {selectedQtPost.is_anonymous ? '익명' : selectedQtPost.author_name}
                <span className="text-muted-foreground font-normal ml-2">
                  ({selectedQtPost.qt_date})
                </span>
              </p>
              {selectedQtPost.my_sentence && (
                <p className="text-muted-foreground line-clamp-1">
                  <span className="text-primary">말씀:</span> {selectedQtPost.my_sentence}
                </p>
              )}
              {selectedQtPost.meditation_answer && (
                <p className="text-muted-foreground line-clamp-1">
                  <span className="text-primary">묵상:</span> {selectedQtPost.meditation_answer}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteQtConfirmOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteQtPost}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 토큰 재발급 확인 */}
      <AlertDialog open={tokenRegenConfirmOpen} onOpenChange={setTokenRegenConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tokenType === 'admin' ? '관리자' : '작성 권한'} 토큰 재발급
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tokenType === 'admin' ? (
                <>
                  관리자 토큰을 재발급하면 <strong>기존 토큰은 즉시 무효화</strong>됩니다.
                  <br /><br />
                  ⚠️ 현재 세션도 로그아웃되며, 새 토큰으로 다시 로그인해야 합니다.
                </>
              ) : (
                <>
                  작성 권한 토큰을 재발급하면 <strong>기존에 공유한 링크는 더 이상 작동하지 않습니다.</strong>
                  <br /><br />
                  새 토큰이 포함된 링크를 교인들에게 다시 공유해야 합니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerateToken}
              className={tokenType === 'admin' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary'}
            >
              재발급
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 교인 해제 확인 */}
      <AlertDialog open={removeMemberConfirmOpen} onOpenChange={setRemoveMemberConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>교인 등록 해제</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember && (
                <>
                  <strong>{selectedMember.nickname}</strong>님의 교회 등록을 해제하시겠습니까?
                  <br /><br />
                  • 교회 등록만 해제되며 작성한 묵상글은 유지됩니다.
                  <br />
                  • 해당 사용자는 교회 코드를 통해 다시 등록할 수 있습니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700"
            >
              등록 해제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shorts 삭제 확인 */}
      <AlertDialog open={deleteShortConfirmOpen} onOpenChange={setDeleteShortConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Shorts 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {shortToDelete && (
                <>
                  <strong>{shortToDelete.title || 'Shorts'}</strong>를 삭제하시겠습니까?
                  <br /><br />
                  삭제된 Shorts는 교회 홈페이지에서 더 이상 표시되지 않습니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShortToDelete(null)}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShort}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 공지사항 추가/수정 다이얼로그 */}
      <Dialog open={noticeDialogOpen} onOpenChange={setNoticeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingNotice ? '공지사항 수정' : '새 공지사항'}</DialogTitle>
            <DialogDescription>
              공지사항은 교회 메인 페이지 상단에 표시됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notice-title">제목 *</Label>
              <Input
                id="notice-title"
                placeholder="공지 제목을 입력하세요"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice-content">내용 *</Label>
              <Textarea
                id="notice-content"
                placeholder="공지 내용을 입력하세요"
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="notice-pinned"
                  checked={noticeIsPinned}
                  onCheckedChange={setNoticeIsPinned}
                />
                <Label htmlFor="notice-pinned" className="text-sm">상단 고정</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="notice-active"
                  checked={noticeIsActive}
                  onCheckedChange={setNoticeIsActive}
                />
                <Label htmlFor="notice-active" className="text-sm">활성화</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoticeDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveNotice} disabled={noticeSaving || !noticeTitle.trim() || !noticeContent.trim()}>
              {noticeSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingNotice ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 공지사항 삭제 확인 */}
      <AlertDialog open={deleteNoticeConfirmOpen} onOpenChange={setDeleteNoticeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {noticeToDelete && (
                <>
                  <strong>{noticeToDelete.title}</strong> 공지사항을 삭제하시겠습니까?
                  <br /><br />
                  삭제된 공지사항은 복구할 수 없습니다.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoticeToDelete(null)}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNotice}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 묵상/QT 상세 보기 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {detailType === 'meditation' && selectedComment && (
            <>
              {/* 묵상 상세 보기 */}
              <div className="h-1 -mx-6 -mt-6 mb-4 bg-gradient-to-r from-blue-400 via-indigo-400 to-muted0 rounded-t-lg" />
              <DialogHeader className="pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-accent/10 text-accent dark:bg-accent dark:text-accent-foreground px-2 py-1 rounded-full font-medium">
                    묵상
                  </span>
                  <span className="font-semibold">
                    {selectedComment.is_anonymous ? '익명' : selectedComment.guest_name}
                  </span>
                  {selectedComment.is_anonymous && (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{new Date(selectedComment.created_at).toLocaleString('ko-KR')}</span>
                  {selectedComment.day_number && (
                    <>
                      <span>·</span>
                      <span className="text-primary font-medium">{selectedComment.day_number}일차</span>
                    </>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* 성경 범위 */}
                {selectedComment.bible_range && (
                  <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-primary">{selectedComment.bible_range}</span>
                  </div>
                )}

                {/* 묵상 내용 */}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {selectedComment.content.startsWith('<') ? (
                    <div
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedComment.content }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedComment.content}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-4 pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제
                </Button>
              </DialogFooter>
            </>
          )}

          {detailType === 'qt' && selectedQtPost && (
            <>
              {/* QT 상세 보기 */}
              <div className="h-1 -mx-6 -mt-6 mb-4 bg-gradient-to-r from-amber-400 via-orange-400 to-muted0 rounded-t-lg" />
              <DialogHeader className="pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-muted text-foreground dark:bg-primary dark:text-accent px-2 py-1 rounded-full font-medium">
                    QT
                  </span>
                  <span className="font-semibold">
                    {selectedQtPost.is_anonymous ? '익명' : selectedQtPost.author_name}
                  </span>
                  {selectedQtPost.is_anonymous && (
                    <Lock className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{selectedQtPost.qt_date}</span>
                  {selectedQtPost.day_number && (
                    <>
                      <span>·</span>
                      <span className="text-primary font-medium">{selectedQtPost.day_number}일차</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{new Date(selectedQtPost.created_at).toLocaleString('ko-KR')}</span>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* 마음에 남는 말씀 */}
                {selectedQtPost.my_sentence && (
                  <div className="bg-muted dark:bg-primary/30 rounded-xl p-4 border border-border dark:border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-muted dark:bg-primary rounded-lg flex items-center justify-center">
                        <BookOpen className="w-3 h-3 text-accent dark:text-accent" />
                      </div>
                      <h4 className="text-xs font-semibold text-foreground dark:text-accent">마음에 남는 말씀</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedQtPost.my_sentence}
                    </p>
                  </div>
                )}

                {/* 묵상 */}
                {selectedQtPost.meditation_answer && (
                  <div className="bg-accent/10 dark:bg-accent/20/30 rounded-xl p-4 border border-accent/30 dark:border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-accent/10 dark:bg-accent rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-3 h-3 text-accent dark:text-accent" />
                      </div>
                      <h4 className="text-xs font-semibold text-accent dark:text-accent">묵상</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedQtPost.meditation_answer}
                    </p>
                  </div>
                )}

                {/* 감사 */}
                {selectedQtPost.gratitude && (
                  <div className="bg-accent/10 dark:bg-accent/20/30 rounded-xl p-4 border border-accent/30 dark:border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-accent/10 dark:bg-accent rounded-lg flex items-center justify-center">
                        <span className="text-xs">🙏</span>
                      </div>
                      <h4 className="text-xs font-semibold text-accent dark:text-accent">감사</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedQtPost.gratitude}
                    </p>
                  </div>
                )}

                {/* 기도 */}
                {selectedQtPost.my_prayer && (
                  <div className="bg-accent/10 dark:bg-accent/20/30 rounded-xl p-4 border border-accent/30 dark:border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-accent/10 dark:bg-accent rounded-lg flex items-center justify-center">
                        <span className="text-xs">✝️</span>
                      </div>
                      <h4 className="text-xs font-semibold text-accent dark:text-accent">나의 기도</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedQtPost.my_prayer}
                    </p>
                  </div>
                )}

                {/* 하루 점검 */}
                {selectedQtPost.day_review && (
                  <div className="bg-accent/10 dark:bg-accent/20/30 rounded-xl p-4 border border-accent/30 dark:border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-accent/10 dark:bg-accent/20 rounded-lg flex items-center justify-center">
                        <Target className="w-3 h-3 text-accent dark:text-accent" />
                      </div>
                      <h4 className="text-xs font-semibold text-accent dark:text-accent">말씀과 함께한 하루 점검</h4>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {selectedQtPost.day_review}
                    </p>
                  </div>
                )}

                {/* 인터랙션 정보 */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                  <span>❤️ {selectedQtPost.likes_count}명이 공감</span>
                  <span>💬 댓글 {selectedQtPost.replies_count}개</span>
                </div>
              </div>

              <DialogFooter className="mt-4 pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    setDeleteQtConfirmOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
