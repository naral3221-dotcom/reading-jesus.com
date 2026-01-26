# Reading Jesus - Clean Architecture 문서

## 개요

이 프로젝트는 **Clean Architecture** 원칙에 따라 4개 계층으로 분리되어 있습니다.

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│                  (React Components, Hooks)               │
├─────────────────────────────────────────────────────────┤
│                   Application Layer                      │
│                     (Use Cases)                          │
├─────────────────────────────────────────────────────────┤
│                    Domain Layer                          │
│                 (Entities, Interfaces)                   │
├─────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                     │
│              (Supabase, Storage, APIs)                   │
└─────────────────────────────────────────────────────────┘
```

## 의존성 규칙

```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓           ↑           ↑
   (UI)       (Use Cases)  (Entities)  (Supabase)
```

- **Domain**: 외부 의존성 없음 (순수 TypeScript)
- **Application**: Domain만 의존
- **Infrastructure**: Domain 인터페이스 구현
- **Presentation**: Application Use Cases 호출

---

## 폴더 구조

```
src/
├── domain/                    # 순수 비즈니스 로직
│   ├── entities/              # 엔티티 정의
│   │   ├── User.ts            # 사용자 엔티티
│   │   ├── Church.ts          # 교회 엔티티
│   │   └── QT.ts              # QT 엔티티
│   ├── repositories/          # Repository 인터페이스
│   │   ├── IUserRepository.ts
│   │   ├── IChurchRepository.ts
│   │   └── IQTRepository.ts
│   └── index.ts               # 통합 export
│
├── application/               # Use Cases
│   ├── use-cases/
│   │   ├── qt/
│   │   │   ├── GetDailyQT.ts
│   │   │   └── GetMonthlyQT.ts
│   │   ├── church/
│   │   │   ├── GetChurch.ts
│   │   │   ├── SearchChurches.ts
│   │   │   └── JoinChurch.ts
│   │   ├── user/
│   │   │   ├── GetCurrentUser.ts
│   │   │   └── UpdateProfile.ts
│   │   └── index.ts
│   └── index.ts
│
├── infrastructure/            # 외부 의존성 구현
│   ├── repositories/          # Supabase 구현체
│   │   ├── SupabaseUserRepository.ts
│   │   ├── SupabaseChurchRepository.ts
│   │   └── SupabaseQTRepository.ts
│   ├── supabase/
│   │   ├── client.ts          # 브라우저 클라이언트
│   │   └── server.ts          # 서버 클라이언트
│   └── index.ts
│
├── presentation/              # UI 계층
│   ├── providers/
│   │   └── QueryProvider.tsx  # React Query Provider
│   ├── hooks/
│   │   ├── queries/           # React Query 훅
│   │   │   ├── useQT.ts
│   │   │   ├── useChurch.ts
│   │   │   ├── useUser.ts
│   │   │   └── index.ts
│   │   └── stores/            # Zustand 스토어
│   │       ├── useUIStore.ts
│   │       ├── useUserSettingsStore.ts
│   │       └── index.ts
│   └── index.ts
│
├── components/                # 기존 컴포넌트 (점진적 마이그레이션)
├── app/                       # Next.js App Router
└── lib/                       # 기존 유틸리티
```

---

## Domain Layer

### Entities

불변(immutable) 객체로 설계되었습니다. 모든 상태 변경은 새 인스턴스를 반환합니다.

```typescript
// 사용 예시
const user = new User({ id: '1', nickname: '테스터' })
const updatedUser = user.updateNickname('새이름')  // 새 인스턴스 반환
```

### Repository Interfaces

데이터 접근을 추상화합니다.

```typescript
interface IQTRepository {
  findByDate(date: Date): Promise<QT | null>
  findByDayNumber(dayNumber: number): Promise<QT | null>
  findToday(): Promise<QT | null>
  findByMonth(year: number, month: number): Promise<QT[]>
}
```

---

## Application Layer

### Use Cases

비즈니스 로직을 캡슐화합니다.

```typescript
// 사용 예시
const getQT = new GetDailyQT(qtRepository)
const qt = await getQT.executeByDate(new Date())
```

---

## Infrastructure Layer

### Supabase Repositories

Domain 인터페이스를 구현합니다.

```typescript
class SupabaseQTRepository implements IQTRepository {
  async findByDate(date: Date): Promise<QT | null> {
    // Supabase 호출 로직
  }
}
```

---

## Presentation Layer

### React Query 훅

서버 상태를 관리합니다.

```typescript
// 사용 예시
const { data: qt, isLoading, error } = useTodayQT()
```

### Zustand 스토어

클라이언트 상태를 관리합니다.

```typescript
// 사용 예시
const { theme, setTheme } = useUIStore()
const { bibleVersion } = useUserSettingsStore()
```

---

## 사용법

### Import 방식

```typescript
// 계층별 import
import { useTodayQT, useUIStore } from '@/presentation'
import { GetDailyQT } from '@/application'
import { User, Church, QT } from '@/domain'
import { SupabaseQTRepository } from '@/infrastructure'

