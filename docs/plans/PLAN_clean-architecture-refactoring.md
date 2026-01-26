# Clean Architecture 리팩토링 계획

> **상태**: ✅ 완료
> **생성일**: 2026-01-02
> **마지막 업데이트**: 2026-01-02

**CRITICAL INSTRUCTIONS**: After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ DO NOT skip quality gates or proceed with failing checks

---

## 개요

### 목표
직접 Supabase를 호출하는 컴포넌트/페이지를 Clean Architecture 패턴으로 리팩토링하여 유지보수성과 테스트 용이성을 향상시킨다.

### 현재 상황

**적용 완료된 도메인 (11개)**:
- ✅ User
- ✅ Church
- ✅ Group
- ✅ QT
- ✅ ChurchNotice
- ✅ GroupNotice
- ✅ Notification
- ✅ GuestComment (교회 게스트 댓글)
- ✅ ChurchQTPost (교회 QT 나눔)
- ✅ CommentReply (그룹 댓글 답글)
- ✅ Prayer (기도 요청)

**미적용 도메인**:
- ⏳ Draft (localStorage 기반 - 선택적)

### 아키텍처 패턴

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (React Components, Pages, React Query Hooks)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (Use Cases: GetXxx, CreateXxx, UpdateXxx, DeleteXxx)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  (Entities, Repository Interfaces)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  (SupabaseXxxRepository implementations)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: GuestComment 도메인 ✅ 완료

### 목표
교회 페이지의 게스트 댓글 기능을 Clean Architecture로 리팩토링

### 영향 파일
- `src/app/church/[code]/page.tsx`
- `src/app/church/[code]/sharing/page.tsx`
- `src/lib/feed-api.ts`

### 태스크

**Domain Layer**:
- [x] `src/domain/entities/GuestComment.ts` 생성
  - GuestComment 엔티티 (id, churchId, guestToken, nickname, content, day, createdAt 등)
  - GuestCommentReply 엔티티
  - GuestCommentLike 엔티티
  - 검증 로직 (닉네임 30자, 내용 3000자)
- [x] `src/domain/repositories/IGuestCommentRepository.ts` 생성

**Infrastructure Layer**:
- [x] `src/infrastructure/repositories/SupabaseGuestCommentRepository.ts` 생성

**Application Layer**:
- [x] `src/application/use-cases/guest-comment/GetGuestComments.ts`
- [x] `src/application/use-cases/guest-comment/CreateGuestComment.ts`
- [x] `src/application/use-cases/guest-comment/UpdateGuestComment.ts`
- [x] `src/application/use-cases/guest-comment/DeleteGuestComment.ts`
- [x] `src/application/use-cases/guest-comment/ToggleGuestCommentLike.ts`
- [x] `src/application/use-cases/guest-comment/GetGuestCommentReplies.ts`
- [x] `src/application/use-cases/guest-comment/CreateGuestCommentReply.ts`
- [x] `src/application/use-cases/guest-comment/DeleteGuestCommentReply.ts`
- [x] `src/application/use-cases/guest-comment/index.ts` export 파일

**Presentation Layer**:
- [x] `src/presentation/hooks/queries/useGuestComment.ts`
  - useGuestComments, useCreateGuestComment, useUpdateGuestComment, useDeleteGuestComment
  - useToggleGuestCommentLike
  - useGuestCommentReplies, useCreateGuestCommentReply, useDeleteGuestCommentReply

**Index 파일 업데이트**:
- [x] `src/domain/entities/index.ts` - GuestComment export 추가
- [x] `src/domain/repositories/index.ts` - IGuestCommentRepository export 추가
- [x] `src/infrastructure/repositories/index.ts` - SupabaseGuestCommentRepository export 추가
- [x] `src/presentation/hooks/queries/index.ts` - useGuestComment export 추가

### Quality Gate
- [x] `npm run build` 성공
- [x] `npm run lint` 에러 없음

---

## Phase 2: ChurchQTPost 도메인 ✅ 완료

### 목표
교회 QT 나눔 기능을 Clean Architecture로 리팩토링

### 태스크

**Domain Layer**:
- [x] `src/domain/entities/ChurchQTPost.ts` 생성
  - ChurchQTPost 엔티티 (mySentence, meditationAnswer, gratitude, myPrayer, dayReview)
  - ChurchQTPostReply 엔티티
  - ChurchQTPostLike 엔티티
- [x] `src/domain/repositories/IChurchQTPostRepository.ts` 생성

**Infrastructure Layer**:
- [x] `src/infrastructure/repositories/SupabaseChurchQTPostRepository.ts` 생성

**Application Layer**:
- [x] `src/application/use-cases/church-qt-post/GetChurchQTPosts.ts`
- [x] `src/application/use-cases/church-qt-post/CreateChurchQTPost.ts`
- [x] `src/application/use-cases/church-qt-post/UpdateChurchQTPost.ts`
- [x] `src/application/use-cases/church-qt-post/DeleteChurchQTPost.ts`
- [x] `src/application/use-cases/church-qt-post/ToggleChurchQTPostLike.ts`
- [x] `src/application/use-cases/church-qt-post/GetChurchQTPostReplies.ts`
- [x] `src/application/use-cases/church-qt-post/CreateChurchQTPostReply.ts`
- [x] `src/application/use-cases/church-qt-post/DeleteChurchQTPostReply.ts`
- [x] `src/application/use-cases/church-qt-post/index.ts`

