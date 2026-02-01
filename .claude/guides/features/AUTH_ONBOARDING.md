# 인증 & 온보딩 가이드

> 로그인, OAuth, 온보딩 관련 작업 시 참조하세요.

---

## 1. 개요

### 인증 플로우

```
┌──────────────────────────────────────────────────────────────┐
│                      인증 시스템                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  사용자                                                       │
│    │                                                         │
│    ▼                                                         │
│  /login 페이지                                                │
│    │                                                         │
│    ├─── Google OAuth ───┐                                    │
│    └─── Kakao OAuth ────┤                                    │
│                         ▼                                    │
│               /auth/callback (콜백 처리)                      │
│                         │                                    │
│                         ▼                                    │
│               auth.users (Supabase Auth)                     │
│                         │                                    │
│                         ▼                                    │
│               profiles 테이블 생성/업데이트                    │
│                         │                                    │
│            ┌────────────┴────────────┐                       │
│            ▼                         ▼                       │
│    온보딩 미완료               온보딩 완료                     │
│    → 온보딩 플로우              → /home                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 관련 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 로그인 | `/login` | 소셜 로그인 버튼 |
| 콜백 | `/auth/callback` | OAuth 콜백 처리 |
| 관리자 로그인 | `/admin-login` | 관리자 전용 로그인 |

---

## 2. 핵심 파일

### 페이지

| 파일 | 역할 |
|------|------|
| `src/app/(auth)/login/page.tsx` | 로그인 페이지 UI |
| `src/app/auth/callback/route.ts` | OAuth 콜백 처리 (서버) |
| `src/app/(admin-auth)/admin-login/page.tsx` | 관리자 로그인 |

### 컴포넌트

| 파일 | 역할 |
|------|------|
| `src/components/auth/SocialLoginButtons.tsx` | 소셜 로그인 버튼들 |
| `src/components/OnboardingTutorial.tsx` | 온보딩 튜토리얼 모달 |
| `src/components/profile/ProfileSetupDialog.tsx` | 프로필 초기 설정 |

### 미들웨어

| 파일 | 역할 |
|------|------|
| `src/middleware.ts` | 인증 상태 확인, 리다이렉트 |

---

## 3. 사용하는 훅

| 훅 | 파일 | 용도 |
|----|------|------|
| `useCurrentUser` | `useUser.ts` | 현재 로그인 사용자 조회 |
| `useUpdateProfile` | `useUser.ts` | 프로필 업데이트 |
| `useUploadAvatar` | `useUser.ts` | 아바타 이미지 업로드 |

### 사용 예시

```typescript
import { useCurrentUser, useUpdateProfile } from '@/presentation/hooks/queries/useUser';

function MyComponent() {
  const { data: userData, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();

  const user = userData?.user;

  if (isLoading) return <Loading />;
  if (!user) return <LoginPrompt />;

  const handleComplete = async () => {
    await updateProfile.mutateAsync({
      userId: user.id,
      updates: { onboarding_completed: true }
    });
  };
}
```

---

## 4. 데이터 흐름

### 테이블 구조

```sql
-- Supabase Auth (자동 관리)
auth.users
├── id: UUID (PK)
├── email: TEXT
├── provider: TEXT (google, kakao)
└── created_at: TIMESTAMPTZ

-- 앱 프로필 (커스텀)
profiles
├── id: UUID (PK, auth.users.id 참조)
├── nickname: TEXT
├── avatar_url: TEXT
├── church_id: UUID (FK → churches)
├── church_code: TEXT
├── active_group_id: UUID
├── onboarding_completed: BOOLEAN (기본 false)
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

### 온보딩 상태 관리

```
신규 사용자 가입
    ↓
profiles 생성 (onboarding_completed = false)
    ↓
온보딩 튜토리얼 표시
    ↓
튜토리얼 완료 시
    ↓
onboarding_completed = true로 업데이트
```

---

## 5. 작업 체크리스트

### 로그인 관련 수정 시

- [ ] `SocialLoginButtons.tsx` 수정
- [ ] OAuth 콜백 경로 확인 (`/auth/callback`)
- [ ] Supabase Auth 설정 확인 (대시보드)
- [ ] 리다이렉트 URL 확인

### 온보딩 수정 시

- [ ] `OnboardingTutorial.tsx` 수정
- [ ] 완료 시 `onboarding_completed` 업데이트 확인
- [ ] 완료 후 리다이렉트 경로 확인

### 프로필 초기 설정 수정 시

- [ ] `ProfileSetupDialog.tsx` 수정
- [ ] 필수 필드 검증 로직 확인
- [ ] 아바타 업로드 기능 확인

---

## 6. 주의사항

1. **OAuth 콜백**: 콜백 URL은 Supabase 대시보드에 등록되어 있어야 함
2. **프로필 생성**: `auth.users` 생성 시 트리거로 `profiles` 자동 생성
3. **토큰 갱신**: Supabase Auth가 자동으로 처리

---

## 7. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-01 | 초기 문서 작성 |