// 개별 import
import { useTodayQT } from '@/presentation/hooks/queries/useQT'
import { useUIStore } from '@/presentation/hooks/stores/useUIStore'
```

### 컴포넌트에서 사용

```typescript
'use client'

import { useTodayQT, useUIStore, useUserSettingsStore } from '@/presentation'

export function QTViewer() {
  // React Query - 서버 상태
  const { data: qt, isLoading, error } = useTodayQT()

  // Zustand - 클라이언트 상태
  const { fontSize } = useUIStore()
  const { showMeditationGuide } = useUserSettingsStore()

  if (isLoading) return <Loading />
  if (error) return <Error />
  if (!qt) return <Empty />

  return (
    <div className={`text-${fontSize}`}>
      <h1>{qt.title}</h1>
      {/* ... */}
    </div>
  )
}
```

---

## 테스트

### 테스트 실행

```bash
# 전체 테스트
npm run test

# 단일 실행
npm run test:run

# 커버리지
npm run test:coverage
```

### 테스트 구조

```
test/
├── setup.ts                   # 테스트 설정
├── example.test.tsx           # 예제 테스트
└── unit/
    └── domain/
        └── entities/
            ├── User.test.ts   # 11개 테스트
            ├── Church.test.ts # 15개 테스트
            └── QT.test.ts     # 15개 테스트
```

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui |
| 서버 상태 | React Query (@tanstack/react-query) |
| 클라이언트 상태 | Zustand |
| Backend | Supabase (Auth, Database, Storage, RLS) |
| 테스트 | Vitest, Testing Library |

---

## 새 기능 추가 가이드

새로운 기능을 추가할 때 반드시 아래 순서와 패턴을 따라주세요.

### Step 1: Domain Entity 생성

`src/domain/entities/` 폴더에 엔티티 클래스를 생성합니다.

```typescript
// src/domain/entities/MyFeature.ts

export interface MyFeatureProps {
  id: string
  name: string
  createdAt: Date
  // ... 필요한 속성들
}

export interface MyFeatureDTO {
  id: string
  name: string
  created_at: string  // snake_case for UI compatibility
}

export class MyFeature {
  readonly id: string
  readonly name: string
  readonly createdAt: Date

  private constructor(props: MyFeatureProps) {
    this.id = props.id
    this.name = props.name
    this.createdAt = props.createdAt
  }

  // Factory method (DB 데이터로부터 생성)
  static fromDatabase(row: Record<string, unknown>): MyFeature {
    return new MyFeature({
      id: row.id as string,
      name: row.name as string,
      createdAt: new Date(row.created_at as string),
    })
  }

  // DTO 변환 (UI 호환용)
  toDTO(): MyFeatureDTO {
    return {
      id: this.id,
      name: this.name,
      created_at: this.createdAt.toISOString(),
    }
  }

  // 비즈니스 로직 메서드 예시
  isActive(): boolean {
    return this.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
}
```

**중요: `src/domain/entities/index.ts`에 export 추가**

```typescript
export { MyFeature } from './MyFeature'
export type { MyFeatureProps, MyFeatureDTO } from './MyFeature'
```

### Step 2: Repository Interface 생성

`src/domain/repositories/` 폴더에 인터페이스를 정의합니다.

```typescript
// src/domain/repositories/IMyFeatureRepository.ts

import type { MyFeature } from '../entities/MyFeature'

export interface IMyFeatureRepository {
  findById(id: string): Promise<MyFeature | null>
  findByUserId(userId: string): Promise<MyFeature[]>
  create(data: Omit<MyFeature, 'id' | 'createdAt'>): Promise<MyFeature>
  update(id: string, data: Partial<MyFeature>): Promise<MyFeature | null>
  delete(id: string): Promise<boolean>
}
```

**중요: `src/domain/repositories/index.ts`에 export 추가**

```typescript
export type { IMyFeatureRepository } from './IMyFeatureRepository'
```

### Step 3: Repository 구현체 생성

`src/infrastructure/repositories/` 폴더에 Supabase 구현체를 작성합니다.

```typescript
// src/infrastructure/repositories/SupabaseMyFeatureRepository.ts

import { getSupabaseBrowserClient } from '../supabase/client'
import type { IMyFeatureRepository } from '@/domain/repositories/IMyFeatureRepository'
import { MyFeature } from '@/domain/entities/MyFeature'

export class SupabaseMyFeatureRepository implements IMyFeatureRepository {
  // 중요: supabase 클라이언트를 메서드 내에서 동적으로 가져옴
  private get supabase() {
    return getSupabaseBrowserClient()
  }

