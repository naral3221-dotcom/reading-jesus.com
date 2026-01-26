# 페이지 생성

Next.js App Router 페이지를 생성합니다.

## 입력
- 페이지 경로: $ARGUMENTS (예: mypage/settings)

## 작업
1. `src/app/(main)/[경로]/page.tsx` 파일 생성
2. 프로젝트 패턴에 맞는 구조 적용

## 페이지 템플릿
```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function PageName() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // 데이터 로드 로직
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={loadData}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-4 space-y-4">
      {/* 헤더 with 뒤로가기 */}
      <div className="flex items-center gap-3 py-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">페이지 제목</h1>
      </div>

      {/* 컨텐츠 */}
      <Card>
        <CardHeader>
          <CardTitle>섹션 제목</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 내용 */}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 체크리스트
- [ ] 'use client' 지시문
- [ ] 로딩 상태 UI
- [ ] 에러 상태 UI
- [ ] 뒤로가기 버튼 (서브 페이지인 경우)
- [ ] 타입 정의
- [ ] Tailwind CSS만 사용
