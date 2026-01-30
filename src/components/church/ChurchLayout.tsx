'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChurchBottomNav } from './ChurchBottomNav';
import { SidePanel } from './sidepanel';
import { SplitViewContainer, DropZoneOverlay, DraggableSidebar } from './splitview';
import { SplitViewProvider, useSplitViewContext } from '@/contexts/SplitViewContext';
import { cn } from '@/lib/utils';

interface ChurchLayoutProps {
    churchCode: string;
    churchId?: string;
    children: React.ReactNode;
    className?: string;
    hideNav?: boolean;
    hideSidePanel?: boolean;
}

function ChurchLayoutInner({
    churchCode,
    churchId,
    children,
    className,
    hideNav = false,
    hideSidePanel = false,
}: ChurchLayoutProps) {
    const { state } = useSplitViewContext();
    const [isLg, setIsLg] = useState(false);
    const searchParams = useSearchParams();

    // splitView 파라미터가 있으면 iframe 내부로 간주하여 네비게이션 숨김
    const isSplitViewMode = searchParams.get('splitView') === 'true';

    // 미디어 쿼리 감지
    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        setIsLg(mediaQuery.matches);

        const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    // iframe 내부 (Split View 패널)인 경우: 네비게이션 없이 콘텐츠만 표시
    if (isSplitViewMode) {
        return (
            <div className="min-h-screen">
                {children}
            </div>
        );
    }

    // Split View 활성화 시
    if (isLg && state.isEnabled) {
        return (
            <div className="min-h-screen lg:ml-48">
                <SplitViewContainer churchCode={churchCode} />
                <DraggableSidebar churchCode={churchCode} />
            </div>
        );
    }

    // 일반 레이아웃
    return (
        <div className={cn(
            'min-h-screen flex',
            // PC에서 좌측 사이드바 공간 확보 (expanded: w-48 = 192px)
            'lg:ml-48',
            className
        )}>
            {/* 메인 콘텐츠 영역 */}
            <div className="flex-1 min-w-0">
                {children}
            </div>

            {/* 오른쪽 사이드 패널 (PC xl 이상에서만 표시) */}
            {!hideSidePanel && (
                <SidePanel churchCode={churchCode} churchId={churchId} />
            )}

            {/* 드롭 영역 오버레이 (메뉴 드래그 중) */}
            {state.isDraggingMenu && <DropZoneOverlay />}

            {/* 네비게이션 */}
            {!hideNav && (
                <>
                    {/* 모바일: 기존 하단 네비게이션 */}
                    <div className="lg:hidden">
                        <ChurchBottomNav churchCode={churchCode} />
                    </div>

                    {/* PC: 드래그 가능한 사이드바 */}
                    <DraggableSidebar churchCode={churchCode} />
                </>
            )}
        </div>
    );
}

export function ChurchLayout(props: ChurchLayoutProps) {
    return (
        <SplitViewProvider>
            <ChurchLayoutInner {...props} />
        </SplitViewProvider>
    );
}
