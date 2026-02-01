# 교회 가이드

> 교회 가입/관리, 게스트 묵상 관련 작업 시 참조하세요.

---

## 1. 개요

### 교회 시스템

```
┌─────────────────────────────────────────────────────────────┐
│                       교회 시스템                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐    │
│  │  /church        │    │  /church/[code]              │    │
│  │  교회 검색/가입  │ →  │  교회 홈 (코드 기반 라우팅)    │    │
│  └─────────────────┘    └──────────────────────────────┘    │
│                                │                            │
│              ┌─────────────────┼─────────────────┐          │
│              ▼                 ▼                 ▼          │
│         /qt            /bible            /admin             │
│       교회 QT         교회 통독         교회 관리            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 특징                                                 │    │
│  │ - 코드 기반 라우팅 (/church/[code])                  │    │
│  │ - 게스트 묵상 지원 (비로그인 작성)                    │    │
│  │ - 교회 관리자 별도 인증                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 관련 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 교회 검색 | `/church` | 교회 검색 및 가입 |
| 교회 등록 | `/church/register` | 새 교회 등록 |
| 교회 홈 | `/church/[code]` | 교회 메인 페이지 |
| 교회 관리 | `/church/[code]/admin` | 교회 관리자 페이지 |
| 관리자 로그인 | `/church/[code]/admin/login` | 관리자 인증 |
| 교회 QT | `/church/[code]/qt` | 교회 QT 목록 |
| 교회 통독 | `/church/[code]/bible` | 교회 성경 통독 |
| 교회 그룹 | `/church/[code]/groups` | 교회 소속 그룹 |
| 교회 마이페이지 | `/church/[code]/my/*` | 교회 컨텍스트 마이페이지 |

---

## 2. 핵심 파일

### 페이지

| 파일 | 역할 |
|------|------|
| `src/app/(main)/church/page.tsx` | 교회 검색/가입 |
| `src/app/(main)/church/register/page.tsx` | 새 교회 등록 |
| `src/app/church/[code]/page.tsx` | 교회 홈 |
| `src/app/church/[code]/admin/page.tsx` | 교회 관리자 |
| `src/app/church/[code]/qt/page.tsx` | 교회 QT |
| `src/app/church/[code]/qt/[date]/page.tsx` | 교회 QT 상세 |

### 컴포넌트

| 파일 | 역할 |
|------|------|
| `src/components/church/ChurchLayout.tsx` | 교회 레이아웃 |
| `src/components/church/ChurchBottomNav.tsx` | 교회 바텀 네비게이션 |
| `src/components/church/InstagramStyleFeed.tsx` | 인스타그램 스타일 피드 |
| `src/components/church/PrayerTab.tsx` | 기도 요청 탭 |
| `src/components/church/EncouragementButton.tsx` | 격려 버튼 |
| `src/components/church/NoticeBanner.tsx` | 공지사항 배너 |
| `src/components/church/BadgeDisplay.tsx` | 배지 표시 |
| `src/components/church/StreakBadge.tsx` | 스트릭 배지 |

### 컨텐츠 컴포넌트

| 파일 | 역할 |
|------|------|
| `src/components/church/contents/HomeContent.tsx` | 홈 탭 |
| `src/components/church/contents/BibleContent.tsx` | 성경 탭 |
| `src/components/church/contents/GroupsContent.tsx` | 그룹 탭 |
| `src/components/church/contents/SharingContent.tsx` | 공유 탭 |
| `src/components/church/contents/MyContent.tsx` | 마이 탭 |

---

## 3. 사용하는 훅

| 훅 | 파일 | 용도 |
|----|------|------|
| `useChurchById` | `useChurch.ts` | 교회 ID로 조회 |
| `useChurchByCode` | `useChurch.ts` | 교회 코드로 조회 |
| `useSearchChurches` | `useChurch.ts` | 교회 검색 |
| `useJoinChurch` | `useChurch.ts` | 교회 가입 |
| `useLeaveChurch` | `useChurch.ts` | 교회 탈퇴 |
| `useChurchMembers` | `useChurch.ts` | 교회 멤버 목록 |
| `useChurchAdminLogin` | `useChurchAdmin.ts` | 관리자 로그인 |
| `useChurchAdmins` | `useChurchAdmin.ts` | 관리자 목록 |
| `useTodayStats` | `useChurchStats.ts` | 오늘 통계 |
| `useChurchReadingProgress` | `useChurchStats.ts` | 읽기 진도 |
| `useChurchQTPosts` | `useChurchQTPost.ts` | 교회 QT 목록 |
| `useChurchGuestMeditations` | `useChurchGuestMeditation.ts` | 게스트 묵상 |

### Query Key Factory

```typescript
const churchKeys = {
  all: ['church'] as const,
  byId: (id: string) => [...churchKeys.all, 'id', id] as const,
  byCode: (code: string) => [...churchKeys.all, 'code', code] as const,
  members: (churchId: string) => [...churchKeys.all, 'members', churchId] as const,
  search: (query: string) => [...churchKeys.all, 'search', query] as const,
};
```

### 사용 예시

```typescript
import { useChurchByCode, useJoinChurch } from '@/presentation/hooks/queries/useChurch';

function ChurchPage({ code }) {
  const { data: churchData, isLoading } = useChurchByCode(code);
  const joinChurch = useJoinChurch();

  const church = churchData?.church;

  if (isLoading) return <Loading />;
  if (!church) return <NotFound />;

  return (
    <div>
      <h1>{church.name}</h1>
      <Button onClick={() => joinChurch.mutate({ churchId: church.id })}>
        가입하기
      </Button>
    </div>
  );
}
```

---

## 4. 데이터 흐름

### 교회 가입 흐름

```
교회 검색 (/church)
    ↓
교회 코드 또는 이름으로 검색
    ↓
useSearchChurches() 훅
    ↓
결과에서 교회 선택
    ↓
useJoinChurch() 훅
    ↓
church_members 테이블 INSERT
    ↓
profiles.church_id 업데이트
    ↓
/church/[code]로 이동
```

### 테이블 구조

```sql
churches
├── id: UUID (PK)
├── name: TEXT
├── code: TEXT (UNIQUE, 가입 코드)
├── description: TEXT
├── logo_url: TEXT
├── denomination: TEXT (교단)
├── address: TEXT
├── region_code: TEXT
├── write_token: TEXT (작성 권한 토큰)
├── admin_token: TEXT (관리 권한 토큰)
├── is_active: BOOLEAN
├── allow_anonymous: BOOLEAN (익명 작성 허용)
├── schedule_year: INTEGER
├── schedule_start_date: DATE
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

church_members
├── id: UUID (PK)
├── church_id: UUID (FK → churches)
├── user_id: UUID (FK → profiles)
├── role: TEXT ('member' | 'admin')
├── joined_at: TIMESTAMPTZ
└── UNIQUE(church_id, user_id)

church_admins
├── id: UUID (PK)
├── church_id: UUID (FK → churches)
├── user_id: UUID (FK → profiles)
├── created_at: TIMESTAMPTZ
└── UNIQUE(church_id, user_id)
```

### 게스트 묵상 시스템

```
비로그인 사용자
    ↓
device_id (로컬스토리지) 생성
    ↓
guest_name 입력
    ↓
guest_comments 테이블 INSERT
    ↓
트리거로 unified_meditations 동기화
    ↓
피드에 표시
```

**게스트 식별**:
- `device_id`: 브라우저 고유 ID
- `guest_name`: 사용자가 입력한 표시명
- 로그인 시 `linked_user_id`로 연결 가능

---

## 5. 작업 체크리스트

### 교회 페이지 수정 시

- [ ] 교회 레이아웃 (`ChurchLayout.tsx`) 확인
- [ ] 바텀 네비게이션 (`ChurchBottomNav.tsx`) 확인
- [ ] 탭별 컨텐츠 컴포넌트 확인

### 교회 가입 수정 시

- [ ] `useJoinChurch` 훅 확인
- [ ] `church_members` INSERT 확인
- [ ] `profiles.church_id` 업데이트 확인
- [ ] 캐시 무효화 확인

### 게스트 묵상 수정 시

- [ ] `guest_comments` 테이블 구조 확인
- [ ] `device_id` 생성 로직 확인
- [ ] `useChurchGuestMeditations` 훅 확인
- [ ] 트리거 동기화 확인

### 교회 관리자 기능 수정 시

- [ ] 관리자 인증 확인 (`admin_token`)
- [ ] `church_admins` 테이블 확인
- [ ] 권한 체크 로직 확인

---

## 6. 교회 코드 규칙

- 영문 소문자, 숫자, 하이픈만 허용
- 최소 2자 이상
- UNIQUE 제약

```typescript
// 유효한 코드 예시
'myChurch'     // ❌ 대문자 포함
'my_church'    // ❌ 언더스코어
'my-church'    // ✅ 하이픈 허용
'church123'    // ✅
```

---

## 7. 토큰 기반 권한

| 토큰 | 용도 |
|------|------|
| `write_token` | 게스트 작성 권한 검증 |
| `admin_token` | 관리자 로그인 검증 |

```typescript
// 토큰 검증 예시
const isValidWriteToken = church.write_token === inputToken;
const isValidAdminToken = church.admin_token === inputToken;
```

---

## 8. 주의사항

1. **코드 기반 라우팅**: `/church/[code]` 형식 사용 (ID 아님)
2. **게스트 vs 로그인**: `device_id` vs `user_id` 구분
3. **guest_comments는 댓글이 아님**: "게스트 묵상글"임

---

## 9. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-01 | 초기 문서 작성 |