  async findById(id: string): Promise<MyFeature | null> {
    const { data, error } = await this.supabase
      .from('my_features')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null
    return MyFeature.fromDatabase(data)
  }

  async findByUserId(userId: string): Promise<MyFeature[]> {
    const { data, error } = await this.supabase
      .from('my_features')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data.map((row) => MyFeature.fromDatabase(row))
  }

  // ... 나머지 메서드 구현
}
```

**중요: `src/infrastructure/repositories/index.ts`에 export 추가**

```typescript
export { SupabaseMyFeatureRepository } from './SupabaseMyFeatureRepository'
```

### Step 4: Use Case 생성

`src/application/use-cases/` 폴더에 Use Case를 작성합니다.

```typescript
// src/application/use-cases/my-feature/GetMyFeatures.ts

import type { IMyFeatureRepository } from '@/domain/repositories/IMyFeatureRepository'
import type { MyFeature } from '@/domain/entities/MyFeature'

export interface GetMyFeaturesInput {
  userId: string
}

export interface GetMyFeaturesOutput {
  features: MyFeature[]
  error: string | null
}

export class GetMyFeatures {
  constructor(private readonly repository: IMyFeatureRepository) {}

  async execute(input: GetMyFeaturesInput): Promise<GetMyFeaturesOutput> {
    try {
      const features = await this.repository.findByUserId(input.userId)
      return { features, error: null }
    } catch (error) {
      console.error('Failed to get features:', error)
      return {
        features: [],
        error: error instanceof Error ? error.message : '조회 실패',
      }
    }
  }
}
```

```typescript
// src/application/use-cases/my-feature/index.ts

export { GetMyFeatures } from './GetMyFeatures'
export type { GetMyFeaturesInput, GetMyFeaturesOutput } from './GetMyFeatures'
```

**중요: `src/application/use-cases/index.ts`에 export 추가**

```typescript
export * from './my-feature'
```

### Step 5: React Query 훅 생성

`src/presentation/hooks/queries/` 폴더에 훅을 작성합니다.

```typescript
// src/presentation/hooks/queries/useMyFeature.ts

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GetMyFeatures } from '@/application/use-cases/my-feature'
import { SupabaseMyFeatureRepository } from '@/infrastructure/repositories/SupabaseMyFeatureRepository'

// Query Key Factory (캐시 관리용)
export const myFeatureKeys = {
  all: ['myFeatures'] as const,
  byUser: (userId: string) => [...myFeatureKeys.all, 'user', userId] as const,
  detail: (id: string) => [...myFeatureKeys.all, 'detail', id] as const,
}

// Repository 및 Use Case 인스턴스
const repository = new SupabaseMyFeatureRepository()
const getMyFeatures = new GetMyFeatures(repository)

/**
 * 사용자 기능 목록 조회 훅
 */
export function useMyFeatures(userId: string | null) {
  return useQuery({
    queryKey: myFeatureKeys.byUser(userId ?? ''),
    queryFn: async () => {
      if (!userId) return []

      const result = await getMyFeatures.execute({ userId })
      if (result.error) throw new Error(result.error)

      return result.features.map((f) => f.toDTO())
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
  })
}

/**
 * 기능 생성 뮤테이션 훅
 */
export function useCreateMyFeature() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { userId: string; name: string }) => {
      const feature = await repository.create(data)
      return feature?.toDTO()
    },
    onSuccess: (_, variables) => {
      // 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: myFeatureKeys.byUser(variables.userId),
      })
    },
  })
}
```

### Step 6: 컴포넌트에서 사용

```typescript
// src/app/(main)/my-feature/page.tsx

'use client'

import { useMyFeatures, useCreateMyFeature } from '@/presentation/hooks/queries/useMyFeature'
import { useCurrentUser } from '@/presentation/hooks/queries/useUser'

