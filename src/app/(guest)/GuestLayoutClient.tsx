'use client';

import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const guestNavItems = [
  { href: '/preview', label: '홈' },
  { href: '/explore', label: '성경' },
];

export default function GuestLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Guest Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-bold">리딩지저스</span>
          </Link>

          <div className="flex items-center gap-2">
            {guestNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/login">
              <Button size="sm" className="ml-2">
                로그인
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="animate-in fade-in-0 duration-300">
          {children}
        </div>
      </main>

      {/* Guest CTA Banner */}
      <div className="sticky bottom-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 text-center">
        <p className="text-sm font-medium mb-2">
          더 많은 기능을 이용하려면 로그인하세요
        </p>
        <Link href="/login">
          <Button variant="secondary" size="sm">
            무료로 시작하기
          </Button>
        </Link>
      </div>
    </div>
  );
}
