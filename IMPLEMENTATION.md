# 리딩지저스 - 2026 구현 현황

> 📁 **이전 기록**: [docs/IMPLEMENTATION_2026_01_01_25.md](./docs/IMPLEMENTATION_2026_01_01_25.md) (1/1~1/25)
> 📁 **2025년 완료 내역**: [docs/IMPLEMENTATION_2025_ARCHIVE.md](./docs/IMPLEMENTATION_2025_ARCHIVE.md)

## 프로젝트 개요
365일 성경 통독 앱 (Next.js 14 + Supabase)

## 기술 스택
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage, RLS)
- **인증**: Google OAuth, 카카오 OAuth

---

## 🔴 우선순위 높음 (당장 필요)

| 작업 | 설명 | 상태 |
|------|------|------|
| Supabase Storage 버킷 | `avatars`, `comment_attachments` 버킷 생성 | ⏳ |
| 2026년 암송 구절 | `memory_verse` 데이터 추가 (현재 null) | ⏳ |
| church_qt_posts 마이그레이션 | 수동 적용 필요 | ⏳ |

---

## 🟡 우선순위 중간 (기능 완성도)

| 작업 | 설명 | 상태 |
|------|------|------|
| FCM 푸시 알림 | Firebase 프로젝트 설정 필요 | ⏳ |
| 이메일 발송 설정 | SMTP 또는 Resend 연동 | ⏳ |
| ImageCropper 통합 | 프로필 편집에 크롭 기능 추가 | ⏳ |
| 멘션 알림 시스템 | `createMentionNotification()` 구현 | ⏳ |
| QT 컨텐츠 관리자 | 관리자 페이지에서 QT 관리 | ⏳ |
| hwpx 데이터 추출 | 2026년 QT 데이터 지속 추출 | ⏳ |
| WebSocket Realtime | 연결 문제 확인 필요 | ⏳ |

---

## 🟢 선택적 개선

| 작업 | 설명 | 상태 |
|------|------|------|
| 글꼴 크기 설정 | 접근성 개선 | ✅ 완료 |
| 오프라인 지원 (PWA) | Service Worker 캐시 개선 | ⏳ |
| AI 묵상 가이드 | OpenAI/Claude API 연동 | ⏳ |

---

## 🎨 디자인 대규모 개편 (진행 중)

### 목표
- **테마 시스템**: 라이트, 다크, 베이지, 세피아 모드 지원
- **모바일**: 인스타그램 스타일 피드 + 현재 탭바 유지 (아이콘+라벨)
- **PC**: Apple 홈페이지 스타일 (미니멀, 클린, 여백 활용)

### 사용자 선택 사항
- **테마 선택 UI**: 마이페이지 설정 내 배치
- **기본 테마**: 시스템 설정 자동 감지 (라이트/다크)
- **모바일 탭바**: 현재 아이콘+라벨 스타일 유지

### Phase 1: 디자인 시스템 기반 구축 ✅ 완료 (2026-01-25)

**완료된 작업**:
- [x] `next-themes` 패키지 설치
- [x] `ThemeProvider` 업그레이드 (next-themes 기반, 4개 테마 지원)
- [x] `globals.css`에 베이지, 세피아 테마 CSS 변수 추가
- [x] 테마 선택 UI 컴포넌트 생성 (`ThemeSelector`)
- [x] 마이페이지 설정에 테마 선택 UI 통합

**수정된 파일**:
- `src/components/providers/ThemeProvider.tsx` - next-themes 업그레이드
- `src/app/globals.css` - 베이지, 세피아 테마 추가
- `src/app/layout.tsx` - 테마 스크립트 업데이트
- `src/components/ThemeSelector.tsx` (신규)
- `src/app/(main)/mypage/settings/page.tsx` - 테마 선택 UI 통합

**지원 테마**: 시스템, 라이트, 다크, 베이지, 세피아

### Phase 2: 기초 UI 컴포넌트 리디자인 ✅ 완료 (2026-01-25)