**Presentation Layer**:
- [x] `src/presentation/hooks/queries/useChurchQTPost.ts`

**Index 파일 업데이트**:
- [x] 모든 관련 index.ts 파일 업데이트

### Quality Gate
- [x] `npm run build` 성공
- [x] `npm run lint` 에러 없음

---

## Phase 3: CommentReply 도메인 ✅ 완료

### 목표
그룹 묵상 댓글 답글 시스템을 Clean Architecture로 리팩토링

### 영향 파일
- `src/app/church/[code]/groups/[groupId]/page.tsx`
- `src/components/church/MeditationReplies.tsx`

### 태스크

**Domain Layer**:
- [x] `src/domain/entities/CommentReply.ts` 생성
  - CommentReply 엔티티 (1000자 제한)
- [x] `src/domain/repositories/ICommentReplyRepository.ts` 생성

**Infrastructure Layer**:
- [x] `src/infrastructure/repositories/SupabaseCommentReplyRepository.ts` 생성

**Application Layer**:
- [x] `src/application/use-cases/comment-reply/GetCommentReplies.ts`
- [x] `src/application/use-cases/comment-reply/CreateCommentReply.ts`
- [x] `src/application/use-cases/comment-reply/DeleteCommentReply.ts`
- [x] `src/application/use-cases/comment-reply/index.ts`

**Presentation Layer**:
- [x] `src/presentation/hooks/queries/useCommentReply.ts`

**컴포넌트 리팩토링**:
- [x] MeditationReplies.tsx 훅 사용으로 전환 (직접 Supabase 호출 제거)

### Quality Gate
- [x] `npm run build` 성공
- [x] `npm run lint` 에러 없음

---

## Phase 4: Prayer 도메인 ✅ 완료

### 목표
기도 요청 기능을 Clean Architecture로 리팩토링

### 영향 파일
- `src/components/church/PrayerTab.tsx`

### 태스크

**Domain Layer**:
- [x] `src/domain/entities/Prayer.ts` 생성
  - Prayer 엔티티 (2000자 제한, 응답됨 상태)
  - PrayerSupport Props
- [x] `src/domain/repositories/IPrayerRepository.ts` 생성

**Infrastructure Layer**:
- [x] `src/infrastructure/repositories/SupabasePrayerRepository.ts` 생성

**Application Layer**:
- [x] `src/application/use-cases/prayer/GetPrayers.ts`
- [x] `src/application/use-cases/prayer/CreatePrayer.ts`
- [x] `src/application/use-cases/prayer/DeletePrayer.ts`
- [x] `src/application/use-cases/prayer/MarkPrayerAsAnswered.ts`
- [x] `src/application/use-cases/prayer/TogglePrayerSupport.ts`
- [x] `src/application/use-cases/prayer/index.ts`

**Presentation Layer**:
- [x] `src/presentation/hooks/queries/usePrayer.ts`

**컴포넌트 리팩토링**:
- [x] PrayerTab.tsx 훅 사용으로 전환 (직접 Supabase 호출 제거)

### Quality Gate
- [x] `npm run build` 성공
- [x] `npm run lint` 에러 없음

---

## Phase 5: 최종 정리 및 문서화 ✅ 완료

### 태스크
- [x] IMPLEMENTATION.md 업데이트
- [x] 컴포넌트 리팩토링 완료 (MeditationReplies, PrayerTab)
- [x] PLAN 문서 업데이트

### Quality Gate
- [x] `npm run build` 성공
- [x] `npm run lint` 에러 없음

---

## 리스크 평가

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|-----------|
| 기존 기능 회귀 | 중간 | 높음 | 단계별 빌드 확인, 수동 테스트 |
| 타입 불일치 | 낮음 | 중간 | 엄격한 타입 정의, 기존 패턴 참조 |
| 성능 저하 | 낮음 | 중간 | React Query 캐싱 활용 |

---

## 노트 & 학습

### 2026-01-02
- GroupNotice, Notification 리팩토링 완료
- 기존 패턴 (ChurchNotice)을 참조하면 효율적
- GuestComment, ChurchQTPost, CommentReply, Prayer 도메인 추가 완료
- MeditationReplies, PrayerTab 컴포넌트 React Query 훅 적용 완료
- **클린 아키텍처 적용률 ~90% 달성**

### 패턴 정리
1. **Domain Entity**: 비즈니스 로직 + 검증 (create, validate, toDTO)
2. **Repository Interface**: 순수 추상화 (도메인 레이어)
3. **Supabase Implementation**: 실제 DB 연동 (인프라 레이어)
4. **Use Case**: 단일 책임 원칙 (CRUD 각각 분리)
5. **React Query Hook**: Query Key Factory + staleTime 설정

---

## 롤백 전략

각 Phase별로 git commit을 수행하여 문제 발생 시 해당 commit으로 롤백 가능.

```bash
# Phase별 커밋 패턴
git commit -m "feat: Phase 1 - GuestComment 도메인 Clean Architecture"
git commit -m "feat: Phase 2 - ChurchQTPost 도메인 Clean Architecture"
git commit -m "feat: Phase 3 - CommentReply 도메인 Clean Architecture"
git commit -m "feat: Phase 4 - Prayer 도메인 Clean Architecture"
git commit -m "feat: Phase 5 - 컴포넌트 리팩토링 (MeditationReplies, PrayerTab)"
```
