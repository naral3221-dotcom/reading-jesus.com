# QT(묵상) 아키텍처 가이드

> QT 관련 기능 수정 시 반드시 이 문서를 참조하세요.

---

## 목차

1. [개요](#1-개요)
2. [QT 보기 방식](#2-qt-보기-방식)
3. [QT 작성 방식](#3-qt-작성-방식)
4. [파일 맵핑](#4-파일-맵핑)
5. [데이터 흐름](#5-데이터-흐름)
6. [작업 가이드](#6-작업-가이드)

---

## 1. 개요

### 핵심 구조

```
┌─────────────────────────────────────────────────────────────┐
│                        QT 시스템                             │
├─────────────────────────────────────────────────────────────┤
│  보기: 피드 카드 | 상세 모달 | 목록 페이지                    │
│  작성: 커뮤니티 | 개인 프로젝트 | 교회 QT                     │
│  저장: 레거시 테이블 → 트리거 → unified_meditations          │
└─────────────────────────────────────────────────────────────┘
```

### QT vs 묵상 구분

| 구분 | QT | 일반 묵상 |
|------|-----|----------|
| 형식 | 구조화 (한 문장, 질문/답변, 감사, 기도 등) | 자유 형식 |
| UI | 캐러셀 스타일 (QTFeedCard) | 마크다운 뷰어 |
| 식별 | `source_type: 'qt'` 또는 `format: 'qt'` | `format: 'free'` |

---

## 2. QT 보기 방식

### 2.1 피드 카드 (인스타그램 스타일)

**컴포넌트**: `src/components/feed/QTFeedCard.tsx`

```
┌─────────────────────────────────────┐
│ 프로필 헤더 (고정)                   │
│  아바타 + 이름 + QT뱃지 + 시간       │
├─────────────────────────────────────┤
│ QT 헤더 (고정)                       │
│  날짜 / 제목 / 통독범위 / ONE WORD   │
├─────────────────────────────────────┤
│ ← 가로 캐러셀 (좌우 스크롤) →        │
│  📖 오늘의 말씀                      │
│  💭 묵상 길잡이                      │
│  ❓ 묵상 질문 + 답변                 │
│  ✨ 내 말로 한 문장                  │
│  ✦ 하루 점검                        │
├─────────────────────────────────────┤
│ 하단 고정 섹션                       │
│  💚 감사와 적용 / 🙏 나의 기도       │
├─────────────────────────────────────┤
│ 액션바: 좋아요 | 댓글 | 북마크       │
└─────────────────────────────────────┘
```

**사용 위치**:
- 커뮤니티 피드 (`UnifiedFeed`)
- 피드 상세 모달 (`FeedDetailModal`)

### 2.2 상세 모달

**컴포넌트**: `src/components/feed/FeedDetailModal.tsx`

| 타입 | 렌더링 |
|------|--------|
| QT (`source_type: 'qt'`) | QTFeedCard 동일 캐러셀 |
| 묵상 | RichViewerWithEmbed |

**추가 기능**: 댓글 섹션 통합

### 2.3 목록 페이지

| 페이지 | 경로 | 컴포넌트 |
|--------|------|----------|
| QT 목록 | `/qt` | `src/app/(main)/qt/page.tsx` |
| 교회 QT | `/church/[code]/qt` | `src/app/church/[code]/qt/page.tsx` |
| 개인 묵상 | 마이페이지 | `PersonalMeditationList` |

---

## 3. QT 작성 방식

### 3.1 작성 위치

| 위치 | 경로 | 에디터 | 대상 |
|------|------|--------|------|
| 커뮤니티 | `/community` | `PublicMeditationEditor` | 공개 |
| 개인 프로젝트 | `/mypage/projects/[id]` | `PersonalMeditationEditor` | 개인 |
| 교회 QT | `/church/[code]/qt/[date]` | `MeditationEditor` | 교회 |

### 3.2 작성 컴포넌트 계층

```
에디터 (진입점)
├── PublicMeditationEditor     # 커뮤니티용 (Collapsible)
├── PersonalMeditationEditor   # 개인용 (Dialog)
└── MeditationEditor           # 교회 QT용

    ↓ 형식 선택

MeditationTypeSelector
├── QTMeditationForm          # QT 형식
├── FreeMeditationForm        # 자유 형식
└── MemoMeditationForm        # 메모 형식
```

### 3.3 QT 형식 필드

`QTMeditationForm` 필드 구조:

| 필드 | 설명 | 필수 |
|------|------|------|
| `bibleVerse` | 성경 구절 | ✓ |
| `oneWord` / `mySentence` | 한 문장 요약 | ✓ |
| `question` | 묵상 질문 | - |
| `questionAnswer` | 질문 답변 | - |
| `gratitudeApplication` | 감사와 적용 | - |
| `prayer` | 나의 기도 | - |
| `dailyCheck` | 하루 점검 | - |

---

## 4. 파일 맵핑

### 4.1 컴포넌트

#### 피드/뷰어

| 파일 | 역할 |
|------|------|
| `src/components/feed/QTFeedCard.tsx` | QT 전용 피드 카드 (캐러셀) |
| `src/components/feed/UnifiedFeedCard.tsx` | 통합 피드 카드 (QT/묵상 분기) |
| `src/components/feed/FeedDetailModal.tsx` | 피드 상세 모달 |
| `src/components/feed/components/` | 카드 하위 컴포넌트들 |
| `src/components/community/UnifiedFeed.tsx` | 통합 피드 컨테이너 |
| `src/components/community/PublicMeditationCard.tsx` | 일반 묵상 카드 |

#### 작성기

| 파일 | 역할 |
|------|------|
| `src/components/community/PublicMeditationEditor.tsx` | 커뮤니티 작성 (Collapsible) |
| `src/components/personal/PersonalMeditationEditor.tsx` | 개인 작성 (Dialog) |
| `src/components/meditation/MeditationEditor.tsx` | 교회 QT 작성 |
| `src/components/personal/QTMeditationForm.tsx` | QT 형식 폼 |
| `src/components/personal/FreeMeditationForm.tsx` | 자유 형식 폼 |
| `src/components/personal/MemoMeditationForm.tsx` | 메모 형식 폼 |
| `src/components/personal/MeditationTypeSelector.tsx` | 형식 선택 UI |

### 4.2 훅 (Presentation Layer)

| 파일 | 훅 | 용도 |
|------|-----|------|
| `useUnifiedFeed.ts` | `useUnifiedFeed`, `useUnifiedFeedInfinite` | 통합 피드 조회 |
| `useQT.ts` | `useTodayQT`, `useDailyQT`, `useMonthlyQT` | QT 원본 조회 |
| `useChurchQTPost.ts` | `useChurchQTPosts`, `useCreateChurchQTPost` 등 | 교회 QT CRUD |
| `usePublicMeditation.ts` | `useCreatePersonalMeditation` 등 | 공개 묵상 CRUD |
| `usePublicMeditationComment.ts` | `useComments`, `useCreateComment` 등 | 댓글 CRUD |
| `useUserBookmarks.ts` | `useIsBookmarked`, `useToggleBookmark` | 북마크 |

### 4.3 Use Case (Application Layer)

| 경로 | Use Case |
|------|----------|
| `unified-feed/` | `GetUnifiedFeed` |
| `qt/` | `GetDailyQT`, `GetMonthlyQT` |
| `church-qt-post/` | `Create/Update/Delete/GetChurchQTPosts`, `ToggleChurchQTPostLike` |
| `public-meditation/` | `Create/Update/Delete/GetPublicMeditations`, `TogglePublicMeditationLike` |
| `public-meditation-comment/` | `Create/Delete/GetComments`, `ToggleCommentLike` |

### 4.4 페이지

| 경로 | 파일 |
|------|------|
| `/qt` | `src/app/(main)/qt/page.tsx` |
| `/qt/[date]` | `src/app/(main)/qt/[date]/page.tsx` |
| `/community` | `src/app/(main)/community/page.tsx` |
| `/church/[code]/qt` | `src/app/church/[code]/qt/page.tsx` |
| `/church/[code]/qt/[date]` | `src/app/church/[code]/qt/[date]/page.tsx` |

---

## 5. 데이터 흐름

### 5.1 조회 흐름

```
컴포넌트 (UnifiedFeed)
    ↓
useUnifiedFeedInfinite() 훅
    ↓
GetUnifiedFeed Use Case
    ↓
unified_meditations 테이블
    ↓
UnifiedFeedCard
    ├─ source_type === 'qt' → QTFeedCard
    └─ 그 외 → 일반 카드
```

### 5.2 작성 흐름

```
에디터 컴포넌트
    ↓
형식 선택 (QT/자유/메모)
    ↓
형식별 폼 작성
    ↓
useCreatePersonalMeditation() 훅
    ↓
CreatePublicMeditation Use Case
    ↓
Supabase DB (레거시 테이블)
    ↓ (트리거)
unified_meditations 동기화
    ↓
피드 캐시 무효화 → 화면 갱신
```

### 5.3 DB 테이블 관계

```
저장 (레거시)                    조회 (통합)
┌────────────────────┐          ┌──────────────────────┐
│ public_meditations │ ──────→  │                      │
│ church_qt_posts    │ ──────→  │ unified_meditations  │
│ guest_comments     │ ──────→  │                      │
└────────────────────┘          └──────────────────────┘
        │                                ↑
        └──── 트리거로 자동 동기화 ────────┘
```

---

## 6. 작업 가이드

### 6.1 수정 시 체크리스트

#### QT 피드 UI 수정

- [ ] `QTFeedCard.tsx` 수정
- [ ] `FeedDetailModal.tsx`에서 QT 렌더링 확인
- [ ] 모바일/데스크톱 반응형 테스트

#### QT 작성 폼 수정

- [ ] `QTMeditationForm.tsx` 수정
- [ ] `PersonalMeditationEditor`에서 폼 렌더링 확인
- [ ] `PublicMeditationEditor`에서 폼 렌더링 확인

#### 새 필드 추가

1. `QTMeditationForm.tsx`에 필드 추가
2. `QTFeedCard.tsx`에 표시 로직 추가
3. `FeedDetailModal.tsx`에서 확인
4. DB 스키마 변경 필요 시 마이그레이션 생성

### 6.2 의존성 다이어그램

```
                    UnifiedFeed
                         │
              ┌──────────┴──────────┐
              ↓                     ↓
        UnifiedFeedCard      FeedDetailModal
              │                     │
    ┌─────────┴─────────┐          │
    ↓                   ↓          ↓
QTFeedCard      PublicMeditationCard
    │
    ├── FeedCardAvatar
    ├── FeedCardContent
    └── FeedCardActions
```

### 6.3 자주 하는 실수

| 실수 | 올바른 방법 |
|------|-------------|
| QTFeedCard만 수정하고 FeedDetailModal 누락 | 모달에서도 QT 렌더링 확인 |
| 피드 캐시 무효화 누락 | `queryClient.invalidateQueries(['unified-feed'])` |
| 형식 분기 누락 | `source_type === 'qt'` 또는 `format === 'qt'` 체크 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-02-01 | 초기 문서 작성 |
