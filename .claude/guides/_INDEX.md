# 가이드 인덱스

> 이 폴더는 프로젝트의 모든 개발 가이드를 포함합니다.
> 작업 시작 전 관련 가이드를 반드시 참조하세요.

---

## 핵심 아키텍처 (core/)

| 문서 | 설명 | 참조 시점 |
|------|------|----------|
| [CLEAN_ARCHITECTURE.md](./core/CLEAN_ARCHITECTURE.md) | 클린 아키텍처 4계층 구조 | 새 기능 설계 시 |
| [CODE_ARCHITECTURE.md](./core/CODE_ARCHITECTURE.md) | 코드 작성 규칙, 훅 재사용 | 코드 작성 시 |
| [BACKEND_ARCHITECTURE.md](./core/BACKEND_ARCHITECTURE.md) | DB 테이블, 데이터 흐름, Dual-Write | DB/API 작업 시 |

---

## 디자인 시스템 (design/)

| 문서 | 설명 | 참조 시점 |
|------|------|----------|
| [DESIGN_SYSTEM.md](./design/DESIGN_SYSTEM.md) | 브랜드 컬러, 테마, Tailwind 토큰 | UI/스타일 작업 시 |

---

## 기능별 가이드 (features/)

| 문서 | 대상 페이지 | 핵심 내용 |
|------|------------|----------|
| [AUTH_ONBOARDING.md](./features/AUTH_ONBOARDING.md) | `/login`, `/auth/callback` | OAuth, 온보딩 플로우 |
| [HOME_FEED.md](./features/HOME_FEED.md) | `/home` | 통합 피드, 무한스크롤 |
| [BIBLE_READING.md](./features/BIBLE_READING.md) | `/bible`, `/bible-reader` | 365일 통독, 읽음 체크 |
| [QT_MEDITATION.md](./features/QT_MEDITATION.md) | `/qt`, QT 작성 | QT 조회/작성, 캐러셀 UI |
| [GROUP.md](./features/GROUP.md) | `/group/*` | 그룹 생성/가입/관리 |
| [CHURCH.md](./features/CHURCH.md) | `/church/*` | 교회 가입/관리, 게스트 묵상 |
| [MYPAGE_PROFILE.md](./features/MYPAGE_PROFILE.md) | `/mypage`, `/profile/*` | 프로필, 통계, 팔로우 |
| [SEARCH_NOTIFICATION.md](./features/SEARCH_NOTIFICATION.md) | `/search`, `/notifications` | 통합 검색, 알림 |
| [ADMIN.md](./features/ADMIN.md) | `/admin/*` | 시스템/교회 관리자 |

---

## 작업 프로토콜

### 작업 시작 시

1. **기능별 가이드** 확인 → 핵심 파일, 훅, 데이터 흐름 파악
2. **코어 가이드** 참조 → 아키텍처 패턴 준수
3. **IMPLEMENTATION.md** 확인 → 현재 진행 상황 파악

### 작업 완료 시

1. **IMPLEMENTATION.md** 업데이트 (필수)
2. **관련 가이드** 업데이트 (변경 사항 있을 시)
   - 새 컴포넌트/훅 추가 → 핵심 파일 목록 갱신
   - 데이터 흐름 변경 → 다이어그램 갱신
   - 변경 이력 테이블에 기록

---

## 키워드별 참조 가이드

| 키워드 | 참조 가이드 |
|--------|------------|
| 로그인, 인증, OAuth, 온보딩 | AUTH_ONBOARDING.md |
| 홈, 피드, 카드, 무한스크롤 | HOME_FEED.md |
| 성경, 통독, 읽음체크, Day | BIBLE_READING.md |
| QT, 묵상, 나눔 | QT_MEDITATION.md |
| 그룹, 멤버, 초대코드 | GROUP.md |
| 교회, church, 게스트 | CHURCH.md |
| 마이페이지, 프로필, 설정 | MYPAGE_PROFILE.md |
| 검색, 알림 | SEARCH_NOTIFICATION.md |
| admin, 관리 | ADMIN.md |

---

*마지막 업데이트: 2026-02-01*
