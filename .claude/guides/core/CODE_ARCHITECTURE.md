# 바이브 코딩 아키텍처 가이드

> **이 파일은 Claude가 코드 작성 시 반드시 참조해야 합니다.**
> 아키텍처 일관성을 위해 모든 새 코드는 이 가이드를 따라야 합니다.

---

## 핵심 원칙 (3줄 요약)

1. **컴포넌트에서 Supabase 직접 호출 금지** → React Query 훅 사용
2. **새 기능 = Entity → Repository → Use Case → Hook → Component** 순서
3. **기존 훅 먼저 확인** → 있으면 재사용, 없으면 새로 생성

---

## 레이어 구조

```
src/
├── domain/              # 1️⃣ 핵심 비즈니스 (순수 TypeScript)
│   ├── entities/        # 데이터 모델 정의
│   └── repositories/    # Repository 인터페이스 (구현 X)
│
├── infrastructure/      # 2️⃣ 외부 시스템 연동
│   └── repositories/    # Supabase Repository 구현체
│
├── application/         # 3️⃣ 비즈니스 로직
│   └── use-cases/       # 유스케이스 (단일 책임)
│
└── presentation/        # 4️⃣ UI 레이어
    ├── hooks/queries/   # React Query 훅 ⭐ 컴포넌트는 여기만 호출
    └── components/      # UI 컴포넌트
```

---

## 의존성 방향 (절대 규칙)

```
Component → Hook → Use Case → Repository Interface ← Repository 구현체
                              ↓
                           Entity
```

- **Domain**: 외부 의존성 없음 (순수 TypeScript만)
- **Infrastructure**: Domain 인터페이스 구현
- **Application**: Domain만 의존 (Supabase 모름)
- **Presentation**: Hook만 호출 (Supabase 모름)

---

## ❌ 금지 패턴

```typescript
// ❌ 컴포넌트에서 Supabase 직접 호출 - 절대 금지!
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';

function MyComponent() {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.from('churches').select('*');  // ❌
}

// ❌ 컴포넌트에서 Repository 직접 사용 - 금지!
import { SupabaseChurchRepository } from '@/infrastructure/repositories';

function MyComponent() {
  const repo = new SupabaseChurchRepository();
  const church = await repo.findById(id);  // ❌
}
```

---

## ✅ 올바른 패턴

```typescript
// ✅ 컴포넌트에서 React Query 훅 사용
import { useChurchByCode } from '@/presentation/hooks/queries/useChurch';

function MyComponent({ churchCode }: Props) {
  const { data: churchData, isLoading, error } = useChurchByCode(churchCode);
  const church = churchData?.church;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error.message} />;

  return <div>{church?.name}</div>;
}
```

---

## 새 기능 추가 체크리스트

### 예시: "교회 공지사항" 기능 추가

#### Step 1: Entity 생성
```typescript
// src/domain/entities/ChurchNotice.ts
export interface ChurchNotice {
  id: string;
  church_id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
}
```

#### Step 2: Repository Interface 생성
```typescript
// src/domain/repositories/IChurchNoticeRepository.ts
import { ChurchNotice } from '../entities';

export interface IChurchNoticeRepository {
  findByChurchId(churchId: string): Promise<ChurchNotice[]>;
  create(notice: Omit<ChurchNotice, 'id' | 'created_at'>): Promise<ChurchNotice>;
  update(id: string, data: Partial<ChurchNotice>): Promise<ChurchNotice>;
  delete(id: string): Promise<void>;
}
```

#### Step 3: Repository 구현체 생성
```typescript
// src/infrastructure/repositories/SupabaseChurchNoticeRepository.ts
import { getSupabaseBrowserClient } from '@/infrastructure/supabase/client';
import { IChurchNoticeRepository } from '@/domain/repositories';
import { ChurchNotice } from '@/domain/entities';

export class SupabaseChurchNoticeRepository implements IChurchNoticeRepository {
  async findByChurchId(churchId: string): Promise<ChurchNotice[]> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('church_notices')
      .select('*')
      .eq('church_id', churchId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw new Error('공지사항 조회 실패');
    return data || [];
  }

  // ... 나머지 메서드
}
```

