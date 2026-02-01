# 마이페이지 & 프로필 가이드

> 프로필, 통계, 설정, 팔로우 관련 작업 시 참조하세요.

---

## 1. 개요

### 관련 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 마이페이지 | `/mypage` | 통합 마이페이지 |
| 프로필 수정 | `/mypage/profile` | 프로필 편집 |
| 설정 | `/mypage/settings` | 계정 설정 |
| 읽음 달력 | `/mypage/calendar` | 히트맵 캘린더 |
| 내 묵상 | `/mypage/comments` | 내 묵상글 목록 |
| 공개 프로필 | `/profile/[userId]` | 타인이 보는 프로필 |

---

## 2. 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/app/(main)/mypage/page.tsx` | 마이페이지 메인 |
| `src/app/(main)/profile/[userId]/page.tsx` | 공개 프로필 |
| `src/components/personal/UnifiedMyPage.tsx` | 통합 마이페이지 |
| `src/components/mypage/ProfileSection.tsx` | 프로필 섹션 |
| `src/components/mypage/StatsSection.tsx` | 통계 섹션 |
| `src/components/personal/stats/ReadingHeatmap.tsx` | 읽기 히트맵 |

---

## 3. 사용하는 훅

| 훅 | 파일 | 용도 |
|----|------|------|
| `useCurrentUser` | `useUser.ts` | 현재 사용자 |
| `useUpdateProfile` | `useUser.ts` | 프로필 업데이트 |
| `useFollowers` | `useUserFollow.ts` | 팔로워 목록 |
| `useToggleFollow` | `useUserFollow.ts` | 팔로우 토글 |
| `useUserBadges` | `useBadge.ts` | 배지 목록 |

---

## 4. 테이블 구조

```sql
profiles
├── id: UUID (PK)
├── nickname: TEXT
├── avatar_url: TEXT
├── church_id: UUID
├── onboarding_completed: BOOLEAN
└── updated_at: TIMESTAMPTZ

user_follows
├── follower_id: UUID
├── following_id: UUID
└── UNIQUE(follower_id, following_id)
```

---

## 5. 작업 체크리스트

- [ ] `UnifiedMyPage.tsx` 수정 시 섹션 컴포넌트 확인
- [ ] 프로필 수정 시 `useUpdateProfile` 훅 확인
- [ ] 팔로우 기능 수정 시 피드 필터 영향 확인

---

## 6. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-01 | 초기 문서 작성 |
