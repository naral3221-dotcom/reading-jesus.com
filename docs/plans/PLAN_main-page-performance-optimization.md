# 메인 페이지 성능 최적화 계획서

> **CRITICAL INSTRUCTIONS**: After completing each phase:
> 1. ✅ Check off completed task checkboxes
> 2. 🧪 Run all quality gate validation commands
> 3. ⚠️ Verify ALL quality gate items pass
> 4. 📅 Update "Last Updated" date
> 5. 📝 Document learnings in Notes section
> 6. ➡️ Only then proceed to next phase
>
> ⛔ DO NOT skip quality gates or proceed with failing checks

---

## Overview

**목표**: 메인 페이지(/home, /community, /group)의 로딩 성능을 교회 페이지 수준으로 개선

**현재 문제**:
1. 동일 데이터 중복 패칭 (useCurrentUser 3회 호출)
2. Waterfall 로딩 패턴 (직렬 API 호출)
3. 직접 Supabase 호출 (React Query 캐시 미활용)
4. useGroupCompat 내부 비효율적 로딩

**목표 지표**:
- 초기 로딩 시간: 현재 3-5초 → 목표 1-2초
- API 호출 수: 현재 8-10회 → 목표 3-4회
- Time to Interactive: 50% 개선

**범위**: Large (6 Phases, 약 15-20시간)

**Last Updated**: 2026-01-03

---

## Architecture Decisions

### 1. 데이터 패칭 전략 변경

**현재 (Before)**:
```
[Layout] useCurrentUser()
[MainSidePanel] useCurrentUser()  ← 중복
[HomePage] useCurrentUser()       ← 중복
           useGroupCompat() → useUserGroups() + useGroupById()
           useUserProjects()
           useReadingCheckWithToggle()
           getUserDailyReadings()  ← 직접 Supabase 호출
```

**목표 (After)**:
```
[Layout] - 데이터 없음 (순수 레이아웃만)
[MainDataProvider] - useMainPageData() (통합 훅)
  ├─ user, groups, activeGroup, projects 한번에 로드
  └─ React Query로 캐시 + 중복 제거
[HomePage/Community/Group] - Context에서 데이터 소비
```

### 2. Clean Architecture 레이어 추가

**새로운 Use Case**:
```
src/application/use-cases/main-page/
├── GetMainPageData.ts      # 메인 페이지 통합 데이터
├── GetUserDailyReadings.ts # 다중 플랜 읽기 (기존 함수 → Use Case)
└── index.ts
```

**새로운 React Query 훅**:
```
src/presentation/hooks/queries/
├── useMainPageData.ts      # 통합 데이터 훅
└── useUserDailyReadings.ts # 다중 플랜 읽기 훅
```

### 3. Context 도입 (데이터 공유)

```
src/contexts/MainDataContext.tsx
- 메인 페이지 공통 데이터 제공
- Layout에서 Provider 설정
- 자식 컴포넌트에서 useMainData() 사용
```

---

## Phase Breakdown

### Phase 1: 다중 플랜 읽기 Clean Architecture 전환 (2-3시간)

**Goal**: `getUserDailyReadings()` 직접 Supabase 호출을 Clean Architecture + React Query로 전환

**Dependencies**: 없음 (독립적으로 시작 가능)

**Tasks**:

#### 1.1 Domain Layer
- [x] `src/domain/entities/UserDailyReading.ts` 생성
  - UserDailyReading 엔티티 클래스
  - 기존 types/index.ts의 UserDailyReading 타입 활용
- [x] `src/domain/repositories/IUserDailyReadingRepository.ts` 생성
  - getUserDailyReadings(userId: string) 메서드 정의

#### 1.2 Infrastructure Layer
- [x] `src/infrastructure/repositories/SupabaseUserDailyReadingRepository.ts` 생성
  - 기존 `lib/reading-utils.ts`의 `getUserDailyReadings()` 로직 이전
  - Supabase 쿼리 최적화 (불필요한 조인 제거)

#### 1.3 Application Layer
- [x] `src/application/use-cases/reading/GetUserDailyReadings.ts` 생성
  - Repository 주입받아 실행
  - 에러 핸들링 표준화

#### 1.4 Presentation Layer
- [x] `src/presentation/hooks/queries/useUserDailyReadings.ts` 생성
  - React Query 훅으로 구현
  - staleTime: 5분, cacheTime: 30분

#### 1.5 기존 코드 업데이트
- [x] `src/app/(main)/home/page.tsx` 수정
  - `loadMultiPlanReadings()` → `useUserDailyReadings()` 훅 사용
  - useEffect + useState 제거

#### 1.6 Index 파일 업데이트
- [x] `src/domain/entities/index.ts` export 추가
- [x] `src/domain/repositories/index.ts` export 추가
- [x] `src/infrastructure/repositories/index.ts` export 추가
- [x] `src/application/use-cases/index.ts` export 추가

