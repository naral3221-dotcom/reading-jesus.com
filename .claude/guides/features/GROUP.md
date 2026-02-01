# 그룹 가이드

> 그룹 생성/가입/관리 관련 작업 시 참조하세요.

---

## 1. 개요

### 그룹 시스템

```
┌─────────────────────────────────────────────────────────────┐
│                       그룹 시스템                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  /group         │    │  /group/[id]    │                 │
│  │  그룹 목록       │ →  │  그룹 상세/피드  │                 │
│  └─────────────────┘    └─────────────────┘                 │
│         │                       │                           │
│         ▼                       ▼                           │
│  그룹 생성/가입           그룹 묵상/관리                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 그룹 유형                                            │    │
│  │ - 독립 그룹: 교회 소속 없음                           │    │
│  │ - 교회 그룹: 교회 소속 (church_id 연결)               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 관련 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 그룹 목록 | `/group` | 내 그룹 목록 |
| 그룹 상세 | `/group/[id]` | 그룹 피드/정보 |
| 그룹 관리 | `/group/[id]/admin` | 그룹 관리자 페이지 |
| 멤버 관리 | `/group/[id]/admin/member/[memberId]` | 멤버 관리 |
| 랭킹 | `/group/[id]/admin/ranks` | 랭킹 관리 |
| 설정 | `/group/[id]/settings` | 그룹 설정 |
| 모임 | `/group/[id]/meetings` | 그룹 모임 |
| 가입 | `/group/join/[inviteCode]` | 초대코드로 가입 |

---

## 2. 핵심 파일

### 페이지

| 파일 | 역할 |
|------|------|
| `src/app/(main)/group/page.tsx` | 그룹 목록 페이지 |
| `src/app/(main)/group/[id]/page.tsx` | 그룹 상세 페이지 |
| `src/app/(main)/group/[id]/admin/page.tsx` | 그룹 관리자 페이지 |
| `src/app/(main)/group/join/[inviteCode]/page.tsx` | 초대코드 가입 |

### 컴포넌트

| 파일 | 역할 |
|------|------|
| `src/components/group/GroupLayout.tsx` | 그룹 레이아웃 |
| `src/components/group/GroupTabs.tsx` | 그룹 탭 네비게이션 |
| `src/components/group/CustomPlanWizard.tsx` | 커스텀 플랜 설정 |
| `src/components/group/ReadingJesusPlanInfo.tsx` | 리딩지저스 플랜 정보 |
| `src/components/group/JoinRequestsManager.tsx` | 가입 요청 관리 |

---

## 3. 사용하는 훅

| 훅 | 파일 | 용도 |
|----|------|------|
| `useGroupById` | `useGroup.ts` | 그룹 ID로 조회 |
| `useGroupByInviteCode` | `useGroup.ts` | 초대코드로 조회 |
| `useUserGroups` | `useGroup.ts` | 사용자의 그룹 목록 |
| `useGroupMembers` | `useGroup.ts` | 그룹 멤버 목록 |
| `useCreateGroup` | `useGroup.ts` | 그룹 생성 |
| `useJoinGroup` | `useGroup.ts` | 그룹 가입 |
| `useLeaveGroup` | `useGroup.ts` | 그룹 탈퇴 |
| `useChurchGroups` | `useGroup.ts` | 교회의 그룹 목록 |
| `useGroupMeditations` | `useGroupMeditation.ts` | 그룹 묵상 목록 |

### Query Key Factory

```typescript
const groupKeys = {
  all: ['group'] as const,
  byId: (id: string) => [...groupKeys.all, 'byId', id] as const,
  byInviteCode: (code: string) => [...groupKeys.all, 'byInviteCode', code] as const,
  byUser: (userId: string) => [...groupKeys.all, 'byUser', userId] as const,
  members: (groupId: string) => [...groupKeys.all, 'members', groupId] as const,
  byChurch: (churchId: string) => [...groupKeys.all, 'byChurch', churchId] as const,
};
```

### 사용 예시

```typescript
import { useGroupById, useJoinGroup } from '@/presentation/hooks/queries/useGroup';

