# 검색 & 알림 가이드

> 통합 검색, 알림 시스템 관련 작업 시 참조하세요.

---

## 1. 개요

### 관련 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 검색 | `/search` | 통합 검색 |
| 알림 | `/notifications` | 알림 목록 |

---

## 2. 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/app/(main)/search/page.tsx` | 검색 페이지 |
| `src/app/(main)/notifications/page.tsx` | 알림 페이지 |

---

## 3. 사용하는 훅

| 훅 | 파일 | 용도 |
|----|------|------|
| `useNotifications` | `useNotification.ts` | 알림 목록 |
| `useUnreadNotificationCount` | `useNotification.ts` | 읽지 않은 알림 수 |
| `useMarkNotificationAsRead` | `useNotification.ts` | 알림 읽음 처리 |

---

## 4. 테이블 구조

```sql
notifications
├── id: UUID (PK)
├── user_id: UUID (수신자)
├── type: TEXT ('follow' | 'like' | 'comment' | 'encouragement')
├── title: TEXT
├── message: TEXT
├── data: JSONB
├── is_read: BOOLEAN
└── created_at: TIMESTAMPTZ
```

---

## 5. 알림 타입

| 타입 | 설명 |
|------|------|
| `follow` | 새 팔로워 |
| `like` | 좋아요 |
| `comment` | 댓글 |
| `encouragement` | 격려 메시지 |
| `badge` | 배지 획득 |

---

## 6. 작업 체크리스트

- [ ] 검색 기능 수정 시 debounce 적용 확인
- [ ] 새 알림 타입 추가 시 NotificationItem 렌더링 추가
- [ ] 알림 읽음 처리 확인

---

## 7. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-01 | 초기 문서 작성 |