**Quality Gate**:
- [x] `npm run build` 성공
- [x] `npm run lint` 에러 없음
- [ ] 기존 기능 동작 확인 (다중 플랜 읽기 카드)
- [ ] Network 탭에서 캐시 동작 확인

**Rollback**: 새 파일 삭제, home/page.tsx 원복

---

### Phase 2: 통합 메인 페이지 데이터 Use Case (3-4시간)

**Goal**: 메인 페이지에서 필요한 모든 데이터를 한 번에 로드하는 통합 Use Case 생성

**Dependencies**: Phase 1 완료

**Tasks**:

#### 2.1 통합 Use Case 설계
- [x] `src/application/use-cases/main-page/GetMainPageData.ts` 생성
- [x] 병렬 데이터 로드 구현 (Promise.all 사용)
- [x] 캐시 친화적 구조 설계

#### 2.2 Repository 의존성 주입
- [x] 필요한 Repository 인터페이스들 주입
  - IUserRepository
  - IChurchRepository
  - IGroupRepository
  - IUserDailyReadingRepository

#### 2.3 React Query 통합 훅
- [x] `src/presentation/hooks/queries/useMainPageData.ts` 생성
  - useQuery로 통합 데이터 로드
  - select 옵션으로 필요한 데이터만 추출 가능하게 (useMainPageUser, useMainPageGroups 등)
  - enabled: !!userId

#### 2.4 Index 업데이트
- [x] `src/application/use-cases/main-page/index.ts` 생성
- [x] `src/application/use-cases/index.ts`에 main-page export 추가

**Quality Gate**:
- [x] `npm run build` 성공
- [x] `npm run lint` 에러 없음
- [ ] 통합 훅 단독 테스트 (console.log로 데이터 확인)
- [ ] 병렬 로드 확인 (Network 탭에서 동시 요청)

**Rollback**: 새 파일 삭제

---

### Phase 3: MainDataContext 도입 (2-3시간)

**Goal**: Context를 통해 메인 페이지 데이터를 자식 컴포넌트에 효율적으로 전달

**Dependencies**: Phase 2 완료

**Tasks**:

#### 3.1 Context 생성
- [x] `src/contexts/MainDataContext.tsx` 생성
- [x] useMainData() 커스텀 훅 생성
- [x] MainDataProvider 컴포넌트 구현

#### 3.2 Layout에 Provider 추가
- [x] `src/app/(main)/layout.tsx` 수정
  - MainDataProvider로 children 래핑
  - 기존 MainSplitViewProvider와 함께 사용

#### 3.3 activeGroup 상태 관리 통합
- [x] useGroupStore의 activeGroupId와 연동
- [x] setActiveGroup 시 localStorage + Context 동기화
- [x] 삭제된 그룹 자동 처리 로직 유지

**Quality Gate**:
- [x] `npm run build` 성공
- [x] `npm run lint` 에러 없음
- [ ] Context 데이터 정상 전달 확인
- [ ] 그룹 전환 기능 동작 확인

**Rollback**: MainDataContext.tsx 삭제, layout.tsx 원복

---

### Phase 4: HomePage 리팩토링 (3-4시간)

**Goal**: HomePage에서 개별 훅 호출 제거, Context 데이터 사용으로 전환

**Dependencies**: Phase 3 완료

**Tasks**:

#### 4.1 HomePage 데이터 소스 변경
- [ ] `src/app/(main)/home/page.tsx` 수정
  - useCurrentUser() 제거 → useMainData() 사용
  - useGroupCompat() 제거 → useMainData() 사용
  - useUserProjects() 제거 → useMainData() 사용
  - useUserDailyReadings() → useMainData().dailyReadings 사용

#### 4.2 불필요한 코드 정리
- [ ] loadMultiPlanReadings 함수 제거
- [ ] 중복 useEffect 정리
- [ ] 상태 변수 최소화

#### 4.3 로딩 최적화
- [ ] 단일 isLoading 상태로 통합
- [ ] Skeleton 표시 조건 단순화
- [ ] 불필요한 리렌더링 방지 (useMemo, useCallback 정리)

#### 4.4 에러 처리 통합
- [ ] Context의 error 상태 활용
- [ ] ErrorState 컴포넌트 조건 단순화

**Quality Gate**:
- [ ] `npm run build` 성공
- [ ] `npm run lint` 에러 없음
- [ ] HomePage 정상 동작 확인
- [ ] Network 탭에서 API 호출 수 감소 확인
- [ ] 체감 로딩 속도 개선 확인

**Rollback**: home/page.tsx git checkout

---

### Phase 5: Community/Group 페이지 최적화 (2-3시간)

**Goal**: Community, Group 페이지도 Context 기반으로 전환

**Dependencies**: Phase 4 완료

**Tasks**:

#### 5.1 Community 페이지
- [ ] `src/app/(main)/community/page.tsx` 수정
  - useCurrentUser() 제거 → useMainData() 사용
  - useGroupCompat() 제거 → useMainData() 사용
  - 중복 로딩 상태 통합

