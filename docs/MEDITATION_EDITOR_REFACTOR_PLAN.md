# 묵상 에디터 리팩토링 계획

## 개요
바이블 리더기의 글 작성 폼을 전면 개선하여 PC/모바일 각각에 최적화된 작성 환경을 제공합니다.

---

## 확정된 요구사항

| 항목 | 결정 |
|------|------|
| 임시저장 최대 개수 | **3개** |
| 말씀카드 이미지 저장 | **Base64** (게시글에 직접 삽입) |
| PC 분할 비율 | **조절 가능** (드래그로 비율 변경) |
| PC 레이아웃 방식 | **옵션 B: 동적 레이아웃** (페이지 전환 없이 모드 변경) |

---

## 구현 진행 상황

### ✅ Step 1: 긴급 수정 (버그 픽스) - 완료
- [x] 모바일 버튼 표시 문제 해결
  - `MeditationPanel.tsx`: flex 레이아웃 수정, `pb-safe` 추가
  - `MeditationEditor.tsx`: 하단 툴바 `flex-shrink-0`, `border-t` 추가
- [x] 스크롤 문제 해결
  - 에디터 영역에 `overflow-y-auto` 적용
  - `flex-1 min-h-0` 조합으로 스크롤 영역 분리

### ✅ Step 2: 모바일 UX 개선 - 완료
- [x] 오버레이 제거 / 투명화
  - `MeditationPanel.tsx`: 검은 오버레이를 `pointer-events-none`으로 변경
  - 배경 말씀 클릭 가능하도록 개선
- [x] 말씀 직접 삽입 로직 (기존 기능 확인)
  - 구절 클릭 시 에디터에 blockquote로 자동 삽입
  - `prevVersesLengthRef`로 새 구절 감지

### ✅ Step 3: 임시저장 시스템 - 완료
- [x] `useMultiDraft.ts` 훅 생성
  - 최대 3개 드래프트 관리
  - localStorage에 배열 형태로 저장
  - 2초 디바운스 자동 저장
  - 오래된 드래프트 자동 삭제
- [x] `DraftDropdown.tsx` 컴포넌트 생성
  - 드래프트 목록 드롭다운 UI
  - 미리보기 (첫 30자), 저장 시간 표시
  - 선택/삭제/새로 작성 기능

### ✅ Step 4: 말씀카드 연동 - 완료
- [x] `VerseCardGenerator.tsx`에 `onCardCreated` 콜백 추가
- [x] "게시글에 삽입" 버튼 추가
- [x] `rich-editor.tsx`에 Image extension 추가
  - `@tiptap/extension-image` 패키지 설치
  - `insertImage`, `onInsertImageComplete` props 추가
- [x] `MeditationEditor.tsx`에서 이미지 삽입 연동
- [x] `MeditationPanel.tsx`에서 VerseCardGenerator ↔ MeditationEditor 연결

### ✅ Step 5: PC 분할 뷰 - 완료
- [x] `/church/[code]/bible/reader/page.tsx`에 동적 레이아웃 구현
  - `isDesktop` 상태로 PC/모바일 분기
  - PC에서는 `SplitViewLayout` 사용
  - 모바일에서는 기존 `MeditationPanel` 바텀시트 유지
- [x] `meditationPanelOpen` 상태에 따라 1열 ↔ 2열 전환
- [x] 드래그로 분할 비율 조절
  - `SplitViewLayout.tsx` 컴포넌트 생성
  - 드래그 핸들로 30%~70% 범위 내 비율 조절
  - 더블클릭으로 기본값(50:50) 리셋
- [x] localStorage에 비율 저장 (`meditation-split-ratio`)

---

## Phase 3: PC 전용 레이아웃

### 3-1. 분할 화면 레이아웃
**현재**: 사이드 패널 (오버레이)
**목표**: 2열 레이아웃 (왼쪽 성경 / 오른쪽 에디터)

```
구조:
┌─────────────────────────────────────────────────┐
│  헤더: 교회명 | 책/장 선택 | 번역 선택          │
├───────────────────────┬─────────────────────────┤
│                       │                         │
│    성경 본문          │    에디터               │
│    (스크롤 독립)      │    - 이름 입력          │
│                       │    - 리치 에디터        │
│    구절 클릭 시       │    - 말씀카드 미리보기  │
│    → 오른쪽에 삽입    │    - 임시저장 드롭다운  │
│                       │    - 발행 버튼          │
│                       │                         │
├───────────────────────┴─────────────────────────┤
│  하단 네비게이션 (선택적)                        │
└─────────────────────────────────────────────────┘

반응형:
- md (768px) 이상: 분할 뷰
- md 미만: 기존 바텀시트 방식
```

### 3-2. 구현 방식 (옵션 B: 동적 레이아웃)
- 기존 `/church/[code]/bible/reader` 페이지 내에서 구현
- "작성 모드" 진입 시 레이아웃 변경
- PC에서 "묵상 작성" 클릭 시 `isWriteMode` 상태 변경
- 레이아웃이 단일 컬럼 → 2열로 전환
- 에디터 닫기 시 원래 레이아웃으로 복귀

### 3-3. 분할 비율 조절
- 드래그 가능한 divider 추가
- 기본 비율: 50:50
- 최소/최대 비율 제한 (30:70 ~ 70:30)
- localStorage에 비율 저장

---

## 수정 파일 목록

### 신규 파일
| 파일 | 설명 | 상태 |
|------|------|------|
| `src/hooks/useMultiDraft.ts` | 다중 임시저장 훅 | ✅ 완료 |
| `src/hooks/useSplitView.ts` | 분할 뷰 비율 관리 훅 | ✅ 완료 |
| `src/components/meditation/DraftDropdown.tsx` | 임시저장 드롭다운 | ✅ 완료 |
| `src/components/meditation/SplitViewLayout.tsx` | PC 분할 뷰 레이아웃 | ✅ 완료 |

### 수정 파일
| 파일 | 변경 내용 | 상태 |
|------|-----------|------|
| `MeditationPanel.tsx` | 모바일 오버레이 제거, 스크롤 개선, 카드 이미지 연동 | ✅ 완료 |
| `MeditationEditor.tsx` | 다중 드래프트 통합, 이미지 삽입 기능 | ✅ 완료 |
| `VerseCardGenerator.tsx` | onCardCreated 콜백 추가 | ✅ 완료 |
| `rich-editor.tsx` | Image extension 추가 | ✅ 완료 |
| `church/[code]/bible/reader/page.tsx` | PC 분할 뷰 통합, isDesktop 분기 | ✅ 완료 |

---

## 설치된 패키지

- `@tiptap/extension-image` - TipTap 이미지 확장

---

*작성일: 2025-12-30*
*마지막 업데이트: 2025-12-30 (Step 1~5 모두 완료)*

---

## 🎉 리팩토링 완료 요약

### 모바일 개선 사항
- 바텀시트 드래그 UX 개선
- 배경 성경 구절 선택 가능 (오버레이 투명화)
- 다중 임시저장 (최대 3개) 지원

### PC 개선 사항
- 동적 분할 뷰 레이아웃 (lg 브레이크포인트 이상)
- 드래그로 분할 비율 조절 (30%~70%)
- 비율 설정 localStorage 자동 저장

### 공통 기능
- 말씀카드 → 에디터 이미지 삽입
- TipTap 리치 에디터 이미지 지원
- 임시저장 드롭다운 UI
