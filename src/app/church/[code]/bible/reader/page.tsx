'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Loader2, Check, ImageIcon, PenLine } from 'lucide-react';
import { VerseCardGenerator } from '@/components/church/VerseCardGenerator';
import { MeditationPanel, MeditationEditor, SplitViewLayout, SelectedVerse, MeditationSubmitData } from '@/components/meditation';
import { VerseCardGenerator as InlineVerseCardGenerator } from '@/components/church/VerseCardGenerator';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { BIBLE_BOOKS, getBibleBook } from '@/data/bibleBooks';
import { getChapter, type BibleVersion } from '@/lib/bibleLoader';
import { useToast } from '@/components/ui/toast';
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { cn } from '@/lib/utils';
import { ChurchLayout } from '@/components/church/ChurchLayout';
import { BibleAccessGuard } from '@/components/bible/BibleAccessGuard';

interface ChurchInfo {
    id: string;
    code: string;
    name: string;
}

function ChurchBibleReaderContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const churchCode = params.code as string;

    const [church, setChurch] = useState<ChurchInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
    const [userProfile, setUserProfile] = useState<{ nickname: string; church_id: string | null } | null>(null);
    const [isRegisteredMember, setIsRegisteredMember] = useState(false);

    const [selectedBook, setSelectedBook] = useState<string>(
        searchParams.get('book') || '창세기'
    );
    const [selectedChapter, setSelectedChapter] = useState<number>(
        parseInt(searchParams.get('chapter') || '1')
    );
    const [selectedVersion, setSelectedVersion] = useState<BibleVersion>('revised');
    const [verses, setVerses] = useState<Record<number, string>>({});
    const [versesLoading, setVersesLoading] = useState(true);

    // 페이지 넘김 애니메이션 상태
    const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // 스와이프 관련 상태
    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);
    const touchEndX = useRef<number>(0);
    const touchEndY = useRef<number>(0);

    // 구절 선택 관련 상태
    const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<number | null>(null);
    const [isDraggingSelection, setIsDraggingSelection] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const versesContainerRef = useRef<HTMLDivElement>(null);

    // 묵상 패널 관련 상태 - sessionStorage로 탭 전환 시에도 유지
    const [meditationPanelOpen, setMeditationPanelOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('meditation-panel-open') === 'true';
        }
        return false;
    });
    const [meditationVerses, setMeditationVerses] = useState<SelectedVerse[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [initialAuthorName, setInitialAuthorName] = useState('');

    // 말씀 카드 생성 관련 상태
    const [verseCardOpen, setVerseCardOpen] = useState(false);
    const [verseCardData, setVerseCardData] = useState<{ verse: string; reference: string } | null>(null);

    // PC/모바일 감지
    const [isDesktop, setIsDesktop] = useState(false);

    // PC 플로팅 네비게이션 (스크롤 시 상단 버튼 안 보일 때)
    const [showFloatingNav, setShowFloatingNav] = useState(false);
    const navButtonsRef = useRef<HTMLDivElement>(null);

    // PC 인라인 에디터용 카드 이미지 삽입 상태
    const [inlineCardImageToInsert, setInlineCardImageToInsert] = useState('');
    const [inlineCardDialogOpen, setInlineCardDialogOpen] = useState(false);
    const [inlineCardVerse, setInlineCardVerse] = useState<SelectedVerse | null>(null);

    const book = getBibleBook(selectedBook);
    const chapters = book ? Array.from({ length: book.chapters }, (_, i) => i + 1) : [];

    // 묵상 패널 상태를 sessionStorage에 저장 (탭 전환 시 유지)
    useEffect(() => {
        sessionStorage.setItem('meditation-panel-open', meditationPanelOpen.toString());
    }, [meditationPanelOpen]);

    // PC/모바일 감지
    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
        };
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // PC에서 스크롤 시 상단 네비게이션 버튼 가시성 체크
    useEffect(() => {
        if (!isDesktop) {
            setShowFloatingNav(false);
            return;
        }

        const checkNavVisibility = () => {
            if (navButtonsRef.current) {
                const rect = navButtonsRef.current.getBoundingClientRect();
                // 상단 네비게이션이 화면에서 완전히 사라지면 플로팅 버튼 표시
                setShowFloatingNav(rect.bottom < 0);
            }
        };

        // 스크롤 이벤트 감지 (분할 뷰의 왼쪽 패널)
        const leftPanel = document.querySelector('[data-left-panel]');
        if (leftPanel) {
            leftPanel.addEventListener('scroll', checkNavVisibility);
            return () => leftPanel.removeEventListener('scroll', checkNavVisibility);
        }
    }, [isDesktop]);

    // 교회 및 사용자 정보 로드
    useEffect(() => {
        const init = async () => {
            const supabase = getSupabaseBrowserClient();
            // 로그인 사용자 확인
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
                    setInitialAuthorName(profile.nickname);
                }
            } else {
                const savedName = localStorage.getItem('guest_name');
                if (savedName) setInitialAuthorName(savedName);
            }

            // 교회 정보 로드
            const { data: churchData, error } = await supabase
                .from('churches')
                .select('id, code, name')
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

            setLoading(false);
        };

        init();
    }, [churchCode]);

    // 애니메이션과 함께 장 변경
    const animateAndChangeChapter = useCallback((direction: 'left' | 'right', changeFunc: () => void) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setSlideDirection(direction);

        setTimeout(() => {
            changeFunc();
            setSlideDirection(null);
            setIsAnimating(false);
        }, 300);
    }, [isAnimating]);

    // 성경 본문 로드
    useEffect(() => {
        async function loadVerses() {
            setVersesLoading(true);
            const chapterData = await getChapter(selectedBook, selectedChapter, selectedVersion);
            setVerses(chapterData);
            setVersesLoading(false);
            setSelectedVerses(new Set());
        }
        loadVerses();
    }, [selectedBook, selectedChapter, selectedVersion]);

    const handlePrevChapter = useCallback(() => {
        const doChange = () => {
            if (selectedChapter > 1) {
                setSelectedChapter(selectedChapter - 1);
            } else if (book) {
                const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook);
                if (currentIndex > 0) {
                    const prevBook = BIBLE_BOOKS[currentIndex - 1];
                    setSelectedBook(prevBook.name);
                    setSelectedChapter(prevBook.chapters);
                }
            }
        };
        animateAndChangeChapter('right', doChange);
    }, [selectedChapter, book, selectedBook, animateAndChangeChapter]);

    const handleNextChapter = useCallback(() => {
        const doChange = () => {
            if (book && selectedChapter < book.chapters) {
                setSelectedChapter(selectedChapter + 1);
            } else {
                const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook);
                if (currentIndex < BIBLE_BOOKS.length - 1) {
                    const nextBook = BIBLE_BOOKS[currentIndex + 1];
                    setSelectedBook(nextBook.name);
                    setSelectedChapter(1);
                }
            }
        };
        animateAndChangeChapter('left', doChange);
    }, [book, selectedChapter, selectedBook, animateAndChangeChapter]);

    // 스와이프용 핸들러
    const handleSwipePrev = useCallback(() => {
        const doChange = () => {
            if (selectedChapter > 1) {
                setSelectedChapter(selectedChapter - 1);
            } else if (book) {
                const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook);
                if (currentIndex > 0) {
                    const prevBook = BIBLE_BOOKS[currentIndex - 1];
                    setSelectedBook(prevBook.name);
                    setSelectedChapter(prevBook.chapters);
                }
            }
        };
        animateAndChangeChapter('right', doChange);
    }, [book, selectedChapter, selectedBook, animateAndChangeChapter]);

    const handleSwipeNext = useCallback(() => {
        const doChange = () => {
            if (book && selectedChapter < book.chapters) {
                setSelectedChapter(selectedChapter + 1);
            } else {
                const currentIndex = BIBLE_BOOKS.findIndex(b => b.name === selectedBook);
                if (currentIndex < BIBLE_BOOKS.length - 1) {
                    const nextBook = BIBLE_BOOKS[currentIndex + 1];
                    setSelectedBook(nextBook.name);
                    setSelectedChapter(1);
                }
            }
        };
        animateAndChangeChapter('left', doChange);
    }, [book, selectedChapter, selectedBook, animateAndChangeChapter]);

    // 스와이프 핸들러
    const handleTouchStart = (e: React.TouchEvent) => {
        if (meditationPanelOpen) return;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        touchEndX.current = e.touches[0].clientX;
        touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (meditationPanelOpen) return;
        touchEndX.current = e.touches[0].clientX;
        touchEndY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
        if (meditationPanelOpen) return;
        if (isAnimating) return;

        const deltaX = touchStartX.current - touchEndX.current;
        const deltaY = touchStartY.current - touchEndY.current;
        const minSwipeDistance = 80;

        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                handleSwipeNext();
            } else {
                handleSwipePrev();
            }
        }
    };

    // 구절 선택 텍스트 생성
    const getSelectedVersesText = useCallback(() => {
        if (selectedVerses.size === 0) return '';

        const sortedVerses = Array.from(selectedVerses).sort((a, b) => a - b);
        const firstVerse = sortedVerses[0];
        const lastVerse = sortedVerses[sortedVerses.length - 1];

        const rangeStr = firstVerse === lastVerse
            ? `${selectedBook} ${selectedChapter}:${firstVerse}`
            : `${selectedBook} ${selectedChapter}:${firstVerse}-${lastVerse}`;

        const textContent = sortedVerses
            .map(v => `${v}. ${verses[v]}`)
            .join('\n');

        return `${rangeStr}\n${textContent}`;
    }, [selectedVerses, selectedBook, selectedChapter, verses]);

    // 말씀 카드 생성을 위한 데이터 추출
    const getVerseCardData = useCallback(() => {
        if (selectedVerses.size === 0) return null;

        const sortedVerses = Array.from(selectedVerses).sort((a, b) => a - b);
        const firstVerse = sortedVerses[0];
        const lastVerse = sortedVerses[sortedVerses.length - 1];

        const reference = firstVerse === lastVerse
            ? `${selectedBook} ${selectedChapter}:${firstVerse}`
            : `${selectedBook} ${selectedChapter}:${firstVerse}-${lastVerse}`;

        // 순수 텍스트만 (절 번호 제외)
        const verseText = sortedVerses
            .map(v => verses[v])
            .join(' ');

        return { verse: verseText, reference };
    }, [selectedVerses, selectedBook, selectedChapter, verses]);

    // 말씀 카드 생성 열기
    const handleOpenVerseCard = useCallback(() => {
        const data = getVerseCardData();
        if (data) {
            setVerseCardData(data);
            setVerseCardOpen(true);
        }
    }, [getVerseCardData]);

    // 단일 구절 클릭
    const handleVerseClick = useCallback((verseNum: number) => {
        // 선택 모드 중이면 범위에 추가
        if (isSelecting && selectionStart !== null) {
            const start = Math.min(selectionStart, verseNum);
            const end = Math.max(selectionStart, verseNum);
            const newSelection = new Set<number>();
            for (let i = start; i <= end; i++) {
                newSelection.add(i);
            }
            setSelectedVerses(newSelection);
            setIsSelecting(false);
            setSelectionStart(null);
            return;
        }

        // 패널이 열려있으면 묵상 구절에 추가, 아니면 복사
        if (meditationPanelOpen) {
            // 묵상에 구절 추가
            const newVerse: SelectedVerse = {
                book: selectedBook,
                chapter: selectedChapter,
                startVerse: verseNum,
                endVerse: verseNum,
                text: verses[verseNum],
            };
            setMeditationVerses(prev => [...prev, newVerse]);
        } else {
            // 이미 선택된 구절이면 해제
            if (selectedVerses.has(verseNum)) {
                const newSelection = new Set(selectedVerses);
                newSelection.delete(verseNum);
                setSelectedVerses(newSelection);
                return;
            }

            // 새 구절 선택 + 클립보드 복사
            const newSelection = new Set(selectedVerses);
            newSelection.add(verseNum);
            setSelectedVerses(newSelection);

            const verseText = `${selectedBook} ${selectedChapter}:${verseNum} ${verses[verseNum]}`;
            navigator.clipboard.writeText(verseText);
            toast({ title: '구절이 복사되었습니다' });
        }
    }, [isSelecting, selectionStart, selectedVerses, meditationPanelOpen, selectedBook, selectedChapter, verses, toast]);

    // 터치한 구절 번호 저장 (탭 처리용)
    const touchedVerseRef = useRef<number | null>(null);
    const touchStartTimeRef = useRef<number>(0);

    // 꾹 누르기 시작
    const handleVerseLongPressStart = useCallback((verseNum: number) => {
        touchedVerseRef.current = verseNum;
        touchStartTimeRef.current = Date.now();
        longPressTimer.current = setTimeout(() => {
            setIsSelecting(true);
            setIsDraggingSelection(true);
            setSelectionStart(verseNum);
            setSelectedVerses(new Set([verseNum]));
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, 500);
    }, []);

    // 드래그 중 구절 위로 이동 시 범위 확장
    const handleVerseHover = useCallback((verseNum: number) => {
        if (!isDraggingSelection || selectionStart === null) return;

        const start = Math.min(selectionStart, verseNum);
        const end = Math.max(selectionStart, verseNum);
        const newSelection = new Set<number>();
        for (let i = start; i <= end; i++) {
            newSelection.add(i);
        }
        setSelectedVerses(newSelection);
    }, [isDraggingSelection, selectionStart]);

    // 터치 이동 핸들러
    const handleTouchMoveOnVerses = useCallback((e: React.TouchEvent) => {
        if (!isDraggingSelection) return;

        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const verseElement = element?.closest('[data-verse]');
        if (verseElement) {
            const verseNum = parseInt(verseElement.getAttribute('data-verse') || '0');
            if (verseNum > 0) {
                handleVerseHover(verseNum);
            }
        }
    }, [isDraggingSelection, handleVerseHover]);

    // 마우스 이동 핸들러
    const handleMouseMoveOnVerses = useCallback((e: React.MouseEvent) => {
        if (!isDraggingSelection) return;

        const element = document.elementFromPoint(e.clientX, e.clientY);
        const verseElement = element?.closest('[data-verse]');
        if (verseElement) {
            const verseNum = parseInt(verseElement.getAttribute('data-verse') || '0');
            if (verseNum > 0) {
                handleVerseHover(verseNum);
            }
        }
    }, [isDraggingSelection, handleVerseHover]);

    // 선택 완료 (복사 또는 묵상에 추가)
    const handleSelectionComplete = useCallback(() => {
        if (selectedVerses.size === 0) return;

        const sortedVerses = Array.from(selectedVerses).sort((a, b) => a - b);
        const firstVerse = sortedVerses[0];
        const lastVerse = sortedVerses[sortedVerses.length - 1];

        if (meditationPanelOpen) {
            // 묵상에 구절 추가
            const newVerse: SelectedVerse = {
                book: selectedBook,
                chapter: selectedChapter,
                startVerse: firstVerse,
                endVerse: lastVerse,
                text: sortedVerses.map(v => `${v}. ${verses[v]}`).join(' '),
            };
            setMeditationVerses(prev => [...prev, newVerse]);
        } else {
            // 클립보드 복사
            const versesText = getSelectedVersesText();
            navigator.clipboard.writeText(versesText);
            toast({ title: '선택한 구절이 복사되었습니다' });
        }

        setSelectedVerses(new Set());
        setIsSelecting(false);
        setSelectionStart(null);
    }, [selectedVerses, meditationPanelOpen, selectedBook, selectedChapter, verses, getSelectedVersesText, toast]);

    // 꾹 누르기 종료
    const handleVerseLongPressEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        // 드래그 모드였으면 선택 완료
        if (isDraggingSelection && selectedVerses.size > 0) {
            setIsDraggingSelection(false);
            handleSelectionComplete();
        } else if (touchedVerseRef.current !== null) {
            // 짧은 탭이었으면 (500ms 미만) handleVerseClick 호출
            const touchDuration = Date.now() - touchStartTimeRef.current;
            if (touchDuration < 500) {
                handleVerseClick(touchedVerseRef.current);
            }
        }

        setIsDraggingSelection(false);
        touchedVerseRef.current = null;
    }, [isDraggingSelection, selectedVerses.size, handleSelectionComplete, handleVerseClick]);

    // 선택된 구절을 묵상 패널에 추가
    const handleAddVerseToMeditation = useCallback(() => {
        if (selectedVerses.size === 0) return;

        const sortedVerses = Array.from(selectedVerses).sort((a, b) => a - b);
        const minVerse = sortedVerses[0];
        const maxVerse = sortedVerses[sortedVerses.length - 1];

        // 선택된 구절 텍스트 생성
        const verseText = sortedVerses
            .map(v => verses[v])
            .filter(Boolean)
            .join(' ');

        const newVerse: SelectedVerse = {
            book: selectedBook,
            chapter: selectedChapter,
            startVerse: minVerse,
            endVerse: maxVerse,
            text: verseText,
        };

        setMeditationVerses(prev => [...prev, newVerse]);
        setMeditationPanelOpen(true);
        setSelectedVerses(new Set());
        setIsSelecting(false);
    }, [selectedVerses, verses, selectedBook, selectedChapter]);

    // 묵상 구절 제거
    const handleRemoveMeditationVerse = useCallback((index: number) => {
        setMeditationVerses(prev => prev.filter((_, i) => i !== index));
    }, []);

    // 묵상 구절 모두 제거
    const handleClearMeditationVerses = useCallback(() => {
        setMeditationVerses([]);
    }, []);

    // PC 인라인 에디터: 카드 생성 핸들러
    const handleInlineCreateCard = useCallback((verse: SelectedVerse) => {
        setInlineCardVerse(verse);
        setInlineCardDialogOpen(true);
    }, []);

    // PC 인라인 에디터: 카드 이미지 생성 완료
    const handleInlineCardImageCreated = useCallback((imageDataUrl: string) => {
        setInlineCardImageToInsert(imageDataUrl);
    }, []);

    // PC 인라인 에디터: 카드 이미지 삽입 완료
    const handleInlineCardImageInserted = useCallback(() => {
        setInlineCardImageToInsert('');
    }, []);

    // 묵상 제출 핸들러
    const handleMeditationSubmit = useCallback(async (data: MeditationSubmitData) => {
        if (!church) return;

        const authorName = isRegisteredMember && userProfile
            ? userProfile.nickname
            : data.authorName?.trim();

        if (!authorName) {
            toast({ variant: 'error', title: '이름을 입력해주세요' });
            throw new Error('이름 필요');
        }

        setSubmitting(true);

        try {
            // 성경 범위 생성
            let bibleRange = `${selectedBook} ${selectedChapter}장`;
            if (data.bibleRange) {
                bibleRange = data.bibleRange;
            }

            const insertData: {
                church_id: string;
                guest_name: string;
                device_id: string;
                content: string;
                bible_range: string;
                day_number: number | null;
                is_anonymous: boolean;
                linked_user_id?: string;
                linked_at?: string;
            } = {
                church_id: church.id,
                guest_name: authorName,
                device_id: 'church-bible-reader-' + Date.now(),
                content: data.content,
                bible_range: bibleRange,
                day_number: data.dayNumber || null,
                is_anonymous: data.isAnonymous,
            };

            if (isRegisteredMember && currentUser) {
                insertData.linked_user_id = currentUser.id;
                insertData.linked_at = new Date().toISOString();
            }

            const supabase = getSupabaseBrowserClient();
            const { error } = await supabase
                .from('guest_comments')
                .insert(insertData);

            if (error) throw error;

            // 비로그인 시 이름 저장
            if (!isRegisteredMember && data.authorName) {
                localStorage.setItem('guest_name', data.authorName.trim());
            }

            toast({ variant: 'success', title: '짧은 묵상 나눔이 등록되었습니다' });
            setMeditationPanelOpen(false);
            setMeditationVerses([]);
        } catch (err) {
            if (err instanceof Error && err.message !== '이름 필요') {
                toast({ variant: 'error', title: '등록에 실패했습니다' });
            }
            throw err;
        } finally {
            setSubmitting(false);
        }
    }, [church, isRegisteredMember, userProfile, currentUser, selectedBook, selectedChapter, toast]);

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

    // 성경 본문 렌더링 (재사용)
    const renderBibleContent = (containerClass?: string) => (
        <div className={cn('space-y-4', containerClass)}>
            {/* 번역본 선택 */}
            <div className="flex gap-2">
                <Select value={selectedVersion} onValueChange={(v) => setSelectedVersion(v as BibleVersion)}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="revised">개역개정</SelectItem>
                        <SelectItem value="klb">현대인의성경</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 책/장 선택 */}
            <div className="flex gap-2">
                <Select value={selectedBook} onValueChange={setSelectedBook}>
                    <SelectTrigger className="flex-1">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                            구약
                        </div>
                        {BIBLE_BOOKS.filter(b => b.testament === 'old').map(bookItem => (
                            <SelectItem key={bookItem.name} value={bookItem.name}>
                                {bookItem.name}
                            </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
                            신약
                        </div>
                        {BIBLE_BOOKS.filter(b => b.testament === 'new').map(bookItem => (
                            <SelectItem key={bookItem.name} value={bookItem.name}>
                                {bookItem.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={selectedChapter.toString()}
                    onValueChange={(v) => setSelectedChapter(parseInt(v))}
                >
                    <SelectTrigger className="w-24">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {chapters.map(ch => (
                            <SelectItem key={ch} value={ch.toString()}>
                                {ch}장
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* 네비게이션 버튼 */}
            <div ref={navButtonsRef} className="flex justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevChapter}
                    disabled={selectedBook === '창세기' && selectedChapter === 1}
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    이전 장
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextChapter}
                    disabled={selectedBook === '요한계시록' && selectedChapter === 22}
                >
                    다음 장
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>

            {/* 선택 모드 안내 */}
            {isSelecting && (
                <div className="bg-primary/10 text-primary text-sm px-3 py-2 rounded-lg flex items-center justify-between">
                    <span>구절을 선택하세요 (클릭으로 범위 끝 지정)</span>
                    <Button size="sm" variant="ghost" onClick={() => {
                        setIsSelecting(false);
                        setSelectionStart(null);
                        setSelectedVerses(new Set());
                    }}>
                        취소
                    </Button>
                </div>
            )}

            {/* 선택된 구절 있을 때 액션 바 */}
            {selectedVerses.size > 0 && !isSelecting && (
                <div className="bg-primary text-primary-foreground text-sm px-3 py-2 rounded-lg flex items-center justify-between">
                    <span>{selectedVerses.size}개 구절 선택됨</span>
                    <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={handleAddVerseToMeditation}>
                            묵상
                        </Button>
                        <Button size="sm" variant="secondary" onClick={handleOpenVerseCard}>
                            <ImageIcon className="w-4 h-4 mr-1" />
                            카드
                        </Button>
                        <Button size="sm" variant="secondary" onClick={handleSelectionComplete}>
                            <Check className="w-4 h-4 mr-1" />
                            복사
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedVerses(new Set())}>
                            취소
                        </Button>
                    </div>
                </div>
            )}

            {/* 본문 카드 */}
            <Card
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`touch-pan-y transition-all duration-300 ease-out overflow-hidden`}
                style={{
                    transform: slideDirection === 'left'
                        ? 'translateX(-100%) rotateY(-15deg)'
                        : slideDirection === 'right'
                            ? 'translateX(100%) rotateY(15deg)'
                            : 'translateX(0)',
                    opacity: slideDirection ? 0 : 1,
                    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                }}
            >
                <CardHeader>
                    <CardTitle className="text-lg">
                        {selectedBook} {selectedChapter}장
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        {selectedVersion === 'klb' ? '현대인의성경' : '개역개정'}
                    </p>
                </CardHeader>
                <CardContent>
                    {versesLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <span className="ml-2 text-sm text-muted-foreground">불러오는 중...</span>
                        </div>
                    ) : Object.keys(verses).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>해당 장의 본문을 찾을 수 없습니다.</p>
                        </div>
                    ) : (
                        <div
                            ref={versesContainerRef}
                            className="space-y-4 text-sm leading-relaxed"
                            onTouchMove={handleTouchMoveOnVerses}
                            onMouseMove={handleMouseMoveOnVerses}
                            onMouseUp={handleVerseLongPressEnd}
                            onMouseLeave={handleVerseLongPressEnd}
                        >
                            {Object.entries(verses)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([verseNum, text]) => {
                                    const num = Number(verseNum);
                                    const isSelected = selectedVerses.has(num);
                                    const isRangeStart = selectionStart === num;

                                    return (
                                        <div
                                            key={verseNum}
                                            data-verse={num}
                                            className={cn(
                                                "flex gap-3 py-1 px-2 -mx-2 rounded-md transition-colors cursor-pointer select-none",
                                                isSelected && "bg-primary/10 border-l-2 border-primary",
                                                isRangeStart && "bg-primary/20",
                                                !isSelected && !isDraggingSelection && "hover:bg-muted/50 active:bg-muted"
                                            )}
                                            onTouchStart={() => handleVerseLongPressStart(num)}
                                            onTouchEnd={handleVerseLongPressEnd}
                                            onTouchCancel={handleVerseLongPressEnd}
                                            onMouseDown={() => handleVerseLongPressStart(num)}
                                            onMouseUp={handleVerseLongPressEnd}
                                        >
                                            <span className={cn(
                                                "font-semibold shrink-0 w-6",
                                                isSelected ? "text-primary" : "text-primary/70"
                                            )}>
                                                {verseNum}
                                            </span>
                                            <p className="text-foreground">{text}</p>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 하단 안내 및 묵상 버튼 (모바일만 또는 PC에서 패널 닫힌 상태) */}
            {(!isDesktop || !meditationPanelOpen) && (
                <div className="space-y-3 pb-4">
                    <p className="text-xs text-muted-foreground text-center">
                        좌우 스와이프로 이동할 수 있습니다
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                        구절을 꾹 눌러 여러 구절을 선택할 수 있습니다
                    </p>
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => setMeditationPanelOpen(true)}
                    >
                        <PenLine className="w-4 h-4 mr-2" />
                        묵상 작성하기
                    </Button>
                </div>
            )}
        </div>
    );

    // PC 분할 뷰의 에디터 영역
    const renderInlineEditor = () => (
        <div className="p-4 h-full overflow-y-auto">
            <MeditationEditor
                onSubmit={handleMeditationSubmit}
                selectedVerses={meditationVerses}
                onRemoveVerse={handleRemoveMeditationVerse}
                onClearVerses={handleClearMeditationVerses}
                onCreateCard={handleInlineCreateCard}
                showCardButton={true}
                cardImageToInsert={inlineCardImageToInsert}
                onCardImageInserted={handleInlineCardImageInserted}
                context="church_bible"
                identifier={churchCode}
                showDayPicker={true}
                showAnonymous={true}
                initialAuthorName={initialAuthorName}
                isSubmitting={submitting}
                minHeight="300px"
            />
        </div>
    );

    // PC 분할 뷰 레이아웃
    if (isDesktop) {
        return (
            <div className="h-screen flex flex-col bg-muted/30 lg:ml-20">
                {/* 헤더 */}
                <header className="bg-background border-b flex-shrink-0 z-10">
                    <div className="px-4 py-3">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/church/${churchCode}/bible`)}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5" />
                                <div>
                                    <h1 className="font-bold text-lg">성경 읽기</h1>
                                    <p className="text-xs text-muted-foreground">{church.name}</p>
                                </div>
                            </div>
                            {/* PC에서 묵상 패널 토글 버튼 */}
                            {!meditationPanelOpen && (
                                <Button
                                    className="ml-auto"
                                    onClick={() => setMeditationPanelOpen(true)}
                                >
                                    <PenLine className="w-4 h-4 mr-2" />
                                    묵상 작성
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                {/* 메인 콘텐츠: 분할 뷰 */}
                <div className="flex-1 min-h-0 relative">
                    <SplitViewLayout
                        leftPanel={
                            <div className="h-full overflow-y-auto" data-left-panel>
                                <div className="max-w-2xl mx-auto px-4 py-4">
                                    {renderBibleContent()}
                                </div>
                            </div>
                        }
                        rightPanel={renderInlineEditor()}
                        isRightPanelOpen={meditationPanelOpen}
                        onRightPanelClose={() => setMeditationPanelOpen(false)}
                        rightPanelTitle="묵상 작성"
                    />

                    {/* PC 플로팅 네비게이션 (스크롤 시 상단 버튼 안 보일 때) */}
                    {showFloatingNav && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-background/80 backdrop-blur-sm border rounded-full shadow-lg px-1 py-1 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePrevChapter}
                                disabled={selectedBook === '창세기' && selectedChapter === 1}
                                className="rounded-full h-9 px-4 text-muted-foreground hover:text-foreground"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                이전 장
                            </Button>
                            <span className="text-sm font-medium text-muted-foreground px-2">
                                {selectedBook} {selectedChapter}장
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleNextChapter}
                                disabled={selectedBook === '요한계시록' && selectedChapter === 22}
                                className="rounded-full h-9 px-4 text-muted-foreground hover:text-foreground"
                            >
                                다음 장
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* PC용 인라인 말씀카드 다이얼로그 */}
                {inlineCardVerse && (
                    <InlineVerseCardGenerator
                        open={inlineCardDialogOpen}
                        onOpenChange={setInlineCardDialogOpen}
                        verse={inlineCardVerse.text}
                        reference={`${inlineCardVerse.book} ${inlineCardVerse.chapter}:${
                            inlineCardVerse.startVerse === inlineCardVerse.endVerse
                                ? inlineCardVerse.startVerse
                                : `${inlineCardVerse.startVerse}-${inlineCardVerse.endVerse}`
                        }`}
                        churchName={church?.name}
                        onCardCreated={handleInlineCardImageCreated}
                    />
                )}

                {/* 말씀 카드 생성 (선택된 구절에서) */}
                {verseCardData && (
                    <VerseCardGenerator
                        open={verseCardOpen}
                        onOpenChange={(open) => {
                            setVerseCardOpen(open);
                            if (!open) {
                                setSelectedVerses(new Set());
                            }
                        }}
                        verse={verseCardData.verse}
                        reference={verseCardData.reference}
                        churchName={church?.name}
                    />
                )}
            </div>
        );
    }

    // 모바일 레이아웃 (기존과 동일)
    return (
        <ChurchLayout churchCode={churchCode} churchId={church?.id}>
        <div className="min-h-screen bg-muted/30 pb-20">
            {/* 헤더 */}
            <header className="bg-background border-b sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/church/${churchCode}/bible`)}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            <div>
                                <h1 className="font-bold text-lg">성경 읽기</h1>
                                <p className="text-xs text-muted-foreground">{church.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-4">
                {renderBibleContent()}
            </main>

            {/* 묵상 패널 (모바일: 바텀시트) */}
            <MeditationPanel
                isOpen={meditationPanelOpen}
                onOpenChange={setMeditationPanelOpen}
                selectedVerses={meditationVerses}
                onRemoveVerse={handleRemoveMeditationVerse}
                onClearVerses={handleClearMeditationVerses}
                onSubmit={handleMeditationSubmit}
                context="church_bible"
                identifier={churchCode}
                showCardButton={true}
                showDayPicker={true}
                showAnonymous={true}
                initialAuthorName={initialAuthorName}
                churchName={church?.name}
                isSubmitting={submitting}
            />

            {/* 말씀 카드 생성 */}
            {verseCardData && (
                <VerseCardGenerator
                    open={verseCardOpen}
                    onOpenChange={(open) => {
                        setVerseCardOpen(open);
                        if (!open) {
                            setSelectedVerses(new Set());
                        }
                    }}
                    verse={verseCardData.verse}
                    reference={verseCardData.reference}
                    churchName={church?.name}
                />
            )}

            {/* 하단 네비게이션은 ChurchLayout에서 처리 */}
        </div>
        </ChurchLayout>
    );
}

// 교회 코드를 가져와서 BibleAccessGuard에 전달하는 래퍼
function ChurchBibleReaderWithGuard() {
    const params = useParams();
    const churchCode = params.code as string;

    return (
        <BibleAccessGuard churchCode={churchCode}>
            <ChurchBibleReaderContent />
        </BibleAccessGuard>
    );
}

export default function ChurchBibleReaderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-muted/30">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <ChurchBibleReaderWithGuard />
        </Suspense>
    );
}
