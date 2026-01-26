'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import readingPlan from '@/data/reading_plan.json';
import { CheckCircle2, Loader2, BookOpen, ChevronDown, ChevronUp, Send, ArrowLeft, Edit, Save, Search, X } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { useToast } from '@/components/ui/toast';
import { useAutoDraft, formatDraftTime } from '@/hooks/useAutoDraft';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';
import { ChurchLayout } from '@/components/church/ChurchLayout';
import { getTodayDateString } from '@/lib/date-utils';
import dynamic from 'next/dynamic';

// Rich Editor (클라이언트 전용)
const RichEditor = dynamic(
    () => import('@/components/ui/rich-editor').then(mod => mod.RichEditor),
    { ssr: false, loading: () => <div className="h-[150px] border rounded-lg bg-muted/30 animate-pulse" /> }
);

// 빈 HTML 콘텐츠 체크
function isEmptyContent(html: string): boolean {
    if (!html) return true;
    const text = html.replace(/<[^>]*>/g, '').trim();
    return text.length === 0;
}

// 성경 66권 목록
const oldTestament = [
    '창세기', '출애굽기', '레위기', '민수기', '신명기',
    '여호수아', '사사기', '룻기', '사무엘상', '사무엘하',
    '열왕기상', '열왕기하', '역대상', '역대하', '에스라',
    '느헤미야', '에스더', '욥기', '시편', '잠언',
    '전도서', '아가', '이사야', '예레미야', '예레미야애가',
    '에스겔', '다니엘', '호세아', '요엘', '아모스',
    '오바댜', '요나', '미가', '나훔', '하박국',
    '스바냐', '학개', '스가랴', '말라기'
];

const newTestament = [
    '마태복음', '마가복음', '누가복음', '요한복음', '사도행전',
    '로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서',
    '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서',
    '디모데후서', '디도서', '빌레몬서', '히브리서', '야고보서',
    '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서',
    '유다서', '요한계시록'
];

interface ChurchInfo {
    id: string;
    code: string;
    name: string;
    schedule_year: number | null;
}

interface ReadingSchedule {
    date: string;
    reading: string;
    memory_verse: string | null;
    is_supplement_week: boolean;
}