function GroupPage({ groupId }) {
  const { data: group, isLoading } = useGroupById(groupId);
  const joinGroup = useJoinGroup();

  const handleJoin = async () => {
    await joinGroup.mutateAsync({
      groupId,
      userId: currentUser.id,
    });
  };

  if (isLoading) return <Loading />;

  return (
    <div>
      <h1>{group?.name}</h1>
      <button onClick={handleJoin}>가입하기</button>
    </div>
  );
}
```

---

## 4. 데이터 흐름

### 그룹 생성 흐름

```
그룹 생성 모달
    ↓
플랜 선택 (리딩지저스 2026 / 커스텀)
    ↓
설정 입력 (이름, 설명, 시작일, 범위)
    ↓
useCreateGroup() 훅
    ↓
CreateGroup Use Case
    ↓
groups 테이블 INSERT
    ↓
group_members 테이블 INSERT (생성자 = admin)
    ↓
캐시 무효화 → 목록 갱신
```

### 테이블 구조

```sql
groups
├── id: UUID (PK)
├── name: TEXT (2~50자)
├── description: TEXT
├── church_id: UUID (FK → churches, nullable)
├── invite_code: TEXT (UNIQUE)
├── created_by: UUID (FK → profiles)
├── is_public: BOOLEAN
├── max_members: INTEGER
├── reading_plan_type: TEXT ('365' | '180' | '90' | 'custom')
├── bible_range_type: TEXT ('full' | 'ot' | 'nt' | 'custom')
├── schedule_mode: TEXT ('calendar' | 'day_count')
├── start_date: DATE
├── end_date: DATE
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

group_members
├── id: UUID (PK)
├── group_id: UUID (FK → groups)
├── user_id: UUID (FK → profiles)
├── role: TEXT ('admin' | 'member')
├── joined_at: TIMESTAMPTZ
└── UNIQUE(group_id, user_id)
```

### 플랜 설정 옵션

| 옵션 | 설명 |
|------|------|
| `reading_plan_type` | 365일 / 180일 / 90일 / 커스텀 |
| `bible_range_type` | 전체 / 구약만 / 신약만 / 커스텀 |
| `schedule_mode` | calendar (실제 날짜) / day_count (시작일 기준) |

---

## 5. 작업 체크리스트

### 그룹 생성 수정 시

- [ ] 그룹 생성 모달/다이얼로그 확인
- [ ] `CustomPlanWizard.tsx` 확인 (커스텀 플랜)
- [ ] `useCreateGroup` 훅 로직 확인
- [ ] 기본값 설정 확인

### 그룹 가입 수정 시

- [ ] 초대코드 검증 로직 확인
- [ ] `useJoinGroup` 훅 확인
- [ ] group_members 테이블 INSERT 확인
- [ ] 캐시 무효화 확인

### 그룹 관리자 기능 수정 시

- [ ] 권한 체크 (`role === 'admin'`)
- [ ] 멤버 관리 UI 확인
- [ ] 그룹 설정 수정 확인

---

## 6. 멤버 역할

| 역할 | 권한 |
|------|------|
| `admin` | 그룹 설정 수정, 멤버 관리, 묵상 고정/삭제 |
| `member` | 묵상 작성, 읽기, 댓글 |

### 역할 체크 예시

```typescript
function GroupAdminButton({ groupId, userId }) {
  const { data: members } = useGroupMembers(groupId);
  const currentMember = members?.find(m => m.user_id === userId);
  const isAdmin = currentMember?.role === 'admin';

  if (!isAdmin) return null;

  return <Button>관리</Button>;
}
```

---

## 7. 주의사항

1. **초대코드 유일성**: `invite_code`는 UNIQUE 제약
2. **그룹 생성자**: 자동으로 admin 역할 부여
3. **교회 그룹**: `church_id`가 있으면 교회 소속 그룹

---

## 8. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-01 | 초기 문서 작성 |