**완료된 작업**:
- [x] `button.tsx` - Apple 스타일 (미니멀, 부드러운 그림자, active 스케일 효과)
- [x] `card.tsx` - 둥근 모서리(24px), 부드러운 그림자, hover 효과
- [x] `input.tsx` - 깔끔한 포커스 스타일, rounded-xl
- [x] `dialog.tsx` - backdrop-blur 오버레이, 부드러운 애니메이션
- [x] `select.tsx` - 드롭다운 스타일 개선, rounded-xl

**수정된 파일**:
- `src/components/ui/button.tsx` - active:scale-[0.97], soft variants 추가
- `src/components/ui/card.tsx` - rounded-2xl, hover:shadow-md
- `src/components/ui/input.tsx` - rounded-xl, focus:ring-primary/20
- `src/components/ui/dialog.tsx` - backdrop-blur-sm, rounded-2xl
- `src/components/ui/select.tsx` - rounded-xl trigger/content/item

### Phase 3: 레이아웃 개편 ✅ 완료 (2026-01-25)

**PC 사이드바 (Apple 스타일)**:
- [x] 글래스모피즘 배경 (backdrop-blur-xl, bg-background/80)
- [x] 부드러운 active 인디케이터 (primary 색상 pill)
- [x] 로고 hover 스케일 효과
- [x] 드래그 툴팁 애니메이션

**모바일 탭바 (개선)**:
- [x] 선택 시 더 명확한 하이라이트 (bg-primary/10)
- [x] 터치 피드백 개선 (scale-95)
- [x] 디자인 토큰 적용 (primary 색상 통일)
- [x] 글래스모피즘 배경 적용

**수정된 파일**:
- `src/components/main/MainSidebar.tsx` - Apple 스타일 개편
- `src/app/(main)/layout.tsx` - 모바일 탭바 및 헤더 개선

### Phase 4: 피드 컴포넌트 개편 ✅ 완료 (2026-01-25)

**인스타그램 스타일 피드 카드**:
- [x] 아바타 그라데이션 링 (Instagram Stories 스타일)
- [x] 깔끔한 인터랙션 버튼 (아이콘 강조, 텍스트 분리)
- [x] 좋아요 애니메이션 (scale 효과)
- [x] 카드 border 제거, backdrop-blur 적용
- [x] 소스 뱃지 미니멀 디자인

**수정된 파일**:
- `src/components/feed/UnifiedFeedCard.tsx` - Instagram 스타일 전면 개편
- `src/components/feed/PublicFeedCard.tsx` - 동일 스타일 적용
- `src/components/church/FeedCard.tsx` - UnifiedFeedCard 래퍼 (자동 적용)

### Phase 5: 특화 컴포넌트 개편 ✅ 완료 (2026-01-25)

**개선된 컴포넌트**:
- [x] `progress.tsx` - 그라데이션 바, 부드러운 애니메이션
- [x] `badge.tsx` - 새 variants (success, warning, info, subtle) 추가
- [x] `textarea.tsx` - Apple 스타일 라운드, 포커스 효과
- [x] `avatar.tsx` - 미묘한 링, 그라데이션 폴백
- [x] `tabs.tsx` - 부드러운 전환, 깔끔한 활성 상태
- [x] `switch.tsx` - 더 큰 터치 영역, Apple 스타일
- [x] `QTMeditationForm.tsx` - 뱃지 스타일 개선

**수정된 파일**:
- `src/components/ui/progress.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/switch.tsx`
- `src/components/personal/QTMeditationForm.tsx`

### Phase 6: 색상 마이그레이션 및 정리 ✅ 완료 (2026-01-25)

