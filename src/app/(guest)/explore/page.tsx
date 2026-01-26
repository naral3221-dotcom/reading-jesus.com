'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

// 성경 책들 (구약/신약 분리)
const oldTestamentBooks = [
  '창세기', '출애굽기', '레위기', '민수기', '신명기',
  '여호수아', '사사기', '룻기', '사무엘상', '사무엘하',
  '열왕기상', '열왕기하', '역대상', '역대하', '에스라',
  '느헤미야', '에스더', '욥기', '시편', '잠언',
  '전도서', '아가', '이사야', '예레미야', '예레미야애가',
  '에스겔', '다니엘', '호세아', '요엘', '아모스',
  '오바댜', '요나', '미가', '나훔', '하박국',
  '스바냐', '학개', '스가랴', '말라기',
];

const newTestamentBooks = [
  '마태복음', '마가복음', '누가복음', '요한복음', '사도행전',
  '로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서',
  '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서', '디모데전서',
  '디모데후서', '디도서', '빌레몬서', '히브리서', '야고보서',
  '베드로전서', '베드로후서', '요한1서', '요한2서', '요한3서',
  '유다서', '요한계시록',
];

export default function GuestBiblePage() {
  return (
    <div className="flex flex-col p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold">성경 전체 보기</h1>
        <p className="text-muted-foreground text-sm mt-1">
          66권의 성경을 탐색해보세요
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">성경 읽기</h3>
              <p className="text-sm text-muted-foreground">
                원하는 성경책을 선택하여 바로 읽을 수 있습니다. 개역개정과 현대인의성경 두 가지 번역본을 제공합니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 구약 */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span>구약</span>
          <span className="text-sm font-normal text-muted-foreground">
            {oldTestamentBooks.length}권
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {oldTestamentBooks.map((book) => (
            <Link key={book} href={`/bible-reader?book=${encodeURIComponent(book)}&chapter=1`}>
              <Card className="relative overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{book}</span>
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 신약 */}
      <div>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span>신약</span>
          <span className="text-sm font-normal text-muted-foreground">
            {newTestamentBooks.length}권
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {newTestamentBooks.map((book) => (
            <Link key={book} href={`/bible-reader?book=${encodeURIComponent(book)}&chapter=1`}>
              <Card className="relative overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{book}</span>
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 text-center">
          <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold mb-2">더 많은 기능을 원하신다면</h3>
          <p className="text-sm text-muted-foreground mb-4">
            로그인하고 365일 통독 계획, 묵상 기록, 그룹 나눔 등의 기능을 이용하세요
          </p>
          <Link href="/login">
            <Button className="w-full">
              무료로 시작하기
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