#### Step 4: Use Case 생성
```typescript
// src/application/use-cases/church-notice/GetChurchNotices.ts
import { IChurchNoticeRepository } from '@/domain/repositories';
import { ChurchNotice } from '@/domain/entities';

export class GetChurchNotices {
  constructor(private repository: IChurchNoticeRepository) {}

  async execute(churchId: string): Promise<ChurchNotice[]> {
    return this.repository.findByChurchId(churchId);
  }
}
```

#### Step 5: React Query 훅 생성 ⭐
```typescript
// src/presentation/hooks/queries/useChurchNotice.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseChurchNoticeRepository } from '@/infrastructure/repositories';
import { GetChurchNotices, CreateChurchNotice } from '@/application/use-cases';

// Query Key Factory
const noticeKeys = {
  all: ['church-notices'] as const,
  byChurch: (churchId: string) => [...noticeKeys.all, churchId] as const,
};

// 조회 훅
export function useChurchNotices(churchId: string | undefined) {
  return useQuery({
    queryKey: noticeKeys.byChurch(churchId ?? ''),
    queryFn: async () => {
      const repository = new SupabaseChurchNoticeRepository();
      const useCase = new GetChurchNotices(repository);
      return useCase.execute(churchId!);
    },
    enabled: !!churchId,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });
}

// 생성 훅
export function useCreateChurchNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNoticeInput) => {
      const repository = new SupabaseChurchNoticeRepository();
      const useCase = new CreateChurchNotice(repository);
      return useCase.execute(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: noticeKeys.byChurch(variables.church_id)
      });
    },
  });
}
```

#### Step 6: 컴포넌트에서 사용
```typescript
// src/components/church/NoticeList.tsx
import { useChurchNotices, useCreateChurchNotice } from '@/presentation/hooks/queries/useChurchNotice';

export function NoticeList({ churchId }: Props) {
  const { data: notices, isLoading } = useChurchNotices(churchId);
  const createNotice = useCreateChurchNotice();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {notices?.map(notice => (
        <NoticeItem key={notice.id} notice={notice} />
      ))}
    </div>
  );
}
```

#### Step 7: index.ts 업데이트 (잊지 말기!)
```typescript
// src/domain/entities/index.ts
export * from './ChurchNotice';

// src/domain/repositories/index.ts
export * from './IChurchNoticeRepository';

// src/infrastructure/repositories/index.ts
export * from './SupabaseChurchNoticeRepository';

// src/presentation/hooks/queries/index.ts
export * from './useChurchNotice';
```

---

## 기존 훅 목록 (재사용 우선!)

> 📁 전체 훅: `src/presentation/hooks/queries/index.ts`

### 교회 관련
| 훅 | 파일 | 용도 |
|----|------|------|
| `useChurchById` | useChurch.ts | ID로 교회 조회 |
| `useChurchByCode` | useChurch.ts | 코드로 교회 조회 |
| `useSearchChurches` | useChurch.ts | 교회 검색 |
| `useJoinChurch` | useChurch.ts | 교회 가입 |
| `useChurchGroups` | useGroup.ts | 교회 소그룹 목록 |
| `useChurchNotices` | useChurchNotice.ts | 교회 공지사항 |
| `useChurchQTPosts` | useChurchQTPost.ts | 교회 QT 나눔 |
| `useTodayStats` | useChurchStats.ts | 오늘 통계 |
| `useChurchReadingProgress` | useChurchStats.ts | 읽기 진도 |

### 사용자 관련
| 훅 | 파일 | 용도 |
|----|------|------|
| `useCurrentUser` | useUser.ts | 현재 로그인 사용자 |
| `useUpdateProfile` | useUser.ts | 프로필 업데이트 |
| `useUploadAvatar` | useUser.ts | 아바타 업로드 |
| `useUserBadges` | useBadge.ts | 사용자 배지 목록 |
| `useUserPlans` | useUserPlans.ts | 사용자 통독 플랜 |
| `useDashboardStats` | useDashboardStats.ts | 대시보드 통계 |

