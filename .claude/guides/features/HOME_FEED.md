# 홈 & 피드 가이드

> 홈 화면, 통합 피드 관련 작업 시 참조하세요.

---

## 1. 개요

### 홈 화면 구조

```
┌─────────────────────────────────────────────────────────────┐
│                       홈 페이지 (/home)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 헤더: 앱 로고 + 알림 아이콘                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 교회 바로가기 (ChurchQuickLink)                      │    │
│  │ - 소속 교회 정보 표시                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 빠른 액션 버튼 (QuickActionButtons)                  │    │
│  │ - 오늘의 말씀 / QT 작성 / 묵상 작성                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 인라인 묵상 작성 (InlineMeditationForm)              │    │
│  │ - 짧은 묵상 빠른 작성                                 │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 피드 탭 (FeedTabs)                                   │    │
│  │ [전체] [팔로잉] [그룹]                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 통합 피드 (UnifiedFeedInfinite)                      │    │
│  │ - QTFeedCard (QT 형식)                               │    │
│  │ - PublicMeditationCard (일반 묵상)                   │    │
│  │ - 무한 스크롤                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 관련 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 홈 | `/home` | 메인 피드 |
| 커뮤니티 | `/community` | → `/home`으로 리다이렉트 |

---

## 2. 핵심 파일

### 페이지

| 파일 | 역할 |
|------|------|
| `src/app/(main)/home/page.tsx` | 홈 페이지 |
| `src/app/(main)/community/page.tsx` | /home으로 리다이렉트 |

### 컴포넌트

| 파일 | 역할 |
|------|------|
| `src/components/feed/UnifiedFeedCard.tsx` | 통합 피드 카드 (QT/묵상 분기) |
| `src/components/feed/QTFeedCard.tsx` | QT 전용 캐러셀 카드 |
| `src/components/feed/FeedDetailModal.tsx` | 피드 상세 모달 |
| `src/components/feed/FeedTabs.tsx` | 피드 탭 (전체/팔로잉/그룹) |
| `src/components/feed/FeedFilters.tsx` | 피드 필터 로직 |
| `src/components/home/ChurchQuickLink.tsx` | 교회 바로가기 |
| `src/components/home/QuickActionButtons.tsx` | 빠른 액션 버튼 |
| `src/components/home/InlineMeditationForm.tsx` | 인라인 묵상 작성 |
| `src/components/home/PlatformStats.tsx` | 플랫폼 통계 |
| `src/components/community/UnifiedFeed.tsx` | 통합 피드 컨테이너 |

### 피드 카드 하위 컴포넌트

| 파일 | 역할 |
|------|------|
| `src/components/feed/components/FeedCardAvatar.tsx` | 아바타 |
| `src/components/feed/components/FeedCardContent.tsx` | 콘텐츠 |
| `src/components/feed/components/FeedCardImages.tsx` | 이미지 |
| `src/components/feed/components/FeedCardActions.tsx` | 좋아요/댓글/북마크 |
| `src/components/feed/components/MediaCarousel.tsx` | 미디어 캐러셀 |

---

## 3. 사용하는 훅

| 훅 | 파일 | 용도 |
|----|------|------|
| `useUnifiedFeed` | `useUnifiedFeed.ts` | 통합 피드 첫 페이지 |
| `useUnifiedFeedInfinite` | `useUnifiedFeed.ts` | 통합 피드 무한스크롤 |
| `useMainData` | `useMainPageData.ts` | 메인 페이지 데이터 |
| `useReadingCheckWithToggle` | `useReadingCheck.ts` | 읽음 체크 토글 |

### Query Key Factory

```typescript
const unifiedFeedKeys = {
  all: ['unified-feed'] as const,
  list: (tab: string) => [...unifiedFeedKeys.all, 'list', tab] as const,
  infinite: (tab: string, typeFilter: string) =>
    [...unifiedFeedKeys.all, 'infinite', tab, typeFilter] as const,
};
```

### 사용 예시

```typescript
import { useUnifiedFeedInfinite } from '@/presentation/hooks/queries/useUnifiedFeed';

