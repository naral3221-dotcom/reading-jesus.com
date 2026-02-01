# 리딩지저스 백엔드 아키텍처

> **최종 업데이트**: 2026-02-01
> **버전**: 2.0.0 (대규모 리팩토링 완료)

---

## 목차

1. [개요](#개요)
2. [테이블 구조](#테이블-구조)
3. [데이터 흐름](#데이터-흐름)
4. [동기화 시스템](#동기화-시스템)
5. [RLS 정책](#rls-정책)
6. [유지보수 도구](#유지보수-도구)

---

## 개요

### 핵심 개념

리딩지저스는 **레거시 테이블**과 **통합(Unified) 테이블** 두 가지 레이어로 구성됩니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                        통합 테이블 (Unified)                      │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │ unified_meditations │  │ unified_reading_checks          │   │
│  │ (모든 묵상글 통합)    │  │ (모든 읽음 체크 통합)            │   │
│  └─────────────────────┘  └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                    자동 동기화 (트리거)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      레거시 테이블 (Legacy)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │church_qt_posts│ │guest_comments│  │ comments              │ │
│  │ (교회 QT글)    │ │ (게스트묵상글) │  │ (그룹 묵상글)          │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 용어 정의

| 테이블명 | 실제 의미 | 설명 |
|----------|----------|------|
| `church_qt_posts` | **교회 QT 나눔글** | 로그인 사용자가 작성한 구조화된 QT (질문/답변 형식) |
| `guest_comments` | **게스트 묵상글** ⚠️ | 비로그인(게스트) 사용자가 작성한 자유 묵상글 |
| `comments` | **그룹 묵상글** | 그룹 내에서 작성한 자유 묵상글 |
| `public_meditations` | **공개 묵상글** | 홈 피드에 공개된 묵상글 |

> ⚠️ **주의**: `guest_comments`는 "댓글"이 아닙니다! **게스트가 작성한 묵상글**입니다.

---

## 테이블 구조

### 1. 사용자 및 조직

#### profiles (사용자 프로필)
```sql
profiles
├── id: UUID (PK, auth.users 참조)
├── nickname: TEXT
├── avatar_url: TEXT
├── church_id: UUID (FK → churches)
├── church_code: TEXT
├── active_group_id: UUID
├── onboarding_completed: BOOLEAN
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

#### churches (교회)
```sql
churches
├── id: UUID (PK)
├── name: TEXT
├── code: TEXT (UNIQUE, 가입 코드)
├── description: TEXT
├── logo_url: TEXT
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

#### church_members (교회 멤버)
```sql
church_members
├── id: UUID (PK)
├── church_id: UUID (FK → churches)
├── user_id: UUID (FK → profiles)
├── role: TEXT ('member' | 'admin')
├── joined_at: TIMESTAMPTZ
└── UNIQUE(church_id, user_id)
```

#### church_admins (교회 관리자)
```sql
church_admins
├── id: UUID (PK)
├── church_id: UUID (FK → churches)
├── user_id: UUID (FK → profiles)
├── created_at: TIMESTAMPTZ
└── UNIQUE(church_id, user_id)
```

#### groups (그룹)
```sql
groups
├── id: UUID (PK)
├── church_id: UUID (FK → churches, nullable)
├── name: TEXT
├── description: TEXT
├── is_public: BOOLEAN
├── invite_code: TEXT (UNIQUE)
├── reading_plan_id: UUID
├── created_by: UUID (FK → profiles)
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

#### group_members (그룹 멤버)
```sql
group_members
├── id: UUID (PK)
├── group_id: UUID (FK → groups)
├── user_id: UUID (FK → profiles)
├── role: TEXT ('member' | 'admin')
├── joined_at: TIMESTAMPTZ
└── UNIQUE(group_id, user_id)
```

---

### 2. 묵상글 (레거시)

#### church_qt_posts (교회 QT 나눔글) 🔵
```sql
church_qt_posts
├── id: UUID (PK)
├── church_id: UUID (FK → churches)
├── user_id: UUID (FK → profiles, nullable)
├── author_name: TEXT
├── day_number: INTEGER (1~365)
├── qt_date: DATE
├── my_sentence: TEXT (내 말로 한 문장)
├── meditation_answer: TEXT (묵상 답변)
├── gratitude: TEXT (감사)
├── my_prayer: TEXT (기도)
├── day_review: TEXT (하루 점검)
├── is_anonymous: BOOLEAN
├── visibility: content_visibility ('private'|'church'|'public')
├── is_pinned: BOOLEAN
├── likes_count: INTEGER
├── replies_count: INTEGER
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

🔄 트리거: sync_qt_to_unified → unified_meditations 자동 동기화
```

#### guest_comments (게스트 묵상글) 🟢
```sql
guest_comments
├── id: UUID (PK)
├── church_id: UUID (FK → churches)
├── linked_user_id: UUID (나중에 연결된 user_id)
├── device_id: TEXT (게스트 식별자)
├── guest_name: TEXT (작성자 표시명)
├── day_number: INTEGER
├── qt_date: DATE
├── content: TEXT (자유 묵상 내용)
├── my_sentence: TEXT
├── meditation_answer: TEXT
├── bible_range: TEXT
├── is_anonymous: BOOLEAN
├── visibility: content_visibility
├── likes_count: INTEGER
├── replies_count: INTEGER
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

🔄 트리거: sync_guest_comment_to_unified → unified_meditations 자동 동기화

⚠️ 이름은 "comments"지만 실제로는 묵상글입니다!
```

#### comments (그룹 묵상글) 🟡
```sql
comments
├── id: UUID (PK)
├── group_id: UUID (FK → groups)
├── user_id: UUID (FK → profiles)
├── day_number: INTEGER
├── content: TEXT
├── is_anonymous: BOOLEAN
├── visibility: content_visibility
├── is_pinned: BOOLEAN
├── likes_count: INTEGER
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

#### public_meditations (공개 묵상글) 🟣
```sql
public_meditations
├── id: UUID (PK)
├── user_id: UUID (FK → profiles)
├── bible_reference: TEXT
├── content: TEXT
├── visibility: content_visibility
├── likes_count: INTEGER
├── replies_count: INTEGER
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

---

### 3. 통합 테이블 (Unified)

#### unified_meditations (통합 묵상글)
```sql
unified_meditations
├── id: UUID (PK)
├── user_id: UUID (FK → profiles, nullable)
├── guest_token: TEXT (게스트 식별용)
├── author_name: TEXT
│
├── source_type: TEXT ('group' | 'church')
├── source_id: UUID (group_id 또는 church_id)
├── content_type: TEXT ('free' | 'qt')
│
├── day_number: INTEGER
├── qt_date: DATE
├── content: TEXT (자유 묵상)
├── bible_range: TEXT
│
├── my_sentence: TEXT (QT용)
├── meditation_answer: TEXT
├── gratitude: TEXT
├── my_prayer: TEXT
├── day_review: TEXT
│
├── visibility: content_visibility
├── is_anonymous: BOOLEAN
├── is_pinned: BOOLEAN
├── likes_count: INTEGER
├── replies_count: INTEGER
│
├── legacy_table: TEXT ('church_qt_posts'|'guest_comments'|'comments')
├── legacy_id: UUID (원본 테이블의 ID)
│
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ
```

**source_type 값 설명**:
- `'church'`: 교회 소속 묵상글 (church_qt_posts, guest_comments)
- `'group'`: 그룹 소속 묵상글 (comments)

**content_type 값 설명**:
- `'qt'`: 구조화된 QT (질문/답변 형식)
- `'free'`: 자유 묵상글

#### unified_reading_checks (통합 읽음 체크)
```sql
unified_reading_checks
├── id: UUID (PK)
├── user_id: UUID (FK → profiles)
├── source_type: TEXT ('group' | 'church')
├── source_id: UUID
├── day_number: INTEGER
├── checked_at: TIMESTAMPTZ
├── created_at: TIMESTAMPTZ
├── legacy_table: TEXT ('daily_checks'|'church_reading_checks')
├── legacy_id: UUID
└── UNIQUE(user_id, source_type, source_id, day_number)
```

---

### 4. 좋아요 & 답글

#### 레거시 좋아요
```sql
church_qt_post_likes
├── id: UUID (PK)
├── post_id: UUID (FK → church_qt_posts)
├── user_id: UUID (FK → profiles)
└── created_at: TIMESTAMPTZ

guest_comment_likes
├── id: UUID (PK)
├── comment_id: UUID (FK → guest_comments)
├── user_id: UUID
├── guest_id: TEXT (게스트 좋아요)
└── created_at: TIMESTAMPTZ

comment_likes
├── id: UUID (PK)
├── comment_id: UUID (FK → comments)
├── user_id: UUID (FK → profiles)
└── created_at: TIMESTAMPTZ
```

#### 레거시 답글
```sql
church_qt_post_replies
├── id: UUID (PK)
├── post_id: UUID (FK → church_qt_posts)
├── user_id: UUID
├── device_id: TEXT
├── guest_name: TEXT
├── content: TEXT
├── is_anonymous: BOOLEAN
└── created_at: TIMESTAMPTZ

guest_comment_replies
├── id: UUID (PK)
├── comment_id: UUID (FK → guest_comments)
├── user_id: UUID
├── device_id: TEXT
├── guest_name: TEXT
├── content: TEXT
├── is_anonymous: BOOLEAN
└── created_at: TIMESTAMPTZ

comment_replies
├── id: UUID (PK)
├── comment_id: UUID (FK → comments)
├── user_id: UUID (FK → profiles)
├── content: TEXT
├── is_anonymous: BOOLEAN
└── created_at: TIMESTAMPTZ
```

#### 통합 좋아요 & 답글
```sql
unified_meditation_likes
├── id: UUID (PK)
├── meditation_id: UUID (FK → unified_meditations)
├── user_id: UUID
├── guest_token: TEXT
└── created_at: TIMESTAMPTZ

unified_meditation_replies
├── id: UUID (PK)
├── meditation_id: UUID (FK → unified_meditations)
├── user_id: UUID
├── guest_token: TEXT
├── author_name: TEXT
├── content: TEXT
├── is_anonymous: BOOLEAN
├── legacy_table: TEXT
├── legacy_id: UUID
└── created_at: TIMESTAMPTZ
```

---

### 5. 읽음 체크 (레거시)

```sql
daily_checks (그룹 읽음 체크)
├── id: UUID (PK)
├── group_id: UUID (FK → groups)
├── user_id: UUID (FK → profiles)
├── day_number: INTEGER
├── is_read: BOOLEAN
├── checked_at: TIMESTAMPTZ
└── UNIQUE(group_id, user_id, day_number)

church_reading_checks (교회 읽음 체크)
├── id: UUID (PK)
├── church_id: UUID (FK → churches)
├── user_id: UUID (FK → profiles)
├── day_number: INTEGER
├── checked_at: TIMESTAMPTZ
├── created_at: TIMESTAMPTZ
└── UNIQUE(church_id, user_id, day_number)
```

---

### 6. 소셜 기능

```sql
user_follows (팔로우)
├── id: UUID (PK)
├── follower_id: UUID (FK → profiles)
├── following_id: UUID (FK → profiles)
├── created_at: TIMESTAMPTZ
└── UNIQUE(follower_id, following_id)

user_bookmarks (북마크)
├── id: UUID (PK)
├── user_id: UUID (FK → profiles)
├── meditation_id: UUID
├── meditation_source: TEXT ('unified' | 'public')
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, meditation_id, meditation_source)

notifications (알림)
├── id: UUID (PK)
├── user_id: UUID (FK → profiles)
├── type: TEXT
├── title: TEXT
├── message: TEXT
├── data: JSONB
├── is_read: BOOLEAN
├── created_at: TIMESTAMPTZ
└── read_at: TIMESTAMPTZ
```

---

## 데이터 흐름

### 묵상글 작성 흐름

```
사용자가 묵상글 작성
         │
         ▼
┌────────────────────────────────────────────────────┐
│ 어디서 작성?                                        │
│                                                    │
│  교회 QT 페이지      교회 피드(게스트)    그룹 페이지  │
│       │                   │                │       │
│       ▼                   ▼                ▼       │
│  church_qt_posts    guest_comments     comments    │
│       │                   │                │       │
│       ▼                   ▼                ▼       │
│  ┌─────────────────────────────────────────────┐   │
│  │        unified_meditations                  │   │
│  │   (트리거로 자동 동기화)                      │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

### 피드 조회 흐름

```
┌─────────────────────────────────────────────────┐
│                    피드 조회                      │
│                                                 │
│  교회 피드          홈 피드          프로필 피드   │
│     │                 │                 │       │
│     ▼                 ▼                 ▼       │
│  레거시 테이블      레거시 테이블     unified     │
│  (church_qt_posts  (church_qt_posts  _meditations│
│   guest_comments)   guest_comments               │
│                     comments)                    │
└─────────────────────────────────────────────────┘
```

> **참고**: 교회 피드와 홈 피드는 레거시 테이블을 직접 조회합니다.
> 프로필의 "내가 쓴 글"은 unified_meditations를 조회합니다.

---

## 동기화 시스템

### 활성 트리거

| 트리거 | 원본 테이블 | 대상 테이블 | 동작 |
|--------|------------|------------|------|
| `sync_qt_to_unified` | church_qt_posts | unified_meditations | INSERT/UPDATE/DELETE |
| `sync_guest_comment_to_unified` | guest_comments | unified_meditations | INSERT/UPDATE/DELETE |
| `sync_comment_to_unified` | comments | unified_meditations | INSERT/UPDATE/DELETE |

### 미동기화 테이블

| 원본 테이블 | 동기화 상태 | 비고 |
|------------|-----------|------|
| public_meditations | ❌ 별도 | 통합 테이블과 별개 |

### 동기화 필드 매핑

#### church_qt_posts → unified_meditations
```
user_id         → user_id
church_id       → source_id
'church'        → source_type
'qt'            → content_type
author_name     → author_name
day_number      → day_number
qt_date         → qt_date
my_sentence     → my_sentence
meditation_answer → meditation_answer
gratitude       → gratitude
my_prayer       → my_prayer
day_review      → day_review
visibility      → visibility
is_anonymous    → is_anonymous
is_pinned       → is_pinned
likes_count     → likes_count
replies_count   → replies_count
id              → legacy_id
'church_qt_posts' → legacy_table
```

#### guest_comments → unified_meditations
```
linked_user_id  → user_id
device_id       → guest_token
church_id       → source_id
'church'        → source_type
'free'          → content_type
guest_name      → author_name
day_number      → day_number
content         → content
bible_range     → bible_range
visibility      → visibility
is_anonymous    → is_anonymous
likes_count     → likes_count
replies_count   → replies_count
id              → legacy_id
'guest_comments' → legacy_table
```

---

## RLS 정책

### visibility 기반 접근 제어

```sql
-- content_visibility ENUM
'private'  -- 본인만
'group'    -- 그룹 멤버만
'church'   -- 교회 멤버만
'public'   -- 전체 공개
```

### 주요 RLS 정책

#### unified_meditations
- **SELECT**: visibility에 따라 접근 제어
  - `public`: 모든 사용자
  - `church`: 같은 교회 멤버
  - `group`: 같은 그룹 멤버
  - `private`: 작성자만
- **INSERT**: 인증된 사용자 또는 guest_token 있는 게스트
- **UPDATE**: 본인만
- **DELETE**: 본인 또는 관리자

#### church_qt_posts / guest_comments
- 교회 멤버만 조회 가능 (visibility 조건 추가)
- 본인 글만 수정/삭제 가능

---

## 유지보수 도구

### 점검 스크립트

```bash
# 백엔드 전체 정합성 점검
npx tsx scripts/backend-health-check.ts

# 점검 항목:
# - 테이블별 레코드 수
# - 레거시 → unified 동기화 상태
# - 읽음 체크 동기화 상태
# - 좋아요/답글 동기화 상태
# - 고아 데이터 확인
# - visibility 일관성
# - likes_count/replies_count 정합성
```

### 마이그레이션 스크립트

```bash
# 묵상글 누락 데이터 마이그레이션
npx tsx scripts/migrate-missing-data.ts

# 게스트 묵상글만 마이그레이션
npx tsx scripts/migrate-guest-comments.ts

# 읽음 체크 누락 데이터 마이그레이션
npx tsx scripts/migrate-reading-checks.ts

# 데이터 분석
npx tsx scripts/final-analysis.ts
```

---

## 현재 데이터 현황 (2026-01-31)

| 테이블 | 레코드 수 | 설명 |
|--------|----------|------|
| profiles | 68 | 등록 사용자 |
| churches | 1 | 교회 |
| groups | 6 | 그룹 |
| church_qt_posts | 330 | 교회 QT 나눔글 |
| guest_comments | 114 | 게스트 묵상글 |
| comments | 5 | 그룹 묵상글 |
| unified_meditations | 449 | 통합 묵상글 |
| church_qt_post_likes | 626 | QT 좋아요 |
| guest_comment_likes | 368 | 게스트묵상 좋아요 |
| unified_reading_checks | 184 | 통합 읽음 체크 |
| user_follows | 15 | 팔로우 관계 |

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-31 | 초안 작성 |
| 2026-01-31 | guest_comments 동기화 트리거 추가 |
| 2026-01-31 | 누락 데이터 마이그레이션 (97개 묵상 + 51개 읽음체크) |
| 2026-01-31 | comments (그룹 묵상글) 동기화 트리거 추가 - 3개 테이블 완전 자동 동기화 완료 |
| 2026-02-01 | **대규모 리팩토링 Phase 1-2**: unified_meditations 스키마 확장 (source_type='public' 추가, source_id NULL 허용), public_meditations 동기화 트리거 추가 |
| 2026-02-01 | **대규모 리팩토링 Phase 3**: 코드 명명 변경 (Comment → Meditation) - 63개 파일 수정 |
| 2026-02-01 | **대규모 리팩토링 Phase 4**: GetUnifiedFeed 통합 전환 (4개 테이블 → 1개 테이블 쿼리) |
| 2026-02-01 | **검증 완료**: 1차(데이터 무결성 100%), 2차(기능 테스트 8/8 통과), 3차(성능 평균 39.5ms) |
| 2026-02-01 | **버그 수정**: SupabaseUnifiedMeditationRepository의 update/delete가 레거시 테이블 경유하도록 수정 (Dual-Write 패턴 준수) |
| 2026-02-01 | **전체 READ 마이그레이션 완료**: 모든 페이지의 읽기 작업을 unified_meditations로 통합 (15개 파일) |
| 2026-02-01 | **최종 검증**: 49개 백엔드 검사 모두 통과 |

---

## 주의사항

1. **guest_comments는 댓글이 아닙니다**
   - 이름은 "comments"이지만 실제로는 **게스트가 작성한 묵상글**입니다
   - 답글(replies)과 혼동하지 마세요

2. **모든 피드는 unified_meditations에서 조회합니다** (2026-02-01 리팩토링 완료)
   - 홈 피드, 교회 피드, 그룹 피드, 프로필 피드 모두 통합
   - 레거시 테이블은 쓰기 전용 (트리거로 자동 동기화)
   - 동기화가 안 되면 피드에서 글이 안 보입니다

3. **visibility 필드 필수**
   - 모든 묵상글에 visibility 값이 있어야 합니다
   - NULL이면 RLS에서 필터링될 수 있습니다

4. **트리거 동작 확인**
   - 새 글 작성 후 unified_meditations에 자동 생성되는지 확인
   - 문제 시 `scripts/backend-health-check.ts` 실행

5. **Dual-Write 패턴 필수 준수** (2026-02-01 추가)
   - **INSERT/UPDATE/DELETE는 반드시 레거시 테이블에 수행**
   - `unified_meditations`를 직접 수정하면 데이터 불일치 발생
   - Repository의 수정/삭제: `legacy_table`/`legacy_id` 조회 → 레거시 테이블 수정 → 트리거가 동기화