### 소그룹 관련
| 훅 | 파일 | 용도 |
|----|------|------|
| `useGroupById` | useGroup.ts | 그룹 정보 |
| `useGroupMembers` | useGroup.ts | 그룹 멤버 |
| `useUserGroups` | useGroup.ts | 사용자 그룹 목록 |
| `useJoinGroup` / `useLeaveGroup` | useGroup.ts | 그룹 가입/탈퇴 |
| `useGroupNotices` | useGroupNotice.ts | 그룹 공지 |
| `useGroupMeetings` | useGroupMeeting.ts | 그룹 모임 |

### 피드/묵상 관련
| 훅 | 파일 | 용도 |
|----|------|------|
| `useUnifiedFeed` | useUnifiedFeed.ts | 통합 피드 조회 |
| `useUnifiedFeedInfinite` | useUnifiedFeed.ts | 통합 피드 무한스크롤 |
| `usePublicFeedInfinite` | usePublicFeed.ts | 공개 피드 무한스크롤 |
| `useUnifiedMeditations` | useUnifiedMeditation.ts | 통합 묵상 조회 |
| `useUserMeditations` | useUnifiedMeditation.ts | 사용자 묵상 목록 |
| `useCreateUnifiedMeditation` | useUnifiedMeditation.ts | 묵상 작성 |
| `useToggleUnifiedMeditationLike` | useUnifiedMeditation.ts | 묵상 좋아요 |

### 팔로우 관련
| 훅 | 파일 | 용도 |
|----|------|------|
| `useFollowers` | useUserFollow.ts | 팔로워 목록 |
| `useFollowing` | useUserFollow.ts | 팔로잉 목록 |
| `useIsFollowing` | useUserFollow.ts | 팔로우 여부 확인 |
| `useToggleFollow` | useUserFollow.ts | 팔로우 토글 |

### 격려/알림 관련
| 훅 | 파일 | 용도 |
|----|------|------|
| `useSendEncouragement` | useEncouragement.ts | 격려 전송 |
| `useReceivedEncouragements` | useEncouragement.ts | 받은 격려 목록 |
| `useNotifications` | useNotification.ts | 알림 목록 |
| `useUnreadNotificationCount` | useNotification.ts | 읽지 않은 알림 수 |

### QT/성경 읽기 관련
| 훅 | 파일 | 용도 |
|----|------|------|
| `useTodayQT` | useQT.ts | 오늘의 QT |
| `useDailyQT` | useQT.ts | 날짜별 QT |
| `useReadingChecks` | useReadingCheck.ts | 읽기 체크 목록 |
| `useToggleReadingCheck` | useReadingCheck.ts | 읽기 체크 토글 |
| `useReadingProgress` | useReadingCheck.ts | 읽기 진도율 |
| `useWeeklyReadingSchedule` | useReadingSchedule.ts | 주간 통독 일정 |

### 개인 프로젝트 관련
| 훅 | 파일 | 용도 |
|----|------|------|
| `useUserProjects` | usePersonalProject.ts | 사용자 프로젝트 목록 |
| `useCreateProject` | usePersonalProject.ts | 프로젝트 생성 |
| `useToggleProjectCheck` | usePersonalProject.ts | 프로젝트 체크 토글 |

### 관리자 관련
| 훅 | 파일 | 용도 |
|----|------|------|
| `useChurchAdminLogin` | useChurchAdmin.ts | 교회 관리자 로그인 |
| `useChurchAdmins` | useChurchAdmin.ts | 교회 관리자 목록 |
| `useSystemStats` | useSystemAdmin.ts | 시스템 통계 |
| `useAdminChurches` | useSystemAdmin.ts | 관리자용 교회 목록 |

---

## React Query 패턴

