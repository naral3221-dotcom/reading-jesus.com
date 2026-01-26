'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, MessageCircle, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChurchBottomNavProps {
    churchCode: string;
}

export function ChurchBottomNav({ churchCode }: ChurchBottomNavProps) {
    const pathname = usePathname();

    const tabs = [
        {
            name: '홈',
            href: `/church/${churchCode}`,
            icon: Home,
            isActive: pathname === `/church/${churchCode}`,
        },
        {
            name: '성경',
            href: `/church/${churchCode}/bible`,
            icon: BookOpen,
            isActive: pathname.startsWith(`/church/${churchCode}/bible`),
        },
        {
            name: '나눔',
            href: `/church/${churchCode}/sharing`,
            icon: MessageCircle,
            isActive: pathname.startsWith(`/church/${churchCode}/sharing`),
        },
        {
            name: '그룹',
            href: `/church/${churchCode}/groups`,
            icon: Users,
            isActive: pathname.startsWith(`/church/${churchCode}/groups`),
        },
        {
            name: '마이',
            href: `/church/${churchCode}/my`,
            icon: User,
            isActive: pathname.startsWith(`/church/${churchCode}/my`),
        },
    ];

    return (
        <>
            {/* 모바일: 하단 네비게이션 */}
            <nav
                className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-background/95 backdrop-blur-sm border-t border-border z-50 safe-area-pb shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
                aria-label="교회 네비게이션"
                role="navigation"
            >
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-around h-16">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                aria-label={tab.name}
                                aria-current={tab.isActive ? 'page' : undefined}
                                className={cn(
                                    'flex flex-col items-center justify-center flex-1 h-full min-w-[64px] gap-0.5 transition-all duration-200 relative active:scale-95',
                                    tab.isActive
                                        ? 'text-primary dark:text-primary'
                                        : 'text-muted-foreground hover:text-primary/80'
                                )}
                            >
                                {tab.isActive && (
                                    <span className="absolute top-1 w-8 h-1 rounded-full bg-gradient-to-r from-accent to-accent/80" />
                                )}
                                <div className={cn(
                                    'p-2 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center',
                                    tab.isActive && 'bg-accent/10'
                                )}>
                                    <tab.icon
                                        className={cn(
                                            'w-6 h-6 transition-transform',
                                            tab.isActive && 'scale-110'
                                        )}
                                        aria-hidden="true"
                                    />
                                </div>
                                <span className={cn(
                                    'text-[10px] font-medium',
                                    tab.isActive && 'text-primary font-semibold'
                                )}>{tab.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </nav>

            {/* PC: 좌측 사이드바 */}
            <nav
                className="hidden lg:flex fixed left-0 top-0 bottom-0 w-20 bg-background/95 backdrop-blur-sm border-r border-border z-50 flex-col items-center py-6 shadow-[4px_0_20px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_20px_rgba(0,0,0,0.2)]"
                aria-label="교회 네비게이션"
                role="navigation"
            >
                <div className="flex flex-col items-center gap-2 flex-1">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            aria-label={tab.name}
                            aria-current={tab.isActive ? 'page' : undefined}
                            className={cn(
                                'flex flex-col items-center justify-center w-16 h-16 gap-1 rounded-xl transition-all duration-200 relative group',
                                tab.isActive
                                    ? 'text-primary bg-accent/10'
                                    : 'text-muted-foreground hover:text-primary/80 hover:bg-accent/5'
                            )}
                        >
                            {tab.isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-accent to-accent/80" />
                            )}
                            <div className={cn(
                                'p-2 rounded-xl transition-colors',
                                tab.isActive && 'bg-accent/15'
                            )}>
                                <tab.icon
                                    className={cn(
                                        'w-5 h-5 transition-transform',
                                        tab.isActive && 'scale-110'
                                    )}
                                    aria-hidden="true"
                                />
                            </div>
                            <span className={cn(
                                'text-[10px] font-medium',
                                tab.isActive && 'text-primary font-semibold'
                            )}>{tab.name}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    );
}