export default function ChurchBiblePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const churchCode = params.code as string;

    const [loading, setLoading] = useState(true);
    const [church, setChurch] = useState<ChurchInfo | null>(null);
    const [schedules, setSchedules] = useState<ReadingSchedule[]>([]);
    const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
    const [userProfile, setUserProfile] = useState<{ nickname: string; church_id: string | null } | null>(null);
    const [isRegisteredMember, setIsRegisteredMember] = useState(false);

    // 읽음 체크 관련
    const [checkedDays, setCheckedDays] = useState<Map<number, string | null>>(new Map());
    const [showCheckDialog, setShowCheckDialog] = useState(false);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    // 글 작성 관련
    const [writeDialogOpen, setWriteDialogOpen] = useState(false);
    const [writingPlan, setWritingPlan] = useState<{ day: number; book: string; reading: string } | null>(null);
    const [guestName, setGuestName] = useState('');
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showDraftRestore, setShowDraftRestore] = useState(false);

    // 자동 임시저장
    const {
        draft,
        hasDraft,
        lastSaved,
        updateDraft,
        clearDraft,
        restoreDraft,
    } = useAutoDraft({
        context: 'church_bible',
        identifier: churchCode,
        debounceMs: 2000,
        enabled: writeDialogOpen,
    });

    // 일정 필터링
    const [showAllSchedule, setShowAllSchedule] = useState(false);
    const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

    // 검색 관련
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // 오늘 Day 계산 (일정 시작일 기준)
    const todayDay = useMemo(() => {
        if (schedules.length === 0) return 1;
        const today = getTodayDateString();
        const todaySchedule = schedules.find(s => s.date === today);
        if (todaySchedule) {
            const index = schedules.findIndex(s => s.date === today);
            return index + 1;
        }
        return 1;
    }, [schedules]);

    // 필터링된 일정
    const filteredPlan = useMemo(() => {
        if (showAllSchedule) return readingPlan;
        return readingPlan.filter(plan => {
            const diff = plan.day - todayDay;
            return diff >= -3 && diff <= 3;
        });
    }, [showAllSchedule, todayDay]);

    // 월별로 일정 그룹화
    const planByMonth = useMemo(() => {
        const grouped: Record<number, typeof readingPlan> = {};
        readingPlan.forEach(plan => {
            const month = new Date(plan.date).getMonth() + 1;
            if (!grouped[month]) grouped[month] = [];
            grouped[month].push(plan);
        });
        return grouped;
    }, []);


    // 검색 결과
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.trim().toLowerCase();

        return readingPlan.filter(plan => {
            // 책 이름 검색 (쉼표로 구분된 경우도 처리)
            const books = plan.book.split(',').map(b => b.trim().toLowerCase());
            return books.some(book => book.includes(query));
        }).map(plan => {
            const date = new Date(plan.date);
            const formattedDate = format(date, 'M월 d일', { locale: ko });
            return {
                ...plan,
                formattedDate,
            };
        });
    }, [searchQuery]);

    // 검색창 열릴 때 포커스
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    // 초기 로드
    useEffect(() => {
        const init = async () => {
            const supabase = getSupabaseBrowserClient();
            setLoading(true);

            // 1. 로그인 사용자 확인
            const { data: { user } } = await supabase.auth.getUser();
            let profileData: { nickname: string; church_id: string | null } | null = null;

            if (user) {
                setCurrentUser(user);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('nickname, church_id')
                    .eq('id', user.id)
                    .single();
                if (profile) {
                    profileData = profile;
                    setUserProfile(profile);
                    setGuestName(profile.nickname);
                }
            } else {
                // 비로그인 시 localStorage에서 이름 가져오기
                const savedName = localStorage.getItem('guest_name');
                if (savedName) setGuestName(savedName);
            }

            // 2. 교회 정보 로드
            const { data: churchData, error } = await supabase
                .from('churches')
                .select('id, code, name, schedule_year')
                .eq('code', churchCode.toUpperCase())
                .eq('is_active', true)
                .single();

            if (error || !churchData) {
                setLoading(false);
                return;
            }

            setChurch(churchData);

            // 등록 교인 확인
            if (user && profileData?.church_id === churchData.id) {
                setIsRegisteredMember(true);
            }

            // 3. 일정 로드
            const scheduleYear = churchData.schedule_year || 2026;
            const { data: scheduleData } = await supabase
                .from('reading_schedules')
                .select('date, reading, memory_verse, is_supplement_week')
                .eq('year', scheduleYear)
                .order('date', { ascending: true });

            if (scheduleData) {
                setSchedules(scheduleData);
            }

            setLoading(false);
        };

        init();
    }, [churchCode]);

    // 통독 일정에서 책별로 그룹화 (합쳐진 책들도 개별로 분리)
    const bookDays = readingPlan.reduce((acc, plan) => {
        // 책 이름에 쉼표가 있으면 분리해서 각각에 추가
        const books = plan.book.split(',').map(b => b.trim());
        books.forEach(bookName => {
            if (!acc[bookName]) {
                acc[bookName] = [];
            }
            acc[bookName].push(plan);
        });
        return acc;
    }, {} as Record<string, typeof readingPlan>);

    // 책별 완료 상태 계산
    const getBookProgress = (book: string) => {
        const days = bookDays[book] || [];
        if (days.length === 0) return { completed: 0, total: 0 };
        const completed = days.filter(d => checkedDays.has(d.day)).length;
        return { completed, total: days.length };
    };

    // localStorage 키 (교회별로 분리)
    const localStorageKey = `church_${churchCode}_checked_days`;

    // 읽음 데이터 로드 (등록 교인: 클라우드 + localStorage 병합, 비등록: localStorage만)
    useEffect(() => {
        const loadCheckedDays = async () => {
            // 1. localStorage에서 먼저 로드
            const saved = localStorage.getItem(localStorageKey);
            const localMap = new Map<number, string | null>();

            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    Object.entries(parsed).forEach(([k, v]) => {
                        localMap.set(parseInt(k), v as string | null);
                    });
                } catch {
                    // 파싱 실패 시 무시
                }
            }

            // 2. 등록 교인이면 클라우드에서도 로드하고 병합
            if (isRegisteredMember && currentUser && church) {
                const supabase = getSupabaseBrowserClient();
                try {
                    const { data: cloudChecks, error } = await supabase
                        .from('church_reading_checks')
                        .select('day_number, checked_at')
                        .eq('user_id', currentUser.id)
                        .eq('church_id', church.id);

                    if (!error && cloudChecks) {
                        // 클라우드 데이터를 localMap에 병합 (클라우드가 우선)
                        cloudChecks.forEach((check: { day_number: number; checked_at: string }) => {
                            localMap.set(check.day_number, check.checked_at);
                        });
                    }
                } catch (err) {
                    console.error('클라우드 읽음 데이터 로드 실패:', err);
                }
            }

            setCheckedDays(localMap);
        };

        // church와 등록 상태가 확정된 후 로드
        if (church) {
            loadCheckedDays();
        }
    }, [localStorageKey, isRegisteredMember, currentUser, church]);

    // checkedDays 변경 시 localStorage에 저장 (백업용)
    useEffect(() => {
        if (checkedDays.size > 0) {
            const obj: Record<number, string | null> = {};
            checkedDays.forEach((v, k) => { obj[k] = v; });
            localStorage.setItem(localStorageKey, JSON.stringify(obj));
        }
    }, [checkedDays, localStorageKey]);

    // Long press handlers (모든 사용자 허용)
    const handleLongPressStart = useCallback((dayNumber: number) => {
        longPressTimer.current = setTimeout(() => {
            setSelectedDay(dayNumber);
            setShowCheckDialog(true);
        }, 500);
    }, []);

    const handleLongPressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    // 읽음 체크/해제 (등록 교인: 클라우드 + localStorage, 비등록: localStorage만)
    const handleConfirmCheck = async () => {
        if (selectedDay === null) return;

        const isCurrentlyChecked = checkedDays.has(selectedDay);
        const now = new Date().toISOString();
        const plan = readingPlan.find(p => p.day === selectedDay);

        // 등록 교인이면 클라우드에도 저장/삭제
        if (isRegisteredMember && currentUser && church) {
            const supabase = getSupabaseBrowserClient();
            try {
                if (isCurrentlyChecked) {
                    // 클라우드에서 삭제
                    await supabase
                        .from('church_reading_checks')
                        .delete()
                        .eq('user_id', currentUser.id)
                        .eq('church_id', church.id)
                        .eq('day_number', selectedDay);
                } else {
                    // 클라우드에 저장
                    await supabase
                        .from('church_reading_checks')
                        .upsert({
                            user_id: currentUser.id,
                            church_id: church.id,
                            day_number: selectedDay,
                            checked_at: now,
                        }, {
                            onConflict: 'user_id,church_id,day_number'
                        });
                }
            } catch (err) {
                console.error('클라우드 동기화 실패:', err);
                // 클라우드 실패해도 로컬에는 저장
            }
        }

        // 로컬 상태 업데이트
        if (isCurrentlyChecked) {
            setCheckedDays(prev => {
                const newMap = new Map(prev);
                newMap.delete(selectedDay);
                return newMap;
            });
            toast({
                title: '읽음 완료가 해제되었습니다',
                description: `Day ${selectedDay} - ${plan?.book}`,
            });
        } else {
            setCheckedDays(prev => {
                const newMap = new Map(prev);
                newMap.set(selectedDay, now);
                return newMap;
            });
            toast({
                title: '읽음 완료 처리되었습니다',
                description: `${format(new Date(now), 'yyyy년 M월 d일 HH:mm', { locale: ko })} 기준`,
            });
        }

        setShowCheckDialog(false);
        setSelectedDay(null);
    };

    // 글 작성 다이얼로그 열기
    const handleOpenWriteDialog = (plan: { day: number; book: string; reading: string }) => {
        setWritingPlan(plan);
        setContent('');
        setWriteDialogOpen(true);

        // 임시저장된 내용이 있으면 복원 여부 물어보기
        if (hasDraft && draft) {
            setShowDraftRestore(true);
        }
    };

    // 임시저장 복원
    const handleRestoreDraft = () => {
        const restored = restoreDraft();
        if (restored) {
            setContent(restored.content || '');
            if (restored.guestName && !isRegisteredMember) {
                setGuestName(restored.guestName);
            }
            toast({ title: '임시저장된 내용을 복원했습니다' });
        }
        setShowDraftRestore(false);
    };

    // 임시저장 버리기
    const handleDiscardDraft = () => {
        clearDraft();
        setShowDraftRestore(false);
    };

    // 폼 내용 변경 시 자동 저장
    useEffect(() => {
        if (writeDialogOpen && !isEmptyContent(content)) {
            updateDraft({
                content,
                bibleRange: writingPlan?.reading,
                guestName: isRegisteredMember ? undefined : guestName,
            });
        }
    }, [content, guestName, writeDialogOpen, updateDraft, isRegisteredMember, writingPlan?.reading]);

    // 글 작성 제출
    const handleSubmitWriting = async () => {
        if (!church || !writingPlan) return;

        const authorName = isRegisteredMember && userProfile ? userProfile.nickname : guestName.trim();

        if (!authorName) {
            toast({ variant: 'error', title: '이름을 입력해주세요' });
            return;
        }

        if (isEmptyContent(content)) {
            toast({ variant: 'error', title: '내용을 입력해주세요' });
            return;
        }

        const supabase = getSupabaseBrowserClient();
        setSubmitting(true);

        try {
            const insertData: {
                church_id: string;
                guest_name: string;
                device_id: string;
                content: string;
                bible_range: string;
                is_anonymous: boolean;
                linked_user_id?: string;
                linked_at?: string;
            } = {
                church_id: church.id,
                guest_name: authorName,
                device_id: 'church-bible-' + Date.now(),
                content: content,
                bible_range: writingPlan.reading,
                is_anonymous: false,
            };

            if (isRegisteredMember && currentUser) {
                insertData.linked_user_id = currentUser.id;
                insertData.linked_at = new Date().toISOString();
            }

            const { error } = await supabase
                .from('guest_comments')
                .insert(insertData);

            if (error) throw error;

            // 비로그인 시 이름 저장
            if (!isRegisteredMember) {
                localStorage.setItem('guest_name', guestName.trim());
            }

            toast({ variant: 'success', title: '짧은 묵상 나눔이 등록되었습니다' });
            setWriteDialogOpen(false);
            setContent('');

            // 임시저장 삭제
            clearDraft();
        } catch {
            toast({ variant: 'error', title: '등록에 실패했습니다' });
        } finally {
            setSubmitting(false);
        }
    };

    const renderBookList = (books: string[]) => (
        <div className="grid grid-cols-3 gap-2">
            {books.map((book) => {
                const days = bookDays[book] || [];
                const hasReadings = days.length > 0;
                const { completed, total } = getBookProgress(book);
                const isComplete = completed === total && total > 0;

                return (
                    <Link key={book} href={`/church/${churchCode}/bible/reader?book=${encodeURIComponent(book)}&chapter=1`}>
                        <Card
                            className={`cursor-pointer transition-colors ${hasReadings ? 'hover:bg-accent' : 'opacity-50'
                                } ${isComplete ? 'border-accent bg-accent/10 dark:bg-accent/20' : ''}`}
                        >
                            <CardContent className="p-3 text-center">
                                <p className="text-sm font-medium truncate">{book}</p>
                                {hasReadings && (
                                    <p className={`text-xs mt-1 ${isComplete ? 'text-accent' : 'text-muted-foreground'}`}>
                                        {completed}/{total}일
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!church) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
                <h1 className="text-xl font-bold mb-2">교회를 찾을 수 없습니다</h1>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    돌아가기
                </Button>
            </div>
        );
    }

    return (
        <ChurchLayout churchCode={churchCode} churchId={church?.id}>
        <div className="min-h-screen bg-muted/30 pb-20 lg:pb-4">
            {/* 헤더 */}
            <header className="bg-background border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/church/${churchCode}`)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="font-bold text-lg">성경 읽기</h1>
                            <p className="text-xs text-muted-foreground">{church.name}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6">
                {/* 로그인 안내 */}
                {!currentUser && (
                    <Card className="mb-4 border-border bg-muted dark:bg-primary">
                        <CardContent className="py-3">
                            <p className="text-sm text-foreground dark:text-muted-foreground">
                                💡 로그인하면 묵상 작성 시 임시저장 기능을 이용할 수 있습니다
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Tabs */}
                <Tabs defaultValue="schedule" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="schedule">통독 일정</TabsTrigger>
                        <TabsTrigger value="old">구약</TabsTrigger>
                        <TabsTrigger value="new">신약</TabsTrigger>
                    </TabsList>

                    <TabsContent value="schedule" className="mt-4">
                        <div className="mb-3 space-y-2">
                            <div className="text-center bg-primary/10 rounded-lg py-2">
                                <span className="text-sm font-medium text-primary">
                                    오늘은 Day {todayDay}입니다
                                </span>
                            </div>

                            {isRegisteredMember && (
                                <p className="text-xs text-muted-foreground text-center">
                                    💡 일정을 길게 누르면 읽음 완료를 체크할 수 있어요
                                </p>
                            )}

                            {!showAllSchedule && (
                                <p className="text-xs text-center text-muted-foreground">
                                    오늘 기준 ±3일 일정만 표시 중
                                </p>
                            )}
                        </div>

                        {/* 이번 주 일정 (접힌 상태) */}
                        {!showAllSchedule && (
                            <div className="space-y-2">
                                {filteredPlan.map((plan) => {
                                    const isChecked = checkedDays.has(plan.day);
                                    const checkedAt = checkedDays.get(plan.day);
                                    const isToday = plan.day === todayDay;
                                    const firstChapter = plan.range.split('-')[0];

                                    return (
                                        <Card
                                            key={plan.day}
                                            className={`transition-colors select-none ${isChecked
                                                ? 'border-accent bg-accent/10 dark:bg-accent/20'
                                                : isToday
                                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                                                    : ''
                                                }`}
                                            onMouseDown={() => handleLongPressStart(plan.day)}
                                            onMouseUp={handleLongPressEnd}
                                            onMouseLeave={handleLongPressEnd}
                                            onTouchStart={() => handleLongPressStart(plan.day)}
                                            onTouchEnd={handleLongPressEnd}
                                        >
                                            <CardContent className="p-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isChecked
                                                            ? 'bg-accent text-white'
                                                            : isToday
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-primary/10'
                                                            }`}
                                                    >
                                                        {isChecked ? (
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        ) : (
                                                            <span className="text-sm font-bold">{plan.day}</span>
                                                        )}
                                                    </div>

                                                    <Link
                                                        href={`/church/${churchCode}/bible/reader?book=${encodeURIComponent(plan.book)}&chapter=${firstChapter}`}
                                                        className="flex-1"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium">{plan.book}</p>
                                                            {isToday && (
                                                                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                                                    오늘
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {plan.reading}
                                                        </p>
                                                        {isChecked && checkedAt && (
                                                            <p className="text-xs text-accent mt-0.5">
                                                                ✓ {format(new Date(checkedAt), 'M월 d일 HH:mm', { locale: ko })} 완료
                                                            </p>
                                                        )}
                                                    </Link>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="p-2 hover:bg-accent rounded-md transition-colors"
                                                    title="묵상 작성"
                                                    onClick={() => handleOpenWriteDialog(plan)}
                                                >
                                                    <Edit className="w-5 h-5 text-muted-foreground" />
                                                </button>

                                                <Link href={`/church/${churchCode}/bible/reader?book=${encodeURIComponent(plan.book)}&chapter=${firstChapter}`}>
                                                    <button
                                                        type="button"
                                                        className="p-2 hover:bg-accent rounded-md transition-colors"
                                                        title="성경 읽기"
                                                    >
                                                        <BookOpen className="w-5 h-5 text-muted-foreground" />
                                                    </button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* 전체 일정 (펼친 상태) - 월별 아코디언 + 검색 */}
                        {showAllSchedule && (
                            <div className="space-y-3">
                                {/* 검색 UI */}
                                <div className="relative">
                                    {searchOpen ? (
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    ref={searchInputRef}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="성경 이름으로 검색 (예: 창세기, 마태)"
                                                    className="pl-9 pr-9"
                                                />
                                                {searchQuery && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSearchQuery('')}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSearchOpen(false);
                                                    setSearchQuery('');
                                                }}
                                            >
                                                취소
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSearchOpen(true)}
                                            className="w-full gap-2"
                                        >
                                            <Search className="w-4 h-4" />
                                            성경 이름으로 검색
                                        </Button>
                                    )}
                                </div>

                                {/* 검색 결과 */}
                                {searchQuery && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                            검색 결과: {searchResults.length}개
                                        </p>
                                        {searchResults.length > 0 ? (
                                            <div className="space-y-1 max-h-[400px] overflow-y-auto">
                                                {searchResults.map((result) => {
                                                    const firstChapter = result.range.split('-')[0];
                                                    const lastChapter = result.range.split('-')[1] || firstChapter;
                                                    const isChecked = checkedDays.has(result.day);

                                                    return (
                                                        <Link
                                                            key={result.day}
                                                            href={`/church/${churchCode}/bible/reader?book=${encodeURIComponent(result.book)}&chapter=${firstChapter}`}
                                                            className="block"
                                                        >
                                                            <div className={`flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors ${isChecked ? 'bg-accent/10 dark:bg-accent/20 border-accent/50' : ''}`}>
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`text-xs px-2 py-1 rounded-full ${isChecked ? 'bg-accent text-white' : 'bg-primary/10 text-primary'}`}>
                                                                        Day {result.day}
                                                                    </span>
                                                                    <div>
                                                                        <p className="font-medium text-sm">
                                                                            {result.book} {firstChapter}장{firstChapter !== lastChapter ? ` - ${lastChapter}장` : ''}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {result.formattedDate}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <BookOpen className="w-4 h-4 text-muted-foreground" />
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-center py-8 text-muted-foreground">
                                                &quot;{searchQuery}&quot;에 해당하는 일정이 없습니다
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* 월별 아코디언 (검색 중이 아닐 때만) */}
                                {!searchQuery && (
                                    <div className="space-y-2">
                                        {Object.entries(planByMonth).map(([monthStr, plans]) => {
                                            const month = parseInt(monthStr);
                                            const isExpanded = expandedMonth === month;
                                            const currentMonth = new Date().getMonth() + 1;
                                            const completedCount = plans.filter(p => checkedDays.has(p.day)).length;

                                            return (
                                                <div key={month} className="border rounded-lg overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => setExpandedMonth(isExpanded ? null : month)}
                                                        className={`w-full flex items-center justify-between p-3 hover:bg-accent transition-colors ${isExpanded ? 'bg-accent' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">{month}월</span>
                                                            {month === currentMonth && (
                                                                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                                                    이번 달
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-muted-foreground">
                                                                ({completedCount}/{plans.length}일 완료)
                                                            </span>
                                                        </div>
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4" />
                                                        )}
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="border-t p-2 space-y-1 max-h-[400px] overflow-y-auto">
                                                            {plans.map((plan) => {
                                                                const isChecked = checkedDays.has(plan.day);
                                                                const checkedAt = checkedDays.get(plan.day);
                                                                const isToday = plan.day === todayDay;
                                                                const firstChapter = plan.range.split('-')[0];

                                                                return (
                                                                    <Card
                                                                        key={plan.day}
                                                                        className={`transition-colors select-none ${isChecked
                                                                            ? 'border-accent bg-accent/10 dark:bg-accent/20'
                                                                            : isToday
                                                                                ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                                                                                : ''
                                                                            }`}
                                                                        onMouseDown={() => handleLongPressStart(plan.day)}
                                                                        onMouseUp={handleLongPressEnd}
                                                                        onMouseLeave={handleLongPressEnd}
                                                                        onTouchStart={() => handleLongPressStart(plan.day)}
                                                                        onTouchEnd={handleLongPressEnd}
                                                                    >
                                                                        <CardContent className="p-2 flex items-center justify-between">
                                                                            <div className="flex items-center gap-2 flex-1">
                                                                                <div
                                                                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-xs ${isChecked
                                                                                        ? 'bg-accent text-white'
                                                                                        : isToday
                                                                                            ? 'bg-primary text-primary-foreground'
                                                                                            : 'bg-primary/10'
                                                                                        }`}
                                                                                >
                                                                                    {isChecked ? (
                                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                                    ) : (
                                                                                        <span className="font-bold">{plan.day}</span>
                                                                                    )}
                                                                                </div>

                                                                                <Link
                                                                                    href={`/church/${churchCode}/bible/reader?book=${encodeURIComponent(plan.book)}&chapter=${firstChapter}`}
                                                                                    className="flex-1 min-w-0"
                                                                                >
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="font-medium text-sm truncate">{plan.book}</p>
                                                                                        {isToday && (
                                                                                            <span className="text-xs bg-primary text-primary-foreground px-1 py-0.5 rounded shrink-0">
                                                                                                오늘
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-xs text-muted-foreground">
                                                                                        {plan.reading} ({plan.display_date})
                                                                                    </p>
                                                                                    {isChecked && checkedAt && (
                                                                                        <p className="text-xs text-accent">
                                                                                            ✓ {format(new Date(checkedAt), 'M/d HH:mm', { locale: ko })}
                                                                                        </p>
                                                                                    )}
                                                                                </Link>
                                                                            </div>

                                                                            <div className="flex items-center shrink-0">
                                                                                <button
                                                                                    type="button"
                                                                                    className="p-1.5 hover:bg-accent rounded-md transition-colors"
                                                                                    title="묵상 작성"
                                                                                    onClick={() => handleOpenWriteDialog(plan)}
                                                                                >
                                                                                    <Edit className="w-4 h-4 text-muted-foreground" />
                                                                                </button>

                                                                                <Link href={`/church/${churchCode}/bible/reader?book=${encodeURIComponent(plan.book)}&chapter=${firstChapter}`}>
                                                                                    <button
                                                                                        type="button"
                                                                                        className="p-1.5 hover:bg-accent rounded-md transition-colors"
                                                                                        title="성경 읽기"
                                                                                    >
                                                                                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                                                                                    </button>
                                                                                </Link>
                                                                            </div>
                                                                        </CardContent>
                                                                    </Card>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 전체 보기 / 접기 버튼 */}
                        <div className="mt-4 text-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowAllSchedule(!showAllSchedule);
                                    if (showAllSchedule) {
                                        setExpandedMonth(null);
                                        setSearchOpen(false);
                                        setSearchQuery('');
                                    }
                                }}
                                className="gap-2"
                            >
                                {showAllSchedule ? (
                                    <>
                                        <ChevronUp className="w-4 h-4" />
                                        이번 주만 보기
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4" />
                                        전체 일정 펼쳐보기
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="old" className="mt-4">
                        {renderBookList(oldTestament)}
                    </TabsContent>

                    <TabsContent value="new" className="mt-4">
                        {renderBookList(newTestament)}
                    </TabsContent>
                </Tabs>
            </main>

            {/* 읽음 완료 확인 다이얼로그 */}
            <AlertDialog open={showCheckDialog} onOpenChange={setShowCheckDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {selectedDay && checkedDays.has(selectedDay)
                                ? '읽음 완료를 해제하시겠습니까?'
                                : '읽음 완료 처리하시겠습니까?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {selectedDay && (() => {
                                const plan = readingPlan.find(p => p.day === selectedDay);
                                const isChecked = checkedDays.has(selectedDay);
                                return isChecked
                                    ? `Day ${selectedDay} - ${plan?.book}의 읽음 완료 표시가 해제됩니다.`
                                    : `Day ${selectedDay} - ${plan?.book}을(를) 읽음 완료로 표시합니다.`;
                            })()}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmCheck}>
                            {selectedDay && checkedDays.has(selectedDay) ? '해제하기' : '완료하기'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 글 작성 다이얼로그 */}
            <Dialog open={writeDialogOpen} onOpenChange={setWriteDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>짧은 묵상 나눔 작성</span>
                            {lastSaved && !isEmptyContent(content) && (
                                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                                    <Save className="w-3 h-3" />
                                    {formatDraftTime(lastSaved)}
                                </span>
                            )}
                        </DialogTitle>
                        {writingPlan && (
                            <p className="text-sm text-muted-foreground">
                                {writingPlan.reading}
                            </p>
                        )}
                    </DialogHeader>

                    {/* 임시저장 복원 알림 */}
                    {showDraftRestore && (
                        <div className="bg-muted dark:bg-primary border border-border dark:border-border rounded-lg p-3">
                            <p className="text-sm text-foreground dark:text-muted-foreground mb-2">
                                이전에 작성하던 내용이 있습니다. 복원하시겠습니까?
                            </p>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={handleDiscardDraft}>
                                    새로 작성
                                </Button>
                                <Button size="sm" onClick={handleRestoreDraft}>
                                    복원하기
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 py-4">
                        {/* 이름 입력 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">이름</label>
                            {isRegisteredMember && userProfile ? (
                                <div className="flex items-center gap-2">
                                    <Input value={userProfile.nickname} disabled className="bg-muted" />
                                    <span className="text-xs text-primary whitespace-nowrap">등록 교인</span>
                                </div>
                            ) : (
                                <Input
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                    maxLength={20}
                                />
                            )}
                        </div>

                        {/* 내용 입력 */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">묵상 내용</label>
                            <RichEditor
                                content={content}
                                onChange={(html) => setContent(html)}
                                placeholder="오늘의 말씀을 묵상하고 나눠주세요..."
                                minHeight="120px"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setWriteDialogOpen(false)} disabled={submitting}>
                            취소
                        </Button>
                        <Button
                            onClick={handleSubmitWriting}
                            disabled={submitting || isEmptyContent(content) || (!isRegisteredMember && !guestName.trim())}
                        >
                            {submitting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Send className="w-4 h-4 mr-2" />
                            )}
                            등록하기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 하단 네비게이션은 ChurchLayout에서 처리 */}
        </div>
        </ChurchLayout>
    );
}
