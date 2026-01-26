# 리딩지저스 종합 코드 리뷰 보고서

> **작성일**: 2026-01-20
> **리뷰 범위**: 전체 프로젝트 (src/ 디렉토리)
> **파일 수**: 496개 TypeScript/TSX 파일

---

## 목차

1. [Executive Summary](#1-executive-summary)
2. [클린 아키텍처 준수 현황](#2-클린-아키텍처-준수-현황)
3. [코드 품질 및 보안 취약점](#3-코드-품질-및-보안-취약점)
4. [사용자 경험(UX) 에러 가능성](#4-사용자-경험ux-에러-가능성)
5. [개선 로드맵](#5-개선-로드맵)
6. [파일별 상세 이슈](#6-파일별-상세-이슈)

---

## 1. Executive Summary

### 전체 평가: **B+ (Good)**

리딩지저스 프로젝트는 클린 아키텍처를 도입하여 코드의 유지보수성과 테스트 용이성을 높였습니다. 그러나 일부 레거시 코드와 새로운 아키텍처 사이의 불일치가 발견되었습니다.

### 강점
- **클린 아키텍처 기반**: 21개 도메인 엔티티, 22개 Repository, 100+ Use Cases
- **React Query 최적화**: Query Key Factory 패턴, 세분화된 캐시 전략
- **보안**: XSS/SQL Injection 취약점 없음, 매개변수화된 쿼리 사용
- **타입 안정성**: TypeScript 전면 도입

### 주요 문제점
| 카테고리 | 심각도 | 발견 수 |
|---------|--------|---------|
| 클린 아키텍처 위반 | 🔴 높음 | 40+ 파일 |
| console.log 잔존 | 🟡 중간 | 268개 |
| API 키 하드코드 | 🔴 높음 | 1개 |
| 에러 처리 누락 | 🟡 중간 | 45개 파일 |
| 페이지네이션 부재 | 🟡 중간 | 5개 페이지 |

---

## 2. 클린 아키텍처 준수 현황

### 2.1 현재 아키텍처 구조

```
src/
├── domain/              # 1️⃣ 도메인 레이어 ✅ 잘 구현됨
│   ├── entities/        # 21개 엔티티 (순수 TypeScript)
│   └── repositories/    # 22개 인터페이스
│
├── infrastructure/      # 2️⃣ 인프라 레이어 ✅ 잘 구현됨
│   ├── repositories/    # 22개 Supabase 구현체
│   └── supabase/        # 클라이언트 설정
│
├── application/         # 3️⃣ 애플리케이션 레이어 ✅ 잘 구현됨
│   └── use-cases/       # 100+ 비즈니스 유스케이스
│
├── presentation/        # 4️⃣ 프레젠테이션 레이어 ⚠️ 부분 준수
│   ├── hooks/queries/   # 25개 React Query 훅
│   ├── hooks/stores/    # 3개 Zustand 스토어
│   └── providers/       # Query Provider
│
├── components/          # ⚠️ 아키텍처 위반 다수
├── app/                 # ⚠️ 아키텍처 위반 다수
└── lib/                 # ⚠️ 위치 모호 (리팩토링 필요)
```

### 2.2 아키텍처 위반 유형별 분류

#### 🔴 유형 1: 컴포넌트에서 Supabase 직접 접근 (40+ 파일)

**심각도**: 높음
**영향**: 테스트 어려움, 의존성 역전 원칙(DIP) 위반

| 컴포넌트 | 위반 내용 |
|---------|----------|
| `components/home/RecentQTList.tsx:10` | guest_comments 직접 조회 |
| `components/bible/PlanSelector.tsx:12` | group_members, group_user_plans 직접 조회 |
| `components/church/EncouragementButton.tsx:6` | encouragements 직접 insert |
| `components/church/BadgeDisplay.tsx:5` | Badge 데이터 직접 조회 |
| `components/church/BadgeNotificationModal.tsx:6` | Badge 알림 상태 직접 접근 |
| `components/church/EncouragementList.tsx:6` | 격려 목록 직접 조회 |
| `components/church/contents/*.tsx` | 5개 컴포넌트 모두 Supabase 직접 사용 |
| `components/church/sidepanel/*.tsx` | 4개 컴포넌트 모두 Supabase 직접 사용 |
| `components/mypage/UnifiedMyPage.tsx:37` | 마이페이지 전체 로직 컴포넌트 내 구현 |
| `components/group/JoinRequestsManager.tsx:8` | 가입 요청 직접 처리 |

```typescript
// ❌ 현재 (위반)
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';

const Component = () => {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.from('table').select('*');
  // ...
}

// ✅ 개선안
import { useMyData } from '@/presentation/hooks/queries/useMyData';

const Component = () => {
  const { data } = useMyData();
  // ...
}
```

#### 🔴 유형 2: Page.tsx에서 Infrastructure 직접 접근 (15+ 파일)

**심각도**: 높음

| 페이지 | 위반 내용 |
|-------|----------|
| `app/page.tsx:6` | 랜딩페이지에서 Supabase 직접 사용 |
| `app/(main)/bible-reader/page.tsx:19` | 사용자 정보 직접 조회 |
| `app/(main)/search/page.tsx:10` | 검색 기능 직접 구현 |
| `app/(main)/qt/[day]/page.tsx:48` | QT 데이터 직접 접근 |
| `app/(main)/mypage/settings/page.tsx:30` | 설정 페이지 직접 접근 |
| `app/church/[code]/sharing/page.tsx:43` | 나눔 페이지 직접 접근 |
| `app/admin/**/*.tsx` | 관리자 페이지 전체 직접 접근 |

#### 🟡 유형 3: lib 폴더의 비즈니스 로직 (8 파일)

**심각도**: 중간
**문제**: lib 폴더가 Application Layer와 Infrastructure Layer 사이에 애매하게 위치

| 파일 | 문제점 |
|-----|--------|
| `lib/feed-api.ts` | 피드 조회 로직이 lib에 있음 (Use Case로 이동 필요) |
| `lib/draftStorage.ts` | Draft 저장 로직이 Supabase 직접 사용 |
| `lib/notifications.ts` | 알림 생성 로직이 직접 Supabase 접근 |
| `lib/reading-utils.ts` | 읽기 유틸리티가 Supabase 직접 접근 |
| `lib/plan-utils.ts` | 플랜 유틸리티가 Supabase 직접 접근 |
| `lib/migrate-local-data.ts` | 마이그레이션 로직 |

#### 🟡 유형 4: Repository Import 경로 불일치 (6 파일)

**심각도**: 중간
**문제**: 일부 Repository가 `@/lib/supabase`를, 일부는 `@/infrastructure/supabase/client`를 사용

```
// 불일치 파일
- SupabaseChurchAdminRepository.ts → @/lib/supabase
- SupabaseSystemAdminRepository.ts → @/lib/supabase
- SupabaseReadingCheckRepository.ts → @/lib/supabase
- SupabasePrayerRepository.ts → @/lib/supabase
- SupabasePersonalProjectRepository.ts → @/lib/supabase
- SupabaseCommentRepository.ts → @/lib/supabase

// 나머지 Repository → @/infrastructure/supabase/client (올바름)
```

### 2.3 아키텍처 준수율

| 레이어 | 준수율 | 설명 |
|--------|--------|------|
| Domain | **100%** | 외부 의존성 없음, 순수 TypeScript |
| Infrastructure | **90%** | Import 경로 불일치 제외하면 양호 |
| Application | **95%** | Use Case 패턴 잘 적용 |
| Presentation | **60%** | 컴포넌트/페이지에서 직접 접근 다수 |

---

## 3. 코드 품질 및 보안 취약점

### 3.1 보안 취약점

#### 🔴 즉시 수정 필요: API 키 하드코드

**파일**: `src/lib/pixabay.ts:4`
```typescript
// ❌ 현재 (취약)
const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY || '53953241-3667b4ec9e976da7a2538a1a4';

// ✅ 수정안
const PIXABAY_API_KEY = process.env.NEXT_PUBLIC_PIXABAY_API_KEY;
if (!PIXABAY_API_KEY) {
  throw new Error('NEXT_PUBLIC_PIXABAY_API_KEY is not set');
}
```

#### ✅ 안전: XSS 취약점 없음

- `dangerouslySetInnerHTML` 사용 없음
- React 컴포넌트로 안전하게 렌더링

#### ✅ 안전: SQL Injection 없음

- Supabase 매개변수화된 쿼리 사용
- Raw SQL 사용 없음

### 3.2 TypeScript `any` 타입 사용 (12개)

| 파일 | 라인 | 코드 |
|-----|------|------|
| `components/bible/PlanSelector.tsx` | 67, 106 | `as any` 타입 변환 |
| `components/ui/image-cropper.tsx` | 10 | 동적 import `any` |
| `components/church/BadgeDisplay.tsx` | 47, 139 | `map((item: any) => ...)` |
| `components/church/BadgeNotificationModal.tsx` | 40 | `map((item: any) => ...)` |
| `app/admin/database/page.tsx` | 76 | `[key: string]: any` |
| `infrastructure/repositories/SupabasePublicMeditationCommentRepository.ts` | 229 | `row: any` |
| `app/church/[code]/groups/[groupId]/page.tsx` | 329 | `(member: any)` |
| `lib/debug.ts` | 142 | `(window as any)` |

### 3.3 console.log 잔존 (268개)

| 유형 | 개수 | 주요 파일 |
|-----|------|---------|
| `console.error()` | ~120 | contexts/, lib/draftStorage.ts |
| `console.log()` | ~95 | lib/debug.ts, admin-login/page.tsx |
| `console.warn()` | ~30 | contexts/ |
| `console.group()` | ~23 | lib/debug.ts |

**권장 조치**:
```typescript
// 환경 변수로 제어
if (process.env.NODE_ENV === 'development') {
  console.log('Debug message');
}

// 또는 로깅 라이브러리 도입
import { logger } from '@/lib/logger';
logger.error('Error message');
```

### 3.4 에러 처리 누락 (45+ 파일)

#### Supabase RPC 호출 에러 처리 없음

| 파일 | 라인 | 문제 |
|-----|------|------|
| `infrastructure/repositories/SupabaseCommentRepository.ts` | 381, 392, 461, 506 | RPC 에러 미처리 |
| `infrastructure/repositories/SupabaseGuestCommentRepository.ts` | 256, 271, 342, 369 | RPC 에러 미처리 |
| `infrastructure/repositories/SupabaseChurchQTPostRepository.ts` | 277, 292, 363, 390 | RPC 에러 미처리 |
| `components/group/JoinRequestsManager.tsx` | 68, 101 | RPC 에러 미처리 |

```typescript
// ❌ 현재 (에러 처리 없음)
await supabase.rpc('increment_comment_likes', { comment_id: commentId });

// ✅ 수정안
const { error } = await supabase.rpc('increment_comment_likes', { comment_id: commentId });
if (error) {
  throw new Error(`좋아요 증가 실패: ${error.message}`);
}
```

---

## 4. 사용자 경험(UX) 에러 가능성

### 4.1 로딩/에러/빈 상태 처리 누락

#### 🔴 에러 상태 UI 누락

| 페이지/컴포넌트 | 문제점 |
|---------------|--------|
| `search/page.tsx:27-93` | 검색 에러 시 silent failure |
| `community/page.tsx:399-404` | 댓글 생성 실패 시 폼 복구 불명확 |
| `group/[id]/admin/page.tsx:375-388` | 멤버 제거/승격 실패 에러 메시지 없음 |
| `mypage/profile/page.tsx:182-184` | 저장 실패 후 추가 안내 없음 |

#### 🟡 빈 상태(Empty State) 처리 누락

| 페이지 | 문제점 |
|-------|--------|
| `community/page.tsx` | "내 묵상" 필터에서 묵상 없을 때 안내 없음 |
| `notifications/page.tsx` | 알림 없을 때 빈 상태 UI 불명확 |
| `mypage/readings/page.tsx` | 읽은 말씀 없을 때 상태 처리 미확인 |
| `search/page.tsx` | 검색 전 vs 결과 없음 vs 에러 구분 불명확 |

### 4.2 페이지네이션/무한스크롤 부재

| 페이지 | 현재 제한 | 문제점 |
|-------|----------|--------|
| `community/page.tsx` | 50개 고정 | ✅ 무한스크롤 적용됨 |
| `search/page.tsx:36, 63` | 50개 고정 | 50개 초과 시 자동 잘림 |
| `notifications/page.tsx:96` | 50개 고정 | 과거 알림 확인 불가 |
| `church/[code]/sharing/page.tsx` | 슬라이더만 | 전체 목록 페이지네이션 없음 |

### 4.3 옵티미스틱 업데이트 누락

| 기능 | 파일 | 문제점 |
|-----|------|--------|
| 좋아요 토글 | `community/page.tsx:467-497` | 서버 응답 대기 후 UI 업데이트 |
| 읽음 체크 | `home/page.tsx:206-237` | 뮤테이션 완료 대기, 1-2초 지연 |
| 댓글 작성 | `community/page.tsx:351-408` | 댓글 목록에 즉시 반영 안됨 |

```typescript
// ✅ 옵티미스틱 업데이트 예시
const mutation = useMutation({
  mutationFn: toggleLike,
  onMutate: async (commentId) => {
    await queryClient.cancelQueries(['comments']);
    const previousComments = queryClient.getQueryData(['comments']);
    queryClient.setQueryData(['comments'], (old) =>
      old.map(c => c.id === commentId ? {...c, liked: !c.liked} : c)
    );
    return { previousComments };
  },
  onError: (err, commentId, context) => {
    queryClient.setQueryData(['comments'], context.previousComments);
  },
});
```

### 4.4 인증/권한 체크 취약점

#### TOCTOU (Time-of-check to Time-of-use) 취약점

**파일**: `group/[id]/admin/page.tsx:183-194`
```typescript
// ❌ 현재 (취약)
// 권한 체크 전에 관리자 UI가 일시적으로 렌더링됨
if (!isAdmin) {
  toast.error('접근 권한이 없습니다');
  router.push('/');
  return;
}
// 이 시점에 이미 UI가 노출되었을 수 있음

// ✅ 수정안
if (loading) return <LoadingSpinner />;
if (!isAdmin) {
  router.push('/');
  return null; // 리다이렉트 중에도 아무것도 렌더링하지 않음
}
```

#### localStorage 기반 권한 체크

**파일**: `group/[id]/admin/page.tsx:138-145`
```typescript
// ⚠️ 위험
const churchAdminToken = localStorage.getItem('church_admin_token');
// localStorage는 클라이언트에서 조작 가능
// 서버 세션 검증 필요
```

### 4.5 경쟁 조건(Race Condition) 가능성

| 위치 | 시나리오 | 문제점 |
|-----|---------|--------|
| `home/page.tsx:181-197` | Day 빠른 클릭 | 상태 업데이트 순서 보장 없음 |
| `community/page.tsx:393` | 필터 변경 중 댓글 추가 | 캐시 무효화 타이밍 불일치 |
| `group/[id]/admin/page.tsx:300-338` | 멤버 다중 작업 | 완료 순서 불일치 가능 |

### 4.6 모바일/접근성 문제

#### 모바일 대응 미흡

| 컴포넌트 | 문제점 |
|---------|--------|
| Day 네비게이션 버튼 | 패딩 부족 |
| 댓글 작업 버튼 | 크기 작음 |
| `group/[id]/admin/page.tsx:509` | `grid-cols-2` 고정 (320px 화면에서 좁음) |

#### 접근성(a11y) 문제

| 컴포넌트 | 문제점 |
|---------|--------|
| Day 네비게이션 | `aria-label` 없음 |
| 멤버 관리 버튼 | `title`만 있음, `aria-label` 없음 |
| 순위 배지 | 색상만으로 구분 |
| 모달 | 포커스 트랩 미구현 |

---

## 5. 개선 로드맵

### Phase A: 긴급 수정 (1주일 이내)

| 우선순위 | 작업 | 예상 시간 |
|---------|------|----------|
| A-1 | Pixabay API 키 하드코드 제거 | 1시간 |
| A-2 | 권한 체크 TOCTOU 수정 | 4시간 |
| A-3 | RPC 에러 처리 추가 | 1일 |

### Phase B: 클린 아키텍처 정리 (2-3주)

| 우선순위 | 작업 | 예상 파일 수 |
|---------|------|-------------|
| B-1 | 컴포넌트 Supabase 직접 접근 제거 | 40+ 파일 |
| B-2 | Page.tsx 리팩토링 | 15+ 파일 |
| B-3 | lib 폴더 정리 (Use Case로 이동) | 8 파일 |
| B-4 | Repository Import 경로 통일 | 6 파일 |

### Phase C: 코드 품질 개선 (3-4주)

| 우선순위 | 작업 | 예상 작업량 |
|---------|------|------------|
| C-1 | console.log 정리 | 268개 |
| C-2 | any 타입 제거 | 12개 |
| C-3 | 에러 처리 보강 | 45+ 파일 |
| C-4 | ESLint 규칙 강화 | 설정 파일 |

### Phase D: UX 개선 (4-6주)

| 우선순위 | 작업 | 영향 범위 |
|---------|------|----------|
| D-1 | 에러/빈 상태 UI 추가 | 10+ 페이지 |
| D-2 | 페이지네이션 추가 | 5 페이지 |
| D-3 | 옵티미스틱 업데이트 | 5+ 기능 |
| D-4 | 모바일 UX 개선 | 전체 |
| D-5 | 접근성 개선 (WCAG 2.1 AA) | 전체 |

---

## 6. 파일별 상세 이슈

### 6.1 클린 아키텍처 위반 파일 목록

<details>
<summary>펼쳐서 전체 목록 보기</summary>

#### 컴포넌트 (components/)
```
components/home/RecentQTList.tsx
components/bible/PlanSelector.tsx
components/church/EncouragementButton.tsx
components/church/BadgeDisplay.tsx
components/church/BadgeNotificationModal.tsx
components/church/EncouragementList.tsx
components/church/contents/BibleContent.tsx
components/church/contents/GroupsContent.tsx
components/church/contents/HomeContent.tsx
components/church/contents/MyContent.tsx
components/church/contents/SharingContent.tsx
components/church/sidepanel/ReadingCalendar.tsx
components/church/sidepanel/ReadingProgress.tsx
components/church/sidepanel/SidePanel.tsx
components/church/sidepanel/TodayStats.tsx
components/mypage/UnifiedMyPage.tsx
components/ui/mention-input.tsx
components/group/JoinRequestsManager.tsx
```

#### 페이지 (app/)
```
app/page.tsx
app/(main)/bible-reader/page.tsx
app/(main)/search/page.tsx
app/(main)/qt/[day]/page.tsx
app/(main)/mypage/settings/page.tsx
app/church/[code]/sharing/page.tsx
app/admin/**/*.tsx (전체)
```

#### 유틸리티 (lib/)
```
lib/feed-api.ts
lib/draftStorage.ts
lib/notifications.ts
lib/reading-utils.ts
lib/plan-utils.ts
lib/migrate-local-data.ts
lib/debug.ts
```

</details>

### 6.2 리팩토링 우선순위 파일

| 파일 | 위반 개수 | 영향도 | 우선순위 |
|-----|----------|--------|---------|
| `components/mypage/UnifiedMyPage.tsx` | 5+ | 높음 | 1 |
| `components/bible/PlanSelector.tsx` | 4 | 중간 | 2 |
| `app/(main)/search/page.tsx` | 3 | 높음 | 3 |
| `components/church/contents/*.tsx` | 5파일 | 중간 | 4 |
| `lib/feed-api.ts` | 2 | 높음 | 5 |

---

## 결론

리딩지저스 프로젝트는 **클린 아키텍처를 도입하여 좋은 기반을 갖추었으나**, 레거시 코드와의 혼재로 인해 **일관성 있는 아키텍처 적용이 필요**합니다.

### 즉시 조치 필요
1. **API 키 하드코드 제거** (보안)
2. **권한 체크 TOCTOU 수정** (보안)
3. **RPC 에러 처리 추가** (안정성)

### 단계적 개선 필요
1. **클린 아키텍처 위반 정리** (40+ 파일)
2. **코드 품질 개선** (console.log, any 타입)
3. **UX 개선** (에러 상태, 페이지네이션, 접근성)

이 문서를 기반으로 `IMPLEMENTATION.md`에 코드 최적화 계획을 추가하는 것을 권장합니다.

---

## 참조 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md) - 클린 아키텍처 상세 가이드
- [IMPLEMENTATION.md](../IMPLEMENTATION.md) - 구현 현황
- [CLAUDE.md](../.claude/CLAUDE.md) - 프로젝트 규칙
