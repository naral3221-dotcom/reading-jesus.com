# Home 페이지

> **경로**: `/home` | **파일**: `src/app/(main)/home/page.tsx`
> **복잡도**: ★★★★★ | **업데이트**: 2026-01-25

## 개요

### 목적
앱의 메인 홈 화면으로, 오늘의 성경 읽기 일정과 통합 피드를 제공합니다. 그룹 가입 여부에 따라 다른 UI를 보여주며, 개인 프로젝트 기반의 홈 화면도 지원합니다.

### 주요 기능
- 오늘의 성경 읽기 일정 표시 (Day 기반 네비게이션)
- 읽음 완료 체크 기능 (토글)
- 통합 피드 (그룹/교회/개인 묵상) 무한 스크롤
- 피드 탭 필터링 (전체/그룹/교회/개인)
- 온보딩 튜토리얼
- 묵상 작성 FAB 버튼
- 그룹이 없는 경우 대체 UI (NoGroupHome, PersonalHomeCard)

---

## 의존성

### 사용하는 훅
| 훅 | 출처 | 용도 |
|----|------|------|
| `useMainData` | `@/contexts/MainDataContext` | 사용자/교회/그룹 정보 |
| `useUpdateProfile` | `useUser` | 온보딩 완료 업데이트 |
| `useReadingCheckWithToggle` | `useReadingCheck` | 읽음 체크 상태 및 토글 |
| `useUserProjects` | `usePersonalProject` | 개인 프로젝트 조회 |
| `useUnifiedFeedInfinite` | `useUnifiedFeed` | 통합 피드 무한 스크롤 |
| `useRouter` | `next/navigation` | 페이지 이동 |
| `useToast` | `@/components/ui/toast` | 토스트 알림 |

### 사용하는 컴포넌트
| 컴포넌트 | 출처 | 용도 |
|----------|------|------|
| `HomeSkeleton` | `@/components/ui/skeleton` | 로딩 스켈레톤 |
| `ErrorState` | `@/components/ui/error-state` | 에러 상태 표시 |
| `AlertDialog` | `@/components/ui/alert-dialog` | 읽음 완료 확인 다이얼로그 |
| `OnboardingTutorial` | `@/components/OnboardingTutorial` | 온보딩 튜토리얼 |
| `NoGroupHome` | `@/components/home/NoGroupHome` | 그룹 없는 경우 UI |
| `PersonalHomeCard` | `@/components/home/PersonalHomeCard` | 개인 프로젝트 홈 카드 |
| `UnifiedFeedCard` | `@/components/feed/UnifiedFeedCard` | 통합 피드 카드 |
| `FeedTabs` | `@/components/feed/FeedTabs` | 피드 탭 UI |
| `FeedEmptyState` | `@/components/feed/FeedTabs` | 피드 빈 상태 |
| `FeedDetailModal` | `@/components/feed/FeedDetailModal` | 피드 상세 모달 |
| `Button`, `Card` | `@/components/ui/*` | UI 기본 컴포넌트 |

### 외부 데이터
| 데이터 | 출처 | 용도 |
|--------|------|------|
| `readingPlan` | `@/data/reading_plan.json` | 365일 성경 읽기 일정 |

---

## 상태 관리

### 로컬 상태 (useState)
| 상태명 | 타입 | 용도 |
|--------|------|------|
| `currentPlan` | `ReadingPlan \| null` | 현재 표시 중인 읽기 일정 |
| `todayPlan` | `ReadingPlan \| null` | 오늘의 읽기 일정 |
| `checkAnimation` | `boolean` | 체크 애니메이션 상태 |
| `showOnboarding` | `boolean` | 온보딩 모달 표시 여부 |
| `showCheckDialog` | `boolean` | 읽음 완료 다이얼로그 표시 |
| `scheduleMode` | `ScheduleMode` | 일정 모드 (calendar/relative) |
| `activeTab` | `FeedTabType` | 활성 피드 탭 |
| `selectedItem` | `UnifiedFeedItem \| null` | 선택된 피드 아이템 |
| `isModalOpen` | `boolean` | 피드 상세 모달 표시 |

### Ref 사용
| Ref | 용도 |
|-----|------|
| `loadMoreRef` | 무한 스크롤 감지용 IntersectionObserver 타겟 |

---

## UI 구성

### 레이아웃 구조
```
HomePage
├── HomeSkeleton (로딩 시)
├── ErrorState (에러 시)
├── NoGroupHome / PersonalHomeCard (그룹 없을 때)
└── 메인 레이아웃 (그룹 있을 때)
    ├── 오늘의 말씀 헤더 (스티키)
    │   ├── Day 네비게이션 (좌우 버튼)
    │   ├── 읽기/QT/완료 버튼
    │   └── "오늘" 뱃지
    ├── FeedTabs (스티키)
    ├── 피드 컨텐츠 (무한 스크롤)
    │   ├── UnifiedFeedCard (반복)
    │   └── 로딩 트리거 영역
    ├── 묵상 작성 FAB
    ├── FeedDetailModal
    ├── OnboardingTutorial
    └── AlertDialog (읽음 확인)
```

### 조건부 렌더링
1. **로딩 중**: `HomeSkeleton` 표시
2. **에러 (사용자 정보 없음)**: `ErrorState` 표시
3. **그룹 없음 + 개인 프로젝트 있음**: `PersonalHomeCard` 표시
4. **그룹 없음 + 개인 프로젝트 없음**: `NoGroupHome` 표시
5. **로그인 안됨**: 로그인 버튼 표시
6. **정상**: 메인 홈 레이아웃 표시

---

## 비즈니스 로직

### Day 계산 로직
```typescript
// calendar 모드: 오늘 날짜 기준
const findClosestPlan = (dateStr: string) => {
  // 정확히 일치하는 날짜 우선
  // 없으면 오늘 이전의 가장 최근 일정
  // 그것도 없으면 미래의 첫 일정
}

// relative 모드: 그룹 시작일 기준
const dayIndex = differenceInDays(today, startDate) + 1
```

### 읽음 완료 토글
1. 다이얼로그로 확인 요청
2. `toggleReadingCheck(currentPlan.day)` 호출
3. 애니메이션 효과 (zoom-in)
4. 토스트 알림 표시

### 피드 무한 스크롤
1. `IntersectionObserver`로 `loadMoreRef` 감지
2. 감지 시 `fetchNextPage()` 호출
3. `isFetchingNextPage` 동안 로딩 스피너 표시

### 피드 핸들러
| 핸들러 | 동작 |
|--------|------|
| `handleLike` | 좋아요 (낙관적 업데이트는 카드 내부 처리) |
| `handleComment` | 피드 상세 모달 열기 |
| `handleSourceClick` | 그룹/교회 페이지로 이동 |
| `handleChurchClick` | 교회 페이지로 이동 |
| `handleAuthorClick` | 작성자 프로필로 이동 |
| `handleViewDetail` | 피드 상세 모달 열기 |

---

## 관련 문서
- [bible.md](./bible.md) - 성경 전체 보기 페이지
- [bible-reader.md](./bible-reader.md) - 성경 읽기 페이지
- [FeedTabs 컴포넌트](../../components/feed/FeedTabs.md)
- [UnifiedFeedCard 컴포넌트](../../components/feed/UnifiedFeedCard.md)