export default function MyFeaturePage() {
  const { data: userData } = useCurrentUser()
  const userId = userData?.user?.id ?? null

  const { data: features, isLoading, error } = useMyFeatures(userId)
  const createFeature = useCreateMyFeature()

  if (isLoading) return <div>로딩 중...</div>
  if (error) return <div>에러: {error.message}</div>

  return (
    <div>
      {features?.map((feature) => (
        <div key={feature.id}>{feature.name}</div>
      ))}
      <button
        onClick={() => createFeature.mutate({ userId: userId!, name: '새 기능' })}
        disabled={createFeature.isPending}
      >
        추가
      </button>
    </div>
  )
}
```

---

## 체크리스트

새 기능 추가 시 다음 사항을 확인하세요:

### 필수 파일

- [ ] `src/domain/entities/[Name].ts` - 엔티티 클래스
- [ ] `src/domain/repositories/I[Name]Repository.ts` - 인터페이스
- [ ] `src/infrastructure/repositories/Supabase[Name]Repository.ts` - 구현체
- [ ] `src/application/use-cases/[name]/[UseCase].ts` - Use Case
- [ ] `src/application/use-cases/[name]/index.ts` - Use Case export
- [ ] `src/presentation/hooks/queries/use[Name].ts` - React Query 훅

### index.ts 업데이트

- [ ] `src/domain/entities/index.ts`
- [ ] `src/domain/repositories/index.ts`
- [ ] `src/infrastructure/repositories/index.ts`
- [ ] `src/application/use-cases/index.ts`

### 코드 품질

- [ ] 엔티티에 `fromDatabase()` factory method 있음
- [ ] 엔티티에 `toDTO()` 변환 메서드 있음
- [ ] Repository에서 `getSupabaseBrowserClient()` 동적 호출
- [ ] Use Case에서 try-catch로 에러 처리
- [ ] Query Key Factory 패턴 사용
- [ ] `staleTime`, `gcTime` 적절히 설정

---

## 자주 하는 실수

### 1. Supabase 클라이언트 정적 할당

```typescript
// ❌ 잘못된 방법 - 모듈 로드 시 클라이언트 생성
const supabase = getSupabaseBrowserClient()

export class MyRepository {
  async find() {
    return supabase.from('table').select('*')  // 인증 문제 발생 가능
  }
}

// ✅ 올바른 방법 - 메서드 호출 시 동적 생성
export class MyRepository {
  private get supabase() {
    return getSupabaseBrowserClient()
  }

  async find() {
    return this.supabase.from('table').select('*')
  }
}
```

### 2. 컴포넌트에서 직접 Supabase 호출

```typescript
// ❌ 잘못된 방법
import { supabase } from '@/lib/supabase'

function MyComponent() {
  const [data, setData] = useState()
  useEffect(() => {
    supabase.from('table').select('*').then(res => setData(res.data))
  }, [])
}

// ✅ 올바른 방법
import { useMyFeatures } from '@/presentation/hooks/queries/useMyFeature'

function MyComponent() {
  const { data, isLoading, error } = useMyFeatures(userId)
}
```

### 3. index.ts export 누락

모든 새 파일은 해당 폴더의 `index.ts`에 export를 추가해야 합니다.
누락 시 다른 모듈에서 import할 수 없습니다.

---

## 기존 도메인 참고

| 도메인 | 엔티티 | Repository | Use Cases | React Query 훅 |
|--------|--------|------------|-----------|----------------|
| User | `User.ts` | `IUserRepository.ts` | `GetCurrentUser` | `useUser.ts` |
| Church | `Church.ts` | `IChurchRepository.ts` | `GetChurch`, `JoinChurch` | `useChurch.ts` |
| Group | `Group.ts` | `IGroupRepository.ts` | `GetGroup`, `JoinGroup` | `useGroup.ts` |
| QT | `QT.ts` | `IQTRepository.ts` | `GetDailyQT` | `useQT.ts` |
| Comment | `Comment.ts` | `ICommentRepository.ts` | `GetComments`, `CreateComment` | `useComment.ts` |
| UserDailyReading | `UserDailyReading.ts` | `IUserDailyReadingRepository.ts` | `GetUserDailyReadings` | `useUserDailyReadings.ts` |
| MainPageData | - | - | `GetMainPageData` | `useMainPageData.ts` |

---

*마지막 업데이트: 2026-01-03*