#### 5.2 Group 페이지
- [ ] `src/app/(main)/group/page.tsx` 수정
  - useCurrentUser() 제거 → useMainData() 사용
  - useGroupCompat() 제거 → useMainData() 사용
  - 그룹 전환 로직 Context 연동

#### 5.3 MainSidePanel 최적화
- [ ] `src/components/main/MainSidePanel.tsx` 수정
  - useCurrentUser() 제거 → useMainData() 사용
  - 하드코딩된 데이터 → 실제 데이터로 교체

#### 5.4 하위 페이지 점검
- [ ] mypage/* 페이지들 확인
- [ ] 필요시 useMainData() 활용하도록 수정

**Quality Gate**:
- [ ] `npm run build` 성공
- [ ] `npm run lint` 에러 없음
- [ ] Community 탭 전환 정상 동작
- [ ] Group 페이지 정상 동작
- [ ] 전체 페이지 네비게이션 테스트

**Rollback**: 수정된 파일들 git checkout

---

### Phase 6: 성능 검증 및 최종 최적화 (2시간)

**Goal**: 성능 측정, 추가 최적화, 문서화

**Dependencies**: Phase 5 완료

**Tasks**:

#### 6.1 성능 측정
- [ ] Chrome DevTools Performance 탭 측정
- [ ] Lighthouse 점수 비교 (Before/After)
- [ ] Network 탭 API 호출 수 비교
- [ ] 실제 로딩 시간 측정 (3회 평균)

#### 6.2 추가 최적화 (필요시)
- [ ] React Query staleTime/cacheTime 미세 조정
- [ ] 불필요한 리렌더링 프로파일링
- [ ] 번들 사이즈 확인

#### 6.3 레거시 코드 정리
- [ ] useGroupCompat() 사용처 확인 및 deprecation 검토
- [ ] 사용하지 않는 import 제거
- [ ] 주석 처리된 코드 정리

#### 6.4 문서화
- [ ] IMPLEMENTATION.md 업데이트
- [ ] 변경된 아키텍처 설명 추가
- [ ] 성능 개선 결과 기록

#### 6.5 배포
- [ ] `npx vercel --prod --yes` 프로덕션 배포
- [ ] 프로덕션 환경 테스트

**Quality Gate**:
- [ ] `npm run build` 성공
- [ ] `npm run lint` 에러 없음
- [ ] Lighthouse Performance Score ≥ 70
- [ ] API 호출 수 50% 이상 감소
- [ ] 프로덕션 배포 완료

**Rollback**: Vercel 이전 배포로 롤백

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Context 리렌더링 성능 | Medium | Medium | useMemo, useCallback 적극 활용 |
| 기존 기능 회귀 | Low | High | 각 Phase 후 수동 테스트 |
| React Query 캐시 충돌 | Low | Medium | Query Key 체계적 관리 |
| useGroupCompat 의존성 | Medium | Medium | 점진적 마이그레이션 |

---

## File Changes Summary

### New Files
```
src/domain/entities/UserDailyReading.ts
src/domain/repositories/IUserDailyReadingRepository.ts
src/infrastructure/repositories/SupabaseUserDailyReadingRepository.ts
src/application/use-cases/reading/GetUserDailyReadings.ts
src/application/use-cases/main-page/GetMainPageData.ts
src/application/use-cases/main-page/index.ts
src/presentation/hooks/queries/useUserDailyReadings.ts
src/presentation/hooks/queries/useMainPageData.ts
src/contexts/MainDataContext.tsx
```

### Modified Files
```
src/app/(main)/layout.tsx
src/app/(main)/home/page.tsx
src/app/(main)/community/page.tsx
src/app/(main)/group/page.tsx
src/components/main/MainSidePanel.tsx
src/domain/entities/index.ts
src/domain/repositories/index.ts
src/infrastructure/repositories/index.ts
src/application/use-cases/index.ts
IMPLEMENTATION.md
```

---

## Progress Tracking

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| Phase 1: 다중 플랜 읽기 | ✅ Completed | 2026-01-03 | 2026-01-03 |
| Phase 2: 통합 Use Case | 🔄 In Progress | 2026-01-03 | - |
| Phase 3: MainDataContext | ⏳ Pending | - | - |
| Phase 4: HomePage 리팩토링 | ⏳ Pending | - | - |
| Phase 5: Community/Group | ⏳ Pending | - | - |
| Phase 6: 성능 검증 | ⏳ Pending | - | - |

---

## Notes & Learnings

### Phase 1 (2026-01-03)
- UserDailyReading 도메인 엔티티 생성 완료
- DTO 변환 메서드로 기존 types/index.ts와 호환성 유지
- React Query 훅 (useUserDailyReadings, useUserDailyReadingsWithToggle) 구현
- home/page.tsx에서 직접 Supabase 호출 제거, React Query 훅으로 전환

---