**완료된 작업**:
- [x] `src/app/page.tsx` (랜딩 페이지) - olive → primary 전면 마이그레이션
- [x] `src/components/feed/UnifiedFeedCard.tsx` - olive 구분선 → primary
- [x] `src/components/main/MainSidePanel.tsx` - olive → primary/muted/border
- [x] `src/components/church/sidepanel/*.tsx` (5개 파일) - 완전 마이그레이션
- [x] `src/components/church/contents/*.tsx` (5개 파일) - 완전 마이그레이션
- [x] `src/components/church/splitview/*.tsx` (5개 파일) - 완전 마이그레이션
- [x] `src/components/church/QT*.tsx` (2개 파일) - 완전 마이그레이션
- [x] `src/app/church/[code]/sharing/page.tsx` - olive → primary/muted/border
- [x] 빌드 검증 완료

**마이그레이션 패턴** (적용됨):
```
olive-50 → muted/30 또는 muted/50
olive-100 → muted 또는 primary/10
olive-200 → border/60
olive-300 → border
olive-600 → primary
olive-700 → foreground
olive-800 → foreground
dark:olive-* → dark:primary/* 또는 dark:muted/*
```

### Phase 7: 접근성 및 세부 개선 ✅ 완료 (2026-01-25)

**완료된 작업**:
- [x] 글꼴 크기 설정 기능 구현
  - `FontSizeSelector` 컴포넌트 생성 (slider/buttons/compact 변형)
  - 5단계 글꼴 크기 (아주 작게 ~ 아주 크게, 85% ~ 120%)
  - `--font-scale` CSS 변수 및 localStorage 저장
  - 레이아웃 초기화 스크립트 추가 (깜빡임 방지)
  - 마이페이지 설정에 통합

- [x] 다크모드 세부 검증
  - QTAnswerView: QT 박스들 dark mode variants 추가
  - QTCardSlider: gray 색상 → foreground/muted-foreground 마이그레이션
  - DashboardStats: slate → muted/foreground 마이그레이션
  - RecentQTList: 다크모드 배경색 수정
  - SplitViewPanel: 로딩 배경색 수정
  - FeedDetailModal: 뱃지 색상 개선

- [x] 반응형 세부 조정 검증 완료
- [x] 애니메이션 통일 검증 완료

**수정된 파일**:
- `src/components/FontSizeSelector.tsx` (신규)
- `src/app/globals.css` - 글꼴 크기 CSS 변수 추가
- `src/app/layout.tsx` - 글꼴 크기 초기화 스크립트
- `src/app/(main)/mypage/settings/page.tsx` - 글꼴 크기 설정 통합
- `src/components/church/QTAnswerView.tsx` - 다크모드 개선
- `src/components/church/QTCardSlider.tsx` - 다크모드 개선
- `src/components/home/DashboardStats.tsx` - 다크모드 개선
- `src/components/home/RecentQTList.tsx` - 다크모드 개선
- `src/components/church/splitview/SplitViewPanel.tsx` - 다크모드 개선
- `src/components/feed/FeedDetailModal.tsx` - 다크모드 개선

---

## 📋 기타 진행 중 작업

### 컴포넌트 통합 (Component Consolidation)

**Phase 1-3 완료** (2026-01-25)

**다음 작업**:
- [ ] Phase 4: 피드 컴포넌트 통합 (AllFeed, PublicFeed, GroupFeed)
- [ ] PublicFeedCard 완전 통합 (로그인 체크, 블러 효과 기능 추가)

### 통합 테이블 마이그레이션

**완료된 작업** (2026-01-24~25):
- [x] UnifiedMeditation, UnifiedReadingCheck 엔티티
- [x] Repository 구현
- [x] React Query 훅 생성
- [x] 페이지 마이그레이션 (mypage/comments, mypage/readings 등)

**테스트 필요** (마이그레이션 적용 후):
- [ ] 마이그레이션 실행 후 데이터 정합성 확인
- [ ] CRUD 기능 테스트
- [ ] 교회에서 작성 → mypage에서 확인
- [ ] 그룹에서 작성 → 교회 mypage에서 확인

---

*마지막 업데이트: 2026-01-25 (디자인 대규모 개편 Phase 1-7 전체 완료, 접근성 개선)*