### Query Key Factory (필수)
```typescript
// 모든 훅 파일 상단에 Query Key Factory 정의
const churchKeys = {
  all: ['churches'] as const,
  detail: (id: string) => [...churchKeys.all, id] as const,
  byCode: (code: string) => [...churchKeys.all, 'code', code] as const,
  members: (id: string) => [...churchKeys.all, id, 'members'] as const,
};
```

### 조회 훅 기본 구조
```typescript
export function useXxx(id: string | undefined) {
  return useQuery({
    queryKey: xxxKeys.detail(id ?? ''),
    queryFn: async () => {
      // Use Case 호출
    },
    enabled: !!id,  // id 있을 때만 실행
    staleTime: 1000 * 60 * 5,  // 적절한 캐시 시간
  });
}
```

### Mutation 훅 기본 구조
```typescript
export function useCreateXxx() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInput) => {
      // Use Case 호출
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: xxxKeys.all });
    },
  });
}
```

---

## 파일 생성 시 체크리스트

새 파일 생성 후 반드시 확인:

- [ ] Entity → `src/domain/entities/index.ts`에 export 추가
- [ ] Repository Interface → `src/domain/repositories/index.ts`에 export 추가
- [ ] Repository 구현체 → `src/infrastructure/repositories/index.ts`에 export 추가
- [ ] Use Case → `src/application/use-cases/index.ts`에 export 추가
- [ ] Hook → `src/presentation/hooks/queries/index.ts`에 export 추가

---

## 에러 처리 패턴

### Repository에서
```typescript
const { data, error } = await supabase.from('table').select('*');
if (error) {
  console.error('조회 실패:', error);
  throw new Error('사용자에게 보여줄 메시지');
}
```

### 컴포넌트에서
```typescript
const { data, isLoading, error } = useXxx(id);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
```

---

## 빈 상태 처리

```typescript
// 재사용 컴포넌트 활용
import { EmptyState, NoCommentsEmpty } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

// 사용 예시
{data?.length === 0 && <NoCommentsEmpty onWrite={handleWrite} />}
```

---

## 마이그레이션 필요 파일 (참고)

아직 아키텍처를 따르지 않는 파일들:

```
✅ 완료:
- app/page.tsx (2026-01-25 마이그레이션 완료)
- app/(main)/bible-reader/page.tsx (2026-01-25 마이그레이션 완료)

⚠️ 대규모 리팩토링 필요:
- components/mypage/UnifiedMyPage.tsx (1221줄, 27곳 Supabase 직접 호출)

⏳ 점진적 개선 필요:
- app/(main)/search/page.tsx
- app/admin/**/*.tsx (9개 파일)
  - admins/page.tsx
  - churches/page.tsx
  - database/page.tsx
  - groups/page.tsx
  - layout.tsx
  - moderation/page.tsx
  - page.tsx
  - reset-password/page.tsx
  - users/page.tsx
```

---

## 구현된 아키텍처 현황 (2026-01-26)

### Entity (23개)
`src/domain/entities/` - Church, ChurchAdmin, ChurchNotice, ChurchQTPost, Comment, CommentReply, Group, GroupNotice, GuestComment, Notification, PersonalProject, Prayer, PublicMeditation, PublicMeditationComment, QT, ReadingCheck, SystemAdmin, UnifiedMeditation, UnifiedReadingCheck, User, UserDailyReading, UserFollow

### Repository Interface (23개)
`src/domain/repositories/` - 모든 Entity에 대응하는 Interface 구현 완료

### Repository 구현체 (23개)
`src/infrastructure/repositories/` - 모든 Interface에 대응하는 Supabase 구현체 완료

### Use Cases (90개+)
`src/application/use-cases/` - church, church-admin, church-notice, church-qt-post, comment, comment-reply, draft, group, group-notice, guest-comment, main-page, notification, personal-project, prayer, public-feed, public-meditation, qt, reading-check, system-admin, unified-feed, unified-meditation, unified-reading-check, user, user-daily-reading, user-follow

### React Query Hooks (35개 파일)
`src/presentation/hooks/queries/` - 모든 주요 기능에 대한 훅 구현 완료

---

*최종 업데이트: 2026-01-26*