function FeedComponent() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUnifiedFeedInfinite({
    tab: 'all',           // 'all' | 'following' | 'group'
    typeFilter: 'all',    // 'all' | 'qt' | 'meditation'
    enabled: true,
  });

  // 무한 스크롤 처리
  const items = data?.pages.flatMap(page => page.items) ?? [];

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={fetchNextPage}
      hasMore={hasNextPage}
    >
      {items.map(item => (
        <UnifiedFeedCard key={item.id} item={item} />
      ))}
    </InfiniteScroll>
  );
}
```

---

## 4. 데이터 흐름

### 피드 조회 흐름

```
useUnifiedFeedInfinite() 훅
    ↓
GetUnifiedFeed Use Case
    ↓
SupabaseUnifiedMeditationRepository
    ↓
unified_meditations 테이블
    ↓
커서 기반 페이지네이션
    ↓
UnifiedFeedCard 렌더링
    ├─ source_type === 'qt' → QTFeedCard
    └─ 그 외 → 일반 묵상 카드
```

### 피드 필터 옵션

| 탭 | 설명 | 필터 조건 |
|----|------|----------|
| `all` | 전체 | 모든 공개 묵상 + 내 그룹/교회 |
| `following` | 팔로잉 | 팔로우 중인 사용자만 |
| `group` | 그룹 | 내가 속한 그룹만 |

| 타입 필터 | 설명 |
|----------|------|
| `all` | 모든 타입 |
| `qt` | QT 형식만 |
| `meditation` | 일반 묵상만 |

### 테이블 구조

```sql
unified_meditations
├── id: UUID (PK)
├── user_id: UUID
├── source_type: TEXT ('group' | 'church' | 'public')
├── source_id: UUID
├── content_type: TEXT ('free' | 'qt')
├── content: TEXT
├── day_number: INTEGER
├── visibility: content_visibility
├── likes_count: INTEGER
├── replies_count: INTEGER
├── created_at: TIMESTAMPTZ
└── ... (QT 필드들)
```

---

## 5. 작업 체크리스트

### 피드 카드 UI 수정 시

- [ ] `UnifiedFeedCard.tsx` 수정
- [ ] `QTFeedCard.tsx` 수정 (QT 타입인 경우)
- [ ] `FeedDetailModal.tsx`에서 확인
- [ ] 모바일/데스크톱 반응형 테스트

### 피드 필터 수정 시

- [ ] `FeedTabs.tsx` 수정
- [ ] `useUnifiedFeedInfinite` 파라미터 확인
- [ ] `GetUnifiedFeed` UseCase 로직 확인

### 새 피드 컴포넌트 추가 시

- [ ] 피드 카드 컴포넌트 생성
- [ ] `UnifiedFeedCard.tsx`에서 타입 분기 추가
- [ ] `FeedDetailModal.tsx`에서 렌더링 추가

---

## 6. 성능 최적화

### 무한 스크롤

- 커서 기반 페이지네이션 (offset 대신 cursor 사용)
- 페이지당 20개 아이템
- React Query의 `useInfiniteQuery` 활용

### 캐시 관리

```typescript
// 피드 캐시 무효화
queryClient.invalidateQueries({ queryKey: ['unified-feed'] });

// 낙관적 업데이트 (좋아요)
queryClient.setQueryData(['unified-feed', ...], (old) => {
  // 좋아요 카운트 즉시 업데이트
});
```

---

## 7. 주의사항

1. **QT vs 묵상 분기**: `source_type === 'qt'` 또는 `content_type === 'qt'` 체크
2. **피드 캐시 무효화**: 묵상 생성/삭제 후 반드시 피드 캐시 무효화
3. **무한 스크롤 메모리**: 너무 많은 페이지 로드 시 메모리 주의

---

## 8. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-01 | 초기 문서 작성 |
