'use client';

import Link from 'next/link';
import { FileEdit, BookOpen, Share2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  churchCode: string;
}

export function QuickActions({ churchCode }: QuickActionsProps) {
  const actions = [
    {
      label: 'QT 작성',
      href: `/church/${churchCode}/sharing?writeQt=true`,
      icon: <FileEdit className="w-4 h-4" />,
      color: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    },
    {
      label: '성경 읽기',
      href: `/church/${churchCode}/bible`,
      icon: <BookOpen className="w-4 h-4" />,
      color: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
    },
  ];

  const quickLinks = [
    {
      label: '나눔 보기',
      href: `/church/${churchCode}/sharing`,
      icon: <Share2 className="w-3.5 h-3.5" />,
    },
    {
      label: '최근 활동',
      href: `/church/${churchCode}/my`,
      icon: <Clock className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          빠른 실행
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 주요 액션 버튼 */}
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              asChild
              className={`h-auto py-3 flex flex-col gap-1 ${action.color}`}
            >
              <Link href={action.href}>
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>

        {/* 빠른 링크 */}
        <div className="pt-2 border-t border-border space-y-1">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
