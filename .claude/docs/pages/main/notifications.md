# 알림 페이지

> **경로**: `/notifications`
> **파일**: `src/app/(main)/notifications/page.tsx`
> **복잡도**: ★★★★☆ (중상)
> **최종 업데이트**: 2026-01-25

---

## 개요

### 목적
사용자에게 온 알림(좋아요, 댓글, 그룹 초대 등)을 관리하는 페이지입니다.

### 주요 기능
- 알림 목록 조회 (무한 스크롤)
- 알림 읽음 처리 (개별/전체)
- 알림 삭제
- 알림 클릭 시 해당 페이지로 이동

---

## 의존성

### 사용하는 훅
| 훅 | 파일 | 용도 |
|----|------|------|
| `useCurrentUser` | `useUser.ts` | 사용자 정보 |
| `useInfiniteNotifications` | `useNotification.ts` | 알림 목록 (무한 스크롤) |
| `useUnreadNotificationCount` | `useNotification.ts` | 읽지 않은 알림 개수 |
| `useMarkAsRead` | `useNotification.ts` | 개별 읽음 처리 |
| `useMarkAllAsRead` | `useNotification.ts` | 전체 읽음 처리 |
| `useDeleteNotification` | `useNotification.ts` | 알림 삭제 |
| `useToast` | `toast.tsx` | 토스트 알림 |

### 사용하는 컴포넌트
| 컴포넌트 | 용도 |
|----------|------|
| `Card` | 알림 카드 |
| `ListSkeleton` | 로딩 스켈레톤 |
| `ErrorState` | 에러 상태 |
| `EmptyState` | 빈 상태 |

---

## 상태 관리

### 서버 상태 (React Query)
| 쿼리 | 데이터 | 갱신 시점 |
|------|--------|----------|
| `useInfiniteNotifications` | 알림 페이지 배열 | 마운트/스크롤 시 |
| `useUnreadNotificationCount` | 읽지 않은 개수 | 읽음 처리 시 |

### 알림 타입
| 타입 | 아이콘 | 색상 |
|------|--------|------|
| `like` | ❤️ Heart | 로즈 |
| `comment` | 💬 MessageCircle | 블루 |
| `reply` | 💬 MessageCircle | 에메랄드 |
| `group_invite` | 👥 Users | 퍼플 |
| `group_notice` | 📢 Megaphone | 앰버 |
| `reminder` | ⏰ Clock | 슬레이트 |

---

## UI 구성

### 레이아웃
```
┌────────────────────────┐
│ [←] 🔔 알림 [3]  [모두 읽음] │
├────────────────────────┤
│ ┌──────────────────┐   │
│ │ 💬 홍길동님이 댓글  │   │
│ │ "좋은 묵상이네요"  │   │
│ │ 5분 전    [✓] [🗑] │   │
│ └──────────────────┘   │
│ ┌──────────────────┐   │
│ │ ❤️ 이영희님이 좋아요│ ● │ ← 읽지 않음 표시
│ │ Day 42 묵상      │   │
│ │ 1시간 전         │   │
│ └──────────────────┘   │
│        ...             │
│    (무한 스크롤)        │
└────────────────────────┘
```

### 컴포넌트 트리
```
NotificationsPage
├── 헤더
│   ├── 뒤로가기 버튼
│   ├── 제목 + 읽지 않은 개수
│   └── "모두 읽음" 버튼
├── EmptyState (알림 없을 때)
└── 알림 목록
    └── Card[] (알림 카드)
        ├── 아이콘 (타입별)
        ├── 제목 + 메시지
        ├── 시간
        └── 액션 버튼 (읽음/삭제)
```

### 상태별 UI
| 상태 | 표시 내용 |
|------|----------|
| 로딩 | `<ListSkeleton />` |
| 에러 | `<ErrorState />` |
| 빈 상태 | `<EmptyState />` |
| 정상 | 알림 카드 목록 |

---

## 비즈니스 로직

### 알림 클릭 흐름
```
1. 알림 카드 클릭
2. 읽지 않은 상태면 → 읽음 처리
3. link가 있으면 → 해당 페이지로 이동
```

### 무한 스크롤
- IntersectionObserver 사용
- threshold: 0.1, rootMargin: 100px
- 20개씩 로드

### 시간 포맷
| 시간차 | 표시 |
|--------|------|
| < 1분 | "방금 전" |
| < 60분 | "X분 전" |
| < 24시간 | "X시간 전" |
| < 7일 | "X일 전" |
| ≥ 7일 | "M월 D일" |

---

## API / 데이터

### 사용하는 테이블
| 테이블 | 용도 | RLS |
|--------|------|-----|
| `notifications` | 알림 목록 | 예 |

---

## 접근 권한

| 사용자 유형 | 접근 가능 | 비고 |
|-------------|----------|------|
| 비로그인 | X | 로그인 필요 |
| 로그인 | O | 자신의 알림만 |

---

## 관련 문서

- [home.md](./home.md) - 홈 페이지
- [mypage-notification-settings.md](./mypage-notification-settings.md) - 알림 설정

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-25 | 최초 작성 |
