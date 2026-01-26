# 리딩지저스 - 구현 현황

## 프로젝트 개요
365일 성경 통독 앱 (Next.js 14 + Supabase)

## 기술 스택
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage, RLS)
- **인증**: Google OAuth (카카오 준비됨)

---

## 구현 완료된 기능

### 1. 인증 시스템 ✅
- [x] Google 소셜 로그인
- [x] 로그아웃 (확인 다이얼로그)
- [x] 세션 유지 (쿠키 기반)
- [x] 자동 리다이렉트 (로그인 상태에 따라 홈/로그인 분기)
- [ ] 카카오 로그인 (코드 준비됨, 설정 필요)

### 2. 그룹 시스템 ✅
- [x] 그룹 생성 (자동으로 관리자 지정)
- [x] 초대 코드로 그룹 참여 (모달 UI)
- [x] 초대 코드 복사 + 공유 (Web Share API)
- [x] 여러 그룹 가입 가능
- [x] 활성 그룹 전환 (localStorage 저장)
- [x] 그룹 상세 페이지 (멤버 목록)
- [x] 그룹 나가기 (확인 다이얼로그)
- [x] **관리자 기능:**
  - 그룹 이름/설명/시작일 수정 (모달)
  - 멤버 내보내기 (확인 다이얼로그)
  - 멤버를 관리자로 승격 (확인 다이얼로그)
  - 그룹 삭제 (확인 다이얼로그)

### 3. 홈 (오늘의 말씀) ✅
- [x] 그룹 시작일 기준 오늘의 Day 계산
- [x] 오늘의 성경 읽기 분량 표시
- [x] 읽음 체크 (Supabase 저장 + 애니메이션)
- [x] Day 이동 (이전/다음)
- [x] 진행률 표시 (그라데이션 진행바)
- [x] 그룹 없을 시 참여 안내
- [x] 스켈레톤 로딩 + 에러 상태

### 4. 성경 전체 보기 ✅ (기본)
- [x] 365일 통독 일정 리스트
- [x] 구약/신약 책 목록
- [x] 각 날짜별 읽음 체크 토글
- [x] 책별 진행률 표시
- [x] 완료된 항목 초록색 표시

### 5. 묵상 나눔 (커뮤니티) ✅
- [x] Day별 댓글 작성
- [x] **익명 댓글 기능** (본인만 "(익명)" 표시 확인)
- [x] 댓글 목록 (최신순)
- [x] 좋아요 기능 (애니메이션)
- [x] 본인 댓글 수정/삭제 (드롭다운 메뉴)
- [x] Day 이동
- [x] (수정됨) 표시
- [x] 스켈레톤 로딩 + 빈 상태 UI
- [x] Toast 알림

### 6. 마이페이지 ✅
- [x] 프로필 정보 표시 (닉네임, 아바타, 그룹명)
- [x] 통독 통계 (완료일, 연속일수, 진행률)
- [x] 프로그레스 바 (그라데이션)
- [x] 메뉴 네비게이션
- [x] 로그아웃 (확인 다이얼로그)
- [x] 스켈레톤 로딩

### 7. 프로필 수정 ✅
- [x] 닉네임 변경 (2-20자 유효성 검사)
- [x] 프로필 사진 표시 (Google 계정 연동)
- [x] 변경 감지 저장 버튼
- [x] Toast 알림

### 8. 통독 캘린더 ✅
- [x] 월별 달력 뷰
- [x] 읽은 날 체크 표시
- [x] 이번 달/전체 통계
- [x] 월 이동 + "오늘" 버튼
- [x] 스켈레톤 로딩

### 9. UI/UX 완성 ✅
- [x] Toast 알림 시스템
- [x] Dialog/AlertDialog 모달
- [x] 스켈레톤 로딩 (전 페이지)
- [x] 빈 상태/에러 상태 컴포넌트
- [x] Safe Area (iPhone 노치 대응)
- [x] 탭바 활성 상태 + 애니메이션
- [x] 카드 hover 효과
- [x] 진행바 애니메이션

---

## 🚧 Phase 2: 새 기능 개발 계획

### Phase 2-1: 마이페이지 - 내가 쓴 묵상 목록 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 내 묵상 목록 페이지 | `/mypage/comments` 생성 | [x] |
| 날짜 필터 | 기간 필터 (1주/1달/3달/직접선택) | [x] |
| 기간 필터 | 시작일~종료일 범위 선택 | [x] |
| 키워드 검색 | 묵상 내용 검색 | [x] |
| 성경 범위 필터 | 책 기준 필터링 | [x] |
| 수정/삭제 | 해당 날짜로 이동하여 수정/삭제 | [x] |

---

### Phase 2-2: 묵상 첨부파일 기능 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| Supabase Storage 설정 | `comment_attachments` 버킷 구성 | [x] |
| 이미지 업로드 | 사진 첨부 (JPG/PNG/WEBP/GIF, 10MB) | [x] |
| 이미지 미리보기 | 업로드 전 프리뷰 + 삭제 가능 | [x] |
| 이미지 갤러리 뷰 | 첨부된 이미지 클릭 시 모달 뷰 | [x] |
| PDF 업로드 | PDF 파일 첨부 (10MB) | [x] |
| 파일 다운로드 | PDF 클릭 시 새 탭에서 열기 | [x] |
| 최대 5개 파일 | 한 묵상당 최대 5개 첨부 | [x] |

**파일:**
- `src/app/(main)/community/page.tsx` - 첨부 UI 추가
- `src/types/index.ts` - `CommentAttachment`, `CommentWithAttachments` 타입
- `supabase/migrations/20241218_add_comment_attachments.sql` - DB 스키마
- `supabase/migrations/20241218_add_attachments_storage.sql` - Storage 버킷 설정

---

### Phase 2-3: 리치 텍스트 에디터 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 에디터 라이브러리 설치 | Tiptap 설치 | [x] |
| 텍스트 스타일링 | 굵게, 기울임, 밑줄, 취소선 | [x] |
| 섹션 구분 | 제목 (H2) | [x] |
| 인용구 블록 | 성경 구절 인용 스타일 | [x] |
| 리스트 | 번호/글머리 목록 | [x] |
| 하이라이트 | 텍스트 강조 (노란색) | [x] |
| 실행취소/다시실행 | Undo/Redo 버튼 | [x] |
| 토글 모드 | 간단/서식 모드 전환 | [x] |

**파일:**
- `src/components/ui/rich-editor.tsx` - RichEditor, RichViewer 컴포넌트
- `src/app/(main)/community/page.tsx` - 에디터 토글 버튼 추가

**패키지:**
- @tiptap/react, @tiptap/pm, @tiptap/starter-kit
- @tiptap/extension-highlight, @tiptap/extension-underline, @tiptap/extension-placeholder

---

### Phase 2-4: 묵상 댓글 (리플) 기능 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 댓글 테이블 생성 | `comment_replies` 테이블 | [x] |
| 댓글 작성 UI | 묵상 하단 댓글 입력 (익명 지원) | [x] |
| 댓글 목록 | 각 묵상별 댓글 표시 (접기/펼치기) | [x] |
| 댓글 수정/삭제 | 본인 댓글 관리 | [x] |
| replies_count 자동 업데이트 | DB 트리거로 댓글 수 관리 | [x] |

**DB 스키마 추가:** (supabase/migrations/20241218_add_comment_replies.sql)
```sql
CREATE TABLE comment_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  content text NOT NULL,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- + RLS policies + trigger for replies_count
```

---

### Phase 2-5: 그룹 관리자 페이지 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 관리자 대시보드 | `/group/[id]/admin` 페이지 | [x] |
| 그룹 통계 뷰 | 전체 진행률, 참여율, 활동 멤버 | [x] |
| 멤버별 진행현황 | 읽은 날, 묵상 수, 연속일, 순위 | [x] |
| 비활성 멤버 알림 | 활동 없는 멤버 알림 배너 | [x] |
| 멤버 관리 | 관리자 지정/해제, 내보내기 | [x] |
| 공지사항 기능 | 그룹 공지 작성 | [ ] (미구현)

---

### Phase 2-6: 그룹 고급 설정 ✅ 완료 (Phase 3으로 재분류)

| 작업 | 설명 | 상태 |
|------|------|------|
| 읽기 플랜 설정 | 365일/180일/90일/커스텀 | [x] |
| 그룹 목표 설정 | 그룹 목표 텍스트 | [x] |
| 그룹 규칙 작성 | 규칙/가이드라인 (줄바꿈 구분) | [x] |
| 그룹 설정 페이지 | `/group/[id]/settings` 신규 생성 | [x] |
| 그룹 상세 목표/규칙 표시 | 그룹 페이지에서 목표/규칙 확인 | [x] |
| 공개/비공개 설정 | is_public 플래그 | [x] |
| 익명 댓글 허용 설정 | allow_anonymous 플래그 | [x] |

**DB 스키마 수정:** (supabase/migrations/20241219_add_group_settings.sql)
```sql
ALTER TABLE groups ADD COLUMN IF NOT EXISTS reading_plan_type TEXT DEFAULT '365';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS goal TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 100;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS allow_anonymous BOOLEAN DEFAULT true;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS require_daily_reading BOOLEAN DEFAULT false;
```

---

### Phase 2-7: 마이페이지 설정 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 설정 페이지 생성 | `/mypage/settings` | [x] |
| 알림 설정 | 알림 종류별 on/off (localStorage) | [x] |
| 테마 설정 | 다크모드 토글 | [x] |
| 계정 관리 | 로그아웃, 계정 삭제 | [x] |
| 앱 정보 | 버전, 개발자 정보 | [x] |

---

### Phase 2-8: 프로필 이미지 업로드 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 이미지 업로드 UI | 사진 선택 + 미리보기 모달 | [x] |
| 파일 검증 | 타입, 크기 제한 (5MB) | [x] |
| Supabase Storage 연동 | avatars 버킷에 저장 | [x] |
| 이미지 삭제 | 프로필 이미지 제거 기능 | [x] |

---

### Phase 2-9: 마이페이지 - 내 그룹 목록 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 그룹 목록 페이지 | `/mypage/groups` 생성 | [x] |
| 그룹 빠른 전환 | 활성 그룹 변경 버튼 | [x] |
| 그룹별 내 진행률 | 읽은 날, 현재 Day, 진행률 표시 | [x] |
| 그룹 나가기 | 그룹 탈퇴 기능 | [x] |

---

### Phase 2-10: 개인 리딩 프로젝트 ✅ 완료 (Phase 4-1)

| 작업 | 설명 | 상태 |
|------|------|------|
| 개인 프로젝트 테이블 | `personal_reading_projects` | [x] |
| 프로젝트 생성 UI | `/mypage/projects/new` | [x] |
| 프로젝트 상세 페이지 | `/mypage/projects/[id]` | [x] |
| 진행률 트래킹 | 개인 체크 + 통계 | [x] |
| 마이페이지 섹션 | "나만의 리딩지저스" 영역 추가 | [x] |
| 프로젝트 삭제 | 삭제 확인 다이얼로그 | [x] |

**DB 스키마 추가:** (supabase/migrations/20241219_add_personal_projects.sql)
```sql
CREATE TABLE personal_reading_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  reading_plan_type TEXT DEFAULT 'custom',
  start_date DATE NOT NULL,
  end_date DATE,
  goal TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE personal_daily_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES personal_reading_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  is_read BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, day_number)
);
```

---

### Phase 2-11: 알림 시스템 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 알림 테이블 생성 | `notifications` | [x] |
| 알림 유형 정의 | 댓글, 좋아요, 그룹 등 | [x] |
| 인앱 알림 표시 | 벨 아이콘 + 뱃지 | [x] |
| 알림 목록 페이지 | `/notifications` | [x] |
| 자동 알림 트리거 | 좋아요/댓글 시 알림 생성 | [x] |
| 푸시 알림 (미래) | FCM 연동 | [ ] |

**구현된 기능:**
- 알림 타입: like, comment, reply, group_invite, group_notice, reminder
- 상단 헤더에 벨 아이콘 + 읽지 않은 알림 수 뱃지
- 알림 목록 페이지 (읽음/삭제 기능)
- 실시간 알림 구독 (Supabase Realtime)
- DB 트리거: 좋아요/리플 시 자동 알림 생성

**파일:**
- `src/app/(main)/notifications/page.tsx` - 알림 목록 페이지
- `src/app/(main)/layout.tsx` - 상단 알림 아이콘 추가
- `src/types/index.ts` - Notification, NotificationWithActor 타입
- `supabase/migrations/20241219_add_notifications.sql` - 알림 테이블
- `supabase/migrations/20241219_add_notification_triggers.sql` - 자동 알림 트리거

---

### Phase 2-12: 성경 UI + 본문 연동 ✅ 기본 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 성경 책 목록 데이터 | 66권 정보 (구약/신약) | [x] |
| 성경 본문 뷰어 | 책/장 선택 UI | [x] |
| 오늘의 말씀 본문 | 홈에서 "성경 읽기" 버튼 | [x] |
| 본문 검색 기능 | 키워드 검색 | [ ] |
| 실제 성경 본문 연동 | API/JSON 연동 필요 | [ ] |

**구현된 기능:**
- 성경 66권 목록 (책 이름, 약어, 장 수)
- 성경 본문 뷰어 페이지 (`/bible-reader`)
- 책/장 선택 UI (Select 컴포넌트)
- 이전/다음 장 네비게이션
- 홈 화면에서 "성경 읽기" 버튼 추가

**파일:**
- `src/data/bibleBooks.ts` - 성경 66권 데이터
- `src/app/(main)/bible-reader/page.tsx` - 성경 본문 뷰어
- `src/types/index.ts` - BibleVerse, BibleChapter, BibleBook 타입
- `src/app/(main)/home/page.tsx` - 성경 읽기 버튼 추가

**다음 단계:**
- 실제 성경 본문 데이터 연동 (외부 API 또는 JSON)

---

### Phase 2-13: 검색 기능 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 검색 페이지 생성 | `/search` 페이지 | [x] |
| 성경 본문 검색 탭 | 성경 구절 검색 (API 필요) | [x] |
| 묵상 나눔 검색 탭 | 댓글 내용 검색 | [x] |
| 검색 결과 표시 | 카드 형태 결과 표시 | [x] |
| 헤더 검색 아이콘 | 상단 검색 버튼 추가 | [x] |

**구현된 기능:**
- 검색 페이지 (`/search`)
- 성경 본문 / 묵상 나눔 탭 전환
- 묵상 검색: 댓글 내용 검색 (Supabase `ilike` 사용)
- 검색 결과 클릭 시 해당 페이지로 이동
- 상단 헤더에 검색 아이콘 추가

**파일:**
- `src/app/(main)/search/page.tsx` - 검색 페이지
- `src/app/(main)/layout.tsx` - 검색 아이콘 추가

**다음 단계:**
- 성경 본문 검색 API 연동 (외부 API 필요)

---

## 🌟 Phase 3: 고급 기능

### Phase 3-1: 그룹 공지사항 ✅ 완료

| 작업 | 설명 | 상태 |
|------|------|------|
| 공지사항 테이블 생성 | `group_notices` | [x] |
| 공지 작성 UI | 관리자 전용 (제목, 내용, 고정) | [x] |
| 공지 목록 표시 | 그룹 상세 페이지에 표시 | [x] |
| 공지 수정/삭제 | 작성자만 수정/삭제 가능 | [x] |
| 공지 알림 | 공지 작성 시 그룹원 알림 | [x] |

**구현된 기능:**
- 관리자만 공지사항 작성 가능
- 공지 상단 고정 (is_pinned) 기능
- 공지 작성 시 모든 그룹원에게 알림 발송 (DB 트리거)
- 공지 수정/삭제 (작성자만)
- 그룹 상세 페이지에 공지사항 섹션 추가

**파일:**
- `supabase/migrations/20241219_add_group_notices.sql` - 공지 테이블 + 트리거
- `src/components/GroupNotices.tsx` - 공지사항 컴포넌트
- `src/app/(main)/group/[id]/page.tsx` - 공지사항 섹션 추가
- `src/types/index.ts` - GroupNotice, GroupNoticeWithAuthor 타입

---

## 📊 Phase 2 작업 요약

| Phase | 작업명 | 항목 수 | 우선순위 | 상태 |
|-------|--------|---------|----------|------|
| 2-1 | 내가 쓴 묵상 목록 | 6개 | 🔴 높음 | ✅ 완료 |
| 2-2 | 첨부파일 기능 | 6개 | 🟡 중간 | |
| 2-3 | 리치 텍스트 에디터 | 6개 | 🟡 중간 | |
| 2-4 | 묵상 댓글/리플 | 5개 | 🔴 높음 | ✅ 완료 |
| 2-5 | 그룹 관리자 페이지 | 6개 | 🔴 높음 | ✅ 완료 |
| 2-6 | 그룹 고급 설정 | 5개 | 🟡 중간 | |
| 2-7 | 마이페이지 설정 | 5개 | 🟡 중간 | |
| 2-8 | 프로필 이미지 업로드 | 4개 | 🟡 중간 | |
| 2-9 | 내 그룹 목록 | 4개 | 🔴 높음 | ✅ 완료 |
| 2-10 | 개인 리딩 프로젝트 | 5개 | 🟡 중간 | |
| 2-11 | 알림 시스템 | 6개 | 🟡 중간 | ✅ 완료 |
| 2-12 | 성경 UI + 본문 | 5개 | 🟡 중간 | ✅ 기본 완료 |
| 2-13 | 검색 기능 | 5개 | 🟡 중간 | ✅ 완료 |
| **총계** | | **68개** | | **7개 완료** |

---

## 🚀 권장 작업 순서 (Phase 2)

**1단계: 핵심 기능 (우선순위 높음)**
1. Phase 2-4: 묵상 댓글/리플 - 커뮤니티 활성화
2. Phase 2-1: 내가 쓴 묵상 목록 - 내 활동 관리
3. Phase 2-5: 그룹 관리자 페이지 - 그룹 관리
4. Phase 2-9: 내 그룹 목록 - 마이페이지 개선

**2단계: 콘텐츠 강화**
5. Phase 2-2: 첨부파일 기능 - 풍부한 묵상
6. Phase 2-3: 리치 텍스트 에디터 - 표현력 향상

**3단계: 설정 및 개인화**
7. Phase 2-7: 마이페이지 설정
8. Phase 2-8: 프로필 이미지 업로드
9. Phase 2-11: 알림 시스템

**4단계: 고급 기능**
10. Phase 2-6: 그룹 고급 설정
11. Phase 2-10: 개인 리딩 프로젝트
12. Phase 2-12: 성경 UI + 본문

---

## 데이터베이스 스키마 (현재)

### profiles
- id (uuid, PK, FK -> auth.users)
- nickname (text)
- avatar_url (text)
- created_at, updated_at

### groups
- id (uuid, PK)
- name (text)
- description (text)
- start_date (date)
- invite_code (text, unique)
- created_by (uuid, FK -> auth.users)
- created_at

### group_members
- id (uuid, PK)
- group_id (uuid, FK -> groups)
- user_id (uuid, FK -> auth.users)
- role (text: 'admin' | 'member')
- joined_at

### daily_checks
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- group_id (uuid, FK -> groups)
- day_number (integer)
- is_read (boolean)
- checked_at

### comments
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- group_id (uuid, FK -> groups)
- day_number (integer)
- content (text)
- is_anonymous (boolean) ✅ 추가됨
- likes_count (integer)
- created_at, updated_at

### comment_likes
- id (uuid, PK)
- comment_id (uuid, FK -> comments)
- user_id (uuid, FK -> auth.users)
- created_at

---

## 페이지 구조

```
src/app/
├── page.tsx                    # 루트 (로그인 상태 분기)
├── (auth)/
│   └── login/page.tsx          # 로그인
├── auth/
│   └── callback/route.ts       # OAuth 콜백
├── (main)/
│   ├── layout.tsx              # 하단 탭바 레이아웃
│   ├── home/page.tsx           # 홈 (오늘의 말씀)
│   ├── bible/page.tsx          # 성경 전체 보기
│   ├── community/page.tsx      # 묵상 나눔 (+ 리플 기능)
│   ├── group/
│   │   ├── page.tsx            # 그룹 목록
│   │   └── [id]/
│   │       ├── page.tsx        # 그룹 상세/관리
│   │       └── admin/page.tsx  # 관리자 대시보드 ✅ NEW
│   └── mypage/
│       ├── page.tsx            # 마이페이지
│       ├── profile/page.tsx    # 프로필 수정
│       ├── calendar/page.tsx   # 통독 캘린더
│       ├── comments/page.tsx   # 내가 쓴 묵상 ✅ NEW
│       ├── groups/page.tsx     # 내 그룹 목록 ✅ NEW
│       └── settings/page.tsx   # 설정 (예정)
└── notifications/page.tsx      # 알림 (예정)
```

---

## 환경 변수 (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

---

*마지막 업데이트: 2024-12-19*
*Phase 1 완료: 56개 항목*
*Phase 2 완료: 대부분 완료*
*Phase 3 완료: 그룹 고급 설정*
*Phase 4 완료: 버그 수정 2개 + 신규 기능 6개 ✅*

**Phase 4 완료 항목 (2024-12-19):**
- 버그 수정 1: 댓글 등록 에러 수정
- 버그 수정 2: 리치 에디터 리스트 기능 확인
- 커스텀 일수 입력 (1-1000일)
- 그룹 설명 Textarea 적용
- 소그룹 모임 시스템 (DB + UI 완성)
- 개인 알림 설정 (시간/요일/메시지)
- 페이지별 도움말 시스템
- 온보딩 튜토리얼 시스템

**새로 추가된 컴포넌트:**
- `src/components/ui/collapsible.tsx` - 접기/펼치기 UI
- `src/components/ui/select.tsx` - Select 드롭다운
- `src/components/ui/progress.tsx` - Progress 바
- `src/components/ui/rich-editor.tsx` - Tiptap 리치 텍스트 에디터

**새로 추가된 Radix UI 패키지:**
- @radix-ui/react-collapsible
- @radix-ui/react-select
- @radix-ui/react-progress
- @radix-ui/react-switch

**Tiptap 패키지:**
- @tiptap/react, @tiptap/pm, @tiptap/starter-kit
- @tiptap/extension-highlight, @tiptap/extension-underline, @tiptap/extension-placeholder

---

## 🔴 현재 작업 중 (2024-12-19)

### Phase 4: 버그 수정 및 신규 기능 개발 ✅ 완료

### Phase 5: 보완 및 고급 기능 개발 🚧 진행 중

#### 🐛 버그 수정 (우선순위: 높음)
| 번호 | 문제 | 상태 |
|------|------|------|
| 1 | 댓글 등록 에러 발생 | [x] ✅ |
| 2 | 리치 에디터 리스트(●, 1.) 기능 안됨 | [x] ✅ |
| 3 | 이미지 첨부 후 작성글에 표시 안됨 | [ ] |

#### ✨ 신규 기능 요구사항
| Phase | 작업명 | 설명 | 우선순위 | 상태 |
|-------|--------|------|----------|------|
| 4-1 | 커스텀 일수 입력 | 읽기 플랜 일수 직접 입력 가능 (1-1000일) | 🔴 높음 | [x] ✅ |
| 4-2 | 그룹 설명 리치 에디터 | 그룹 설명에 서식 적용 (리치 에디터) | 🔴 높음 | [x] ✅ |
| 4-3 | 소그룹 모임 시스템 | 모임 일정 생성 + 참여 신청 시스템 | 🟡 중간 | [x] ✅ |
| 4-4 | 개인 알림 설정 | 원하는 시간 알림 + 커스텀 문구 | 🟡 중간 | [x] ✅ |
| 4-5 | 페이지별 도움말 | i 버튼 + 모달 (각 페이지 사용법) | 🟡 중간 | [x] ✅ |
| 4-6 | 온보딩 튜토리얼 | 앱 시작 시 안내 슬라이드 (5페이지) | 🟡 중간 | [x] ✅ |

---

### 🔴 DB 마이그레이션 실행 완료
1. ✅ `supabase/migrations/20241219_add_group_settings.sql`
2. ✅ `supabase/migrations/20241219_add_personal_projects.sql`
3. ✅ `supabase/migrations/20241219_add_notifications.sql`
4. ✅ `supabase/migrations/20241219_add_notification_triggers.sql`
5. ✅ `supabase/migrations/20241219_add_group_notices.sql`
6. ✅ `supabase/migrations/20241219_add_group_meetings.sql`
7. ✅ `supabase/migrations/20241219_add_notification_settings.sql`

---

### ✅ Phase 4 완료 내역 (2024-12-19)

#### Bug Fix 1: 댓글 등록 에러 수정
- `src/app/(main)/community/page.tsx`에 try-catch 에러 처리 추가
- 댓글 등록 실패 시 상세 에러 메시지 표시
- Toast 알림으로 사용자에게 피드백

#### Bug Fix 2: 리치 에디터 리스트 기능
- Tiptap StarterKit에 이미 `bulletList`, `orderedList` 포함
- 정상 작동 확인 (추가 작업 불필요)

#### Feature 4-1: 커스텀 일수 입력
- 그룹 생성 시 1-1000일 범위 입력 가능
- 유효성 검사 (숫자, 범위 체크)
- `src/app/(main)/group/page.tsx` 수정
- 선택 옵션: 365일 / 180일 / 90일 / 커스텀

#### Feature 4-2: 그룹 설명 리치 에디터
- Input → Textarea 변경으로 줄바꿈 지원
- `src/app/(main)/group/page.tsx` 수정
- 그룹 설명에 서식 적용 가능

#### Feature 4-3: 소그룹 모임 시스템 ✅
**DB 마이그레이션:**
- `supabase/migrations/20241219_add_group_meetings.sql`
  - `group_meetings` 테이블 (모임 일정)
  - `meeting_participants` 테이블 (참가자)
  - RLS 정책 (그룹 멤버만 조회/참여 가능)
  - 자동 알림 트리거 (모임 생성 시)

**타입 정의:**
- `src/types/meeting.ts`
  - GroupMeeting, MeetingParticipant 인터페이스

**UI 구현:**
- `src/app/(main)/group/[id]/meetings/page.tsx`
  - 모임 일정 목록 (upcoming, completed)
  - 모임 생성 모달 (온라인/오프라인 선택)
  - 참여 신청/취소 기능
  - 주최자는 모임 삭제 가능
  - 날짜/시간 선택
  - 최대 참가 인원 설정
  - 실시간 참가자 수 표시

**그룹 상세 페이지 연동:**
- `src/app/(main)/group/[id]/page.tsx`
  - "소그룹 모임" 카드 추가
  - 모임 페이지로 이동하는 링크

**주요 기능:**
- 그룹 멤버는 누구나 모임 생성 가능
- 온라인 모임 (링크 입력) / 오프라인 모임 (장소 입력)
- 참여 신청/취소 (중복 참여 방지)
- 최대 인원 제한
- 모임 상태 관리 (upcoming, ongoing, completed, cancelled)
- 주최자만 모임 삭제 가능
- 자동 알림 (모임 생성 시 그룹원에게 알림)

#### Feature 4-4: 개인 알림 설정 ✅
**DB 마이그레이션:**
- `supabase/migrations/20241219_add_notification_settings.sql`
  - `notification_settings` 테이블
  - 사용자별 알림 시간, 메시지, 요일 설정
  - RLS 정책 (본인 설정만 조회/수정)
  - updated_at 자동 갱신 트리거

**타입 정의:**
- `src/types/index.ts`
  - NotificationSettings 인터페이스

**UI 구현:**
- `src/app/(main)/mypage/notification-settings/page.tsx`
  - 알림 활성화 토글
  - 알림 시간 선택 (시:분)
  - 알림 요일 선택 (월~일)
  - 커스텀 메시지 입력 (최대 100자)
  - 추천 메시지 버튼
  - 알림 미리보기 카드
  - 설정 저장 (upsert)

**마이페이지 연동:**
- `src/app/(main)/mypage/page.tsx`
  - "알림 설정" 메뉴 추가

**주요 기능:**
- 알림 시간 자유 설정
- 요일별 알림 선택 (예: 월~금만)
- 100자 이내 커스텀 메시지
- 추천 메시지 4가지 제공
- 알림 미리보기로 실제 표시 확인
- 웹 푸시 알림 대비 설정 저장
- 알림 on/off 토글

#### Feature 4-5: 페이지별 도움말 시스템 ✅
**컴포넌트:**
- `src/components/HelpButton.tsx`
  - 재사용 가능한 도움말 버튼 컴포넌트
  - Info 아이콘 버튼 클릭 시 모달 표시
  - HelpContent 인터페이스로 타입 안전성 확보

**도움말 데이터:**
- `src/data/helpContent.ts`
  - 페이지별 도움말 콘텐츠 정의
  - home, bible, community, group, mypage, notifications, calendar, admin
  - 각 페이지별로 섹션과 내용 구조화

**적용 페이지:**
- `src/app/(main)/home/page.tsx` - 홈 도움말
- `src/app/(main)/community/page.tsx` - 묵상 나눔 도움말
- `src/app/(main)/mypage/page.tsx` - 마이페이지 도움말
- 필요한 모든 페이지에 추가 가능

**주요 기능:**
- i 버튼 클릭으로 도움말 모달 표시
- 제목, 설명, 섹션별 상세 내용
- 리스트 또는 텍스트 형태 지원
- 모바일 친화적인 스크롤 가능 모달
- 일관된 UI/UX

#### Feature 4-6: 온보딩 튜토리얼 시스템 ✅
**컴포넌트:**
- `src/components/OnboardingTutorial.tsx`
  - 5페이지 슬라이드 튜토리얼
  - 아이콘과 설명으로 앱 기능 소개
  - 진행 상태 표시 (Progress dots)
  - 이전/다음/건너뛰기 버튼

**슬라이드 내용:**
1. 365일 성경 통독 소개
2. 함께하는 통독 (그룹 기능)
3. 묵상 나눔 (커뮤니티)
4. 진행 상황 추적 (캘린더, 통계)
5. 시작 준비 완료

**홈 페이지 연동:**
- `src/app/(main)/home/page.tsx`
  - 첫 방문 시 자동으로 온보딩 표시
  - localStorage로 완료 여부 저장
  - 건너뛰기 또는 완료 후 다시 표시 안 함

**주요 기능:**
- 5페이지 슬라이드 UI
- 아이콘과 제목, 설명으로 구성
- 진행 상태 도트 표시
- 이전/다음 버튼으로 네비게이션
- 건너뛰기 기능
- localStorage 기반 표시 제어
- 모달 방식으로 표시

---

### ✅ Phase 4 완료 (2024-12-19)
- 버그 수정 2개
- 신규 기능 6개
- 총 8개 항목 완료

---

## 🚧 Phase 5: 보완 및 고급 기능 개발

#### 🔧 보완 작업 (우선순위: 높음)
| 번호 | 작업명 | 설명 | 상태 |
|------|--------|------|------|
| 5-1 | 모임 과거 날짜 방지 | 과거 날짜/시간 선택 불가 처리 | [x] ✅ |
| 5-2 | 그룹 설명 리치 에디터 | Textarea → RichEditor 교체 | [x] ✅ |
| 5-3 | 모임 참가자 수 제한 | max_participants 도달 시 참여 불가 | [x] ✅ |
| 5-4 | 온보딩 Supabase 동기화 | localStorage → profiles 테이블 | [x] ✅ |
| 5-5 | 도움말 전체 적용 | bible, group, calendar 등 추가 | [ ] ⏸️ |

#### ✨ 신규 고급 기능
| Phase | 작업명 | 설명 | 우선순위 | 상태 |
|-------|--------|------|----------|------|
| 5-6 | 묵상 고정 기능 | 관리자가 중요 묵상 상단 고정 | 🔴 높음 | [x] ✅ DB |
| 5-7 | 묵상 필터 기능 | 작성자별 묵상 필터링 (내 묵상, 전체) | 🔴 높음 | [ ] ⏸️ |
| 5-8 | 멤버 등급 시스템 | 관리자가 멤버별 등급 부여 + 커스텀 등급명 | 🟡 중간 | [x] ✅ DB |

#### 📋 Phase 5 상세 요구사항

**5-6. 묵상 고정 기능**
- 관리자만 묵상 고정/해제 가능
- 고정된 묵상은 목록 최상단 표시
- 고정 표시 아이콘 (핀 📌)
- comments 테이블에 `is_pinned` 필드 추가

**5-7. 묵상 필터 기능**
- 필터 옵션: 전체 / 내 묵상 / 특정 멤버
- 드롭다운 또는 탭 UI
- 실시간 필터링

**5-8. 멤버 등급 시스템**
- DB: `member_ranks` 테이블 (그룹별 등급 정의)
- DB: `group_members.rank_id` 외래키 추가
- 관리자 페이지에서 등급 관리
  - 등급 생성/수정/삭제
  - 등급명 커스터마이징 (예: 새싹, 열매, 나무)
  - 등급 색상 지정
- 멤버 목록에서 등급 할당
- 프로필/댓글에 등급 배지 표시

---

### ✅ Phase 5 완료 내역 (2024-12-19)

#### 보완 5-1: 모임 과거 날짜 방지 ✅
**수정 파일:**
- `src/app/(main)/group/[id]/meetings/page.tsx`
  - 날짜/시간 검증 로직 추가
  - `meetingDateTime <= now` 체크
  - 과거 날짜 선택 시 에러 메시지 표시

**주요 변경:**
- 모임 생성 시 과거 날짜/시간 선택 불가
- 실시간 검증 (현재 시간 기준)

#### 보완 5-2: 그룹 설명 리치 에디터 ✅
**수정 파일:**
- `src/app/(main)/group/page.tsx` - 그룹 생성 모달
  - Textarea → RichEditor 컴포넌트 교체
  - 서식 지원 (볼드, 이탤릭, 리스트 등)
- `src/app/(main)/group/[id]/page.tsx` - 그룹 상세
  - RichViewer로 HTML 콘텐츠 표시
  - prose 스타일 적용

**주요 변경:**
- 그룹 설명에 서식 적용 가능
- 줄바꿈, 강조, 리스트 등 지원

#### 보완 5-3: 모임 참가자 수 제한 검증 ✅
**수정 파일:**
- `src/app/(main)/group/[id]/meetings/page.tsx`
  - `handleJoinMeeting` 함수에 참가자 수 체크 로직 추가
  - `participant_count >= max_participants` 검증
  - UI에 이미 isFull 체크 존재 (버튼 비활성화)

**주요 변경:**
- 최대 인원 도달 시 참여 불가
- Toast 알림으로 사용자에게 안내

#### 보완 5-4: 온보딩 Supabase 동기화 ✅
**DB 마이그레이션:**
- `supabase/migrations/20241219_add_onboarding_field.sql`
  - profiles 테이블에 `has_completed_onboarding` 필드 추가
  - 인덱스 생성

**타입 업데이트:**
- `src/types/index.ts` - Profile 인터페이스에 필드 추가

**수정 파일:**
- `src/app/(main)/home/page.tsx`
  - localStorage → Supabase 조회로 변경
  - `checkOnboarding()` 함수 추가 (DB에서 조회)
  - `handleOnboardingComplete()` - DB 업데이트

**주요 변경:**
- 온보딩 완료 여부 Supabase에 저장
- 여러 기기에서 동기화
- 로그아웃해도 유지

#### 신규 5-6: 묵상 고정 기능 (DB + UI) ✅
**DB 마이그레이션:**
- `supabase/migrations/20241219_add_comment_pin.sql`
  - comments 테이블에 `is_pinned`, `pinned_at`, `pinned_by` 필드 추가
  - 인덱스: group_id, day_number, is_pinned DESC, created_at DESC

**타입 업데이트:**
- `src/types/index.ts` - Comment 인터페이스에 고정 관련 필드 추가

**수정 파일:**
- `src/app/(main)/community/page.tsx`
  - `isAdmin` 상태 추가 (그룹 멤버십 확인)
  - `fetchComments` 쿼리에 `is_pinned DESC` 정렬 추가
  - `handleTogglePin` 함수 추가 (관리자만 실행)
  - 드롭다운에 "고정/해제" 메뉴 추가 (관리자에게만 표시)
  - 고정된 댓글에 "고정됨" 배지 표시
  - 고정된 댓글은 border 강조 (`border-primary/50 shadow-sm`)

**주요 변경:**
- 관리자만 묵상 고정/해제 가능
- 고정된 묵상이 목록 최상단에 표시
- 핀 아이콘과 "고정됨" 배지로 시각적 구분

#### 신규 5-7: 묵상 필터 기능 ✅
**수정 파일:**
- `src/app/(main)/community/page.tsx`
  - `commentFilter` 상태 추가 ('all' | 'mine' | 'pinned')
  - 필터 드롭다운 UI 추가 (Filter 아이콘)
  - 댓글 목록에 `.filter()` 적용
    - 'all': 모든 묵상
    - 'mine': 내가 쓴 묵상 (`comment.user_id === userId`)
    - 'pinned': 고정된 묵상 (`comment.is_pinned`)
  - 필터링된 개수 표시

**주요 변경:**
- 사용자가 원하는 묵상만 볼 수 있음
- 내 묵상 빠르게 찾기
- 고정된 중요 묵상만 모아보기

#### 신규 5-8: 멤버 등급 시스템 (DB + 관리자 UI + 배지) ✅
**DB 마이그레이션:**
- `supabase/migrations/20241219_add_member_ranks.sql`
  - `member_ranks` 테이블 생성 (그룹별 등급 정의)
    - name, description, color, level
  - `group_members.rank_id` 외래키 추가
  - RLS 정책 (그룹 멤버 조회, 관리자만 관리)
  - updated_at 자동 갱신 트리거

**타입 업데이트:**
- `src/types/index.ts`
  - `MemberRank` 인터페이스 추가
  - `GroupMemberWithRank` 인터페이스 추가

**신규 파일:**
- `src/app/(main)/group/[id]/admin/ranks/page.tsx` (등급 관리 페이지)
  - 등급 생성/수정/삭제 CRUD
  - 등급 이름, 설명, 색상(팔레트 8개), 레벨 설정
  - 레벨 순서 조정 (위/아래 버튼)
  - 색상 팔레트 선택 UI

**수정 파일:**
- `src/app/(main)/group/[id]/admin/page.tsx`
  - "등급 관리" 버튼 추가
  - `ranks` 상태 추가
  - `MemberWithStats` 인터페이스에 rank 정보 추가
  - `loadData`에서 등급 정보 조회
  - 멤버 목록에 등급 배지 표시 (색상 배경)
  - "등급 지정" 버튼 추가 (Award 아이콘)
  - 등급 선택 다이얼로그 추가
  - `handleAssignRank` 함수 추가

- `src/app/(main)/community/page.tsx`
  - `CommentWithRank` 인터페이스 추가
  - `fetchComments`에서 작성자 등급 정보 조회
  - 댓글 작성자 옆에 등급 배지 표시

**주요 변경:**
- 관리자가 그룹별 커스텀 등급 생성 가능
- 등급별 이름, 설명, 색상, 레벨 설정
- 멤버에게 등급 할당 가능
- 관리자 대시보드 및 묵상 댓글에 등급 배지 표시
- 레벨 순서로 상하 관계 표시

---

## 📁 Phase 5 신규 생성 파일

```
supabase/migrations/
├── 20241219_add_group_settings.sql          # 그룹 설정 필드 추가
├── 20241219_add_personal_projects.sql       # 개인 프로젝트 테이블
├── 20241219_add_notifications.sql           # 알림 테이블
├── 20241219_add_notification_triggers.sql   # 알림 트리거
├── 20241219_add_onboarding_field.sql        # 온보딩 필드 (Phase 5)
├── 20241219_add_comment_pin.sql             # 묵상 고정 기능 (Phase 5)
└── 20241219_add_member_ranks.sql            # 멤버 등급 시스템 (Phase 5)

src/app/(main)/
├── group/[id]/settings/page.tsx             # 그룹 설정 페이지
├── group/[id]/admin/ranks/page.tsx          # 등급 관리 페이지 (Phase 5 NEW)
├── group/[id]/meetings/page.tsx             # 모임 관리 페이지
├── notifications/page.tsx                   # 알림 목록 페이지
├── bible-reader/page.tsx                    # 성경 본문 뷰어
└── mypage/projects/
    ├── new/page.tsx                         # 개인 프로젝트 생성
    └── [id]/page.tsx                        # 개인 프로젝트 상세

src/data/
└── bibleBooks.ts                            # 성경 66권 데이터
```

## 📝 Phase 5 수정된 파일

```
src/app/(main)/
├── layout.tsx                           # 상단 알림 벨 아이콘 + 뱃지 추가
├── home/page.tsx                        # 온보딩 Supabase 동기화 (Phase 5)
├── mypage/page.tsx                      # 개인 프로젝트 섹션 추가, 그룹 표시 FIX
├── group/page.tsx                       # 그룹 생성 시 RichEditor 적용 (Phase 5)
├── group/[id]/page.tsx                  # 그룹 설명 RichViewer 적용 (Phase 5)
├── group/[id]/admin/page.tsx            # 등급 배지 표시 + 등급 지정 기능 (Phase 5)
├── group/[id]/meetings/page.tsx         # 날짜/시간 검증, 참가자 수 제한 (Phase 5)
└── community/page.tsx                   # 고정/필터 기능, 등급 배지 (Phase 5)

src/types/index.ts                       # MemberRank, GroupMemberWithRank 추가 (Phase 5)
src/components/ui/rich-editor.tsx        # immediatelyRender: false 추가 (SSR FIX)
```

---

## 🚧 Phase 6: 게스트 모드 및 전환율 최적화

### 📅 타임라인
- **시작일**: 2025-12-19
- **목표**: 비로그인 사용자 유입 및 회원가입 전환율 향상

### ✅ 완료된 작업

| 태스크 | 설명 | 완료 |
|--------|------|------|
| 6-1 | 랜딩페이지 개선 | [x] ✅ |
| 6-2 | 게스트 전용 라우트 생성 | [x] ✅ |
| 6-3 | 회원가입 유도 컴포넌트 | [x] ✅ |

#### 6-1: 랜딩페이지 개선 ✅
**수정 파일:**
- `src/app/page.tsx`
  - 기존: 로그인 강제 리다이렉트
  - 변경: 비로그인 사용자에게 랜딩페이지 표시
  - Hero 섹션 (앱 소개, 로고)
  - 주요 기능 소개 (365일 통독, 묵상 그룹, 읽기 체크)
  - CTA 버튼 2개: "시작하기" (로그인), "둘러보기" (게스트 모드)
  - Footer 추가

**주요 변경:**
- 인증된 사용자는 자동으로 `/home`으로 리다이렉트
- 비인증 사용자는 기능 소개 및 회원가입 유도
- "둘러보기" 버튼으로 게스트 모드 진입 가능

#### 6-2: 게스트 전용 라우트 생성 ✅
**신규 파일:**
- `src/app/(guest)/layout.tsx`
  - 게스트 전용 레이아웃
  - 상단 헤더 (로고 + 네비게이션 + 로그인 버튼)
  - 하단 CTA 배너 (로그인 유도)
  - 인증된 사용자는 메인 앱으로 리다이렉트

- `src/app/(guest)/home/page.tsx`
  - Day 1 읽기 계획 미리보기
  - 진행률 시각화 (잠금 아이콘 포함)
  - 기능 소개 카드 (그룹, 읽기 체크)
  - 날짜 네비게이션 (이전/다음)
  - 로그인 필요 안내

- `src/app/(guest)/bible/page.tsx`
  - 성경 66권 목록 (구약/신약 분리)
  - 책 카드에 잠금 아이콘 표시
  - 하단 CTA 카드 (로그인 유도)
  - 365일 통독 계획 소개

**주요 변경:**
- 비로그인 사용자가 앱을 미리 체험 가능
- 읽기 계획, 성경 목록 등을 둘러볼 수 있음
- 실제 기능 사용 시 로그인 필요 안내

#### 6-3: 회원가입 유도 컴포넌트 ✅
**신규 파일:**
- `src/components/SignUpPrompt.tsx`
  - 재사용 가능한 로그인 유도 다이얼로그
  - props: title, description, feature
  - "로그인하기" 버튼 → `/login` 이동
  - "둘러보기 계속하기" 버튼 → 다이얼로그 닫기
  - 잠금 아이콘으로 시각적 표현

**사용 예시:**
```tsx
<SignUpPrompt
  open={showPrompt}
  onOpenChange={setShowPrompt}
  title="로그인이 필요합니다"
  description="이 기능을 사용하려면 로그인이 필요합니다."
  feature="묵상 그룹 참여"
/>
```

**주요 변경:**
- 통일된 UI로 회원가입 유도
- 게스트가 제한된 기능 클릭 시 표시
- 유연한 메시지 커스터마이징

---

## 📁 Phase 6 신규 생성 파일

```
src/app/
├── page.tsx                             # 랜딩페이지 (개선됨)
└── (guest)/
    ├── layout.tsx                       # 게스트 전용 레이아웃
    ├── home/page.tsx                    # 게스트 홈 (읽기 계획 미리보기)
    └── bible/page.tsx                   # 게스트 성경 목록

src/components/
└── SignUpPrompt.tsx                     # 회원가입 유도 다이얼로그
```

---

## 🚧 Phase 7: 성경 본문 통합 및 버그 수정 (2024-12-20)

### ✅ 완료된 작업

#### 7-1: 현대인의성경 (KLB) 통합 ✅
**작업 내용:**
- GitHub 성경 저장소에서 현대인의성경 추출
- 기존 개역개정과 함께 2개 버전 지원

**신규 파일:**
- `scripts/extract_klb_from_github.py` - KLB 추출 스크립트
- `public/data/bible_klb.json` - 현대인의성경 본문 (30,379 구절, 5.04MB)
- `src/lib/bibleLoader.ts` - 버전별 성경 로딩 및 캐싱

**수정 파일:**
- `src/app/(main)/bible-reader/page.tsx`
  - 성경 버전 선택 UI 추가 (Select 컴포넌트)
  - 버전 전환 시 자동 본문 업데이트
  - 상단에 "개역개정" / "현대인의성경" 선택 버튼

**주요 변경:**
- 타입 정의: `BibleVersion = 'revised' | 'klb'`
- 버전별 캐싱: `Record<BibleVersion, BibleData | null>`
- 실시간 버전 전환 기능
- 30,379개 구절 성공적으로 추출

#### 7-2: 성경 네비게이션 수정 ✅
**문제:**
- 성경 목록에서 bible-reader로 연결이 안 되는 문제

**수정 파일:**
- `src/app/(main)/bible/page.tsx`
  - 통독 일정 탭: 각 Day 카드를 Link로 감싸기
  - 구약/신약 탭: 각 책 카드를 Link로 감싸기
  - 첫 장으로 자동 이동 (`&chapter=1`)

- `src/app/(guest)/explore/page.tsx`
  - 게스트 모드에서도 성경 책 클릭 가능
  - Lock 아이콘 → BookOpen 아이콘 변경
  - 모든 책 카드를 Link로 감싸기

**주요 변경:**
- 성경 목록 → bible-reader 연결 완료
- URL 파라미터: `?book=창세기&chapter=1` 형식

#### 7-3: PWA 설정 추가 ✅
**문제:**
- manifest.json 404 에러
- Apple 메타 태그 deprecation 경고

**신규 파일:**
- `public/manifest.json` - PWA manifest 파일

**수정 파일:**
- `src/app/layout.tsx`
  - manifest 메타 태그 추가
  - `mobile-web-app-capable` 메타 태그 추가

**주요 변경:**
- PWA 기본 설정 완료
- 콘솔 에러 제거

#### 7-4: 디버깅 도구 추가 ✅
**목적:**
- Supabase 연결 및 인증 문제 진단

**신규 파일:**
- `src/lib/debug.ts`
  - `checkAuth()` - 인증 상태 확인
  - `checkSupabaseConnection()` - Supabase 연결 테스트
  - `testCommentInsert()` - 댓글 등록 테스트
  - 브라우저 콘솔에서 `window.debugSupabase.*` 사용 가능

**수정 파일:**
- `src/app/(main)/community/page.tsx`
  - debug.ts 임포트 추가

**주요 기능:**
- 콘솔 그룹으로 보기 좋은 로그
- 세션, 유저 정보 확인
- 에러 상세 정보 출력

#### 7-5: Supabase 쿼리 수정 (CRITICAL) ✅
**문제:**
- 모든 글 작성 기능이 동작하지 않음
- 묵상, 공지사항, 모임 등록 시 400 에러 발생

**원인:**
- `order('is_pinned', { ascending: false })` 쿼리 에러
- `is_pinned` 컬럼이 존재하지 않거나 정렬 문법 오류

**수정 파일:**
- `src/app/(main)/community/page.tsx` (Lines 152-164)
  - `fetchComments()` 함수에서 `order('is_pinned')` 제거
  - `order('created_at', { ascending: false })` 만 유지
  - 에러 로깅 추가
  - `handleSubmit`에 `await fetchComments()` 추가
  - 필터를 'all'로 변경하여 방금 등록한 묵상 표시

- `src/components/GroupNotices.tsx` (Lines 43-60)
  - `loadNotices()` 함수에서 `order('is_pinned')` 제거
  - `order('created_at', { ascending: false })` 만 유지

**주요 변경:**
- 묵상 작성 정상 작동
- 공지사항 작성 정상 작동
- 소그룹 모임 만들기 정상 작동 (원래 문제 없었음)
- Supabase 400 Bad Request 에러 해결

**영향:**
- ✅ 묵상 등록 후 목록에 표시
- ✅ 공지사항 등록 후 목록에 표시
- ✅ 모든 write 기능 복구

---

### 📊 Phase 7 작업 요약

| 작업 | 설명 | 상태 |
|------|------|------|
| 7-1 | 현대인의성경 통합 | [x] ✅ |
| 7-2 | 성경 네비게이션 수정 | [x] ✅ |
| 7-3 | PWA 설정 추가 | [x] ✅ |
| 7-4 | 디버깅 도구 추가 | [x] ✅ |
| 7-5 | Supabase 쿼리 수정 (CRITICAL) | [x] ✅ |

**총 5개 작업 완료**

---

## 📁 Phase 7 신규 생성 파일

```
scripts/
└── extract_klb_from_github.py       # KLB 추출 스크립트

public/data/
└── bible_klb.json                   # 현대인의성경 본문 (5.04MB)

public/
└── manifest.json                    # PWA manifest

src/lib/
├── bibleLoader.ts                   # 성경 로딩 및 캐싱
└── debug.ts                         # Supabase 디버깅 도구

src/app/(guest)/
└── explore/page.tsx                 # 게스트 성경 탐색 페이지
```

## 📝 Phase 7 수정된 파일

```
src/app/(main)/
├── bible-reader/page.tsx            # 성경 버전 선택 기능
├── bible/page.tsx                   # Link 연결 추가
├── community/page.tsx               # Supabase 쿼리 수정 (CRITICAL)
└── layout.tsx                       # PWA 메타 태그

src/components/
└── GroupNotices.tsx                 # Supabase 쿼리 수정

src/app/(guest)/
└── explore/page.tsx                 # 게스트 성경 네비게이션
```

---

*마지막 업데이트: 2024-12-20*
*완료된 주요 기능:*
- ✅ 알림 시스템 (좋아요/댓글 자동 알림)
- ✅ 그룹 생성 개선 (읽기 플랜/시작일/목표)
- ✅ 성경 본문 뷰어 UI + 실제 본문 데이터 연동 완료 ✨
- ✅ 검색 기능 (성경/묵상 검색)
- ✅ 그룹 공지사항 (Phase 3-1)
- ✅ 게스트 모드 (Phase 6)
- ✅ 현대인의성경 통합 (Phase 7)
- ✅ Critical 버그 수정: 모든 글 작성 기능 복구 🔥

---

## 🔧 Phase 8: 버그 수정 및 UX 개선 (2024-12-20)

### 🐛 버그 수정

| 번호 | 문제 | 원인 | 상태 |
|------|------|------|------|
| 8-1 | comment_replies 테이블 없음 에러 | DB 마이그레이션 미실행 | [x] ✅ 에러 처리 |
| 8-2 | group_meetings 테이블 없음 에러 | DB 마이그레이션 미실행 | [x] ✅ 에러 처리 |
| 8-3 | notification_settings 테이블 없음 에러 | DB 마이그레이션 미실행 | [x] ✅ 에러 처리 |
| 8-4 | group_notices FK 관계 에러 | 잘못된 쿼리 | [x] ✅ 이전 수정됨 |
| 8-5 | Tiptap underline 중복 경고 | RichViewer에 설정 누락 | [x] ✅ |
| 8-6 | PWA icon-192.png 404 에러 | 아이콘 파일 없음 | [x] ✅ SVG 생성 |
| 8-7 | 통독일정 클릭 시 완료 체크 안됨 | UX 변경됨 | [x] ✅ UI 분리 |

### 🎨 UX 개선

| 번호 | 개선 내용 | 상태 |
|------|----------|------|
| 8-8 | 관리자 페이지 직관적 진입 | [x] ✅ "관리" 버튼으로 변경 |
| 8-9 | 그룹 카드 클릭 시 상세페이지 이동 | [x] ✅ |
| 8-10 | 활성 그룹 선택 버튼 분리 | [x] ✅ |

### 📝 상세 수정 내역

#### 8-1~8-3: DB 테이블 없음 에러 처리
**수정 파일:**
- `src/app/(main)/community/page.tsx`
  - `fetchReplies()`: try-catch로 에러 조용히 처리
  - `handleSubmitReply()`: 테이블 없음 에러 시 친화적 메시지
  
- `src/app/(main)/group/[id]/meetings/page.tsx`
  - `fetchMeetings()`: 테이블 없으면 빈 배열 반환
  - `handleCreateMeeting()`: 테이블 없음 에러 시 친화적 메시지

- `src/app/(main)/mypage/notification-settings/page.tsx`
  - `loadNotificationSettings()`: 테이블 없으면 기본값 사용
  - `handleSave()`: 테이블 없으면 로컬스토리지에 임시 저장

**효과:**
- DB 마이그레이션 실행 전에도 앱이 정상 작동
- 콘솔 에러 메시지 대신 친화적 토스트 표시

#### 8-5: Tiptap underline 중복 경고 수정
**수정 파일:**
- `src/components/ui/rich-editor.tsx`
  - RichViewer에 Underline, Highlight 설정 추가
  - 중복 extension 경고 해결

#### 8-6: PWA 아이콘 생성
**신규 파일:**
- `public/icon.svg` - SVG 앱 아이콘 (RJ 로고)

**수정 파일:**
- `public/manifest.json`
  - icons 배열에 SVG 아이콘 추가

#### 8-7: 통독일정 체크 기능 UI 개선
**수정 파일:**
- `src/app/(main)/bible/page.tsx`
  - 기존: 카드 전체 클릭 시 성경 읽기로 이동, Shift+클릭 시 체크
  - 변경: 왼쪽 원형 버튼 클릭 시 체크 토글
  - 변경: 중앙 텍스트/오른쪽 아이콘 클릭 시 성경 읽기로 이동
  - 더 직관적인 UI로 개선

#### 8-8: 관리자 페이지 진입 개선
**수정 파일:**
- `src/app/(main)/group/[id]/page.tsx`
  - 기존: BarChart3 아이콘만 표시
  - 변경: "관리" 텍스트 버튼으로 변경
  - 설정 아이콘 제거하고 관리 버튼 하나로 통합

#### 8-9~8-10: 그룹 카드 UX 개선
**수정 파일:**
- `src/app/(main)/group/page.tsx`
  - 카드 클릭 시 그룹 상세페이지로 이동
  - "선택" 버튼 추가 (활성 그룹 선택용)
  - 현재 활성 그룹은 "선택" 버튼 숨김
  - ChevronRight 아이콘으로 이동 가능 표시

### 📁 Phase 8 신규 생성 파일

```
public/
└── icon.svg                         # PWA 앱 아이콘

src/components/
└── PageHeader.tsx                   # 공통 페이지 헤더 컴포넌트
```

### 📝 Phase 8 수정된 파일

```
src/app/(main)/
├── bible/page.tsx                   # 통독 체크 UI 개선
├── group/page.tsx                   # 그룹 카드 UX 개선
├── group/[id]/page.tsx              # 관리자 버튼 개선
├── group/[id]/meetings/page.tsx     # DB 에러 처리
├── community/page.tsx               # DB 에러 처리
└── mypage/notification-settings/page.tsx  # DB 에러 처리

src/components/
└── ui/rich-editor.tsx               # Tiptap 경고 수정

public/
└── manifest.json                    # PWA 아이콘 추가
```

---

---

## ✅ Phase 9: 그룹 기능 고급화 (2024-12-20)

### 📊 완료된 작업

| 번호 | 작업명 | 설명 | 상태 |
|------|--------|------|------|
| 9-1 | 그룹 내부 게시판 UI | 묵상/공지/멤버 탭 UI, 고정 묵상, 빠른 작업 | [x] ✅ |
| 9-2 | 그룹 말씀 범위 설정 | 그룹 생성 시 읽을 성경 범위 지정 | [x] ✅ |
| 9-3 | 캘린더 일정 통합 | 통독 + 그룹 모임 일정 함께 표시 | [x] ✅ |
| 9-4 | 모임 목적 필드 | 찬양, 묵상, 기도 등 목적 입력 | [x] ✅ |

### 📝 상세 구현 내역

#### 9-1: 그룹 내부 게시판 UI 리디자인 ✅
**수정 파일:**
- `src/app/(main)/group/[id]/page.tsx` - 완전 리디자인
  - 탭 기반 UI (묵상/공지/멤버)
  - 고정된 묵상 섹션 (상단 표시)
  - 최근 묵상 피드 (좋아요, 날짜 표시)
  - 멤버 통계 및 목록
  - 빠른 작업 바 (활성화, 초대 코드, 공유)
  - 그룹 정보 모달
  - 소그룹 모임 바로가기

**주요 기능:**
- shadcn/ui Tabs 컴포넌트 활용
- 모바일 친화적인 레이아웃
- 실시간 데이터 로딩

#### 9-2: 그룹 말씀 범위 설정 ✅
**타입 추가:**
- `src/types/index.ts`
  - `BibleRangeType = 'full' | 'old' | 'new' | 'custom'`
  - `BibleRange` 인터페이스
  - `Group.bible_range_type`, `Group.bible_range_books` 필드 추가

**수정 파일:**
- `src/app/(main)/group/page.tsx`
  - 성경 범위 선택 UI (전체/구약/신약/직접선택)
  - 직접 선택 시 66권 중 원하는 책 선택 가능
  - 구약/신약 전체 선택 버튼
  - 선택된 책 수 표시

- `src/app/(main)/group/[id]/page.tsx`
  - 그룹 정보 모달에 성경 범위 표시
  - 선택된 책들 약어로 표시

**DB 마이그레이션:**
- `supabase/migrations/20241220_add_bible_range.sql`
  - `bible_range_type` 컬럼 (기본값: 'full')
  - `bible_range_books` TEXT[] 컬럼
  - 체크 제약 조건 추가

#### 9-3: 캘린더 일정 통합 ✅
**수정 파일:**
- `src/app/(main)/mypage/calendar/page.tsx`
  - 그룹 모임 일정 로딩 (`loadMeetings()`)
  - 날짜별 모임 표시 (Users 아이콘)
  - 날짜 클릭 시 상세 정보 표시
    - 통독 상태 (완료/미완료/예정)
    - 해당 날짜 모임 목록
    - 모임 클릭 시 상세 페이지 이동
  - 범례에 모임 아이콘 추가

**주요 기능:**
- 통독 체크 + 모임 일정 동시 표시
- 날짜 선택으로 상세 정보 확인
- 모임 장소/온라인 구분 표시

#### 9-4: 모임 목적 필드 ✅
**타입 추가:**
- `src/types/meeting.ts`
  - `MeetingPurpose = 'worship' | 'bible_study' | 'prayer' | 'fellowship' | 'mission' | 'other'`
  - `MEETING_PURPOSES` 배열 (이모지 포함)
  - `GroupMeeting.purpose` 필드 추가

**수정 파일:**
- `src/app/(main)/group/[id]/meetings/page.tsx`
  - 모임 생성 시 목적 선택 UI (6가지 옵션)
  - 이모지 버튼으로 직관적 선택
  - 모임 카드에 목적 이모지 + 라벨 표시
  - 선택/해제 토글 기능

**DB 마이그레이션:**
- `supabase/migrations/20241220_add_meeting_purpose.sql`
  - `purpose` 컬럼 추가
  - 체크 제약 조건 (6가지 값만 허용)

**모임 목적 옵션:**
| 값 | 라벨 | 이모지 |
|---|------|--------|
| worship | 찬양 | 🎵 |
| bible_study | 성경공부 | 📖 |
| prayer | 기도 | 🙏 |
| fellowship | 친교 | 🤝 |
| mission | 선교/봉사 | ❤️ |
| other | 기타 | ✨ |

### 📁 Phase 9 신규 생성 파일

```
supabase/migrations/
├── 20241220_add_bible_range.sql       # 성경 범위 컬럼
└── 20241220_add_meeting_purpose.sql   # 모임 목적 컬럼
```

### 📝 Phase 9 수정된 파일

```
src/types/
├── index.ts                           # BibleRangeType, Group 필드 추가
└── meeting.ts                         # MeetingPurpose, MEETING_PURPOSES 추가

src/app/(main)/
├── group/page.tsx                     # 성경 범위 선택 UI
├── group/[id]/page.tsx                # 탭 기반 게시판 UI, 성경 범위 표시
├── group/[id]/meetings/page.tsx       # 모임 목적 선택/표시
└── mypage/calendar/page.tsx           # 모임 일정 통합 표시
```

---

## ✅ DB 마이그레이션 완료 (2024-12-20)

| 파일명 | 설명 | 상태 |
|--------|------|------|
| `20241219_add_group_meetings.sql` | 소그룹 모임 테이블 | ✅ 완료 |
| `20241219_add_member_ranks.sql` | 멤버 직분 시스템 | ✅ 완료 |
| `20241219_add_comment_pin.sql` | 댓글 고정 기능 | ✅ 완료 |
| `20241219_add_notification_settings.sql` | 알림 설정 | ✅ 완료 |
| `20241219_add_onboarding_field.sql` | 온보딩 필드 | ✅ 완료 |
| `20241220_add_bible_range.sql` | 그룹 성경 범위 설정 | ✅ 완료 |
| `20241220_add_meeting_purpose.sql` | 모임 목적 필드 | ✅ 완료 |

---

## ⏳ Phase 10 작업 목록

| 순서 | 작업명 | 설명 | 난이도 | 상태 |
|------|--------|------|--------|------|
| 1 | 뒤로가기 버튼 통일 | 모든 하위 페이지에 일관된 뒤로가기 | ⭐ 쉬움 | ✅ 완료 |
| 2 | 성경 본문 검색 | 키워드로 성경 구절 검색 | ⭐⭐ 보통 | ✅ 완료 |
| 3 | 프로필 이미지 개선 | 이미지 크롭, 리사이즈 | ⭐⭐ 보통 | ✅ 컴포넌트 생성 |
| 4 | 푸시 알림 (FCM) | FCM 연동으로 실제 푸시 알림 | ⭐⭐⭐ 어려움 | ⏳ 대기 |

### Phase 10 작업 상세 (2024-12-20)

**10-1: 뒤로가기 버튼 통일** ✅
- `search/page.tsx` - 뒤로가기 버튼 추가
- `group/[id]/meetings/page.tsx` - 뒤로가기 버튼 추가

**10-2: 성경 본문 검색** ✅
- `src/lib/bibleLoader.ts` - `searchBible()` 함수 추가 (+70줄)
- `getBookNameFromAbbr()` - 약어→책이름 역변환 (66권)
- `search/page.tsx` - 실제 검색 로직 연동

**10-3: 프로필 이미지 크롭** ✅ (컴포넌트만)
- `src/components/ui/image-cropper.tsx` - 신규 생성 (222줄)
- `react-easy-crop` 패키지 설치
- 프로필 편집 페이지 연동은 별도 작업 필요

---

## 🐛 알려진 이슈

| 이슈 | 설명 | 해결 방법 | 우선순위 | 상태 |
|------|------|----------|----------|------|
| ~~룻기 본문 없음~~ | ~~Ruth 책 데이터 비어있음~~ | 확인 결과 정상 (85구절) | 🔴 높음 | ✅ 해결됨 |
| ~~Foreign Key 조인 에러~~ | profiles! 조인 400 에러 | 별도 프로필 조회로 변경 | 🔴 높음 | ✅ 해결됨 (2024-12-21) |
| ~~406 Not Acceptable~~ | .single() 사용 시 0건 에러 | .maybeSingle()로 변경 | 🔴 높음 | ✅ 해결됨 (2024-12-21) |
| ~~댓글 안보임~~ | FK 조인 에러로 프로필 없음 | 별도 프로필 조회로 변경 | 🔴 높음 | ✅ 해결됨 (2024-12-21) |
| ~~그룹 삭제 안됨~~ | CASCADE 미설정 | 수동 관련 데이터 삭제 구현 | 🔴 높음 | ✅ 해결됨 (2024-12-21) |
| Storage 버킷 | 프로필 이미지 업로드 실패 가능 | Supabase Dashboard에서 버킷 생성 | 🟡 중간 | ⏳ 사용자 액션 |
| 이미지 첨부 | 묵상에 이미지 첨부 안됨 | Storage 정책 마이그레이션 작성됨 | 🟡 중간 | ✅ 코드 완료 (2024-12-21) |
| ~~소그룹 모임 게시글~~ | 모임 생성 후 게시글 추가 안됨 | FK 조인 에러 수정됨 | 🟡 중간 | ✅ 해결됨 (2024-12-21) |

---

## 📋 다음 작업 (TODO) - 기존

- [ ] ImageCropper를 프로필 편집 페이지에 통합
- [ ] Supabase Storage 버킷 생성 (`avatars`, `comment_attachments`)
- [ ] FCM 푸시 알림 설정 (Firebase 프로젝트 필요)
- [ ] 새 프로젝트 생성 페이지에 성경 범위 설정 기능 추가 (`/mypage/projects/new`)

---

## 🚀 Phase 11: 핵심 기능 고도화 (신규)

### 11-1: 통독일정 기간 필터링 ⭐⭐ 보통 ✅ 완료
> 성경 통독일정이 365일이면 너무 길어짐

- [x] 기간 선택 UI 추가 (주차별/기간별)
- [x] 기본값: 오늘 기준 전후 3일 (총 7일 표시)
- [x] "전체보기" 옵션 추가
- [x] 홈 화면 Day 이동에도 빠른 선택 기능 추가 (10번 연관)

### 11-2: 통독일정 QT 게시판 ⭐⭐⭐ 어려움 ✅ 완료
> 관리자가 올리는 QT북/교역자 코멘트 시스템

- [x] 통독일정 챕터 클릭 시 QT 게시판으로 이동
- [x] 관리자만 QT 글 작성 가능
- [x] 일반 멤버는 열람만 가능
- [x] QT 게시판 DB 테이블 설계 필요
- [x] 나누면 좋은 QT 질문 섹션

### 11-3: 알림 목록 구현 ⭐⭐ 보통 ✅ 이미 완료
> 알림설정은 있는데 실제 알림 목록이 없음

- [x] 알림 목록 페이지 구현 (`/notifications`)
- [x] 알림 데이터 저장 테이블 (notifications)
- [x] 읽음/안읽음 표시 (is_read 필드)
- [x] 알림 클릭 시 해당 페이지로 이동 (link 필드)
- [x] 실시간 알림 카운트 (layout.tsx 헤더)
- [x] 알림 타입별 아이콘/색상 (like, comment, reply, group_invite, group_notice, reminder)

### 11-4: 그룹별 데이터 분리 강화 ⭐⭐ 보통 ✅ 완료
> 활성화된 그룹에 따라 모든 데이터 조정

- [x] 통독일정 → 활성 그룹 기준
- [x] 나눔 목록 → 활성 그룹 기준
- [x] 캘린더 → 활성 그룹 기준
- [x] 검색 페이지 → 사용자가 속한 그룹만 검색 (보안 강화)

### 11-5: 리딩지저스 기본 일정 ⭐⭐ 보통 ✅ 완료
> 그룹 생성 시 "리딩지저스" 선택하면 기본 일정 적용

- [x] BibleRangeType에 'reading_jesus' 옵션 추가
- [x] 그룹 생성 모달에 "리딩지저스 (추천)" 버튼 추가
- [x] 리딩지저스 선택 시 365일 플랜 자동 설정 + 전체 성경 선택
- [x] 리딩지저스 선택 시 읽기 플랜 선택 UI 숨김 (자동 365일)
- [x] 기본 선택값을 'reading_jesus'로 변경

### 11-6: 멤버 통독 현황 조회 (관리자) ⭐⭐⭐ 어려움 ✅ 완료
> 관리자가 각 멤버의 읽기 현황 확인

- [x] 관리자 페이지에서 멤버 클릭 시 상세 현황
- [x] 언제 어떤 챕터를 읽었는지 표시
- [x] 빠진 챕터 목록 표시
- [x] 통계 대시보드 (완료율, 연속일수 등)

### 11-7: 등급별 권한 체계 정립 ⭐⭐ 보통 ✅ 완료
> 등급 추가 시 각 레벨 권한 명시

- [x] 레벨별 권한 정의 (5가지: 읽기, 묵상 작성, 모임 생성, 묵상 고정, 멤버 관리)
- [x] 등급 추가 UI에 권한 설정 섹션 추가
- [x] 권한 프리셋 5가지 (읽기만, 일반 멤버, 활동 멤버, 리더, 관리자)
- [x] 권한에 따른 기능 제한 로직 (community, meetings 페이지)

### 11-8: 도움말 시스템 보완 ⭐ 쉬움 ✅ 완료
> 전체 페이지에 도움말 추가 및 업데이트

- [x] 홈: Day 빠른 이동, 읽음 완료 확인 설명 추가
- [x] 성경: 기간 필터링, Long Press 체크 방법 설명 추가
- [x] 그룹: 리딩지저스 옵션, 활성 그룹 변경, 모임 목적 설명 추가
- [x] 마이페이지: 활성 그룹 변경, 읽은 말씀 메뉴 설명 추가
- [x] 관리자: 등급 관리 섹션 추가
- [x] 검색 페이지 도움말 신규 추가
- [x] 읽은 말씀 페이지 도움말 신규 추가

### 11-9: 읽음완료 UX 개선 ⭐⭐ 보통 ✅ 완료
> 읽음 체크에 확인 다이얼로그 추가

- [x] 통독일정에서 꾹 누르면 팝업 → 읽음완료 체크 (long press 500ms)
- [x] 홈에서 체크 시 "읽음 완료 처리하시겠습니까?" AlertDialog 확인
- [x] 해제 시에도 "해제하시겠습니까?" AlertDialog 확인
- [x] 읽음 완료 시 날짜/시간 기록
- [x] 읽은 날짜를 통독일정/홈에 표시

### 11-10: 홈 Day 빠른 이동 ⭐⭐ 보통 ✅ 완료
> Day1~Day365 빠른 선택 이동

- [x] Day 번호 클릭 시 입력 필드 표시
- [x] 특정 Day 입력 후 바로 점프
- [x] 범위 검증 (1~365)

### 11-11: 마이페이지 - 내가 읽은 말씀 ⭐⭐ 보통 ✅ 완료
> 읽음 처리된 말씀 목록 조회

- [x] "내가 읽은 말씀" 메뉴 추가
- [x] 읽은 말씀 목록 (언제 읽었는지 표시)
- [x] 클릭 시 해당 성경 읽기 페이지로 이동
- [x] 최근 7일 / 전체 탭 구분
- [x] 그룹별 읽은 말씀 분리 표시

### 11-12: 마이페이지 그룹 표시 및 변경 ⭐⭐ 보통 ✅ 완료
> 활성 그룹 표시 및 빠른 변경

- [x] 프로필 밑에 현재 활성 그룹 표시
- [x] 완료일/연속일수/진행률 → 그룹 기준으로 변경
- [x] 여러 그룹 소속 시 드롭다운으로 그룹 변경 가능

---

## 📊 Phase 11 우선순위 정리

| 우선순위 | 작업 | 난이도 | 상태 |
|----------|------|--------|------|
| 🔴 높음 | 11-9 읽음완료 UX | ⭐⭐ | ✅ 완료 |
| 🔴 높음 | 11-4 그룹별 데이터 | ⭐⭐ | ✅ 완료 |
| 🔴 높음 | 11-1 기간 필터링 | ⭐⭐ | ✅ 완료 |
| 🟡 중간 | 11-3 알림 목록 | ⭐⭐ | ✅ 이미 완료 |
| 🟡 중간 | 11-5 리딩지저스 일정 | ⭐⭐ | ✅ 완료 |
| 🟡 중간 | 11-10 Day 빠른 이동 | ⭐⭐ | ✅ 완료 |
| 🟡 중간 | 11-11 읽은 말씀 | ⭐⭐ | ✅ 완료 |
| 🟡 중간 | 11-12 그룹 표시 | ⭐⭐ | ✅ 완료 |
| 🟢 낮음 | 11-2 QT 게시판 | ⭐⭐⭐ | ✅ 완료 |
| 🟢 낮음 | 11-6 멤버 현황 | ⭐⭐⭐ | ✅ 완료 |
| 🟢 낮음 | 11-7 등급 권한 | ⭐⭐ | ✅ 완료 |
| 🟢 낮음 | 11-8 도움말 보완 | ⭐ | ✅ 완료 |

### ✅ Phase 11 완료 내역 (2024-12-20)

**완료된 작업: 12/12개 - Phase 11 완료!**

#### 11-1: 통독일정 기간 필터링 ✅
**수정 파일:**
- `src/app/(main)/bible/page.tsx`
  - `todayDay` useMemo로 오늘 Day 계산
  - `filteredPlan` useMemo로 전후 3일 필터링
  - "전체보기" 토글 버튼 추가
  - "오늘: Day X" 표시 추가

#### 11-4: 그룹별 데이터 분리 강화 ✅
**수정 파일:**
- `src/app/(main)/search/page.tsx`
  - 묵상 검색 시 사용자가 속한 그룹만 검색
  - `group_members` 조회 후 `groupIds` 필터링
  - `.in('group_id', groupIds)` 쿼리 추가
  - **보안 강화**: 타 그룹 묵상 노출 방지

#### 11-9: 읽음완료 UX 개선 ✅
**수정 파일:**
- `src/app/(main)/bible/page.tsx`
  - Long press (500ms) 핸들러 추가 (`useRef`, `useCallback`)
  - `AlertDialog` 컴포넌트로 확인 다이얼로그
  - 읽음 완료/해제 시 확인 메시지

- `src/app/(main)/home/page.tsx`
  - `AlertDialog` 컴포넌트 import
  - 체크박스 클릭 시 확인 다이얼로그 표시
  - "읽음 완료 처리하시겠습니까?" / "해제하시겠습니까?"

#### 11-10: 홈 Day 빠른 이동 ✅
**수정 파일:**
- `src/app/(main)/home/page.tsx`
  - Day 번호 클릭 시 입력 필드 토글
  - 1~365 범위 검증
  - Enter 또는 blur 시 해당 Day로 이동

#### 11-11: 마이페이지 - 내가 읽은 말씀 ✅
**신규 파일:**
- `src/app/(main)/mypage/readings/page.tsx`
  - 그룹별 읽은 말씀 조회
  - 최근 7일 / 전체 탭
  - 읽은 날짜 표시
  - 클릭 시 bible-reader로 이동

**수정 파일:**
- `src/app/(main)/mypage/page.tsx`
  - "내가 읽은 말씀" 메뉴 추가

#### 11-12: 마이페이지 그룹 표시 및 변경 ✅
**수정 파일:**
- `src/app/(main)/mypage/page.tsx`
  - `useGroup` 훅으로 `groups`, `setActiveGroup` 사용
  - 활성 그룹 표시
  - 여러 그룹 소속 시 Select 드롭다운으로 변경 가능

#### 11-2: QT 게시판 ✅ (2024-12-20)
**DB 마이그레이션:**
- `supabase/migrations/20241220_add_qt_posts.sql`
  - `qt_posts` 테이블 (그룹별 Day별 QT)
  - 제목, 본문, 질문(JSONB), 공개여부
  - RLS: 그룹 멤버 읽기, 관리자만 작성/수정/삭제

**타입 추가:**
- `src/types/index.ts`
  - `QTPost` 인터페이스
  - `QTPostWithAuthor` 인터페이스

**신규 페이지:**
- `src/app/(main)/qt/[day]/page.tsx`
  - Day별 QT 보기/작성/수정/삭제
  - 관리자만 작성 버튼 표시
  - 오늘의 읽기 범위 표시 + 성경 읽기 링크
  - 나눔 질문 섹션 (최대 3개)
  - 묵상 나눔 페이지 바로가기

**연결 추가:**
- `src/app/(main)/bible/page.tsx`
  - 통독 일정에 QT 아이콘 버튼 추가
- `src/app/(main)/home/page.tsx`
  - 오늘 말씀에 QT 버튼 추가
- `src/data/helpContent.ts`
  - 성경 도움말에 QT 보기 섹션 추가

#### 11-6: 멤버 통독 현황 조회 ✅ (2024-12-20)
**신규 페이지:**
- `src/app/(main)/group/[id]/admin/member/[memberId]/page.tsx`
  - 멤버 프로필 및 등급 표시
  - 진행 통계 (완료일, 빠진 날, 연속일수, 최장연속, 주간평균)
  - 캘린더 탭 (월별 읽기 현황 표시)
  - 완료한 읽기 목록 (날짜, 범위, 체크 시간)
  - 빠진 읽기 목록 (성경 읽기 페이지 이동 링크)
  - 진행률 Progress 바

**관리자 페이지 수정:**
- `src/app/(main)/group/[id]/admin/page.tsx`
  - 멤버 행 클릭 시 상세 페이지로 이동
  - 클릭 영역과 버튼 영역 분리 (`stopPropagation`)
  - ChevronRight 아이콘 추가로 클릭 가능 힌트
  - hover 효과 및 cursor-pointer 스타일 추가

#### 11-7: 등급별 권한 체계 정립 ✅ (2024-12-20)
**타입 정의:**
- `src/types/index.ts`
  - `RankPermissions` 인터페이스 (5가지 권한)
  - `RANK_PERMISSION_PRESETS` 권한 프리셋 (5가지)
  - `MemberRank.permissions` 필드 추가

**DB 마이그레이션:**
- `supabase/migrations/20241220_add_rank_permissions.sql`
  - `permissions` JSONB 컬럼 추가
  - 권한 필드 유효성 체크 제약 조건
  - 기존 등급에 레벨 기반 기본 권한 설정

**등급 관리 UI 개선:**
- `src/app/(main)/group/[id]/admin/ranks/page.tsx`
  - 권한 프리셋 버튼 (읽기만/일반 멤버/활동 멤버/리더/관리자)
  - 개별 권한 토글 체크박스 UI
  - 등급 목록에 권한 아이콘 표시
  - 등급 생성/수정 시 권한 저장

**권한 제한 로직:**
- `src/app/(main)/community/page.tsx`
  - `userPermissions` 상태 추가
  - `checkAdminStatus`에서 권한 조회
  - `can_comment` 없으면 묵상 작성 UI 숨김
  - `can_pin_comment` 없으면 고정 메뉴 숨김

- `src/app/(main)/group/[id]/meetings/page.tsx`
  - `checkUserPermissions` 함수 추가
  - `can_create_meeting` 없으면 모임 만들기 버튼 숨김

**도움말 업데이트:**
- `src/data/helpContent.ts`
  - 관리자 페이지에 "권한 설정" 섹션 추가

**권한 종류:**
| 권한 | 설명 |
|------|------|
| can_read | 읽기 권한 (기본) |
| can_comment | 묵상 작성 권한 |
| can_create_meeting | 모임 생성 권한 |
| can_pin_comment | 묵상 고정 권한 |
| can_manage_members | 멤버 관리 권한 |

### 📁 Phase 11 신규 생성 파일

```
src/app/(main)/mypage/readings/page.tsx   # 내가 읽은 말씀 페이지
src/app/(main)/group/[id]/admin/member/[memberId]/page.tsx  # 멤버 통독 현황 상세 페이지
src/app/(main)/qt/[day]/page.tsx          # QT 게시판 페이지
src/components/ui/slider.tsx              # shadcn/ui Slider 컴포넌트
supabase/migrations/20241220_add_rank_permissions.sql  # 등급 권한 마이그레이션
supabase/migrations/20241220_add_qt_posts.sql          # QT 게시판 마이그레이션
```

### 📝 Phase 11 수정된 파일

```
src/app/(main)/
├── bible/page.tsx           # 기간 필터링, long press 체크, todayDay 표시, QT 버튼
├── home/page.tsx            # AlertDialog 확인, Day 빠른 입력 이동, QT 버튼
├── search/page.tsx          # 그룹별 데이터 분리 (보안)
├── mypage/page.tsx          # 그룹 선택기, 읽은 말씀 메뉴 추가
├── bible-reader/page.tsx    # Suspense 경계 추가 (useSearchParams)
└── group/[id]/admin/page.tsx  # 멤버 클릭 시 상세 페이지 이동

src/components/
├── ui/rich-editor.tsx       # disabled prop 추가
└── GroupNotices.tsx         # toast variant 수정

src/types/index.ts           # RankPermissions, RANK_PERMISSION_PRESETS, QTPost 추가
src/data/helpContent.ts      # 권한 설정, QT 보기 도움말 추가
```

### 🔧 Phase 11 버그 수정

| 버그 | 해결 |
|------|------|
| Set iteration 타입 에러 | `Array.from(new Set([...]))` 변환 |
| RichEditor disabled prop 없음 | `disabled?: boolean` prop 추가 |
| Slider 컴포넌트 없음 | `slider.tsx` 생성 + @radix-ui/react-slider 설치 |
| toast variant 'destructive' 오류 | 'error'로 변경 |
| useSearchParams Suspense 필요 | Suspense 경계 래퍼 추가 |

---

## 🚀 Phase 12: 댓글 시스템 고도화 + 멘션 기능 (2024-12-21)

### Phase 12-1: 알림 생성 시스템 구현 ✅

**문제 상황:**
- `/notifications` 페이지에서 알림이 표시되지 않음
- 알림 설정 페이지는 리마인더 예약용이고, 이벤트 기반 알림 생성 로직이 없었음

**해결:**
- `src/lib/notifications.ts` 유틸리티 생성
- 좋아요, 답글, 그룹 공지 시 알림 자동 생성
- 자기 자신에게는 알림 미발송 처리

```typescript
// 알림 생성 함수들
createNotification()        // 기본 알림 생성
createLikeNotification()    // 좋아요 알림
createReplyNotification()   // 답글 알림
createGroupNoticeNotification()  // 그룹 공지 알림 (모든 멤버에게)
```

### Phase 12-2: 리치 에디터 Typography 플러그인 ✅

**문제 상황:**
- H2, List, ListOrdered, Quote 버튼 클릭 시 시각적 변화 없음
- `prose` 클래스가 작동하지 않음

**원인:**
- `@tailwindcss/typography` 플러그인 미설치

**해결:**
```bash
npm install @tailwindcss/typography
```

```typescript
// tailwind.config.ts
plugins: [
  require("tailwindcss-animate"),
  require("@tailwindcss/typography"),  // 추가
],
```

### Phase 12-3: AlertDialog 접근성 경고 수정 ✅

**문제 상황:**
```
Warning: Missing `Description` or `aria-describedby={undefined}`
for {DialogContent}.
```

**원인:**
- 이미지/PDF 미리보기 모달에 `AlertDialogTitle` 누락

**해결:**
```tsx
<AlertDialogTitle className="sr-only">이미지 미리보기</AlertDialogTitle>
<AlertDialogTitle className="sr-only">PDF 미리보기: {modalPdfName}</AlertDialogTitle>
```

### Phase 12-4: 답글 작성 후 목록 미표시 버그 ✅

**문제 상황:**
- 답글 작성 후 "댓글이 등록되었습니다" 토스트는 뜨지만 답글 목록이 안 보임

**원인:**
- `fetchReplies()` 호출 후 `expandedReplies`에 commentId가 추가되지 않음
- `Collapsible`이 열려있어야 답글 목록이 표시됨

**해결:**
```typescript
// handleSubmitReply 함수에서
setExpandedReplies(prev => new Set(prev).add(commentId));
await fetchReplies(commentId);
```

### Phase 12-5: 대댓글 + 멘션 기능 구현 ✅

**새 기능:**
- 답글에 대한 답글 (대댓글)
- `@닉네임` 형태로 대댓글 대상 표시
- 답글 버튼 클릭 시 멘션 대상 자동 설정

**DB 마이그레이션:**
```sql
-- 20241221_add_reply_mentions.sql
ALTER TABLE comment_replies
ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES comment_replies(id);

ALTER TABLE comment_replies
ADD COLUMN IF NOT EXISTS mentioned_user_id UUID REFERENCES profiles(id);
```

**타입 정의 수정:**
```typescript
interface CommentReply {
  parent_reply_id: string | null;    // 대댓글인 경우 부모 답글 ID
  mentioned_user_id: string | null;  // 멘션된 사용자 ID
}

interface CommentReplyWithProfile extends CommentReply {
  mentioned_user?: Pick<Profile, 'nickname'> | null;
}
```

### Phase 12-6: @ 멘션 자동완성 기능 ✅

**새 컴포넌트:** `src/components/ui/mention-input.tsx`

**기능:**
- `@` 입력 시 그룹 멤버 자동완성 목록 표시
- 닉네임으로 필터링 검색
- 키보드 네비게이션 (↑↓ 이동, Enter/Tab 선택, Esc 취소)
- 단일 줄 (Input) / 멀티 줄 (Textarea) 지원

**적용 위치:**
- 묵상 글 작성 (일반 모드)
- 댓글 작성

**MentionText 컴포넌트:**
- `@닉네임` 패턴을 파란색으로 하이라이트 표시
- 묵상 내용, 답글 내용에 적용

---

### 📁 Phase 12 신규 생성 파일

```
src/lib/notifications.ts                      # 알림 생성 유틸리티
src/components/ui/mention-input.tsx           # 멘션 입력 컴포넌트
supabase/migrations/20241221_add_reply_mentions.sql  # 대댓글/멘션 마이그레이션
```

### 📝 Phase 12 수정된 파일

```
src/app/(main)/community/page.tsx    # 알림 생성, 멘션 기능, 답글 펼침 수정
src/components/GroupNotices.tsx      # groupName prop 추가, 공지 알림 생성
src/app/(main)/group/[id]/page.tsx   # groupName prop 전달
src/types/index.ts                   # CommentReply 타입에 멘션 필드 추가
tailwind.config.ts                   # @tailwindcss/typography 플러그인 추가
```

### 🔧 Phase 12 버그 수정 상세

| 버그 | 원인 | 해결 |
|------|------|------|
| 알림이 생성되지 않음 | 이벤트 발생 시 알림 생성 로직 없음 | `notifications.ts` 유틸리티 생성 및 이벤트에 연결 |
| H2/List/Quote 서식 미적용 | `@tailwindcss/typography` 미설치 | 플러그인 설치 및 config에 추가 |
| AlertDialog 접근성 경고 | `AlertDialogTitle` 누락 | `sr-only` 클래스로 숨김 타이틀 추가 |
| 답글 작성 후 목록 안 보임 | `expandedReplies`에 ID 미추가 | 답글 작성 후 Set에 commentId 추가 |
| tiptap duplicate extension 경고 | StarterKit에 underline 없음 (무해함) | 무시 (실제 중복 아님) |
| FK join 에러 | Supabase join 문법 변경 | 별도 쿼리로 분리하여 조회 |
| `.single()` 에러 | 결과 없을 때 에러 발생 | `.maybeSingle()`로 변경 |

### 💡 Phase 12 주요 학습 포인트

1. **Supabase FK Join 제한**: 복잡한 join은 별도 쿼리로 분리하는 것이 안정적
2. **`.single()` vs `.maybeSingle()`**: 결과가 없을 수 있으면 반드시 `.maybeSingle()` 사용
3. **Tailwind Typography**: `prose` 클래스는 별도 플러그인 필요
4. **Radix AlertDialog**: 접근성을 위해 Title 필수 (sr-only로 숨김 가능)
5. **React State와 UI 동기화**: 목록 펼침 상태(expandedReplies)와 데이터 fetch가 모두 필요

---

*마지막 업데이트: 2024-12-21*
*DB 마이그레이션: 18개 완료 (12/21 대댓글/멘션 마이그레이션 추가)*

### 완료된 Phase 요약
| Phase | 주요 기능 | 상태 |
|-------|----------|------|
| 1-3 | 기본 구조, 인증, 그룹 | ✅ 완료 |
| 4-5 | 성경 읽기, 묵상 작성 | ✅ 완료 |
| 6-7 | 알림, 커뮤니티, PWA | ✅ 완료 |
| 8 | 버그 수정, UI 개선 | ✅ 완료 |
| 9 | 그룹 고급화 (게시판/범위/일정/목적) | ✅ 완료 |
| 10 | 검색, 푸시, UI 통일 | 🔄 진행 중 (3/4) |
| 11 | 핵심 기능 고도화 | ✅ 완료 (12/12) |
| 12 | 댓글 고도화, 알림, 멘션 | ✅ 완료 |

---

## 📋 앞으로 해야 할 작업 (TODO)

### 🔴 우선순위 높음 (당장 필요)

#### 1. DB 마이그레이션 적용 ⏳
> Supabase SQL Editor에서 실행 필요

```
supabase/migrations/20241221_add_reply_mentions.sql  # 대댓글/멘션 기능
```

#### 2. Storage 버킷 생성 ⏳
> Supabase Dashboard에서 수동 생성 필요

| 버킷명 | 용도 | 공개 여부 |
|--------|------|----------|
| `avatars` | 프로필 이미지 | 공개 |
| `comment_attachments` | 묵상 첨부파일 | 공개 |

---

## ✅ Phase 13: 성경 읽기 중 묵상 작성 기능 (2024-12-21)

### 개요
성경을 읽으면서 바로 묵상을 작성할 수 있는 통합 UX 구현

### 주요 기능

#### 13-1: 바텀시트 컴포넌트 ✅
**신규 파일:** `src/components/ui/bottom-sheet.tsx`

**기능:**
- 드래그로 높이 조절 가능 (터치/마우스 이벤트 지원)
- 스냅 포인트: 25%, 33%, 50%, 75%
- 배경 오버레이 클릭 시 닫기
- 닫기 버튼 옵션
- 제목 표시 옵션

**Props:**
```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  defaultHeight?: 'quarter' | 'third' | 'half' | 'threeQuarter';
  title?: string;
  showCloseButton?: boolean;
}
```

#### 13-2: 임시저장 시스템 ✅
**신규 파일:** `src/lib/draftStorage.ts`

**기능:**
- 하이브리드 저장: localStorage 즉시 저장 + Supabase 백업
- 자동 저장: 3초 디바운스
- 드래프트 CRUD (생성, 읽기, 수정, 삭제)
- 서버 동기화

**주요 함수:**
```typescript
// localStorage
saveDraftLocal(draft: Draft): void
getDraftLocal(id: string): Draft | null
getAllDraftsLocal(): Draft[]
getDraftsLocalByGroup(groupId: string): Draft[]
deleteDraftLocal(id: string): void
createEmptyDraft(userId, groupId, dayNumber): Draft
generateDraftId(): string

// Supabase
saveDraftToServer(draft): Promise<boolean>
loadDraftsFromServer(userId, groupId): Promise<Draft[]>
deleteDraftFromServer(id: string): Promise<boolean>
syncDraftsToServer(): Promise<number>
mergeDraftsWithServer(userId, groupId): Promise<Draft[]>

// 유틸리티
getDraftPreview(draft): string  // 최대 50자 미리보기
getDraftTitle(draft): string    // "Day X 묵상 (M/D)"
scheduleAutoSave(draft, delayMs): void
cancelAutoSave(): void
```

**DB 마이그레이션:** `supabase/migrations/20241221_add_draft_posts.sql`
```sql
CREATE TABLE IF NOT EXISTS draft_posts (
  id TEXT PRIMARY KEY,  -- 클라이언트 생성 ID
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  is_rich_editor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### 13-3: 드래프트 선택기 컴포넌트 ✅
**신규 파일:** `src/components/DraftSelector.tsx`

**기능:**
- 드롭다운으로 임시저장된 묵상 목록 표시
- 새 묵상 작성 옵션
- 각 드래프트 미리보기 (제목, 시간, 내용 일부)
- 드래프트 삭제 기능 (삭제 확인 다이얼로그)

**Props:**
```typescript
interface DraftSelectorProps {
  userId: string;
  groupId: string;
  dayNumber: number;
  currentDraftId?: string;
  onSelect: (draft: Draft) => void;
  onNew: () => void;
  className?: string;
}
```

#### 13-4: 성경 페이지 구절 선택 + 묵상 패널 ✅
**수정 파일:** `src/app/(main)/bible-reader/page.tsx`

**구절 선택 기능:**
- 단일 구절 클릭: 해당 구절 선택/해제
- 꾹 누르기 (500ms) + 드래그: 여러 구절 범위 선택
- 선택된 구절 시각적 하이라이트 (primary 색상 배경 + 좌측 테두리)

**복사/삽입 동작:**
- 패널 닫힘 상태: 선택된 구절 클립보드 복사 + 토스트 알림
- 패널 열림 상태: 묵상 작성 영역에 인용구 형태로 직접 삽입

**인용구 형식:**
```
> 창세기 1:1-3
> 태초에 하나님이 천지를 창조하시니라.
> 땅이 혼돈하고 공허하며...
```

**UI 추가:**
- 하단 플로팅 버튼: 연필 아이콘으로 묵상 패널 열기
- 하단 안내 영역에 "묵상 작성하기" 버튼
- 슬라이드업 바텀시트 패널
- 드래프트 선택기 + MentionInput + 저장/발행 버튼

**자동 저장:**
- 내용 변경 시 3초 후 localStorage에 자동 저장
- 저장 상태 표시 ("저장됨" 뱃지)

#### 13-5: 나눔 페이지 임시저장 드롭다운 ✅
**수정 파일:** `src/app/(main)/community/page.tsx`

**변경사항:**
- DraftSelector 컴포넌트 통합
- 작성 모드 상태 관리 (currentDraft, showDraftSelector)
- 드래프트 선택 시 내용 불러오기
- 새 묵상 작성 시 빈 드래프트 생성
- 발행 후 드래프트 삭제

### 📁 Phase 13 신규 생성 파일

```
src/components/ui/bottom-sheet.tsx    # 드래그 가능 바텀시트
src/components/DraftSelector.tsx      # 임시저장 선택기
src/lib/draftStorage.ts               # 임시저장 관리 유틸리티
supabase/migrations/20241221_add_draft_posts.sql  # 드래프트 테이블
```

### 📝 Phase 13 수정된 파일

```
src/types/index.ts                    # Draft 인터페이스 추가
src/app/(main)/bible-reader/page.tsx  # 구절 선택 + 묵상 패널 통합
src/app/(main)/community/page.tsx     # 임시저장 드롭다운 추가
```

### 타입 정의

```typescript
// src/types/index.ts
export interface Draft {
  id: string;
  user_id: string;
  group_id: string;
  day_number: number;
  title?: string;
  content: string;
  is_rich_editor: boolean;
  created_at: string;
  updated_at: string;
  synced?: boolean;  // localStorage 전용
}
```

### DB 마이그레이션 적용 ✅ 완료 (2024-12-21)

```
supabase/migrations/20241221_add_reply_mentions.sql  # 대댓글/멘션 기능
supabase/migrations/20241221_add_draft_posts.sql     # 임시저장 묵상 테이블
```

### 🔧 Phase 13 빌드 오류 수정 (2024-12-21)

| 오류 | 원인 | 해결 |
|------|------|------|
| `@/hooks/use-toast` 모듈 없음 | 잘못된 import 경로 | `@/components/ui/toast`로 수정 |
| `Button`, `createEmptyDraft` 미사용 | DraftSelector에서 사용 안 함 | import 제거 |
| `getDraftLocal`, `saveDraftToServer` 미사용 | bible-reader에서 사용 안 함 | import 제거 |
| `Save` 아이콘 미사용 | community에서 JSX에 없음 | import 제거 |
| `showDraftSelector` 미사용 | community 상태 불필요 | 상태 제거 |
| `synced` 변수 미사용 | draftStorage에서 destructuring만 | `void _synced` 처리 |
| `/explore` 페이지 못 찾음 | 라우트 그룹 경로 오류 | `/guest/explore` → `/explore` 수정 |
| `Check` 아이콘 없음 | import 제거됨 | 다시 import 추가 |

### 🔧 Phase 13 기능 버그 수정 (2024-12-21)

#### 1. 구절 삽입 버그 수정
- **문제**: 묵상 패널 열린 상태에서 구절 클릭 시 삽입 안 됨
- **원인**: `useCallback`에서 `currentDraft` 직접 참조 시 클로저 문제
- **해결**: 함수형 상태 업데이트 `setCurrentDraft(prev => ...)` 사용

#### 2. 패널 닫힘 버그 수정
- **문제**: 구절 클릭 시 묵상 패널이 닫힘
- **원인**: BottomSheet의 오버레이 클릭 이벤트가 구절 클릭 이벤트 가로챔
- **해결**: `closeOnOverlayClick={false}` props 추가, 오버레이 `pointer-events-none` 적용

#### 3. 드래그 선택 기능 구현
- **요청**: 꾹 누른 상태에서 드래그로 여러 구절 선택
- **구현**:
  - `isDraggingSelection` 상태 추가
  - `handleVerseHover` - 드래그 중 범위 확장
  - `handleTouchMoveOnVerses` - 터치 드래그 처리
  - `handleMouseMoveOnVerses` - 마우스 드래그 처리
  - `data-verse` 속성으로 요소 식별
  - 드래그 종료 시 자동 삽입/복사

#### 4. 배경 스크롤 허용
- **문제**: 묵상 패널 열려있을 때 성경 본문 스크롤 불가
- **해결**:
  - `document.body.style.overflow = 'hidden'` 제거
  - 오버레이 완전 `pointer-events-none` 적용
  - 묵상 패널 열릴 때 `pb-[55vh]` 하단 여백 추가

---

*마지막 업데이트: 2024-12-21*
*PWA 배포: https://reading-jesus-tau.vercel.app*
*DB 마이그레이션: 19개 완료 (12/21 드래프트 + 멘션 마이그레이션 적용)*

### 완료된 Phase 요약
| Phase | 주요 기능 | 상태 |
|-------|----------|------|
| 1-3 | 기본 구조, 인증, 그룹 | ✅ 완료 |
| 4-5 | 성경 읽기, 묵상 작성 | ✅ 완료 |
| 6-7 | 알림, 커뮤니티, PWA | ✅ 완료 |
| 8 | 버그 수정, UI 개선 | ✅ 완료 |
| 9 | 그룹 고급화 (게시판/범위/일정/목적) | ✅ 완료 |
| 10 | 검색, 푸시, UI 통일 | 🔄 진행 중 (3/4) |
| 11 | 핵심 기능 고도화 | ✅ 완료 (12/12) |
| 12 | 댓글 고도화, 알림, 멘션 | ✅ 완료 |
| 13 | 성경 읽기 중 묵상 작성 | ✅ 완료 + 빌드 통과 |

**생성 방법:**
1. Supabase Dashboard → Storage → New bucket
2. 버킷 이름 입력 → Public bucket 체크 → Create

#### 3. ImageCropper 통합 ⏳
> 프로필 편집 페이지에 이미지 크롭 기능 연결

- [ ] `/mypage` 프로필 편집에 ImageCropper 적용
- [ ] 크롭된 이미지 Supabase Storage 업로드
- [ ] 업로드 후 프로필 URL 업데이트

---

### 🟡 우선순위 중간 (기능 완성도)

#### 4. FCM 푸시 알림 (Phase 10-4) ⏳
> 실제 모바일 푸시 알림 구현

**필요 작업:**
- [ ] Firebase 프로젝트 생성
- [ ] FCM 설정 (firebase-messaging-sw.js)
- [ ] 푸시 토큰 저장 테이블 생성
- [ ] 서버 사이드 푸시 발송 (Edge Function 또는 외부 서버)
- [ ] 알림 설정과 FCM 연동

**난이도:** ⭐⭐⭐ 어려움

#### 5. 새 프로젝트 성경 범위 설정 ⏳
> `/mypage/projects/new` 페이지 개선

- [ ] 프로젝트 생성 시 성경 범위 선택 UI 추가
- [ ] 그룹과 동일한 BibleRange 컴포넌트 재사용

#### 6. 멘션 알림 생성 ⏳
> @ 멘션 시 해당 사용자에게 알림

- [ ] `createMentionNotification()` 함수 추가
- [ ] 묵상 작성 시 멘션된 사용자에게 알림
- [ ] 답글 작성 시 멘션된 사용자에게 알림

---

### 🟢 우선순위 낮음 (향후 개선)

#### 7. 설정 페이지 구현 ⏳
> `/mypage/settings` 페이지

- [ ] 앱 테마 설정 (다크모드)
- [ ] 글꼴 크기 설정
- [ ] 언어 설정 (한국어/영어)
- [ ] 데이터 내보내기/가져오기

#### 8. 오프라인 지원 강화 ⏳
> PWA 오프라인 기능

- [ ] Service Worker 캐시 전략 개선
- [ ] 오프라인 시 읽기 기능
- [ ] 오프라인 작업 후 동기화

#### 9. 성능 최적화 ⏳
> 대규모 데이터 처리

- [ ] 무한 스크롤 구현 (묵상 목록)
- [ ] 이미지 lazy loading
- [ ] API 응답 캐싱

#### 10. 통계 대시보드 ⏳
> 그룹/개인 통계 시각화

- [ ] 차트 라이브러리 적용 (Recharts)
- [ ] 주간/월간 읽기 현황 그래프
- [ ] 그룹 전체 진행률 비교

---

### 📝 알려진 이슈

| 이슈 | 설명 | 우선순위 | 상태 |
|------|------|----------|------|
| Storage 버킷 | 프로필/첨부 이미지 업로드 실패 가능 | 🔴 높음 | ⏳ 사용자 액션 |
| FCM 미구현 | 실제 푸시 알림 미발송 | 🟡 중간 | ⏳ 대기 |
| 멘션 알림 | @ 멘션 시 알림 미발송 | 🟡 중간 | ⏳ 대기 |

---

### 🎯 Phase 13 계획 (예정)

> 다음 대규모 업데이트 방향

1. **소셜 기능 강화**
   - 사용자 간 팔로우/팔로워
   - 좋아요 누른 사람 목록 보기
   - 묵상 공유하기 (SNS 공유)

2. **게이미피케이션**
   - 연속 읽기 배지 시스템
   - 레벨 시스템 (읽은 양 기준)
   - 그룹 내 랭킹 보드

3. **AI 기능**
   - AI 묵상 도우미 (질문 생성)
   - 성경 본문 요약
   - 비슷한 구절 추천

4. **관리자 기능 고도화**
   - 대시보드 리포트 내보내기
   - 자동 리마인더 발송
   - 멤버 활동 로그

---

## ✅ Phase 14: 통합 관리자 페이지 (2024-12-21 완료)

> 앱 전체를 관리할 수 있는 관리자 대시보드 구현

### 개요
- **목표**: 사용자, 그룹, 콘텐츠, 교회를 한 곳에서 관리
- **대상**: 최고 관리자 (Super Admin), 콘텐츠 관리자 (Moderator)
- **특징**: PC/모바일 반응형 UI

### 구조
```
/admin                    → 대시보드 (통계/차트)
/admin/users              → 사용자 관리
/admin/users/[id]         → 사용자 상세
/admin/groups             → 그룹 관리
/admin/groups/[id]        → 그룹 상세
/admin/moderation         → 콘텐츠 모더레이션 (통합)
/admin/churches           → 교회/QR 관리 (기존 이동)
/admin/settings           → 시스템 설정
```

### Phase 14-1: 기반 작업 ✅ 완료
- [x] profiles 테이블에 role 컬럼 추가
- [x] audit_logs 테이블 생성
- [x] system_settings 테이블 생성
- [x] reports (신고) 테이블 생성
- 마이그레이션: `20241221_add_admin_schema.sql`

### Phase 14-2: 관리자 레이아웃 ✅ 완료
- [x] `/admin/layout.tsx` - PC 사이드바, 모바일 바텀네비
- [x] 관리자 권한 체크 (레이아웃에서 처리)
- [x] 반응형 네비게이션 (PC: 사이드바 240px, 모바일: 바텀네비 + 햄버거 메뉴)

### Phase 14-3: 대시보드 ✅ 완료
- [x] 핵심 지표 카드 (총 사용자, 그룹, 교회, 게시글)
- [x] 오늘 활동 통계 (오늘 작성된 글)
- [x] 최근 활동 목록
- [x] 빠른 작업 링크

### Phase 14-4: 사용자 관리 ✅ 완료
- [x] 사용자 목록 (검색/필터)
- [x] 역할 필터 (관리자/모더레이터/일반)
- [x] 사용자 상세 다이얼로그
- [x] 권한 변경 기능
- [x] 페이지네이션
- [x] PC 테이블 뷰 / 모바일 카드 뷰

### Phase 14-5: 콘텐츠 모더레이션 ✅ 완료
- [x] posts + guest_comments 탭 분리 뷰
- [x] 콘텐츠 삭제 기능 (확인 다이얼로그)
- [x] 삭제 사유 입력 (선택)
- [x] 신고 탭 (reports 테이블 연동 준비)
- [x] 페이지네이션

### Phase 14-6: 그룹 관리 ✅ 완료
- [x] 그룹 목록 (검색)
- [x] 그룹 상세 다이얼로그 (멤버/게시글 수)
- [x] 공개/비공개 표시
- [x] 그룹 페이지 바로가기
- [x] 페이지네이션
- [x] PC 테이블 뷰 / 모바일 카드 뷰

### Phase 14-7: 교회 관리 통합 ✅ 완료
- [x] 기존 교회 관리 기능 통합
- [x] 교회 등록/삭제
- [x] 토큰 재생성, URL 복사
- [x] 교회 페이지 열기
- [x] 검색 및 페이지네이션
- [x] PC 테이블 뷰 / 모바일 카드 뷰

### Phase 14-8: 시스템 설정 ✅ 완료
- [x] 일반 설정 (사이트 이름, 설명, 유지보수 모드)
- [x] 알림 설정 (이메일/푸시)
- [x] 보안 설정 (회원가입 허용, 이메일 인증, 로그인 시도 제한)
- [x] 콘텐츠 설정 (비회원 댓글, 게시글 승인, 최대 길이)
- [x] 시스템 정보 표시

### 기술적 포인트
1. **보안**: Server Actions로 민감한 작업 처리
2. **권한**: RLS + app_metadata 기반 역할 관리
3. **로깅**: 모든 관리 작업 audit_logs 기록
4. **성능**: 통계 쿼리 캐싱 (1시간 단위)

### 관련 파일
- `src/app/admin/layout.tsx` - 관리자 레이아웃
- `src/app/admin/page.tsx` - 대시보드
- `src/app/admin/users/page.tsx` - 사용자 관리
- `src/app/admin/moderation/page.tsx` - 모더레이션
- `src/components/admin/AdminSidebar.tsx` - PC 사이드바
- `src/components/admin/AdminBottomNav.tsx` - 모바일 네비

---

## 🚀 Phase 15: 2026 리딩지저스 일정 적용 (2024-12-21)

### Phase 15-1: 리딩지저스 264일 일정 적용 ✅ 완료
- [x] `reading_plan.json` 6일 테스트 → 264일 2026 공식 일정으로 업데이트
- [x] 일정 구조 변경: `description` → `reading`, `date`, `memory_verse` 필드 추가
- [x] `ReadingPlan` TypeScript 타입 업데이트
- [x] 영향받는 모든 페이지 수정:
  - `src/app/(guest)/preview/page.tsx`
  - `src/app/(main)/bible/page.tsx`
  - `src/app/(main)/home/page.tsx`
  - `src/app/(main)/qt/[day]/page.tsx`
  - `src/app/(main)/community/page.tsx`
  - `src/app/(main)/mypage/readings/page.tsx`
  - `src/app/(main)/mypage/projects/[id]/page.tsx`

### Phase 15-2: 초대 코드 대소문자 이슈 수정 ✅ 완료
- [x] 초대 코드 검색 `.eq()` → `.ilike()`로 변경 (대소문자 구분 없음)
- [x] DB에 `7bceaa3c`로 저장, 사용자 입력 `7BCEAA3C`도 인식

### Phase 15-3: 교회 페이지 일정 연동 ✅ 완료
- [x] `churches` 테이블에 `schedule_year`, `schedule_start_date` 컬럼 추가
- [x] `church/[code]/page.tsx`에서 `reading_schedules` DB 테이블 연동
- [x] 교회별로 다른 년도 일정 사용 가능
- [x] `church_today_reading` 뷰 생성

### 관련 마이그레이션 SQL
- `20241221_add_church_schedule.sql` - churches 테이블 schedule_year 컬럼 추가
- `20241221_add_reading_schedule_2026.sql` - 2026년 264일 일정 데이터

### 배포
- **Vercel Production**: https://www.reading-jesus.com
- **빌드 성공**: 2024-12-21

---

## 📋 다음 작업 (TODO)

- [ ] 2026년 암송 구절(memory_verse) 데이터 추가 (현재 null)
- [x] 그룹별 일정 시작일 커스텀 기능 → Phase 15-4에서 완료
- [ ] 보충 주간(supplement week) UI 처리
- [ ] Supabase 이메일 발송 설정 (SMTP 또는 Resend 연동)
- [ ] WebSocket Realtime 연결 문제 확인

---

## Phase 15-4: 날짜 기반 일정 시스템 ✅ 완료 (2024-12-22)

### 구현 내용
- [x] 홈 페이지를 Day 기반에서 날짜 기반으로 변경
- [x] `schedule_mode` 타입 추가 (`'calendar'` | `'day_count'`)
- [x] Group 타입에 `schedule_mode` 필드 추가
- [x] 그룹 생성 시 일정 모드 선택 UI 추가
  - 📅 캘린더 모드 (추천): 리딩지저스 2026 공식 일정에 맞춰 진행
  - 🔢 Day 순차 모드: 그룹 시작일부터 Day 1, 2, 3... 순서대로 진행
- [x] `findClosestPlan()` 함수: 오늘 날짜에 해당하는 일정 또는 가장 가까운 과거 일정 찾기
- [x] 관리자 비밀번호 재설정 페이지 추가 (`/admin/reset-password`)
- [x] 관리자 로그인 페이지에 "비밀번호를 잊으셨나요?" 링크 추가
- [x] profiles 테이블에 email 컬럼 추가 마이그레이션

### 관련 파일
- `src/app/(main)/home/page.tsx` - 날짜 기반 시스템으로 리팩토링
- `src/app/(main)/group/page.tsx` - 일정 모드 선택 UI 추가
- `src/types/index.ts` - ScheduleMode 타입 추가
- `src/app/admin/reset-password/page.tsx` - 비밀번호 재설정 페이지 (신규)
- `src/app/(admin-auth)/admin-login/page.tsx` - 비밀번호 재설정 링크 추가

### 마이그레이션 SQL
- `20241221_add_schedule_mode.sql` - groups 테이블에 schedule_mode 컬럼 추가
- `20241221_add_profile_email.sql` - profiles 테이블에 email 컬럼 추가

### 배포
- **Vercel Production**: https://www.reading-jesus.com
- **빌드 성공**: 2024-12-22

---

## 🐛 알려진 이슈 (2024-12-22)

| 이슈 | 설명 | 해결 방법 | 우선순위 | 상태 |
|------|------|----------|----------|------|
| ~~WebSocket 연결 실패~~ | Supabase Realtime 연결 안됨 | graceful 에러 처리 추가 | 🟡 중간 | ✅ 해결됨 |
| ~~406 Not Acceptable~~ | .single() 결과 없으면 에러 | .maybeSingle()로 변경 | 🔴 높음 | ✅ 해결됨 |
| Email logins disabled | Supabase에서 이메일 로그인 비활성화됨 | 아래 설정 가이드 참조 | 🟡 중간 | ⏳ 설정 필요 |
| Email not confirmed | 이메일 인증 안 된 계정 로그인 불가 | 아래 설정 가이드 참조 | 🟡 중간 | ⏳ 설정 필요 |
| 비밀번호 재설정 이메일 발송 실패 | Supabase 무료 플랜 이메일 제한 | SMTP 또는 Resend 연동 필요 | 🟡 중간 | ⏳ 설정 필요 |

---

## ⚙️ Supabase 설정 가이드

### 1. 이메일 로그인 활성화
> 공용 관리자 계정(이메일/비밀번호)을 사용하려면 필수

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 → **Authentication** → **Providers**
3. **Email** 클릭
4. 설정:
   - **Enable Email provider**: ✅ ON
   - **Confirm email**: ❌ OFF (이메일 인증 건너뛰기)
   - **Secure email change**: OFF (선택)
5. **Save** 클릭

### 2. 관리자 계정 생성 (이메일/비밀번호)
> 이메일 로그인 활성화 후 진행

1. **Authentication** → **Users** → **Add user** → **Create new user**
2. 입력:
   - Email: `admin@readingjesus.com`
   - Password: `원하는비밀번호`
   - **Auto Confirm User**: ✅ 체크
3. **Create user** 클릭
4. **SQL Editor**에서 role 설정:
   ```sql
   -- 생성된 유저 ID 확인
   SELECT id, email FROM auth.users WHERE email = 'admin@readingjesus.com';

   -- role 설정
   UPDATE profiles SET role = 'admin' WHERE id = '위에서_확인한_UUID';
   ```

### 3. 기존 Google 계정에 관리자 권한 부여
> 더 간단한 방법

1. **SQL Editor**에서:
   ```sql
   -- 본인 계정을 superadmin으로 설정
   UPDATE profiles SET role = 'superadmin' WHERE id = 'USER_UUID';

   -- 또는 이메일로 찾기
   UPDATE profiles SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'example@gmail.com');
   ```
2. `/admin-login`에서 **Google로 로그인** 클릭

### 4. 권한 종류
| role | 권한 |
|------|------|
| `superadmin` | 모든 권한 + 관리자 계정 관리 |
| `admin` | 사용자, 그룹, 콘텐츠 관리 |
| `moderator` | 콘텐츠 관리만 |
| `user` | 일반 사용자 (기본값) |

---

## 📋 앞으로 해야 할 작업 (TODO)

### 🔴 우선순위 높음
- [ ] **Supabase 이메일 로그인 활성화** - 공용 관리자 계정 사용 위해 필수
- [ ] **Storage 버킷 생성** - 프로필 이미지, 첨부파일 업로드용
  - `avatars` 버킷
  - `comment_attachments` 버킷

### 🟡 우선순위 중간
- [ ] **2026년 암송 구절(memory_verse) 데이터 추가** - 현재 null
- [ ] **보충 주간(supplement week) UI 처리** - 5주마다 보충 주간 표시
- [ ] **이메일 발송 설정** - 비밀번호 재설정, 알림 이메일 발송용
  - Supabase SMTP 설정 또는 Resend/SendGrid 연동

### 🟢 우선순위 낮음 (개선사항)
- [ ] **React Hook 의존성 경고 수정** - ESLint 경고 제거
- [ ] **`<img>` → `<Image>` 변경** - Next.js Image 최적화
- [ ] **ImageCropper 통합** - 프로필 편집 페이지에 적용
- [ ] **FCM 푸시 알림 설정** - Firebase 프로젝트 필요

### 📱 기능 추가 (향후)
- [ ] **카카오 로그인** - 코드 준비됨, Supabase 설정 필요
- [ ] **그룹별 커스텀 일정** - 각 그룹이 자체 읽기 일정 설정
- [ ] **오프라인 지원** - PWA 캐시 최적화

---

## 📊 현재 상태 요약

| 항목 | 상태 |
|------|------|
| **사이트** | https://www.reading-jesus.com |
| **배포** | Vercel (자동 배포) |
| **DB** | Supabase PostgreSQL |
| **인증** | Google OAuth (카카오 준비됨) |
| **일정** | 리딩지저스 2026 (264일) |
| **관리자** | `/admin` (role 설정 필요) |

---

## Phase 16: 교회별 QR 코드 일괄 생성 기능 ✅ 완료 (2024-12-22)

### 구현 내용
- [x] QR 코드 생성 유틸리티 (`src/lib/qr-generator.ts`)
  - `generateQRImage()`: 단일 QR 코드 이미지 생성 (1080x1080, Canvas 기반)
  - `downloadQRImage()`: 단일 QR 이미지 다운로드
  - `downloadQRBatch()`: 전체 일정 QR 코드 ZIP 다운로드
  - `downloadQRByMonth()`: 월별 QR 코드 ZIP 다운로드
- [x] QR 이미지 디자인
  - 상단: 교회 이름, 날짜 (월/일/요일)
  - 중앙: QR 코드 (둥근 모서리, 그림자 효과)
  - 하단: 성경 구절 범위 (예: "창 1-4"), 리딩지저스 로고
  - 크기: 1080x1080px
- [x] 관리자 페이지 QR 다운로드 UI (`/admin/churches`)
  - 각 교회별 QR 다운로드 버튼 추가
  - 다운로드 범위 선택 (전체/월별)
  - 진행 상태 표시 (프로그레스 바)
  - QR 미리보기 기능

### 설치된 패키지
- `qrcode` + `@types/qrcode`: QR 코드 생성
- `jszip` + `@types/jszip`: ZIP 파일 생성

### 사용법
1. `/admin/churches` 페이지 접속
2. 원하는 교회의 QR 버튼 클릭
3. 다운로드 범위 선택 (전체 264일 또는 월별)
4. "ZIP 다운로드" 클릭
5. 생성된 ZIP 파일에 날짜별 QR 이미지 포함

### 파일 구조
```
ZIP 파일 내용:
├── 2026-01-12_창 1-4.png
├── 2026-01-13_창 5-8.png
├── 2026-01-14_창 9-12.png
└── ... (264개 파일)
```

### 관련 파일
- `src/lib/qr-generator.ts` (신규)
- `src/app/admin/churches/page.tsx` (수정)
- `src/data/reading-schedule-2026.ts` (기존)

---

## Phase 17: 교회 교인 등록 시스템 ✅ 완료 (2024-12-22)

### 기능 설명
교회 코드를 기반으로 사용자가 교회에 등록할 수 있는 기능. 등록 교인은 QR 토큰 없이도 묵상글을 작성할 수 있음.

### 구현 항목
- [x] DB 마이그레이션: profiles에 church_id, church_joined_at 추가
- [x] guest_comments에 linked_user_id, linked_at 추가 (등록 교인 연동)
- [x] 타입 정의 업데이트 (Profile, ProfileWithChurch)
- [x] 교회 페이지 접근 제어 수정 (등록 교인도 작성 가능)
- [x] 교회 페이지에 "교회 등록" 버튼 추가
- [x] 마이페이지 "소속 교회" 섹션 추가 (등록/탈퇴 기능)
- [x] 그룹 페이지 헤더에 소속 교회 배지 표시
- [x] 교회 관리자 통계에 등록 교인 현황 추가

### 주요 변경 사항
1. **1인 1교회 제한**: 한 사용자는 하나의 교회에만 등록 가능
2. **등록 교인 혜택**: QR 코드 없이 묵상 작성 가능, 프로필 닉네임 자동 입력
3. **관리자 통계**: 등록 교인 수, 신규 등록, 교인 작성 비율 표시

### 관련 파일
- `supabase/migrations/20251222_add_church_membership.sql` (신규)
- `src/types/index.ts` (수정)
- `src/app/church/[code]/page.tsx` (수정)
- `src/app/(main)/mypage/page.tsx` (수정)
- `src/app/(main)/group/page.tsx` (수정)
- `src/app/church/[code]/admin/page.tsx` (수정)

---

## Phase 18: 교회 나눔 페이지에서 묵상 작성 기능 ✅ 완료 (2024-12-24)

### 기능 설명
교회별 나눔 페이지(/church/[code]/sharing)에서 직접 짧은 묵상 나눔을 작성할 수 있는 기능 추가.

### 구현 항목
- [x] 나눔 페이지에 "짧은 묵상 나눔 작성하기" 버튼 추가
- [x] 글 작성 다이얼로그 구현 (RichEditor 사용)
- [x] 이름 입력 (등록 교인은 자동 입력, 비로그인 시 localStorage 저장)
- [x] 성경 구절 입력 필드 (선택)
- [x] 작성 후 목록 자동 새로고침
- [x] 로그인 사용자 정보 로드 및 등록 교인 확인 로직

### 주요 변경 사항
1. 성경 읽기 페이지(bible)뿐 아니라 나눔 페이지에서도 묵상 작성 가능
2. 등록 교인은 닉네임 자동 입력, 비로그인 사용자는 이름 직접 입력
3. 성경 구절 필드를 자유 입력 형식으로 제공 (선택 사항)

### 관련 파일
- `src/app/church/[code]/sharing/page.tsx` (수정)

---

## Phase 19: 묵상 작성 자동 임시저장 기능 ✅ 완료 (2024-12-24)

### 기능 설명
묵상 작성 중 실수로 종료하거나 페이지를 이탈해도 작성 내용이 자동으로 localStorage에 저장되어 복원 가능.

### 구현 항목
- [x] `useAutoDraft` 커스텀 훅 생성 (재사용 가능한 자동 임시저장 로직)
- [x] 교회 나눔 페이지(sharing)에 자동 임시저장 적용
- [x] 교회 성경 읽기 페이지(bible)에 자동 임시저장 적용
- [x] 임시저장 복원 알림 UI (다이얼로그 상단)
- [x] 자동 저장 상태 표시 (다이얼로그 제목 옆)
- [x] 글 등록 완료 시 임시저장 자동 삭제

### useAutoDraft 훅 기능
1. **자동 저장**: 입력 후 2초 디바운스로 localStorage에 저장
2. **복원 기능**: 다이얼로그 열 때 임시저장 있으면 복원 여부 확인
3. **저장 상태 표시**: "방금 저장됨", "N분 전 저장됨" 등 표시
4. **컨텍스트 분리**: context와 identifier로 페이지/교회별 분리 저장

### 사용 예시
```typescript
const { draft, hasDraft, lastSaved, updateDraft, clearDraft, restoreDraft } = useAutoDraft({
  context: 'church_sharing',
  identifier: churchCode,
  debounceMs: 2000,
  enabled: writeDialogOpen,
});
```

### 관련 파일
- `src/hooks/useAutoDraft.ts` (신규)
- `src/app/church/[code]/sharing/page.tsx` (수정)
- `src/app/church/[code]/bible/page.tsx` (수정)

---

## Phase 20: QT 나눔 시스템 (hwpx 데이터 연동) ✅ 완료 (2024-12-24)

### 기능 설명
hwpx 파일에서 파싱한 1월 QT 데이터를 교회 나눔 페이지의 QT 탭에 연동.
사용자가 QT 컨텐츠(성경 본문, 묵상 가이드, 질문 등)를 보면서 나만의 묵상을 작성하고 나눌 수 있음.

### 구현 항목

#### 1. hwpx 데이터 파싱 ✅
- [x] hwpx 파일 압축 해제 및 XML 분석
- [x] `scripts/parse-hwpx-qt.js` 파서 스크립트 생성
- [x] 18일치 QT 데이터 추출 (창세기~출애굽기)
- [x] `public/data/qt-january-2026.json` 데이터 파일 생성

#### 2. QT 타입 및 유틸리티 ✅
- [x] `src/types/index.ts` - QT 관련 타입 추가
  - `QTVerse` - 성경 구절 (절 번호, 내용)
  - `QTMeditation` - 묵상 가이드 (ONE WORD, 묵상 길잡이, 질문, 기도)
  - `QTDailyContent` - 일일 QT 컨텐츠 (날짜, 제목, 성경 범위, 구절, 묵상)
- [x] `src/lib/qt-content.ts` - QT 데이터 로딩 유틸리티
  - `loadQTData()` - 전체 QT 데이터 로드
  - `getQTByDate()` - 날짜별 QT 조회
  - `getTodayQT()` - 오늘의 QT 조회

#### 3. QT 컴포넌트 ✅
- [x] `src/components/qt/QTViewer.tsx` - QT 상세 뷰어
- [x] `src/components/qt/QTCard.tsx` - QT 목록 카드
- [x] `src/components/qt/index.ts` - 컴포넌트 export

#### 4. QT 나눔 페이지 UI 통합 ✅
- [x] `/church/[code]/sharing` 페이지에 QT 탭 통합
- [x] QT 작성하기 버튼 (amber 색상)
- [x] QT 작성 다이얼로그
  - 날짜 선택 드롭다운
  - QT 컨텐츠 표시 (접기/펼치기)
    - 성경 본문 (verseReference, verses)
    - 묵상 길잡이 (meditationGuide, jesusConnection)
    - 묵상 질문 (meditationQuestion)
  - 나의 묵상 작성 폼 (7개 필드)
    - 🔵 한 단어 동그라미
    - ✍️ 오늘의 필사
    - 💬 내 말로 한 문장
    - ❓ 묵상 질문 답변
    - 🙏 감사와 적용
    - 🙌 나의 기도
    - 📋 말씀과 함께한 하루 점검
- [x] 나눔된 QT 목록 (페이지네이션)
- [x] QT 상세 보기 모달

#### 5. DB 마이그레이션 ✅
- [x] `supabase/migrations/20251224_add_church_qt_posts.sql` 생성
  - `church_qt_posts` 테이블 (QT 나눔 게시글)
  - RLS 정책 (읽기: 전체, 쓰기: 전체, 수정/삭제: 작성자/관리자)
  - 인덱스 (church_id, qt_date, created_at)

### QT 데이터 구조
```typescript
interface QTDailyContent {
  month: number;
  year: number;
  day: number;
  dayOfWeek: string;
  date: string; // "2026-01-01"
  title: string | null;
  bibleRange: string | null; // 통독 범위
  verseReference: string | null; // 묵상 구절
  verses: QTVerse[];
  meditation: QTMeditation | null;
}

interface QTMeditation {
  oneWord: string | null;
  oneWordSubtitle: string | null;
  meditationGuide: string | null;
  jesusConnection: string | null;
  meditationQuestion: string | null;
  prayer: string | null;
  copyVerse: string | null;
}
```

### church_qt_posts 테이블 구조
```sql
CREATE TABLE church_qt_posts (
  id UUID PRIMARY KEY,
  church_id UUID REFERENCES churches(id),
  author_name TEXT NOT NULL,
  qt_date TEXT NOT NULL,
  one_word TEXT,
  copy_verse TEXT,
  my_sentence TEXT,
  meditation_answer TEXT,
  gratitude TEXT,
  my_prayer TEXT,
  day_review TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ
);
```

### 관련 파일
**신규 생성:**
- `scripts/parse-hwpx-qt.js` - hwpx 파서 스크립트
- `public/data/qt-january-2026.json` - QT 데이터 (18일치)
- `src/lib/qt-content.ts` - QT 데이터 유틸리티
- `src/components/qt/QTViewer.tsx` - QT 뷰어 컴포넌트
- `src/components/qt/QTCard.tsx` - QT 카드 컴포넌트
- `src/components/qt/index.ts` - 컴포넌트 export
- `supabase/migrations/20251224_add_church_qt_posts.sql` - DB 마이그레이션

**수정:**
- `src/types/index.ts` - QT 타입 추가
- `src/app/church/[code]/sharing/page.tsx` - QT 탭 UI 통합

### 빌드 상태
✅ `npm run build` 성공 (린트 오류 없음)

### 남은 작업
- [ ] Supabase에서 `church_qt_posts` 테이블 마이그레이션 수동 적용 필요
  ```bash
  npx supabase db push --include-all
  # 또는 Supabase Dashboard에서 SQL 직접 실행
  ```

---

## Phase 21: 교회 성경 리더 페이지 생성 ✅ 완료 (2024-12-24)

### 기능 설명
교회별 성경 읽기 페이지(/church/[code]/bible)에서 링크를 클릭할 때 404가 발생하던 문제 수정.
`/church/[code]/bible/reader` 페이지를 새로 생성하여 교회 전용 성경 리더 기능 제공.

### 구현 항목
- [x] `/church/[code]/bible/reader` 페이지 생성
- [x] 성경 책/장 선택 (구약/신약 전체)
- [x] 개역개정/현대인의성경 번역본 선택
- [x] 좌우 스와이프로 이전/다음 장 이동
- [x] 구절 클릭 시 복사
- [x] 구절 꾹 누르기로 범위 선택
- [x] 교회 하단 네비게이션 유지
- [x] 묵상 작성 기능 추가 (플로팅 버튼 + 다이얼로그)
- [x] 자동 임시저장 기능 연동

### 관련 파일
- `src/app/church/[code]/bible/reader/page.tsx` (신규)
- `src/app/church/[code]/bible/page.tsx` (수정 - 미사용 import 정리)

---

## Phase 22: 성경 책별 진행 현황 버그 수정 ✅ 완료 (2024-12-24)

### 기능 설명
성경 책 목록에서 일부 책들이 "0/0" 진행 현황으로 표시되던 문제 수정.
`reading_plan.json`에서 합쳐진 책들(예: "요엘,아모스")도 개별 책으로 매칭되도록 개선.

### 원인
`reading_plan.json`의 일부 책 이름이 합쳐져 있었음:
- "요엘,아모스", "오바댜,요나", "나훔,하박국"
- "디도서,빌레몬서", "요한이서,요한삼서"

### 해결
`bookDays` 계산 시 쉼표로 구분된 책 이름을 분리해서 각각의 책에 일정을 추가하도록 수정.

### 관련 파일
- `src/app/church/[code]/bible/page.tsx` (수정)
- `src/app/(main)/bible/page.tsx` (수정)

---

## 📋 추가 기능 제안 (TODO)

### 교회 관리자 페이지 개선

#### 높은 우선순위 ⭐ - ✅ 완료 (2024-12-24)
1. **반응형 레이아웃 개선** ✅
   - [x] 모바일에서 통계 카드 2열 레이아웃 (컴팩트 디자인)
   - [x] 텍스트 크기/여백 반응형 조정 (text-xs md:text-sm)
   - [x] 차트/랭킹 2열 그리드 (PC에서)
   - [x] 탭 기반 네비게이션으로 구조 개선

2. **교회 설정 관리** ✅
   - [x] 익명 작성 허용/차단 설정 (Switch 컴포넌트)
   - [x] 일정 년도(schedule_year) 변경
   - [x] 작성 토큰 재발급/변경 (AlertDialog 확인)
   - [x] 관리자 토큰 재발급 (자동 로그아웃 안내)
   - [x] 교회 정보 수정 (이름, 주소, 교단)

3. **등록 교인 목록 관리** ✅
   - [x] 등록 교인 목록 조회 (새 탭)
   - [x] 교인 검색 기능
   - [x] 교인 강제 해제 기능 (AlertDialog 확인)
   - [x] 가입일, 최근 작성일, 작성 수 표시
   - [x] 페이지네이션

#### 중간 우선순위 - ✅ 완료 (2024-12-24)
4. **QR코드/공유 링크 관리** ✅
   - [x] 교회 코드 복사
   - [x] 공개 페이지 링크 복사/열기
   - [x] 작성 토큰 포함된 공유 링크 복사
   - [x] 관리자 링크 복사
   - [x] QR 코드 생성 페이지 연결

5. **공지사항 관리**
   - [ ] 교회 공지사항 작성/수정/삭제
   - [ ] 공지 표시 기간 설정

6. **통계 개선**
   - [ ] 월별 참여 추이 그래프
   - [ ] 성경별 묵상 분포
   - [ ] 요일별/시간대별 작성 패턴
   - [ ] 통계 기간 선택 (7일/30일/전체)

#### 낮은 우선순위
7. **묵상글 관리 개선**
   - [ ] 일괄 삭제 기능
   - [ ] 묵상글 내용 전체 보기 팝업
   - [ ] 답글/격려 기능 (관리자 댓글)

8. **알림 설정**
   - [ ] 새 묵상글 이메일/푸시 알림
   - [ ] 일일/주간 요약 리포트

---

## Phase 24: 교회 관리자 페이지 개선 ✅ 완료 (2024-12-24)

### 기능 설명
교회 관리자 페이지를 탭 기반 네비게이션으로 재구성하고, 반응형 레이아웃과 다양한 관리 기능 추가.

### 구현 내용

#### 1. 탭 기반 UI 구조
- **대시보드 탭**: 통계 카드, 차트, 참여 랭킹
- **묵상글 탭**: 기존 댓글 관리 기능
- **교인 탭**: 등록 교인 목록, 검색, 해제 기능
- **설정 탭**: 교회 정보 수정, 링크/토큰 관리

#### 2. 반응형 레이아웃
- 모바일: 컴팩트 카드, 작은 텍스트/아이콘
- PC: 2-4열 그리드, 여유 있는 여백

#### 3. 교인 관리 기능
- 등록 교인 목록 (닉네임, 가입일, 최근 작성일, 작성 수)
- 검색 기능 (닉네임 검색)
- 등록 해제 기능 (AlertDialog 확인)
- 페이지네이션 (10명씩)

#### 4. 설정 관리 기능
- 교회 정보 수정 (이름, 교단, 주소)
- 익명 작성 허용 토글 (Switch)
- 일정 년도 변경
- 링크 관리 (교회 코드, 공개 페이지, 작성 권한 링크, 관리자 링크)
- 토큰 재발급 (write_token, admin_token)

### 관련 파일
**수정:**
- `src/app/church/[code]/admin/page.tsx`
  - Tabs 컴포넌트로 UI 재구성
  - 반응형 스타일 적용 (md: breakpoint)
  - RegisteredMember 인터페이스 추가
  - 교인 목록 로드/검색/해제 기능
  - 설정 저장/토큰 재발급 기능
  - AlertDialog로 위험 작업 확인

### 컴포넌트 의존성
- `@/components/ui/tabs` (Tabs, TabsContent, TabsList, TabsTrigger)
- `@/components/ui/switch` (Switch)
- `@/components/ui/alert-dialog` (AlertDialog 관련)
- `@/components/ui/dropdown-menu` (DropdownMenu 관련)

---

## Phase 23: QT 작성 폼 단순화 ✅ 완료 (2024-12-24)

### 기능 설명
QT 작성 폼의 항목이 너무 많아 사용자에게 부담이 되는 문제 해결.
불필요한 항목을 제거하고, 교회 요청 항목(하루 점검)은 특별 UI로 강조.

### 변경 사항

#### 제거된 항목
- **한 단어 동그라미 (one_word)**: 온라인에서 불필요
- **오늘의 필사 (copy_verse)**: 책에 직접 필사하는 것이 핵심인 항목

#### 유지된 핵심 항목 (5개)
| 순서 | 항목 | 설명 | UI 스타일 |
|------|------|------|-----------|
| 1 | 내 말로 한 문장 | 본문 내용 요약 | amber 배지 |
| 2 | 묵상 질문 답변 | 묵상 질문에 대한 나의 생각 | purple 배지 |
| 3 | 감사와 적용 | 감사한 것, 삶에 적용할 것 | green 배지 |
| 4 | 나의 기도 | 말씀을 붙들고 드리는 기도 | blue 배지 |
| 5 | **말씀과 함께한 하루 점검** | 하루 돌아보며 말씀 적용 점검 | **특별 강조 UI** |

#### UI 개선
- 각 항목에 색상 배지 아이콘 적용
- **하루 점검** 항목: 그라데이션 배경, 특별 카드 UI, indigo/purple 테마
- 목록에서 하루 점검 작성된 QT는 배지로 표시
- 상세 보기에서 하루 점검은 별도 섹션으로 강조

### 관련 파일
**수정:**
- `src/app/church/[code]/sharing/page.tsx`
  - ChurchQTPost 인터페이스: one_word 제거, day_review 유지
  - qtFormData 상태: oneWord 제거, dayReview 추가
  - 폼 UI 재구성 및 하루 점검 특별 UI 적용
  - 목록/상세 보기 다이얼로그에서 하루 점검 강조

**수정:**
- `supabase/migrations/20251224_simplify_church_qt_posts.sql`
  - one_word, copy_verse 컬럼 제거 (day_review는 유지)

### 마이그레이션 적용
```bash
npx supabase db push --include-all
# 또는 Supabase Dashboard에서 SQL 직접 실행
```

---

## Phase 25: 교회 성경 읽기 페이지 기능 강화 ✅ 완료 (2024-12-24)

### 기능 설명
교회 성경 읽기 페이지(`/church/[code]/bible`)에 검색, 자동 임시저장, 묵상 작성 기능 추가.

### 구현 내용

#### 1. 성경 검색 기능
- 전체 일정 펼침 시 검색 UI 표시
- 성경 이름으로 검색 (예: "창세기", "마태")
- 검색 결과에서 바로 읽기 페이지로 이동

#### 2. 묵상 작성 다이얼로그
- 각 일정에서 편집 아이콘 클릭 시 작성 모달 열림
- 등록 교인은 닉네임 자동 입력
- 비등록 사용자는 이름 직접 입력

#### 3. 자동 임시저장 (useAutoDraft 훅)
- 2초 디바운스로 localStorage에 자동 저장
- 이전 임시저장 복원 알림
- 제출 성공 시 임시저장 삭제

### 관련 파일
**수정:**
- `src/app/church/[code]/bible/page.tsx`
  - 검색 UI 추가 (searchOpen, searchQuery, searchResults)
  - 묵상 작성 다이얼로그 추가
  - useAutoDraft 훅 통합
  - 월별 아코디언 + 검색 결과 뷰

**신규:**
- `src/hooks/useAutoDraft.ts` - 자동 임시저장 훅

---

## 📋 현재 프로젝트 구조 요약

### 기술 스택
| 카테고리 | 기술 |
|----------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI | shadcn/ui, Radix UI, Lucide Icons |
| Editor | TipTap (리치 텍스트) |
| Backend | Supabase (Auth, DB, Storage, RLS) |
| 인증 | Google OAuth |
| PWA | next-pwa |

### 주요 기능 현황

| 기능 | 상태 | 설명 |
|------|------|------|
| 인증 시스템 | ✅ | Google OAuth, 세션 관리 |
| 그룹 시스템 | ✅ | 생성, 참여, 관리, 등급 |
| 통독 기능 | ✅ | 365일 일정, 체크, 캘린더 |
| 묵상 나눔 | ✅ | 댓글, 좋아요, 답글, 첨부 |
| 마이페이지 | ✅ | 프로필, 통계, 설정 |
| 알림 시스템 | ✅ | 좋아요, 댓글, 공지 알림 |
| QT 시스템 | ✅ | 일일 QT, 게시글 작성 |
| 교회 페이지 | ✅ | 공개 페이지, 관리자, QR |
| 관리자 기능 | ✅ | 사용자/그룹/콘텐츠 관리 |

### 파일 구조
```
src/
├── app/                    # 50+ 페이지
│   ├── (main)/            # 메인 라우트
│   ├── (auth)/            # 인증 라우트
│   ├── admin/             # 관리자 라우트
│   ├── church/[code]/     # 교회 라우트
│   └── api/               # API 라우트
├── components/            # 40+ 컴포넌트
│   ├── ui/               # shadcn/ui 기반
│   ├── qt/               # QT 관련
│   └── church/           # 교회 관련
├── contexts/             # React Context
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티
├── types/                # TypeScript 타입
└── data/                 # 정적 데이터
```

---

## 🚀 향후 개발 계획 (TODO)

### 🔴 높은 우선순위

---

## 📋 Phase 26 설계: 교회 시스템 보완

### 26-1. 교회 공지사항 기능

#### 데이터베이스 설계
```sql
-- 교회 공지사항 테이블
CREATE TABLE church_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,

  -- 공지 내용
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,

  -- 표시 설정
  is_pinned BOOLEAN DEFAULT FALSE,           -- 상단 고정
  is_active BOOLEAN DEFAULT TRUE,            -- 활성화 여부
  display_start_date DATE,                   -- 표시 시작일 (NULL이면 즉시)
  display_end_date DATE,                     -- 표시 종료일 (NULL이면 무기한)

  -- 대상 설정
  target_type VARCHAR(20) DEFAULT 'all',     -- all, members_only (등록 교인만)

  -- 통계
  view_count INTEGER DEFAULT 0,

  -- 메타
  created_by UUID REFERENCES profiles(id),   -- 작성자 (관리자)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_church_notices_church_id ON church_notices(church_id);
CREATE INDEX idx_church_notices_active ON church_notices(church_id, is_active, display_start_date, display_end_date);

-- RLS 정책
ALTER TABLE church_notices ENABLE ROW LEVEL SECURITY;

-- 읽기: 해당 교회 공지 조회 가능
CREATE POLICY "church_notices_select" ON church_notices
  FOR SELECT USING (
    is_active = TRUE
    AND (display_start_date IS NULL OR display_start_date <= CURRENT_DATE)
    AND (display_end_date IS NULL OR display_end_date >= CURRENT_DATE)
  );

-- 쓰기: 서비스 롤만 (API 통해 관리자 검증)
CREATE POLICY "church_notices_insert" ON church_notices
  FOR INSERT WITH CHECK (FALSE);
```

#### 파일 구조
```
src/app/church/[code]/
├── page.tsx                    # 메인 페이지에 공지 배너 추가
├── notices/
│   ├── page.tsx               # 공지 목록 페이지
│   └── [id]/page.tsx          # 공지 상세 페이지
└── admin/
    └── page.tsx               # 관리자 페이지에 공지 관리 탭 추가

src/components/church/
├── ChurchNoticeBanner.tsx     # 메인 공지 배너 (슬라이드/스택)
├── ChurchNoticeCard.tsx       # 공지 카드 컴포넌트
└── ChurchNoticeForm.tsx       # 공지 작성/수정 폼
```

#### UI 설계

**1. 메인 페이지 공지 배너**
```
┌────────────────────────────────────────┐
│ 📢 [중요] 2025년 새해 성경통독 시작 안내  │
│    1월 12일부터 함께 시작합니다!        ←→ │
└────────────────────────────────────────┘
```
- 고정 공지 1개 또는 최근 공지 자동 슬라이드
- 클릭 시 상세 페이지로 이동
- 닫기 버튼 (24시간 동안 숨김)

**2. 관리자 - 공지 관리 탭**
```
┌─────────────────────────────────────────────┐
│ 공지사항 관리                    [+ 새 공지]│
├─────────────────────────────────────────────┤
│ □ 상단고정  2025년 새해 통독 안내  12/24   │
│             조회수: 45  [수정] [삭제]       │
├─────────────────────────────────────────────┤
│ ○ 일반     12월 묵상 나눔 주제    12/15    │
│             조회수: 123 [수정] [삭제]       │
└─────────────────────────────────────────────┘
```

**3. 공지 작성 폼**
```
┌─────────────────────────────────────────────┐
│ 새 공지사항 작성                            │
├─────────────────────────────────────────────┤
│ 제목: [________________________]            │
│                                             │
│ 내용:                                       │
│ ┌─────────────────────────────────────┐    │
│ │ (리치 에디터)                        │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ ☑ 상단 고정                                │
│ ○ 모든 방문자  ● 등록 교인만               │
│                                             │
│ 표시 기간:                                  │
│ [시작일 선택] ~ [종료일 선택] ☐ 무기한    │
│                                             │
│              [취소]  [저장]                 │
└─────────────────────────────────────────────┘
```

#### 구현 체크리스트
- [ ] DB 마이그레이션 파일 생성
- [ ] 공지 타입 정의 (`src/types/index.ts`)
- [ ] ChurchNoticeBanner 컴포넌트
- [ ] ChurchNoticeCard 컴포넌트
- [ ] ChurchNoticeForm 컴포넌트
- [ ] 공지 목록 페이지 (`/church/[code]/notices`)
- [ ] 공지 상세 페이지 (`/church/[code]/notices/[id]`)
- [ ] 관리자 페이지 공지 탭 추가
- [ ] 공지 CRUD API 함수
- [ ] 메인 페이지에 배너 통합
- [ ] 공지 숨김 기능 (localStorage)

---

### 26-2. 교회 통계 개선

#### 추가 통계 항목

**1. 월별 참여 추이 (라인 차트)**
```typescript
interface MonthlyStats {
  month: string;           // "2024-01"
  totalPosts: number;      // 총 묵상글 수
  uniqueWriters: number;   // 참여자 수
  avgPostsPerDay: number;  // 일평균 작성 수
}
```

**2. 성경별 묵상 분포 (파이/바 차트)**
```typescript
interface BibleBookStats {
  book: string;            // "창세기"
  testament: 'old' | 'new';
  count: number;           // 해당 책 묵상 수
  percentage: number;      // 전체 대비 비율
}
```

**3. 요일별/시간대별 패턴 (히트맵)**
```typescript
interface TimePatternStats {
  dayOfWeek: number;       // 0-6 (일-토)
  hour: number;            // 0-23
  count: number;           // 해당 시간대 작성 수
}
```

#### UI 설계

**통계 대시보드 (관리자 페이지)**
```
┌─────────────────────────────────────────────┐
│ 📊 상세 통계                    [기간: 30일]│
├─────────────────────────────────────────────┤
│ 월별 참여 추이                              │
│ ┌─────────────────────────────────────┐    │
│ │    ╱╲                               │    │
│ │   ╱  ╲    ╱╲                        │    │
│ │  ╱    ╲  ╱  ╲                       │    │
│ │ ╱      ╲╱    ╲                      │    │
│ │ 10월   11월   12월   1월            │    │
│ └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│ 성경별 묵상 분포                            │
│ ┌───────────────────┬─────────────────┐    │
│ │ 창세기 ████████ 45│ 마태  ██████ 32 │    │
│ │ 출애굽 ███████ 38 │ 요한  █████ 28  │    │
│ │ 시편   ██████ 30  │ 로마  ████ 22   │    │
│ └───────────────────┴─────────────────┘    │
├─────────────────────────────────────────────┤
│ 작성 시간 패턴 (히트맵)                     │
│       월 화 수 목 금 토 일                  │
│ 06-09 ░░ ░░ ▒▒ ░░ ░░ ░░ ▓▓                │
│ 09-12 ▒▒ ▒▒ ▒▒ ▒▒ ▒▒ ░░ ▓▓                │
│ 12-15 ░░ ░░ ░░ ░░ ░░ ░░ ░░                │
│ 15-18 ░░ ░░ ░░ ░░ ░░ ░░ ░░                │
│ 18-21 ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▒▒ ▒▒                │
│ 21-24 ▒▒ ▒▒ ▒▒ ▒▒ ▒▒ ░░ ░░                │
│ (░ 적음  ▒ 보통  ▓ 많음)                   │
└─────────────────────────────────────────────┘
```

#### 파일 구조
```
src/components/church/stats/
├── MonthlyTrendChart.tsx      # 월별 추이 라인 차트
├── BibleDistributionChart.tsx # 성경별 분포 차트
├── TimeHeatmap.tsx            # 시간대 히트맵
└── StatsCard.tsx              # 통계 카드 래퍼

src/lib/
└── church-stats.ts            # 통계 계산 유틸
```

#### 라이브러리 선택
- **차트**: recharts (가벼움, React 친화적)
- **설치**: `npm install recharts`

#### 구현 체크리스트
- [ ] recharts 설치
- [ ] 통계 계산 함수 (`lib/church-stats.ts`)
- [ ] MonthlyTrendChart 컴포넌트
- [ ] BibleDistributionChart 컴포넌트
- [ ] TimeHeatmap 컴포넌트
- [ ] 관리자 대시보드에 통계 섹션 추가
- [ ] 기간 필터 (7일/30일/90일/전체)
- [ ] CSV 내보내기 기능

---

## 📋 Phase 27 설계: 성능 최적화

### 27-1. 이미지 최적화

#### 현재 문제
- `<img>` 태그 직접 사용 (ESLint 경고)
- 이미지 리사이징/포맷 변환 없음
- Lazy loading 미적용

#### 해결 방안

**1. next/image로 교체**
```tsx
// Before
<img src={user.avatar_url} alt={user.nickname} className="w-10 h-10 rounded-full" />

// After
import Image from 'next/image';

<Image
  src={user.avatar_url || '/default-avatar.png'}
  alt={user.nickname}
  width={40}
  height={40}
  className="rounded-full object-cover"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

**2. 교체 대상 파일**
```
src/app/(main)/community/page.tsx        - 3개
src/app/(main)/mypage/profile/page.tsx   - 1개
src/app/admin/churches/page.tsx          - 1개
src/app/admin/groups/page.tsx            - 3개
src/app/admin/users/page.tsx             - 3개
src/app/church/[code]/admin/page.tsx     - 1개
```

**3. Supabase Storage 이미지 최적화**
```typescript
// lib/image-utils.ts
export function getOptimizedImageUrl(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
}) {
  if (!url || !url.includes('supabase')) return url;

  const { width = 200, height = 200, quality = 75 } = options || {};
  // Supabase Transform URL 생성
  return `${url}?width=${width}&height=${height}&quality=${quality}`;
}
```

#### 구현 체크리스트
- [ ] Image 컴포넌트 래퍼 생성 (`components/ui/optimized-image.tsx`)
- [ ] 기본 아바타 이미지 추가 (`public/default-avatar.png`)
- [ ] community/page.tsx 이미지 교체
- [ ] mypage/profile/page.tsx 이미지 교체
- [ ] admin/churches/page.tsx 이미지 교체
- [ ] admin/groups/page.tsx 이미지 교체
- [ ] admin/users/page.tsx 이미지 교체
- [ ] church/[code]/admin/page.tsx 이미지 교체
- [ ] next.config.mjs에 이미지 도메인 설정

---

### 27-2. 무한 스크롤 구현

#### 대상 페이지
1. 묵상 나눔 (community/page.tsx)
2. 교회 묵상 목록 (church/[code]/page.tsx)
3. 관리자 - 묵상글 관리

#### 구현 방식

**1. Intersection Observer 훅**
```typescript
// hooks/useInfiniteScroll.ts
import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll(
  loadMore: () => Promise<void>,
  hasMore: boolean,
  options?: UseInfiniteScrollOptions
) {
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(async (entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !isLoading) {
      setIsLoading(true);
      await loadMore();
      setIsLoading(false);
    }
  }, [hasMore, isLoading, loadMore]);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    observerRef.current = new IntersectionObserver(handleObserver, {
      threshold: options?.threshold || 0.1,
      rootMargin: options?.rootMargin || '100px',
    });

    observerRef.current.observe(element);

    return () => observerRef.current?.disconnect();
  }, [handleObserver, options]);

  return { loadMoreRef, isLoading };
}
```

**2. 사용 예시**
```tsx
const ITEMS_PER_PAGE = 20;
const [comments, setComments] = useState<Comment[]>([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)
    .order('created_at', { ascending: false });

  if (data) {
    setComments(prev => [...prev, ...data]);
    setHasMore(data.length === ITEMS_PER_PAGE);
    setPage(prev => prev + 1);
  }
};

const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore);

return (
  <div>
    {comments.map(comment => <CommentCard key={comment.id} {...comment} />)}
    <div ref={loadMoreRef}>
      {isLoading && <Loader2 className="animate-spin" />}
    </div>
  </div>
);
```

#### 구현 체크리스트
- [ ] useInfiniteScroll 훅 생성
- [ ] community/page.tsx에 무한 스크롤 적용
- [ ] church/[code]/page.tsx에 무한 스크롤 적용
- [ ] 관리자 묵상글 관리에 적용
- [ ] 스크롤 위치 복원 기능

---

### 27-3. 데이터 캐싱 (SWR)

#### 라이브러리 선택: SWR
- React Query보다 가볍고 설정 간단
- Vercel(Next.js 개발사) 제작
- 자동 revalidation, 포커스 시 갱신

#### 설치
```bash
npm install swr
```

#### SWR Provider 설정
```tsx
// app/providers.tsx
'use client';

import { SWRConfig } from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

#### Supabase용 SWR 훅
```typescript
// hooks/useSupabaseSWR.ts
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

export function useChurchData(churchCode: string) {
  const { data, error, isLoading, mutate } = useSWR(
    churchCode ? `church:${churchCode}` : null,
    async () => {
      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .eq('code', churchCode)
        .single();

      if (error) throw error;
      return data;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1분간 중복 요청 방지
    }
  );

  return { church: data, error, isLoading, refresh: mutate };
}

export function useComments(churchId: string, page: number) {
  const { data, error, isLoading, mutate } = useSWR(
    churchId ? `comments:${churchId}:${page}` : null,
    async () => {
      const { data, error } = await supabase
        .from('guest_comments')
        .select('*')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })
        .range(page * 20, (page + 1) * 20 - 1);

      if (error) throw error;
      return data;
    }
  );

  return { comments: data, error, isLoading, refresh: mutate };
}
```

#### 구현 체크리스트
- [ ] SWR 설치
- [ ] SWRProvider 설정
- [ ] useSupabaseSWR 훅 생성
- [ ] 교회 데이터 캐싱 적용
- [ ] 묵상글 목록 캐싱 적용
- [ ] 통계 데이터 캐싱 적용
- [ ] Optimistic UI 업데이트

---

### 27-4. 번들 사이즈 최적화

#### 분석 도구 설치
```bash
npm install @next/bundle-analyzer
```

#### next.config.mjs 설정
```javascript
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
```

#### 최적화 방안

**1. Dynamic Import (코드 스플리팅)**
```tsx
// 무거운 컴포넌트 동적 로드
const RichEditor = dynamic(
  () => import('@/components/ui/rich-editor').then(mod => mod.RichEditor),
  {
    loading: () => <Skeleton className="h-32" />,
    ssr: false
  }
);

// 차트 라이브러리 동적 로드
const MonthlyChart = dynamic(
  () => import('@/components/church/stats/MonthlyTrendChart'),
  { loading: () => <Skeleton className="h-64" /> }
);
```

**2. 불필요한 import 제거**
```tsx
// Before - 전체 lodash 번들
import _ from 'lodash';

// After - 필요한 함수만
import debounce from 'lodash/debounce';
```

**3. Tree Shaking 최적화**
```tsx
// Before - 전체 date-fns
import { format, parseISO } from 'date-fns';

// After - 서브패스 임포트
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
```

#### 구현 체크리스트
- [ ] Bundle Analyzer 설치 및 설정
- [ ] 현재 번들 사이즈 분석
- [ ] RichEditor 동적 로드 (이미 적용됨)
- [ ] 차트 컴포넌트 동적 로드
- [ ] QR 생성 라이브러리 동적 로드
- [ ] lodash 최적화 (사용 시)
- [ ] 이미지 import 최적화

---

## 📋 Phase 28 설계: 알림 시스템 강화

### 28-1. 웹 푸시 알림 (Web Push API)

#### 아키텍처
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   클라이언트  │────▶│   서버 API   │────▶│   Supabase  │
│ (브라우저)   │◀────│  (Vercel)   │◀────│  (Edge Fn)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │         ┌─────────────┐               │
       └────────▶│  FCM/VAPID  │◀──────────────┘
                 │  Push 서버  │
                 └─────────────┘
```

#### 데이터베이스 설계
```sql
-- 푸시 구독 정보 테이블
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- 푸시 구독 정보
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,           -- 공개키
  auth TEXT NOT NULL,             -- 인증 시크릿

  -- 디바이스 정보
  user_agent TEXT,
  device_type VARCHAR(20),        -- mobile, desktop, tablet

  -- 상태
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, endpoint)
);

-- 알림 설정 확장
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS
  push_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS
  push_new_comment BOOLEAN DEFAULT TRUE;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS
  push_new_like BOOLEAN DEFAULT TRUE;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS
  push_church_notice BOOLEAN DEFAULT TRUE;
```

#### 파일 구조
```
src/
├── app/
│   └── api/
│       └── push/
│           ├── subscribe/route.ts    # 구독 등록
│           ├── unsubscribe/route.ts  # 구독 해제
│           └── send/route.ts         # 푸시 전송
├── lib/
│   ├── push-notifications.ts         # 푸시 알림 유틸
│   └── service-worker-register.ts    # SW 등록
└── public/
    └── sw-push.js                    # 푸시용 서비스 워커
```

#### 서비스 워커 (sw-push.js)
```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  const options = {
    body: data.body || '새 알림이 있습니다',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    data: { url: data.url || '/' },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '리딩지저스', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
```

#### 푸시 알림 유틸 (lib/push-notifications.ts)
```typescript
import webpush from 'web-push';

// VAPID 키 설정
webpush.setVapidDetails(
  'mailto:admin@reading-jesus.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
  }
) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error) {
    console.error('Push notification failed:', error);
    return { success: false, error };
  }
}

// 클라이언트 - 구독 등록
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    ),
  });

  // 서버에 구독 정보 저장
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });

  return subscription;
}
```

#### 구현 체크리스트
- [ ] VAPID 키 생성 및 환경변수 설정
- [ ] push_subscriptions 테이블 생성
- [ ] 서비스 워커 푸시 핸들러 추가
- [ ] 구독 등록 API 생성
- [ ] 구독 해제 API 생성
- [ ] 푸시 전송 API 생성
- [ ] 알림 설정 페이지에 푸시 설정 추가
- [ ] 새 댓글 시 푸시 전송
- [ ] 새 좋아요 시 푸시 전송
- [ ] 새 공지 시 푸시 전송

---

### 28-2. 이메일 알림

#### 서비스 선택: Resend (또는 SendGrid)
- Vercel 친화적
- 무료 티어: 3,000통/월

#### 이메일 템플릿 유형

**1. 일일 요약 (매일 오전 6시)**
```
Subject: [리딩지저스] 오늘의 통독 알림 - Day 45

안녕하세요, {닉네임}님!

📖 오늘의 말씀
- 출애굽기 3-6장

✨ 어제 우리 교회 묵상 현황
- 새 묵상글: 12개
- 참여자: 8명

💬 인기 묵상 (좋아요 5개 이상)
- "{묵상 내용 미리보기...}" - 홍길동

[오늘의 말씀 읽기]  [묵상 나눔 보기]

---
이 메일은 리딩지저스에서 발송되었습니다.
알림 설정: https://reading-jesus.com/mypage/notification-settings
```

**2. 주간 요약 (매주 월요일 오전 9시)**
```
Subject: [리딩지저스] 지난 주 통독 리포트 - 홍길동님

📊 지난 주 리포트 (12/18 - 12/24)

✅ 내 통독 현황
- 완료한 날: 5일 / 7일
- 작성한 묵상: 3개
- 받은 좋아요: 12개

🏆 우리 교회 현황
- 총 묵상글: 45개
- 참여자: 15명
- 이번 주 MVP: 김철수님 (묵상 7개)

📈 내 연속 기록
- 현재 연속: 23일 🔥
- 최장 기록: 45일

[이번 주 일정 보기]  [내 기록 보기]
```

#### 파일 구조
```
src/
├── app/api/
│   └── email/
│       ├── daily-digest/route.ts     # 일일 요약 발송
│       └── weekly-report/route.ts    # 주간 리포트 발송
├── lib/
│   └── email/
│       ├── client.ts                 # Resend 클라이언트
│       ├── templates/
│       │   ├── daily-digest.tsx      # 일일 요약 템플릿
│       │   ├── weekly-report.tsx     # 주간 리포트 템플릿
│       │   └── new-comment.tsx       # 새 댓글 알림 템플릿
│       └── send.ts                   # 발송 유틸
└── emails/                           # React Email 템플릿 (선택)
```

#### Cron Job 설정 (Vercel)
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/email/daily-digest",
      "schedule": "0 21 * * *"  // UTC 21:00 = KST 06:00
    },
    {
      "path": "/api/email/weekly-report",
      "schedule": "0 0 * * 1"   // UTC 월요일 00:00 = KST 09:00
    }
  ]
}
```

#### 데이터베이스 설계
```sql
-- 이메일 발송 로그
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),

  email_type VARCHAR(50) NOT NULL,    -- daily_digest, weekly_report, etc.
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,

  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,

  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림 설정 확장
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS
  email_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS
  email_daily_digest BOOLEAN DEFAULT TRUE;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS
  email_weekly_report BOOLEAN DEFAULT TRUE;
```

#### 구현 체크리스트
- [ ] Resend 계정 생성 및 API 키 설정
- [ ] 이메일 클라이언트 설정
- [ ] 일일 요약 템플릿 생성
- [ ] 주간 리포트 템플릿 생성
- [ ] 새 댓글 알림 템플릿 생성
- [ ] 일일 요약 API 및 Cron 설정
- [ ] 주간 리포트 API 및 Cron 설정
- [ ] 알림 설정 페이지에 이메일 옵션 추가
- [ ] 이메일 발송 로그 테이블 생성
- [ ] 수신 거부 기능

---

### 28-3. 알림 그룹화 및 정리

#### 현재 문제
- 같은 게시글에 여러 좋아요 → 개별 알림
- 오래된 알림 무한 누적

#### 해결 방안

**1. 알림 그룹화**
```typescript
// 그룹화 예시
// Before:
// - 홍길동님이 좋아요를 눌렀습니다.
// - 김철수님이 좋아요를 눌렀습니다.
// - 이영희님이 좋아요를 눌렀습니다.

// After:
// - 홍길동님 외 2명이 좋아요를 눌렀습니다.

interface GroupedNotification {
  type: 'like' | 'comment' | 'reply';
  targetId: string;           // 대상 게시글/댓글 ID
  actors: { id: string; name: string }[];
  count: number;
  latestAt: string;
  isRead: boolean;
}
```

**2. 자동 정리 정책**
```sql
-- 90일 이상 된 읽은 알림 자동 삭제
DELETE FROM notifications
WHERE is_read = TRUE
AND created_at < NOW() - INTERVAL '90 days';

-- 30일 이상 된 모든 알림 아카이브
-- (선택적으로 별도 테이블로 이동)
```

**3. UI 개선**
```
┌─────────────────────────────────────────────┐
│ 알림                     [모두 읽음] [정리] │
├─────────────────────────────────────────────┤
│ 오늘                                        │
│ ┌─────────────────────────────────────┐    │
│ │ 👍 홍길동님 외 4명이 "창세기 묵상"에  │    │
│ │    좋아요를 눌렀습니다.        5분 전│    │
│ └─────────────────────────────────────┘    │
│ ┌─────────────────────────────────────┐    │
│ │ 💬 김철수님이 댓글을 남겼습니다.    │    │
│ │    "좋은 묵상이네요..."       1시간 전│    │
│ └─────────────────────────────────────┘    │
├─────────────────────────────────────────────┤
│ 이번 주                                     │
│ ...                                         │
└─────────────────────────────────────────────┘
```

#### 구현 체크리스트
- [ ] 알림 그룹화 로직 구현
- [ ] 그룹화된 알림 UI 컴포넌트
- [ ] 알림 자동 정리 Cron Job
- [ ] "모두 읽음" 기능
- [ ] 날짜별 그룹 표시 (오늘/이번 주/이번 달)
- [ ] 알림 삭제 기능

---

## 우선순위 및 예상 일정

| Phase | 기능 | 예상 작업량 | 우선순위 |
|-------|------|------------|---------|
| 26-1 | 교회 공지사항 | 중 | ⭐⭐⭐ |
| 26-2 | 교회 통계 개선 | 중 | ⭐⭐ |
| 27-1 | 이미지 최적화 | 소 | ⭐⭐⭐ |
| 27-2 | 무한 스크롤 | 소 | ⭐⭐⭐ |
| 27-3 | SWR 캐싱 | 중 | ⭐⭐ |
| 27-4 | 번들 최적화 | 소 | ⭐ |
| 28-1 | 웹 푸시 알림 | 대 | ⭐⭐ |
| 28-2 | 이메일 알림 | 대 | ⭐⭐ |
| 28-3 | 알림 그룹화 | 중 | ⭐ |

### 권장 구현 순서
1. **27-1 이미지 최적화** - ESLint 경고 해결, 즉시 성능 개선
2. **27-2 무한 스크롤** - UX 개선, 대용량 데이터 대비
3. **26-1 교회 공지사항** - 사용자 요청 가능성 높음
4. **27-3 SWR 캐싱** - 전반적 성능 개선
5. **26-2 교회 통계** - 관리자 가치 제공
6. **28-1 웹 푸시** - 사용자 참여도 증가
7. **28-2 이메일 알림** - 이탈 사용자 리텐션
8. **28-3 알림 그룹화** - UX 개선

---

### 🟡 중간 우선순위

#### 4. 소셜 기능 확장
- [ ] 카카오 로그인 연동
- [ ] 애플 로그인 연동
- [ ] 친구 추가/추천 기능
- [ ] 묵상 공유 (카카오톡, SNS)

#### 5. 콘텐츠 기능
- [ ] QT 컨텐츠 관리자 페이지
- [ ] 성경 주석/해설 연동
- [ ] 묵상 템플릿 기능
- [ ] 성경 암송 카드 생성

#### 6. UX 개선
- [ ] 다크 모드 완성도 향상
- [ ] 온보딩 튜토리얼 개선
- [ ] 접근성 개선 (ARIA)
- [ ] 키보드 네비게이션

### 🟢 낮은 우선순위

#### 7. 앱 배포
- [ ] iOS/Android 네이티브 래퍼 (Capacitor)
- [ ] 앱스토어/플레이스토어 출시
- [ ] 딥링크 설정

#### 8. 분석 및 모니터링
- [ ] Google Analytics 연동
- [ ] 에러 추적 (Sentry)
- [ ] 사용자 행동 분석

#### 9. 고급 기능
- [ ] 오프라인 모드 완성
- [ ] 다국어 지원 (i18n)
- [ ] 음성 성경 재생
- [ ] AI 묵상 가이드

---

## 🐛 알려진 이슈

### 해결 필요
1. [ ] ESLint 경고: useEffect 의존성 배열 (여러 파일)
2. [ ] `<img>` 태그를 `next/image`로 교체 필요 (성능)
3. [ ] 일부 페이지 로딩 상태 개선 필요

### 관찰 중
1. 대용량 교회의 성능 테스트 필요
2. 모바일에서 간헐적 스크롤 이슈

---

## 📁 Supabase 마이그레이션 현황

### 적용된 마이그레이션 (38개)
```
20241218_*  - 초기 스키마 (프로필, 그룹, 댓글)
20241219_*  - 그룹 멤버십, 초대 코드
20241220_*  - 알림, 통독 체크
20241221_*  - QT, 첨부파일
20241222_*  - 교회, 관리자
20251222_*  - 교회 멤버십, 관리자 토큰
20251224_*  - QT 폼 단순화
```

### 적용 대기 중
```sql
-- 교회 QT 폼 단순화
-- supabase/migrations/20251224_simplify_church_qt_posts.sql
ALTER TABLE church_qt_posts DROP COLUMN IF EXISTS one_word;
ALTER TABLE church_qt_posts DROP COLUMN IF EXISTS copy_verse;
```

---

## 📊 배포 정보

- **Production URL**: https://www.reading-jesus.com
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Last Deploy**: 2024-12-25

---

## Phase 26-1: 교회 관리자 진척도 & 묵상글 좋아요 ✅ 완료 (2024-12-25)

### 구현 내용

#### 1. 교회 관리자 페이지 - 교인 진척도 표시
- 등록 교인 목록에 리딩지저스 진척도 표시
- 해당 교인이 참여한 그룹의 통독 완료 현황 (완료일/전체일)
- 프로그레스 바로 시각적 표현
- 그룹 미참여 시 "리딩지저스 그룹 미참여" 표시

#### 2. 교회 묵상글 좋아요 기능
- `guest_comment_likes` 테이블 추가 (마이그레이션)
- 로그인 유저: user_id 기반 좋아요
- 비로그인 유저: device_id 기반 좋아요
- 좋아요 카운트 자동 업데이트 트리거
- 애니메이션 효과 (하트 scale)

### 파일 변경
- `src/app/church/[code]/admin/page.tsx` - 진척도 표시 로직 및 UI
- `src/app/church/[code]/page.tsx` - 좋아요 버튼 UI 및 핸들러
- `supabase/migrations/20251225_add_guest_comment_likes.sql` - 좋아요 테이블

---

## Phase 26-2: 교회-그룹 통합 시스템 ✅ 완료 (2024-12-25)

### 개요
교회 페이지에서 소그룹을 생성하고 관리할 수 있는 통합 시스템 구현

### 구현 기능

#### DB 스키마 확장
- [x] `groups` 테이블에 `church_id` 컬럼 추가 (교회 연동)
- [x] `groups` 테이블에 `is_church_official` 컬럼 추가 (공식 그룹 표시)
- [x] `Group` 타입 정의 업데이트

#### 교회 그룹 목록 페이지 (`/church/[code]/groups`)
- [x] 해당 교회 소속 그룹 목록 표시
- [x] 그룹별 멤버 수, 진행률 표시
- [x] 초대 코드로 그룹 참여 기능
- [x] 교회 관리자만 그룹 생성 가능
- [x] ChurchBottomNav에 "그룹" 메뉴 추가

#### 교회 그룹 상세 페이지 (`/church/[code]/groups/[groupId]`)
- [x] 3개 탭: 묵상, 멤버, 진행현황
- [x] Day별 묵상 작성 및 조회
- [x] 교회 묵상글(guest_comments)과 그룹 묵상글 통합 조회
- [x] 멤버 목록 및 개인별 진행률 표시
- [x] 그룹 전체 진행률 대시보드
- [x] 멤버별 진행률 랭킹

#### 교회 관리자 페이지 확장
- [x] "그룹" 탭 추가 (5개 탭 체계)
- [x] 교회 소속 그룹 목록 관리
- [x] 그룹별 진행률 비교 차트
- [x] 그룹 상세 페이지 / 관리자 페이지 바로가기

#### 그룹 관리자 권한 제한
- [x] 교회 연동 그룹 식별 (`church_id` 존재 여부)
- [x] 교회 연동 그룹 안내 UI 표시
- [x] 교회 관리자만 게시글 삭제 가능 (RLS 정책)
- [x] 그룹 관리자는 멤버 관리만 가능

### 권한 체계
| 역할 | 그룹 생성 | 멤버 관리 | 묵상 고정 | 게시글 삭제 | 통계 조회 |
|------|----------|----------|----------|------------|----------|
| 교회 관리자 | ✅ | ✅ | ✅ | ✅ | ✅ (전체) |
| 그룹 관리자 | ❌ | ✅ (자기 그룹) | ✅ | ⚠️ 개인그룹만 | ✅ (자기 그룹) |
| 일반 멤버 | ❌ | ❌ | ❌ | ❌ | ❌ |

### 파일 변경/생성
**신규 파일**
- `supabase/migrations/20251226_add_church_group_integration.sql` - DB 마이그레이션
- `src/app/church/[code]/groups/page.tsx` - 그룹 목록 페이지
- `src/app/church/[code]/groups/[groupId]/page.tsx` - 그룹 상세 페이지

**수정 파일**
- `src/types/index.ts` - Group 타입에 church_id, is_church_official 추가
- `src/components/church/ChurchBottomNav.tsx` - 그룹 메뉴 추가
- `src/app/church/[code]/admin/page.tsx` - 그룹 관리 탭 추가
- `src/app/(main)/group/[id]/admin/page.tsx` - 교회 연동 그룹 권한 제한

---

## Phase 26-3: 교회 그룹 찾아보기 기능 ✅ 완료 (2024-12-25)

### 개요
교회 그룹 페이지에서 해당 교회의 모든 그룹을 찾아보고 바로 참여할 수 있는 기능

### 구현 기능
- [x] "우리교회 그룹 찾아보기" 버튼 추가
- [x] 교회 소속 전체 그룹 목록 다이얼로그
- [x] 그룹별 멤버 수, 읽기 플랜, 공식 그룹 표시
- [x] 이미 참여중인 그룹 "참여중" 표시
- [x] 바로 참여 버튼 (로그인 사용자)
- [x] 그룹 참여 후 목록 자동 새로고침

### 파일 변경
- `src/app/church/[code]/groups/page.tsx`
  - 그룹 찾기 다이얼로그 상태 및 함수 추가
  - `loadAvailableGroups()` - 교회 전체 그룹 로드
  - `openBrowseDialog()` - 다이얼로그 열기
  - `handleDirectJoin()` - 그룹 바로 참여
  - Browse Groups Dialog 컴포넌트 추가

### 버그 수정
- TypeScript Set spread 에러 수정 (`[...prev]` → `[...Array.from(prev)]`)

---

*마지막 업데이트: 2024-12-25*
*Phase 26-4: 교회 그룹 생성 기능 개선 완료*
*Phase 26-3: 교회 그룹 찾아보기 기능 완료*
*Phase 26-2: 교회-그룹 통합 시스템 완료*
*Phase 26-1: 교회 관리자 진척도 & 묵상글 좋아요 완료*
*Phase 25: 교회 성경 읽기 페이지 기능 강화 완료*
*Phase 24: 교회 관리자 페이지 개선 완료*

---

## Phase 26-4: 교회 그룹 생성 기능 개선 ✅ 완료 (2024-12-25)

### 개요
교회 그룹 페이지에서 일반 사용자도 그룹을 생성할 수 있도록 개선하고, 기존 그룹 생성 오류 수정

### 구현 기능
- [x] 일반 로그인 사용자도 교회 그룹 생성 가능
- [x] 교회 관리자가 만든 그룹만 "공식" 배지 표시
- [x] 그룹 생성 시 `is_church_official` 조건부 설정

### 버그 수정
- [x] `schedule_mode` 컬럼 누락 오류 해결
  - DB에 `schedule_mode` 컬럼이 없어서 그룹 생성 실패
  - 코드에서 `schedule_mode` 없이 먼저 시도하도록 수정
  - 교회 그룹 생성에서 `schedule_mode` 필드 제거

### 파일 변경
- `src/app/(main)/group/page.tsx` - `handleGroupCreated()` 함수 분리, `schedule_mode` 없이 먼저 시도
- `src/app/church/[code]/groups/page.tsx` - 그룹 생성 버튼 조건 변경, `is_church_official` 조건부 설정

### DB 마이그레이션 실행됨
- `supabase/migrations/20251225_add_guest_comment_likes.sql` 실행 완료
  - `guest_comment_likes` 테이블 생성
  - 좋아요 카운트 자동 업데이트 트리거 생성
  - RLS 정책 설정 (로그인/비로그인 사용자 모두 지원)

### 추가 DB 마이그레이션 필요 (선택)
```sql
-- groups 테이블에 schedule_mode 컬럼 추가 (일정 모드 기능 사용 시)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS schedule_mode VARCHAR(20) DEFAULT 'day_count';
UPDATE groups SET schedule_mode = 'day_count' WHERE schedule_mode IS NULL;
CREATE INDEX IF NOT EXISTS idx_groups_schedule_mode ON groups(schedule_mode);
```

---

## 오늘 (2024-12-25) 작업 요약

### Phase 26-1 ~ 26-4 완료
1. **교회 관리자 진척도 표시** - 등록 교인별 리딩지저스 통독 진행률 표시
2. **교회 묵상글 좋아요 기능** - 로그인/비로그인 사용자 모두 좋아요 가능
3. **교회-그룹 통합 시스템** - 교회 페이지에서 소그룹 생성/관리
4. **교회 그룹 찾아보기** - 교회 소속 그룹 목록 조회 및 바로 참여
5. **그룹 생성 기능 개선** - 일반 사용자도 그룹 생성 가능, 공식 그룹 표시

### 주요 버그 수정
- `admin_id` → `admin_token` 변경 (DB 스키마 불일치 수정)
- `schedule_mode` 컬럼 누락 오류 우회 처리
- TypeScript Set spread 오류 수정

### 배포
- Vercel Production: https://www.reading-jesus.com

---

## Phase 27: 교회 그룹 기능 강화 ✅ 완료 (2024-12-27)

### 개요
교인의 입장에서 **소통 강화**와 **동기부여** 두 가지 방향으로 교회 그룹 기능 강화

### 구현 기능

#### 1. 스트릭(연속 읽기) 표시 ✅
- [x] 스트릭 계산 유틸리티 (`src/lib/streak.ts`)
  - `calculateStreak()`: 현재 연속 읽기 일수 계산
  - `calculateLongestStreak()`: 최장 연속 읽기 일수 계산
  - `getStreakLevel()`: 스트릭 레벨/색상/라벨 반환
- [x] 스트릭 컴포넌트 (`src/components/church/StreakBadge.tsx`)
  - `StreakBadge`: 멤버 카드용 간단한 스트릭 표시
  - `StreakHeader`: 헤더용 눈에 띄는 스트릭 표시
- [x] 그룹 상세 페이지에 스트릭 표시
  - 헤더: 현재 사용자의 스트릭 표시
  - 멤버 탭: 각 멤버의 스트릭 표시
  - 진행현황 탭: 멤버별 진행률 + 스트릭 표시

#### 2. 기도제목 나눔 기능 ✅
- [x] DB 마이그레이션 (`20251227_add_prayer_requests.sql`)
  - `prayer_requests` 테이블: 기도제목 저장
  - `prayer_support` 테이블: "함께 기도합니다" 기록
  - RLS 정책: 그룹 멤버만 조회/작성 가능
  - 트리거: support_count 자동 업데이트
- [x] 타입 정의 추가 (`src/types/index.ts`)
  - `PrayerRequest`, `PrayerRequestWithProfile`, `PrayerSupport`
- [x] 기도제목 컴포넌트
  - `PrayerTab`: 기도제목 탭 (목록 + 작성 폼)
  - `PrayerCard`: 기도제목 카드 (함께 기도/응답됨)
- [x] 그룹 상세 페이지에 기도 탭 추가 (4번째 탭)

### 파일 변경 내역

#### 새로 생성
- `supabase/migrations/20251227_add_prayer_requests.sql`
- `src/lib/streak.ts`
- `src/components/church/StreakBadge.tsx`
- `src/components/church/PrayerTab.tsx`
- `src/components/church/PrayerCard.tsx`

#### 수정
- `src/types/index.ts` - 기도제목 타입 추가
- `src/app/church/[code]/groups/[groupId]/page.tsx` - 탭 4개로 확장, 스트릭 표시

### UI 변경사항

#### 그룹 상세 페이지 탭 구조 (3 → 4개)
```
[묵상] [멤버] [진행] [기도]
```

#### 헤더 스트릭 표시
```
🔥 7일 연속 읽기 중!
```

#### 멤버 카드
```
홍길동  👑 🔥 15일
진행률: ████████░░ 80%
```

#### 기도제목 카드
```
익명
"가족의 건강을 위해..."
🙏 12명이 함께 기도합니다
[함께 기도합니다] [응답됨✓]
```

---

## ✅ Phase 27-2: 소통 강화 (2차) - 완료 (2024-12-27)

### 묵상 댓글 기능 ✅
다른 사람의 묵상에 댓글(리플)을 달 수 있는 기능 추가

#### 구현 내역
- [x] `MeditationReplies` 컴포넌트 생성
  - 접기/펼치기 토글 (댓글 수 표시)
  - 댓글 작성 폼 (Enter로 전송)
  - 댓글 삭제 (본인만)
  - 작성자 프로필 표시 (닉네임, 아바타)
- [x] 그룹 상세 페이지 묵상 탭에 통합
  - 각 묵상 카드에 댓글 섹션 추가
  - 기존 `comment_replies` 테이블 활용

#### 새로 생성된 파일
- `src/components/church/MeditationReplies.tsx`

#### 수정된 파일
- `src/app/church/[code]/groups/[groupId]/page.tsx`
  - MeditationReplies 컴포넌트 import 및 사용

---

## ✅ Phase 27-3: 동기부여 - 배지 시스템 - 완료 (2024-12-27)

### 배지 시스템 ✅
활동에 따라 자동으로 배지를 획득하고 알림으로 표시

#### 구현 내역

##### 1. DB 마이그레이션 (`20251227_add_badge_system.sql`)
- [x] `badge_definitions` 테이블 - 배지 정의
- [x] `user_badges` 테이블 - 사용자별 획득 배지
- [x] 기본 배지 15종 데이터 삽입
- [x] 자동 배지 부여 트리거 함수들
  - `check_meditation_badges()` - 묵상 작성 시
  - `check_reply_badges()` - 댓글 작성 시
  - `check_prayer_badges()` - 기도제목 작성 시
  - `check_prayer_support_badges()` - 함께 기도 시
  - `check_prayer_answered_badges()` - 기도 응답 시
  - `check_streak_badges()` - 스트릭 달성 시

##### 2. 타입 정의 (`src/types/index.ts`)
- [x] `BadgeCategory` - streak, meditation, prayer, social
- [x] `BadgeDefinition` - 배지 정의 인터페이스
- [x] `UserBadge` - 사용자 배지 인터페이스
- [x] `UserBadgeWithDefinition` - 배지 + 정의 조인
- [x] `NewBadgeNotification` - 새 배지 알림용

##### 3. 배지 컴포넌트
- [x] `BadgeDisplay` - 사용자 배지 표시 (title 툴팁)
- [x] `BadgeList` - 배지 목록 전체 보기 (카테고리별)
- [x] `BadgeNotificationModal` - 새 배지 획득 모달
  - 축하 애니메이션
  - 여러 배지 연속 표시
  - 알림 완료 처리

##### 4. 그룹 상세 페이지 통합
- [x] 멤버 카드에 배지 표시 (최대 3개)
- [x] 페이지 로드 시 새 배지 알림 모달 표시

#### 배지 목록 (15종)

| 코드 | 이름 | 아이콘 | 카테고리 | 조건 |
|------|------|--------|----------|------|
| first_meditation | 첫 묵상 | 📝 | 묵상 | 묵상 1회 |
| meditation_10 | 묵상 10회 | 📖 | 묵상 | 묵상 10회 |
| meditation_50 | 묵상 50회 | 📚 | 묵상 | 묵상 50회 |
| meditation_100 | 묵상 마스터 | 🎓 | 묵상 | 묵상 100회 |
| streak_7 | 7일 연속 | 🔥 | 스트릭 | 7일 연속 읽기 |
| streak_30 | 30일 연속 | 💪 | 스트릭 | 30일 연속 읽기 |
| streak_100 | 100일 연속 | 🏆 | 스트릭 | 100일 연속 읽기 |
| streak_365 | 1년 완주 | 👑 | 스트릭 | 365일 연속 읽기 |
| first_prayer | 첫 기도 | 🙏 | 기도 | 기도제목 1회 |
| prayer_supporter | 기도 서포터 | 🤝 | 기도 | 함께 기도 10회 |
| prayer_answered | 응답의 증인 | ✨ | 기도 | 기도 응답 1회 |
| first_reply | 첫 댓글 | 💬 | 소통 | 댓글 1회 |
| active_member | 활발한 멤버 | 🌟 | 소통 | 댓글 50회 |

#### 새로 생성된 파일
- `supabase/migrations/20251227_add_badge_system.sql`
- `src/components/church/BadgeDisplay.tsx`
- `src/components/church/BadgeNotificationModal.tsx`

#### 수정된 파일
- `src/types/index.ts` - 배지 타입 추가
- `src/app/church/[code]/groups/[groupId]/page.tsx`
  - BadgeDisplay, BadgeNotificationModal 통합
  - 멤버 카드에 배지 표시

---

---

## ✅ 마이그레이션 관리 시스템 추가 (2024-12-27)

### 문제점
- 42개 이상의 마이그레이션 파일 관리 어려움
- 어떤 마이그레이션이 실행되었는지 확인 불가
- 누락된 테이블/컬럼 파악 어려움

### 해결책: 마이그레이션 체크 도구

#### 1. `CHECK_MISSING_MIGRATIONS.sql`
누락된 항목을 자동으로 찾아 실행해야 할 마이그레이션 파일을 알려주는 통합 쿼리

**체크 항목:**
- 테이블 25개 (profiles, groups, comments, churches, badges 등)
- 컬럼 11개 (schedule_mode, total_days, admin_token 등)
- 트리거 7개 (likes_count, prayer_support, badge 트리거 등)
- 함수 8개 (update_likes_count, badge 체크 함수들)

**결과 예시:**
```
status                    | required_migration
--------------------------|------------------------------------
❌ 테이블 없음: badges    | 20251227000001_add_badge_system.sql
⚠️ 컬럼 없음: groups.x    | 20241221000008_add_schedule_mode.sql
📋 총 2개 누락            | 2024-12-27 15:30
```

#### 2. `CHECK_DB_STATUS.sql`
현재 DB 상태 확인 (테이블 목록, 필수 테이블 존재 여부, row 수, RLS 정책)

#### 3. `CONSOLIDATED_V1.sql`
신규 환경용 통합 마이그레이션 (모든 테이블 한 번에 생성)

#### 4. 문서화
- `supabase/README.md` - 마이그레이션 가이드
- `supabase/MIGRATION_CHECKLIST.md` - 마이그레이션 체크리스트

### 파일 목록
```
supabase/
├── CHECK_MISSING_MIGRATIONS.sql  ⭐ 누락 체크 (핵심)
├── CHECK_DB_STATUS.sql           DB 상태 확인
├── MIGRATION_CHECKLIST.md        체크리스트
├── README.md                     마이그레이션 가이드
└── migrations/
    └── CONSOLIDATED_V1.sql       통합 마이그레이션
```

---

---

## ✅ Phase 28: 격려 메시지 시스템 - 완료 (2024-12-27)

### 격려 메시지 기능 ✅
비활성 멤버에게 격려 메시지를 보내서 동기부여

#### 구현 내역

##### 1. DB 마이그레이션 (`20251227000003_add_encouragements.sql`)
- [x] `encouragements` 테이블 생성
  - sender_id, receiver_id, message
  - 하루에 같은 사람에게 한 번만 (UNIQUE 제약)
  - is_read 플래그
- [x] RLS 정책 (그룹 멤버만 보내기/받기)
- [x] 격려 알림 자동 생성 트리거

##### 2. 타입 정의 (`src/types/index.ts`)
- [x] `Encouragement` 인터페이스
- [x] `EncouragementWithProfile` - 보낸 사람 프로필 포함
- [x] `ENCOURAGEMENT_TEMPLATES` - 8개 기본 메시지 템플릿

##### 3. 컴포넌트
- [x] `EncouragementButton` - 격려 보내기 버튼 + 모달
  - 8개 기본 템플릿 선택
  - 직접 메시지 작성 옵션
  - 하루에 한 번 제한
- [x] `EncouragementList` - 받은 격려 목록
  - 읽음/안읽음 표시
  - 일괄 읽음 처리
- [x] `EncouragementBadge` - 안 읽은 격려 수 뱃지

##### 4. 페이지 통합
- [x] 그룹 상세 > 멤버 탭 > 각 멤버 카드에 하트 버튼 추가
- [x] 클릭 시 격려 메시지 선택 모달 표시

#### 격려 메시지 템플릿 (8종)
| 이모지 | 메시지 |
|--------|--------|
| 💪 | 함께 말씀 읽어요! |
| 🔥 | 오늘도 화이팅! |
| 🙏 | 기도하고 있어요 |
| ❤️ | 함께해서 좋아요 |
| ✨ | 다시 시작해봐요! |
| 🌟 | 응원합니다! |
| 📖 | 말씀 안에서 힘을 얻어요 |
| 🤗 | 사랑합니다! |

#### 새로 생성된 파일
- `supabase/migrations/20251227000003_add_encouragements.sql`
- `src/components/church/EncouragementButton.tsx`
- `src/components/church/EncouragementList.tsx`

#### 수정된 파일
- `src/types/index.ts` - 격려 타입 + 템플릿 추가
- `src/app/church/[code]/groups/[groupId]/page.tsx` - 멤버 카드에 격려 버튼
- `supabase/CHECK_MISSING_MIGRATIONS.sql` - encouragements 테이블 추가

---

## ✅ Phase 29: 그룹 생성 개편 - 완료 (2024-12-28)

### 개요
그룹 생성 UI 통합 및 커스텀 플랜 기능 추가

### 완료된 작업 요약
- DB 마이그레이션 (`reading_plans`, `plan_schedules` 테이블)
- 타입 정의 및 플랜 계산 유틸리티
- 커스텀 플랜 5-Step 위자드 (`CustomPlanWizard.tsx`)
- 리딩지저스 플랜 정보 모달 (`ReadingJesusPlanInfo.tsx`)
- 다중 플랜 읽기 카드 (`MultiPlanReadingCard.tsx`)
- 다중 플랜 읽기 유틸리티 (`reading-utils.ts`)
- 플랜 선택기 (`PlanSelector.tsx`)

### Phase 29-1: DB & 타입 ✅ 완료

#### DB 마이그레이션 (`20251228000001_add_reading_plans.sql`)
- [x] `reading_plans` 테이블 생성
  - plan_type: 'reading_jesus' | 'custom'
  - bible_scope, selected_books, reading_days, chapters_per_day
  - 계산된 값: total_chapters, total_reading_days, total_calendar_days
- [x] `plan_schedules` 테이블 생성
  - day_number, reading_date, book_name, start/end_chapter
- [x] `groups` 테이블 수정 (department, plan_id 추가)
- [x] `daily_checks` 테이블 수정 (plan_id 추가)
- [x] `check_plan_for_all_groups()` 함수 - 같은 플랜 일괄 체크
- [x] `get_user_daily_readings()` 함수 - 다중 플랜 조회
- [x] 리딩지저스 2026 기본 플랜 생성

#### 타입 정의 (`src/types/index.ts`)
- [x] `ReadingPlanType` - 'reading_jesus' | 'custom'
- [x] `BibleScope` - 'full' | 'old' | 'new' | 'custom'
- [x] `ReadingPlanConfig` - 플랜 설정 인터페이스
- [x] `PlanSchedule` - 일별 일정 인터페이스
- [x] `UserDailyReading` - 사용자 일일 읽기 정보
- [x] `WEEKDAYS`, `BIBLE_BOOKS_INFO`, `TOTAL_BIBLE_CHAPTERS` 상수

#### 유틸리티 (`src/lib/plan-utils.ts`)
- [x] `calculateTotalChapters()` - 선택 범위 총 장 수
- [x] `getBooksForScope()` - 범위별 책 목록
- [x] `calculateReadingDays()` - 실제 읽기 일수
- [x] `calculateCalendarDays()` - 달력 기준 일수
- [x] `calculateEndDate()` - 종료일 계산
- [x] `calculateDayNumber()` - 날짜 → Day 번호
- [x] `calculateDateFromDayNumber()` - Day 번호 → 날짜
- [x] `generatePlanSchedules()` - 플랜 일정 생성
- [x] `formatReadingRange()` - 읽기 범위 문자열
- [x] `formatReadingDays()` - 요일 문자열

### Phase 29-2: 그룹 생성 UI 통합 ✅ 완료

#### 생성된 컴포넌트
- [x] `src/components/group/CustomPlanWizard.tsx` - 5-Step 커스텀 플랜 위자드
  - Step 1: 읽을 말씀 선택 (전체/구약/신약/직접선택)
  - Step 2: 통독 요일 선택 (월~일, 빠른 선택)
  - Step 3: 하루 분량 설정 (자동 기간 계산)
  - Step 4: 시작일 선택 (종료일 자동 계산)
  - Step 5: 플랜 확인 및 이름 입력
- [x] `src/components/group/ReadingJesusPlanInfo.tsx` - 리딩지저스 2026 플랜 정보 모달
  - Dialog로 플랜 상세 정보 표시
  - icon 또는 button 트리거 지원

#### 그룹 페이지 수정
- [x] `src/app/(main)/group/page.tsx` 플랜 선택 UI 통합
  - 리딩지저스 2026 / 커스텀 플랜 선택
  - 커스텀 플랜 위자드 연동
  - 플랜 데이터 상태 관리

### Phase 29-3: 다중 플랜 체크 시스템 ✅ 완료

#### 생성된 파일
- [x] `src/components/home/MultiPlanReadingCard.tsx` - 다중 플랜 읽기 카드 컴포넌트
  - `MultiPlanReadingCard` - 개별 플랜 읽기 카드
  - `MultiPlanReadingList` - 플랜 목록 컴포넌트 (완료/미완료 분리)
  - 플랜별 소속 그룹 표시 (접기/펼치기)
  - 통합 체크 확인 다이얼로그
- [x] `src/lib/reading-utils.ts` - 다중 플랜 읽기 유틸리티
  - `getUserDailyReadings()` - 사용자의 모든 플랜 읽기 정보 조회
  - `checkPlanForAllGroups()` - 동일 플랜 사용 그룹 일괄 체크
  - 일반 그룹 + 교회 그룹 통합 처리
  - 리딩지저스 플랜 자동 감지

#### 핵심 기능
- [x] 동일 플랜 통합: 같은 플랜을 사용하는 그룹들이 하나의 카드로 표시
- [x] 플랜별 소속 그룹 표시: 각 플랜이 어디에 적용되는지 명확히 표시
- [x] 통합 체크: 한 번 체크로 동일 플랜을 사용하는 모든 그룹에 적용

### Phase 29-4: Bible 플랜 선택기 ✅ 완료

#### 생성된 파일
- [x] `src/components/bible/PlanSelector.tsx` - 플랜 선택 드롭다운 컴포넌트
  - 사용자가 속한 모든 그룹의 플랜 목록 표시
  - 리딩지저스/커스텀 플랜 구분 아이콘
  - 플랜이 하나면 드롭다운 없이 표시
  - 플랜 변경 시 콜백 지원

#### 기능
- [x] 사용자의 모든 플랜 로드 (일반 그룹 + 교회 그룹)
- [x] 중복 플랜 필터링 (같은 리딩지저스는 하나만)
- [x] 플랜 선택 UI (Select 컴포넌트)

### Phase 29-5: 추가 구현 ✅ 완료 (2024-12-28)

#### 수정된 파일
- [x] `src/components/group/ReadingJesusPlanInfo.tsx` - React Portal 적용
  - 모달 z-index 충돌 문제 해결 (z-[100] + createPortal)
  - 클라이언트 마운트 상태 관리
  - 부모 모달 위에 정상 표시

- [x] `src/app/church/[code]/groups/page.tsx` - 교회 그룹 생성 UI 개선
  - 플랜 선택 UI 추가 (리딩지저스 2026 / 커스텀 플랜)
  - CustomPlanWizard 연동
  - ReadingJesusPlanInfo 모달 연동

- [x] `src/app/(main)/group/page.tsx` - 소속 교회 선택 기능 추가
  - 교회 소속 그룹 생성 옵션 (createAsChurchGroup)
  - 소속 부서 입력 필드 (churchDepartment)
  - 그룹 생성 시 church_id, is_church_official, department 저장

- [x] `src/app/(main)/home/page.tsx` - 다중 플랜 체크 시스템 연동
  - MultiPlanReadingList 컴포넌트 연동
  - handleMultiPlanCheck 핸들러 구현
  - 다중 그룹 사용자에게 "나의 모든 플랜" 섹션 표시
  - 동일 플랜 사용 그룹 일괄 체크 지원

- [x] `src/app/(main)/bible/page.tsx` - 플랜 선택기 추가
  - PlanSelector 컴포넌트 헤더에 추가
  - 플랜 변경 핸들러 구현

---

## ✅ Phase 29-6: 커스텀 플랜 저장 로직 구현 - 완료 (2024-12-28)

### 구현 내용

#### 1. 커스텀 플랜 저장 함수 (`src/lib/plan-utils.ts`)
- [x] `saveCustomPlan()` 함수 추가
  - `reading_plans` 테이블에 플랜 저장
  - `plan_schedules` 테이블에 일정 자동 생성
  - 대량 삽입을 위한 배치 처리 (500개씩)
- [x] `linkPlanToGroup()` 함수 추가 (향후 사용)
- [x] `SaveCustomPlanParams` 인터페이스 정의

#### 2. 일반 그룹 생성 연동 (`src/app/(main)/group/page.tsx`)
- [x] 커스텀 플랜 선택 시 `saveCustomPlan()` 호출
- [x] 저장된 `plan_id`를 그룹에 연결
- [x] `calculateCalendarDays()` 사용하여 달력 기준 일수 계산

#### 3. 교회 그룹 생성 연동 (`src/app/church/[code]/groups/page.tsx`)
- [x] 커스텀 플랜 저장 로직 추가
- [x] 플랜 타입별 시작일/종료일 계산
- [x] `plan_id` 연결

#### 4. 버그 수정
- [x] `home/page.tsx`: `checkPlanForAllGroups` 호출 인자 수정
- [x] toast variant `'destructive'` → `'error'` 수정

---

## ✅ Phase 30: 교회 페이지 UX 고도화 - 완료 (2024-12-28)

### 목표
- 1월 4일 베타 테스트 준비
- 교회 성도들의 첫인상 개선
- 핵심 기능 완성도 향상

### 구현 내용

#### 1. 날짜 포맷 통일 (`src/lib/date-utils.ts`)
- [x] `formatRelativeTime()` - 상대 시간 포맷 (방금 전, 5분 전, 오늘 14:30, 어제, 12월 25일)
- [x] `formatKoreanDate()` - 한국식 날짜 (12월 28일 (토))
- [x] `formatKoreanDateWithYear()` - 연도 포함 한국식 날짜
- [x] `formatShortDate()` - 짧은 날짜 (12/28)
- [x] `getInitials()` - 이름에서 이니셜 추출 (아바타용)
- [x] `getAvatarColor()` - 이름 기반 아바타 색상 (16색 팔레트)

#### 2. 댓글 카드 UI 개선
**수정 파일:**
- `src/app/church/[code]/page.tsx`
- `src/app/church/[code]/sharing/page.tsx`

**변경 내용:**
- [x] User 아이콘 → 이니셜 기반 컬러 아바타 (10x10px)
- [x] 절대 시간 → 상대 시간 (formatRelativeTime 사용)
- [x] 익명 댓글에 "🔒 익명" 배지 추가
- [x] 카드 hover 효과 (bg-accent/30)
- [x] QT 상세 보기 다이얼로그 아바타 적용

#### 3. 터치 타겟 크기 개선
- [x] 좋아요 버튼: min-w-[44px] min-h-[44px], 아이콘 w-5 h-5
- [x] 날짜 네비게이션 버튼: min-w-[44px] min-h-[44px], 아이콘 w-6 h-6
- [x] active:scale-95 터치 피드백 추가

#### 4. 스티키 작성 버튼
- [x] 작성 권한 있을 때 하단 고정 버튼 표시
- [x] bottom-20 (하단 네비 위), z-20
- [x] 배경 그라데이션 (from-background via-background)
- [x] 그림자 효과 (shadow-lg)
- [x] 버튼 높이 h-12, 텍스트 text-base

#### 5. 로딩/빈 상태 개선
**로딩 스켈레톤:**
- [x] 댓글 카드 3개 스켈레톤 애니메이션
- [x] 아바타, 이름, 시간, 본문, 좋아요 버튼 골격

**에러 상태:**
- [x] destructive 스타일 카드
- [x] AlertCircle 아이콘
- [x] "다시 시도" 버튼

**빈 상태:**
- [x] 아이콘 배경 원형 (bg-primary/10)
- [x] 메시지 개선 ("첫 번째 나눔을 시작해보세요!")
- [x] 작성 권한 있을 때 안내 문구 추가

### 수정된 파일

```
src/lib/date-utils.ts                    # 날짜/아바타 유틸리티 추가
src/app/church/[code]/page.tsx           # 댓글 UI, 스티키 버튼, 로딩/에러/빈 상태
src/app/church/[code]/sharing/page.tsx   # 댓글 UI, 상대 시간 적용
```

---

## 📋 다음 작업 (TODO)

### Phase 30-2: 교회 페이지 고도화 (베타 1주차) ✅ 완료 (2024-12-29)
- [x] 등록 교인 스트릭 표시 (메인 페이지 상단 StreakHeader) ✅ 완료 (2024-12-29)
- [ ] BadgeNotificationModal 활성화
- [x] 읽음 표시 클라우드 동기화 (등록 교인) ✅ 완료 (2024-12-29)
  - `church_reading_checks` 테이블 마이그레이션 추가
  - 성경 읽기 페이지에서 등록 교인 클라우드 저장/로드
  - localStorage와 클라우드 데이터 자동 병합
  - 스트릭 계산도 클라우드 데이터 우선 사용
- [x] 교회 마이페이지 추가 ✅ 완료 (2024-12-29)
  - 하단 네비게이션에 '마이' 탭 추가 (5번째)
  - `/church/[code]/my` 페이지 생성
  - 프로필, 통계(읽은 날/연속일수/진행률), 진행바
  - 등록 교인 등록/탈퇴 기능
  - 로그인/로그아웃 기능
  - 앱 마이페이지 연동

### Phase 30-3: 보안/성능 강화 ✅ 완료 (2024-12-29)
- [x] guest_comments DELETE/UPDATE RLS 정책 개선
  - `20251229000002_fix_guest_comments_delete_policy.sql` 마이그레이션 추가
  - 로그인 사용자: linked_user_id 검증
  - 비로그인 사용자: DB 레벨 허용 + 앱에서 device_id 검증
- [x] Rate Limiting 유틸리티 추가 (`src/lib/rate-limit.ts`)
  - `checkCommentRateLimit()` - 1분에 3회 제한
  - `checkLikeRateLimit()` - 1분에 30회 제한
  - `checkApiRateLimit()` - 1분에 60회 제한
- [x] 교회 메인 페이지에 Rate Limiting 적용
  - 묵상 작성 시 Rate Limiting 체크
  - 좋아요 클릭 시 Rate Limiting 체크

### Phase 31: 동기부여 (3차)
- [ ] 주간 챌린지 - 이번 주 목표 달성 표시
- [ ] 배지 상세 보기 페이지

### Phase 32: 커스텀 플랜 확장
- [ ] 커스텀 플랜 불러오기 기능 - 저장된 플랜 목록에서 선택
- [ ] 내 플랜 목록 조회 (reading_plans 테이블)
- [ ] 플랜 템플릿 공유 기능 (선택사항)

---

## ✅ Phase 33: 올리브 그린 테마 적용 ✅ 완료 (2024-12-29)

### 디자인 시스템 개선
- [x] **올리브 그린 컬러 시스템 정의**
  - CSS 변수로 olive-50 ~ olive-900 정의
  - 보조 컬러 warm-50 ~ warm-500 (따뜻한 베이지/골드)
  - 라이트/다크 모드 모두 지원

- [x] **Tailwind 테마 확장**
  - `olive` 색상 팔레트 추가 (10단계)
  - `warm` 보조 색상 팔레트 추가 (6단계)
  - 커스텀 그림자 (`shadow-soft`, `shadow-glow`)
  - 부드러운 pulse 애니메이션

- [x] **교회 메인 페이지 디자인 개선**
  - 헤더: 올리브 그린 그라데이션 + 백드롭 블러
  - 로딩 상태: 올리브 테마 아이콘 + 그라데이션 배경
  - 날짜 선택 카드: "Today's Reading" 배너, 둥근 모서리
  - 작성 폼: 올리브 그린 강조, 그라데이션 버튼
  - 댓글 카드: 올리브 배경, 호버 효과, 라운드 아바타
  - 빈 상태: 그라데이션 배경 + 아이콘

- [x] **하단 네비게이션 개선**
  - 올리브 그린 활성 상태 표시
  - 활성 탭 상단 인디케이터 바
  - 아이콘 배경 라운드 박스

- [x] **푸터 스타일**
  - 올리브/웜 그라데이션 배경
  - 리프 이모지 + 브랜딩

### 수정된 파일
- `src/app/globals.css` - CSS 변수 (올리브/웜 팔레트)
- `tailwind.config.ts` - Tailwind 확장 (색상, 그림자, 애니메이션)
- `src/app/church/[code]/page.tsx` - 교회 메인 페이지 스타일
- `src/components/church/ChurchBottomNav.tsx` - 하단 네비게이션 스타일

### 버그 수정
- `src/app/church/[code]/admin/page.tsx` - writerStats 초기값 수정
- `src/app/church/[code]/sharing/page.tsx` - FeedCard props 수정
- `src/components/church/VerseCardGenerator.tsx` - Image 생성 방식 수정

---

## Phase: 통합 묵상 에디터 시스템 ✅ 완료 (2025-12-29)

### 개요
기존에 각 페이지별로 다르게 구현되어 있던 묵상 작성 UI를 통합 컴포넌트로 리팩토링

### 변경 전 문제점
- `/bible-reader`: 일반 Textarea, 포맷팅 없음
- `/church/[code]/bible/reader`: Dialog + RichEditor, 카드 생성 가능
- `/church/[code]/sharing`: RichEditor, 별도 UI

### 구현 내용

#### 1. 통합 MeditationEditor 컴포넌트 ✅
- [x] **RichEditor 기반** - TipTap 에디터로 텍스트 포맷팅 지원
- [x] **구절 선택 기능** - 성경 구절을 묵상에 포함
- [x] **카드 생성 버튼** - VerseCardGenerator 연동
- [x] **자동 임시저장** - useAutoDraft 훅으로 localStorage 저장
- [x] **익명 옵션** - 체크박스로 익명 발행 선택
- [x] **컨텍스트 기반 동작** - bible_reader, church_bible, church_sharing 구분

#### 2. MeditationPanel 컴포넌트 ✅
- [x] **반응형 UI**
  - 데스크톱: 사이드 패널 (380px/500px 확장 가능)
  - 모바일: 바텀시트 (60vh/90vh 확장 가능)
- [x] **플로팅 토글 버튼** - 패널 열기/닫기
- [x] **VerseCardGenerator 통합** - 구절 카드 생성 다이얼로그

#### 3. 교회 바이블리더 적용 ✅
- [x] Dialog 기반 UI를 MeditationPanel로 교체
- [x] 구절 선택 → 묵상 패널에 자동 추가
- [x] 구절 삭제/전체 삭제 기능
- [x] Supabase 저장 로직 연동

### 생성된 파일
- `src/components/meditation/MeditationEditor.tsx` - 핵심 에디터 컴포넌트
- `src/components/meditation/MeditationPanel.tsx` - 패널 래퍼 컴포넌트
- `src/components/meditation/index.ts` - 모듈 엑스포트

### 수정된 파일
- `src/app/church/[code]/bible/reader/page.tsx` - MeditationPanel 적용

### 타입 정의
```typescript
interface SelectedVerse {
  book: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  text: string;
}

interface MeditationSubmitData {
  content: string;
  authorName?: string;
  bibleRange?: string;
  selectedVerses?: SelectedVerse[];
  isAnonymous: boolean;
}
```

### 📋 다음 작업 (TODO)
- [x] 일반 바이블리더(/bible-reader)에 통합 컴포넌트 적용 ✅ 완료 (2025-12-29)
- [x] 교회 QT 상세 페이지(/church/[code]/qt/[date])에 MeditationPanel 적용 ✅ 완료 (2025-12-30)
- [ ] 교회 나눔 페이지(/church/[code]/sharing)에 통합 컴포넌트 적용

---

## Phase: 유튜브 링크 미리보기 기능 ✅ 완료 (2025-12-29)

### 개요
묵상 작성 시 유튜브 링크를 붙여넣으면 자동으로 미리보기 카드가 표시되는 기능

### 구현 내용

#### 1. LinkPreview 컴포넌트 ✅
- [x] 유튜브 URL 감지 및 비디오 ID 추출
- [x] 유튜브 썸네일 미리보기 카드
- [x] 클릭 시 임베드 플레이어로 재생
- [x] 일반 링크 미리보기 (호스트명 표시)
- [x] 링크 삭제 기능

#### 2. MeditationEditor 통합 ✅
- [x] 콘텐츠에서 URL 자동 감지 (useMemo)
- [x] 감지된 링크 자동 추가
- [x] 링크 미리보기 섹션 (접기/펼치기)
- [x] 발행 시 attachedLinks 데이터 포함

#### 3. 일반 바이블리더 MeditationPanel 적용 ✅
- [x] 기존 BottomSheet + Textarea 제거
- [x] MeditationPanel (사이드 패널/바텀시트) 적용
- [x] 구절 선택 → 묵상에 추가 기능
- [x] "묵상" 버튼 액션바에 추가

### 생성된 파일
- `src/components/ui/link-preview.tsx` - 링크 미리보기 컴포넌트

### 수정된 파일
- `src/components/meditation/MeditationEditor.tsx` - 링크 감지 및 미리보기 통합
- `src/app/(main)/bible-reader/page.tsx` - MeditationPanel 적용

### MeditationSubmitData 확장
```typescript
interface MeditationSubmitData {
  content: string;
  authorName?: string;
  bibleRange?: string;
  selectedVerses?: SelectedVerse[];
  attachedLinks?: string[];  // 새로 추가
  isAnonymous: boolean;
}
```

---

## Phase: 교회 QT 페이지 MeditationPanel 적용 ✅ 완료 (2025-12-30)

### 개요
교회 QT 상세 페이지(`/church/[code]/qt/[date]`)에서 "묵상 쓰기" 버튼을 누르면 MeditationPanel이 열리고, QT 본문 구절이 자동으로 묵상에 추가되어 작성할 수 있는 기능

### 구현 내용

#### 1. 교회 정보 로드 ✅
- [x] churchCode로 교회 id, name 조회
- [x] 묵상 등록 시 church_id 필요

#### 2. MeditationPanel 상태 관리 ✅
- [x] meditationPanelOpen 상태
- [x] meditationVerses 상태 (선택된 구절)
- [x] submitting 상태 (발행 중)

#### 3. handleWrite 함수 구현 ✅
- [x] QT 본문 구절을 SelectedVerse 형태로 변환
- [x] MeditationPanel 열기
- [x] 기존 alert 제거

#### 4. handleMeditationSubmit 함수 구현 ✅
- [x] guest_comments 테이블에 저장
- [x] church_id, guest_name, content, bible_range, is_anonymous 저장
- [x] 성공/실패 Toast 알림
- [x] 발행 후 상태 초기화

#### 5. MeditationPanel 컴포넌트 추가 ✅
- [x] context="church_bible"
- [x] showAnonymous=true (익명 옵션 표시)
- [x] showCardButton=false (카드 생성 버튼 숨김)
- [x] churchName 전달 (카드 생성 시 사용)

### 수정된 파일
- `src/app/church/[code]/qt/[date]/page.tsx`
  - MeditationPanel import 추가
  - 교회 정보 로드 useEffect 추가
  - 묵상 관련 상태 및 핸들러 추가
  - JSX에 MeditationPanel 컴포넌트 추가

### 데이터 흐름
1. QT 페이지 로드 → 교회 정보(id, name) 조회
2. "묵상 쓰기" 버튼 클릭 → QT 본문 구절을 meditationVerses에 추가
3. MeditationPanel 열림 → 사용자가 묵상 작성
4. 발행 클릭 → guest_comments 테이블에 저장
5. 성공 시 Toast 표시 + 패널 닫기

---

## Phase: 교회 QT 페이지 내 글 수정/삭제 기능 ✅ 완료 (2025-12-30)

### 개요
교회 QT 상세 페이지에서 device_id 기반으로 내가 작성한 묵상을 수정/삭제할 수 있는 기능

### 구현 내용

#### 1. Device ID 관리 ✅
- [x] localStorage 기반 device_id 생성 및 저장
- [x] `getOrCreateDeviceId()` 유틸리티 함수
- [x] 묵상 등록 시 device_id 함께 저장

#### 2. 내가 쓴 묵상 조회 ✅
- [x] `loadMyComments()` 함수 - device_id로 필터링
- [x] "내가 쓴 묵상" 섹션 UI (접기/펼치기)
- [x] 작성일시, 익명 여부 표시

#### 3. 수정 기능 ✅
- [x] 수정 다이얼로그 (AlertDialog)
- [x] 기존 내용 로드 → 수정 → 저장
- [x] guest_comments 테이블 UPDATE
- [x] 성공/실패 Toast 알림

#### 4. 삭제 기능 ✅
- [x] 삭제 확인 다이얼로그
- [x] guest_comments 테이블 DELETE
- [x] 삭제 후 목록 새로고침

### 수정된 파일
- `src/app/church/[code]/qt/[date]/page.tsx`
  - Device ID 관리 함수 추가
  - 내가 쓴 묵상 상태 및 로드 함수 추가
  - 수정/삭제 다이얼로그 UI 추가
  - 수정/삭제 핸들러 함수 추가

### 버그 수정
- [x] churchCode 대문자 변환 누락 수정 (`.eq('code', churchCode.toUpperCase())`)
- [x] 묵상 등록 시 device_id 필드 누락 수정

---

## Phase: 유튜브 링크 미리보기 버그 수정 ✅ 완료 (2025-12-30)

### 개요
Rich Editor에서 유튜브 링크가 href 속성에만 있을 때 미리보기가 표시되지 않던 문제 수정

### 문제 원인
- `extractUrls()` 함수가 plain text에서만 URL을 추출
- Rich Editor는 `<a href="https://...">` 형태로 링크를 저장
- href 속성 내부의 URL이 감지되지 않음

### 해결 방법

#### 1. extractUrls 함수 개선 ✅
- [x] HTML href 속성에서 URL 추출 패턴 추가
- [x] `href=["']?(https?://...)["']?` 정규식 추가
- [x] 중복 URL 제거 (Set 사용)

#### 2. MeditationEditor 링크 감지 개선 ✅
- [x] plain text에서 URL 추출
- [x] HTML 원본에서 href URL 추출
- [x] 두 소스 병합 후 중복 제거

### 수정된 파일
- `src/components/ui/link-preview.tsx`
  - `extractUrls()` 함수에 href 패턴 추가
- `src/components/meditation/MeditationEditor.tsx`
  - `detectedLinks` useMemo 로직 개선

---

## 🔄 업데이트 내역 (2025-12-29 ~ 2025-12-30)

### 📦 배포 완료: https://www.reading-jesus.com

### 주요 변경사항

#### 1. MeditationEditor 통합 컴포넌트 적용
- 일반 바이블리더 (/bible-reader) - MeditationPanel 적용
- 교회 바이블리더 (/church/[code]/bible/reader) - 기존 적용됨
- 교회 QT 상세 페이지 (/church/[code]/qt/[date]) - 새로 적용

#### 2. 유튜브 링크 미리보기 기능
- 묵상 작성 시 유튜브 링크 자동 감지
- 썸네일 미리보기 카드 표시
- 클릭 시 임베드 플레이어 재생
- href 속성에서도 URL 추출되도록 수정

#### 3. 교회 QT 페이지 내 글 관리
- device_id 기반 사용자 식별
- 내가 쓴 묵상 목록 표시
- 수정/삭제 기능

#### 4. 버그 수정
- QT 등록 실패: churchCode 대문자 변환 누락
- QT 등록 실패: device_id 필드 누락
- 유튜브 미리보기 안 뜸: href 속성 URL 추출 누락

### 데이터베이스 변경 (마이그레이션 필요)
- `is_anonymous` 컬럼 추가 (church_qt_posts, guest_comments)
- `day_number` 컬럼 추가 (church_qt_posts, guest_comments)
- `replies_count` 컬럼 추가 (church_qt_posts, guest_comments)
- `likes_count` 컬럼 추가 (church_qt_posts)
- `church_qt_post_likes` 테이블 생성
- `church_qt_post_replies` 테이블 생성
- `guest_comment_replies` 테이블 생성

---

## 2025-12-30 업데이트 (교회 홈 페이지 답글 기능)

### 완료된 작업

#### 1. 교회 홈 페이지 답글(댓글) 기능 추가 ✅
- `/church/[code]/page.tsx` 수정
- 묵상글에 답글 작성 기능 추가
- 답글 펼치기/접기 기능
- 답글 목록 실시간 로드
- guest_comment_replies 및 church_qt_post_replies 테이블 활용

#### 주요 구현 내용
1. **상태 관리**
   - `replyingToId`: 현재 답글 작성 중인 글 ID
   - `replyingToSource`: guest_comment 또는 qt_post 구분
   - `repliesMap`: 글별 답글 목록 캐시
   - `expandedReplies`: 펼쳐진 답글 목록 Set

2. **핵심 함수**
   - `loadReplies(commentId, source)`: source에 따라 다른 테이블에서 답글 로드
   - `toggleReplies(commentId, source)`: 답글 목록 펼치기/접기
   - `startReply(commentId, source)`: 답글 작성 시작
   - `handleSubmitReply()`: 답글 제출 (source에 따라 다른 테이블에 저장)

3. **UI 기능**
   - 답글 버튼 (QR 코드 접근 또는 등록 교인만)
   - 답글 개수 표시 및 펼치기/접기 버튼
   - 답글 목록 표시 (아바타, 이름, 시간, 내용)
   - 답글 작성 폼 (이름 입력, 내용 입력, 등록/취소 버튼)

4. **데이터 흐름**
   - guest_comments → guest_comment_replies 테이블
   - church_qt_posts → church_qt_post_replies 테이블
   - 답글 등록 시 replies_count 자동 증가 (트리거)

### 배포 완료
- https://www.reading-jesus.com 에 배포됨

---

## 2025-12-30 업데이트 (교회 성경 리더기 구절 자동 삽입)

### 완료된 작업

#### 1. 교회 성경 리더기에서 구절 클릭 시 자동 삽입 ✅
- `/church/[code]/bible/reader/page.tsx` 수정
- 일반 바이블 리더와 동일하게 동작하도록 통합
- 묵상 패널이 열려있을 때 구절 클릭 → 에디터에 자동 삽입

#### 수정 내용
1. **`handleVerseClick` 함수 수정**
   - 기존: 구절 클릭 시 항상 클립보드 복사
   - 수정: `meditationPanelOpen`이 true이면 `meditationVerses`에 추가 → MeditationEditor의 자동 삽입 기능 활용

2. **`handleSelectionComplete` 함수 수정**
   - 기존: 범위 선택 완료 시 항상 클립보드 복사
   - 수정: `meditationPanelOpen`이 true이면 선택한 범위를 `meditationVerses`에 추가

#### 동작 흐름
1. 사용자가 묵상 패널을 열음
2. 성경 본문에서 구절 클릭
3. `meditationVerses` 배열에 구절 추가
4. `MeditationEditor`의 `useEffect`가 감지하여 에디터에 blockquote로 자동 삽입

### 배포 완료
- https://www.reading-jesus.com 에 배포됨

---

## 2025-12-30 업데이트 (댓글/답글 삭제 기능)

### 완료된 작업

#### 1. 교회 홈 페이지 답글 삭제 기능 ✅
- `/church/[code]/page.tsx` 수정
- 본인이 작성한 답글 삭제 가능

#### 주요 구현 내용
1. **기존 댓글 삭제** (이미 구현됨)
   - `canDeleteComment()`: 로그인 사용자는 `linked_user_id`, 비로그인은 `device_id`로 확인
   - 삭제 버튼 및 확인 다이얼로그

2. **답글 삭제 추가** (신규)
   - `canDeleteReply()`: 로그인 사용자는 `user_id`, 비로그인은 `device_id`로 확인
   - `handleDeleteReply()`: source에 따라 guest_comment_replies 또는 church_qt_post_replies에서 삭제
   - 삭제 후 `repliesMap` 및 `replies_count` 자동 업데이트
   - 마우스 호버 시 삭제 버튼 표시 (group-hover)
   - 삭제 확인 다이얼로그

#### 2. 교회 나눔 페이지 답글 삭제 기능 ✅
- `/church/[code]/sharing/page.tsx` 수정
- 동일한 방식으로 답글 삭제 구현

#### 수정 파일
1. `src/app/church/[code]/page.tsx`
   - 답글 삭제 관련 상태 추가 (`deleteReplyId`, `deleteReplyConfirmOpen` 등)
   - `canDeleteReply()` 함수 추가
   - `handleDeleteReply()` 함수 추가
   - 답글 UI에 삭제 버튼 추가
   - 답글 삭제 확인 다이얼로그 추가

2. `src/app/church/[code]/sharing/page.tsx`
   - replies 인터페이스에 `device_id` 추가
   - 답글 삭제 상태 추가
   - `canDeleteReply()` 함수 추가
   - `handleDeleteReply()` 함수 추가
   - 답글 UI에 삭제 버튼 추가
   - 답글 삭제 확인 다이얼로그 추가
   - `DialogDescription` import 추가

### 배포 완료
- https://www.reading-jesus.com 에 배포됨

---

## 2025-12-30 업데이트 (묵상 에디터 리팩토링)

### 개요
바이블 리더기의 글 작성 폼을 전면 개선하여 PC/모바일 각각에 최적화된 작성 환경 제공

### 확정된 요구사항
| 항목 | 결정 |
|------|------|
| 임시저장 최대 개수 | **3개** |
| 말씀카드 이미지 저장 | **Base64** (게시글에 직접 삽입) |
| PC 분할 비율 | **조절 가능** (추후 구현) |
| PC 레이아웃 방식 | **옵션 B: 동적 레이아웃** (추후 구현) |

### 완료된 작업

#### Phase 1: 긴급 수정 ✅

##### 1-1. 모바일 버튼 표시 문제 해결
- `MeditationPanel.tsx` 수정
- 에디터 영역을 `flex-1 min-h-0`으로 변경하여 하단 버튼이 항상 표시되도록
- `pb-safe` 클래스로 Safe Area 고려

##### 1-2. 스크롤 문제 해결
- `MeditationEditor.tsx` 수정
- 에디터 영역에 `overflow-y-auto` 적용
- 하단 툴바에 `flex-shrink-0`과 `border-t` 추가

#### Phase 2: 모바일 UX 개선 ✅

##### 2-1. 오버레이 제거/투명화
- `MeditationPanel.tsx` 수정
- 검은 오버레이를 `pointer-events-none`으로 변경
- 배경 말씀 클릭 가능하도록 개선

##### 2-2. 말씀 직접 삽입 로직 (기존 구현 확인)
- 구절 선택 시 에디터에 blockquote로 자동 삽입
- `prevVersesLengthRef`로 새 구절 감지

#### Phase 3: 다중 임시저장 시스템 ✅

##### 신규 파일
1. `src/hooks/useMultiDraft.ts`
   - 최대 3개 드래프트 관리
   - localStorage에 배열 형태로 저장
   - 자동 저장 (2초 디바운스)
   - 가장 오래된 드래프트 자동 삭제

2. `src/components/meditation/DraftDropdown.tsx`
   - 드래프트 목록 드롭다운
   - 미리보기 (첫 30자)
   - 저장 시간 표시
   - 선택/삭제 기능
   - 새 드래프트 시작 옵션

##### 수정 파일
- `MeditationEditor.tsx` - useMultiDraft 훅 통합, DraftDropdown 추가

#### Phase 4: 말씀카드 → 에디터 이미지 삽입 ✅

##### 수정 파일
1. `src/components/church/VerseCardGenerator.tsx`
   - `onCardCreated` 콜백 prop 추가
   - "게시글에 삽입" 버튼 추가
   - `handleInsertToPost()` 함수로 base64 이미지 반환

2. `src/components/ui/rich-editor.tsx`
   - `@tiptap/extension-image` 추가 (npm install)
   - `insertImage`, `onInsertImageComplete` props 추가
   - RichViewer에도 Image extension 추가

3. `src/components/meditation/MeditationEditor.tsx`
   - `cardImageToInsert`, `onCardImageInserted` props 추가
   - 외부에서 이미지 전달 시 에디터에 삽입

4. `src/components/meditation/MeditationPanel.tsx`
   - `cardImageToInsert` 상태 관리
   - VerseCardGenerator와 MeditationEditor 연결

### ✅ Phase 5: PC 분할 뷰 레이아웃 - 완료 (2025-12-30)
- [x] 2열 레이아웃 (왼쪽 성경 / 오른쪽 에디터)
- [x] 드래그로 비율 조절 (30%~70% 범위)
- [x] 동적 레이아웃 모드 (페이지 전환 없음)
- [x] 비율 localStorage 자동 저장

#### 구현 내용
1. `src/hooks/useSplitView.ts` - 분할 비율 관리 훅 (참조용)
2. `src/components/meditation/SplitViewLayout.tsx` - PC 분할 뷰 레이아웃 컴포넌트
3. `src/app/church/[code]/bible/reader/page.tsx` - PC/모바일 분기 처리
   - `isDesktop` 상태로 lg(1024px) 이상에서 분할 뷰 적용
   - PC: SplitViewLayout 사용, 모바일: MeditationPanel 바텀시트 유지

### 수정 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/hooks/useMultiDraft.ts` | 신규 - 다중 임시저장 훅 |
| `src/hooks/useSplitView.ts` | 신규 - 분할 뷰 비율 관리 훅 |
| `src/components/meditation/DraftDropdown.tsx` | 신규 - 드래프트 드롭다운 UI |
| `src/components/meditation/SplitViewLayout.tsx` | 신규 - PC 분할 뷰 레이아웃 |
| `src/components/meditation/MeditationPanel.tsx` | 오버레이 제거, 스크롤 개선, 카드 이미지 연동 |
| `src/components/meditation/MeditationEditor.tsx` | 다중 드래프트 통합, 이미지 삽입 기능 |
| `src/components/church/VerseCardGenerator.tsx` | 게시글에 삽입 콜백 추가 |
| `src/components/ui/rich-editor.tsx` | Image extension 추가 |
| `src/app/church/[code]/bible/reader/page.tsx` | PC 분할 뷰 통합, isDesktop 분기 |

### 설치된 패키지
- `@tiptap/extension-image` - TipTap 이미지 확장

### 참고 문서
- `docs/MEDITATION_EDITOR_REFACTOR_PLAN.md` - 전체 리팩토링 계획

### 빌드 확인
- ✅ `npm run build` 성공 (2025-12-30)

---

## 🎉 묵상 에디터 리팩토링 완료 요약 (2025-12-30)

### 모바일 개선
- 바텀시트 드래그 UX 개선
- 배경 성경 구절 선택 가능 (오버레이 투명화)
- 다중 임시저장 (최대 3개)

### PC 개선
- 동적 분할 뷰 레이아웃 (lg 브레이크포인트 이상)
- 드래그로 분할 비율 조절 (30%~70%)
- 더블클릭으로 기본값 리셋
- 비율 설정 localStorage 자동 저장

### 공통 기능
- 말씀카드 → 에디터 Base64 이미지 삽입
- TipTap 리치 에디터 이미지 지원
- 임시저장 드롭다운 UI

---

## ✅ UI/UX 개선 및 버그 수정 (2025-12-30)

### 묵상 에디터 UI 개선
1. **선택된 구절 섹션 스크롤**: `max-h-[30vh] overflow-y-auto` 적용하여 구절 많을 때 스크롤 가능
2. **에디터 캔버스 유지**: `flex-shrink-0`과 `min-h-[200px]` 적용하여 구절 펼쳐도 에디터 영역 유지
3. **에디터 이미지 크기 축소**: `max-w-[180px]`으로 썸네일 크기로 표시

### 피드 이미지 인스타 스타일 적용
- FeedCard에서 이미지를 텍스트 아래 인스타그램 스타일로 표시
- 단일 이미지: 전체 너비로 표시
- 여러 이미지: 2x2 그리드 + 추가 이미지 개수 표시
- `extractImagesFromHtml`, `removeImagesFromHtml` 유틸 함수 추가

### 콘솔 경고 수정
1. **TipTap Underline 중복 경고**: `Underline.extend({ name: 'customUnderline' })` 적용
2. **Dialog Description 경고**: VerseCardGenerator에 sr-only DialogDescription 추가, 다이얼로그에 `aria-describedby={undefined}` 추가

### QT 게시글 스타일 통일 (교회 메인/나눔 페이지)
- `/church/[code]/page.tsx`에 QT 원본 필드 추가 (mySentence, meditationAnswer, gratitude, myPrayer, dayReview)
- 나눔 페이지와 동일한 컬러 박스 스타일 적용
  - 내 말로 한 문장: 앰버 박스
  - 묵상 질문 답변: 퍼플 박스
  - 감사와 적용: 그린 박스
  - 나의 기도: 블루 박스
  - 하루 점검: 인디고 그라데이션 박스

### 기타 개선
- 성경 읽기 페이지에서 구절 추가 시 토스트 알림 제거 (UX 간소화)

### 수정 파일 목록

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/meditation/MeditationEditor.tsx` | 선택 구절 스크롤, 에디터 최소 높이 |
| `src/components/ui/rich-editor.tsx` | 이미지 크기 180px, Underline 중복 수정 |
| `src/components/church/FeedCard.tsx` | 인스타 스타일 이미지 그리드 |
| `src/components/church/VerseCardGenerator.tsx` | DialogDescription 추가 |
| `src/app/church/[code]/page.tsx` | QT 컬러 박스 스타일 적용 |
| `src/app/church/[code]/sharing/page.tsx` | aria-describedby 경고 수정 |
| `src/app/(main)/bible-reader/page.tsx` | 구절 추가 토스트 제거 |
| `src/app/church/[code]/bible/reader/page.tsx` | 구절 추가 토스트 제거 |

### 빌드 확인
- ✅ `npm run build` 성공 (2025-12-30)

---

## ✅ QTContentRenderer 리팩토링 완료 (2025-12-30)

### 목적
QT 콘텐츠 렌더링 코드를 공통 컴포넌트로 추출하여 일관성 유지 및 유지보수성 향상

### 생성된 컴포넌트
**`src/components/church/QTContentRenderer.tsx`**

```typescript
// 주요 export
export function QTContentRenderer({ data, className }: QTContentRendererProps)
export function hasQTContent(data: QTContentData): boolean

// QTContentData 인터페이스
interface QTContentData {
  mySentence?: string | null;
  meditationAnswer?: string | null;
  meditationQuestion?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
}
```

### 적용된 페이지
| 파일 | 변경 내용 |
|------|-----------|
| `src/components/church/FeedCard.tsx` | QTContentRenderer 사용, hasQTContent 함수 사용 |
| `src/app/church/[code]/page.tsx` | QTContentRenderer 사용 |

### 장점
1. **일관성**: 모든 페이지에서 동일한 QT 스타일 보장
2. **유지보수성**: 스타일 변경 시 한 곳만 수정하면 됨
3. **재사용성**: 새로운 페이지에서도 쉽게 사용 가능
4. **코드 중복 제거**: ~100줄의 중복 코드 제거

### 빌드 확인
- ✅ `npm run build` 성공 (2025-12-30)

---

## ✅ 묵상/QT 수정 및 삭제 기능 추가 (2025-12-30)

### 기능 설명
- 본인이 작성한 묵상 및 QT 게시글을 수정/삭제 가능
- 수정 시 익명 설정 변경 가능 (공개 ↔ 익명 전환)

### 생성된 컴포넌트
**`src/components/church/EditPostDialog.tsx`**
- 묵상: 리치 에디터로 내용 수정
- QT: 5개 필드(내 말로 한 문장, 묵상 답변, 감사와 적용, 나의 기도, 하루 점검) 개별 수정
- 익명 체크박스로 공개/익명 전환

### 수정된 파일
| 파일 | 변경 내용 |
|------|-----------|
| `src/components/church/FeedCard.tsx` | 더보기 메뉴 추가 (수정/삭제), currentUserId로 본인 확인, DropdownMenu 사용 |
| `src/components/church/EditPostDialog.tsx` | 신규 - 묵상/QT 수정 다이얼로그 |
| `src/app/church/[code]/sharing/page.tsx` | 수정/삭제 핸들러 및 다이얼로그 추가 |

### 사용 방법
```tsx
<FeedCard
  item={item}
  currentUserId={currentUser?.id}  // 본인 게시글 판별
  onEdit={handleOpenEdit}           // 수정 다이얼로그 열기
  onDelete={handleOpenDeleteConfirm} // 삭제 확인 다이얼로그 열기
/>
```

### 주요 기능
1. **본인 게시글만 수정/삭제**: `currentUserId`와 `item.userId` 비교
2. **더보기 메뉴**: 카드 우상단 ⋮ 버튼으로 수정/삭제 접근
3. **익명 전환**: 수정 시 체크박스로 공개/익명 상태 변경
4. **삭제 확인**: 삭제 전 확인 다이얼로그 표시

### 빌드 확인
- ✅ `npm run build` 성공 (2025-12-30)

---

## ✅ 교회 홈 화면 수정 기능 추가 (2025-12-30)

### 기능 설명
교회 홈 화면(`/church/[code]`)에서도 나눔 페이지와 동일하게 본인 게시글 수정 가능

### 수정된 파일
| 파일 | 변경 내용 |
|------|-----------|
| `src/app/church/[code]/page.tsx` | EditPostDialog import, 상태/핸들러 추가, 수정 버튼 UI |

### 추가된 코드
1. **Import**: `EditPostDialog`, `FeedItem`, `Pencil`
2. **상태 변수**: `editDialogOpen`, `editingItem`
3. **핸들러**:
   - `handleOpenEdit(comment)`: GuestComment를 FeedItem으로 변환 후 다이얼로그 열기
   - `handleSaveEdit(data)`: 타입에 따라 `guest_comments` 또는 `church_qt_posts` 업데이트
4. **UI**: 삭제 버튼 옆에 수정 버튼 추가 (연필 아이콘)
5. **다이얼로그**: `<EditPostDialog />` 컴포넌트 추가

### 배포
- ✅ Vercel 배포 완료 (https://www.reading-jesus.com)

---

## ✅ 교회 홈페이지 UI 리디자인 + 새 컬러 시스템 (2025-12-30)

### 변경 개요
교회 홈 화면(`/church/[code]`)을 현대적이고 깔끔한 디자인으로 전면 리디자인
- 기존 올리브 그린 테마 → **Slate + Coral** 컬러 시스템으로 변경
- QT 카드 슬라이더 추가 (3초 자동 슬라이드)
- 인스타그램 스타일 피드 레이아웃

### 새로운 컬러 시스템

#### Primary Colors
| 색상 | 용도 | HSL 값 |
|------|------|--------|
| Slate Gray | 기본, 텍스트, 헤더 | `220 15% 30%` |
| Warm Coral | 액센트, CTA 버튼 | `12 76% 61%` |
| Soft Sage | 보조 (성경의 평화로움) | `158 30% 42%` |

#### Slate 팔레트 (50~900)
- 신뢰감 있고 현대적인 뉴트럴 톤
- 헤더, 텍스트, 카드 배경에 사용

#### Coral 팔레트 (50~900)
- 따뜻한 산호색으로 활력과 에너지
- CTA 버튼, 좋아요, 강조 요소에 사용

#### QT 박스 컬러 (유지)
- Amber: 하루 점검, 내 말로 한 문장
- Purple: 묵상 질문 답변
- Emerald: 감사와 적용
- Sky: 나의 기도
- Indigo: 추가 묵상

### 생성된 컴포넌트

**`src/components/church/QTCardSlider.tsx`**
```tsx
interface QTSliderItem {
  id: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
  dayReview: string | null;  // 앰버 박스에 표시
  qtDate: string;
}

<QTCardSlider
  items={qtSliderItems}
  churchCode={churchCode}
  autoSlideInterval={3000}  // 3초마다 자동 슬라이드
/>
```

### 수정된 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/globals.css` | 완전 재작성 - Slate+Coral 컬러 시스템, 다크모드, QT 박스 색상 |
| `tailwind.config.ts` | slate, coral, sage, qt 컬러 팔레트 추가, 호환성 별칭(olive→slate, warm→coral) |
| `src/components/church/QTCardSlider.tsx` | 신규 - QT 카드 슬라이더 컴포넌트 |
| `src/app/church/[code]/page.tsx` | 전체 UI olive→slate/coral 마이그레이션, QT 슬라이더 추가 |

### 페이지 구조 (신규)

```
┌─────────────────────────────────────┐
│  헤더 (Slate 그라데이션)              │
├─────────────────────────────────────┤
│  날짜 선택 (Today's Reading)         │
├─────────────────────────────────────┤
│  짧은 묵상 나눔 작성 폼               │
│  (Coral CTA 버튼)                    │
├─────────────────────────────────────┤
│  오늘의 QT 나눔 슬라이더 ← NEW!      │
│  (3초 자동 슬라이드, 앰버 박스)       │
├─────────────────────────────────────┤
│  묵상 나눔 피드                       │
│  (인스타그램 스타일 카드)             │
├─────────────────────────────────────┤
│  푸터                                │
└─────────────────────────────────────┘
```

### QT 슬라이더 기능
1. **자동 슬라이드**: 3초마다 다음 카드로 자동 전환
2. **마우스 호버 시 일시정지**: 사용자가 읽는 동안 멈춤
3. **좌우 화살표**: 수동 네비게이션
4. **인디케이터**: 현재 위치 표시 및 클릭으로 이동
5. **앰버 박스**: "말씀과 함께한 하루 점검" 내용 표시

### 디자인 특징
1. **깔끔하고 현대적**: 과도한 장식 제거, 깔끔한 라인
2. **접근성 고려**: 청소년~장년층 모두 편하게 사용
3. **일관된 컬러**: 전체 앱에서 통일된 색상 시스템
4. **부드러운 애니메이션**: shadow-soft, card-hover 효과

### 호환성
- `olive-*` 클래스는 `slate-*`로 매핑되어 기존 코드 호환
- `warm-*` 클래스는 `coral-*`로 매핑

---

## ✅ YouTube Shorts 기능 추가 (2025-12-30)

### 개요
교회 홈페이지에서 YouTube Shorts를 앱 내에서 재생할 수 있는 기능. 유튜브로 이탈하지 않고 TikTok/Reels 스타일의 세로 스와이프 재생 지원.

### 구현 내용

#### 1. 데이터베이스 (Supabase)
- **테이블**: `church_shorts`
  - `id`, `church_id`, `youtube_url`, `video_id`, `title`, `description`
  - `thumbnail_url`, `display_order`, `is_active`, `created_at`
- **RLS 정책**:
  - 읽기: 활성화된 Shorts만 공개
  - 쓰기: 관리자/목사만 가능

#### 2. Shorts 뷰어 컴포넌트
- **파일**: `src/components/church/ShortsViewer.tsx`
- **기능**:
  - 가로 스크롤 썸네일 목록 (미니 플레이어)
  - 전체화면 모드 (세로 스와이프)
  - YouTube IFrame API 연동
  - 재생/일시정지, 음소거 컨트롤
  - 터치 스와이프로 영상 전환
  - 자동 다음 영상 재생

#### 3. 관리자 페이지 UI
- **위치**: `/church/[code]/admin` → Settings 탭
- **기능**:
  - YouTube URL 입력으로 Shorts 추가
  - 제목 설정 (선택)
  - 순서 변경 (위/아래 버튼)
  - 활성화/비활성화 토글
  - 삭제 (확인 다이얼로그)

#### 4. 교회 홈페이지 통합
- **위치**: QT 슬라이더 아래, 피드 위
- **조건**: 활성화된 Shorts가 있을 때만 표시
- **디자인**: 빨간 그라데이션 아이콘, 개수 표시 배지

### 수정된 파일
| 파일 | 변경 내용 |
|------|-----------|
| `supabase/migrations/20251230000002_add_church_shorts.sql` | Shorts 테이블 및 RLS 생성 |
| `src/types/youtube.d.ts` | YouTube IFrame API 타입 정의 |
| `src/components/church/ShortsViewer.tsx` | Shorts 뷰어 컴포넌트 |
| `src/app/church/[code]/admin/page.tsx` | 관리자 Shorts 관리 UI |
| `src/app/church/[code]/page.tsx` | 홈페이지에 ShortsViewer 통합 |

### UI 구조
```
교회 홈페이지
┌─────────────────────────────────────┐
│  헤더                                │
├─────────────────────────────────────┤
│  묵상 작성 폼                        │
├─────────────────────────────────────┤
│  QT 카드 슬라이더                    │
├─────────────────────────────────────┤
│  교회 Shorts (NEW!)                  │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐              │
│  │ 1│ │ 2│ │ 3│ │ 4│  → 가로 스크롤  │
│  └──┘ └──┘ └──┘ └──┘              │
│  [전체화면으로 보기]                 │
├─────────────────────────────────────┤
│  피드                                │
└─────────────────────────────────────┘
```

### 전체화면 모드
```
┌─────────────────────────────────────┐
│  [교회 Shorts]              [X]     │
├─────────────────────────────────────┤
│                                     │
│         YouTube Player              │
│         (9:16 비율)                 │
│                                     │
│                            [▲]      │
│                            [▼]      │
│                                     │
├─────────────────────────────────────┤
│  제목                      [음소거]  │
│  1 / 5                              │
└─────────────────────────────────────┘
```

### 빌드 확인
- ✅ `npm run build` 성공 (2025-12-30)

---

## Phase: 인스타그램 스타일 나눔 피드 컴포넌트 ✅ 완료 (2025-12-30)

### 개요
교회 나눔 페이지(`/church/[code]/sharing`)에서 사용할 수 있는 인스타그램 릴스/스토리 스타일의 풀스크린 세로 피드 컴포넌트

### 구현 내용

#### 1. InstagramStyleFeed 컴포넌트 ✅
- [x] 풀스크린 세로 피드 (100vh 카드)
- [x] 스냅 스크롤 네비게이션
- [x] 이름 기반 그라데이션 배경
- [x] 이미지 배경 지원 (이미지가 있을 경우)

#### 2. StoryCard 서브컴포넌트 ✅
- [x] 상단: 프로필 아바타 (링 효과) + 이름 + 타입 뱃지 + 시간
- [x] 중앙: 메인 콘텐츠 (묵상 텍스트 또는 QT 박스)
- [x] 성경 구절 뱃지
- [x] QT 확장/축소 기능

#### 3. 우측 액션 버튼 ✅
- [x] 좋아요 버튼 (하트 아이콘, 애니메이션)
- [x] 댓글 버튼 (메시지 아이콘)
- [x] 공유 버튼 (Web Share API 연동)

#### 4. FAB 글쓰기 버튼 ✅
- [x] 하단 고정 플로팅 버튼
- [x] 그라데이션 스타일
- [x] 터치 피드백 애니메이션

#### 5. 네비게이션 기능 ✅
- [x] 스와이프로 이전/다음 이동
- [x] 키보드 네비게이션 (Arrow Up/Down, j/k)
- [x] 좌측 진행 인디케이터
- [x] 첫 카드 스와이프 힌트 애니메이션

#### 6. 추가 기능 ✅
- [x] 무한 스크롤 지원 (onLoadMore)
- [x] 빈 피드 상태 UI
- [x] 로딩 인디케이터
- [x] FeedViewToggle 컴포넌트 (리스트/스토리 뷰 전환)

### 생성된 파일
```
src/components/church/InstagramStyleFeed.tsx
```

### Export 목록
- `InstagramStyleFeed` - 메인 피드 컴포넌트
- `FeedViewToggle` - 뷰 모드 전환 컴포넌트

### Props 인터페이스
```typescript
interface InstagramStyleFeedProps {
  items: FeedItem[];
  currentUserId?: string | null;
  onLike: (id: string, type: FeedItemType) => void;
  onComment: (id: string, type: FeedItemType) => void;
  onShare?: (item: FeedItem) => void;
  onWrite?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
}
```

### 사용 예시
```tsx
import { InstagramStyleFeed, FeedViewToggle } from '@/components/church/InstagramStyleFeed';

// 스토리 뷰 사용
<InstagramStyleFeed
  items={feedItems}
  currentUserId={currentUser?.id}
  onLike={handleLike}
  onComment={handleOpenCommentDialog}
  onWrite={() => handleOpenWriteDialog('meditation')}
  hasMore={hasMore}
  onLoadMore={loadFeed}
  loading={loadingMore}
/>

// 뷰 전환 토글
<FeedViewToggle
  viewMode={viewMode}
  onViewModeChange={setViewMode}
/>
```

### 기존 FeedCard와의 관계
- FeedItem 타입과 FeedItemType을 FeedCard.tsx에서 재사용
- 기존 리스트 뷰(FeedCard)와 스토리 뷰(InstagramStyleFeed) 간 전환 가능
- 동일한 핸들러 함수들 사용 (onLike, onComment)

---

## ✅ 교회 Sharing 페이지 인스타그램 스타일 통합 (2024-12-30)

### 개요
교회 묵상 나눔 페이지(`/church/[code]/sharing`)에 인스타그램 Reels/Stories 스타일 피드 뷰를 통합했습니다.

### 구현된 기능

#### 1. 뷰 모드 토글
- 헤더에 목록/스토리 아이콘 버튼 추가
- `LayoutGrid` 아이콘: 기존 카드 리스트 뷰
- `Play` 아이콘: 인스타그램 스타일 스토리 뷰
- 상태: `viewMode: 'list' | 'story'`

#### 2. 스토리 뷰 모드
- 전체 화면(`fixed inset-0`) 풀스크린 피드
- CSS snap scroll로 한 게시물씩 스크롤
- 각 게시물마다 그라데이션 배경 또는 이미지 배경
- 우측 액션 버튼 (좋아요, 댓글, 공유)
- FAB 글쓰기 버튼
- 좌측 상단 뒤로가기 버튼 (목록 뷰로 복귀)
- 키보드 네비게이션 (↑/↓, j/k)
- 좌측 진행 인디케이터

#### 3. 반응형 UI 처리
- 스토리 뷰에서 헤더 숨김 (`hidden` class)
- 스토리 뷰에서 하단 네비게이션 숨김
- 스토리 뷰에서 body padding 제거

### 수정된 파일
```
src/app/church/[code]/sharing/page.tsx
- InstagramStyleFeed 컴포넌트 import
- viewMode 상태 추가
- 헤더에 뷰 모드 토글 버튼 추가
- 조건부 렌더링 (list vs story)
- 스토리 뷰에서 헤더/네비게이션 숨김
```

### 주요 Props 연결
```tsx
<InstagramStyleFeed
  items={feedItems}
  currentUserId={currentUser?.id}
  onLike={handleLike}
  onComment={handleOpenCommentDialog}
  onWrite={() => handleOpenWriteDialog('meditation')}
  hasMore={hasMore}
  onLoadMore={() => loadFeed(false)}
  loading={loadingMore}
/>
```

---

## ✅ 유튜브 링크 자동 임베드 기능 (2024-12-30)

### 개요
묵상 나눔에 유튜브 링크를 올리면 자동으로 임베드 플레이어로 변환되어 표시됩니다.

### 구현된 기능

#### 1. RichViewerWithEmbed 컴포넌트
- HTML 콘텐츠에서 유튜브 URL 자동 감지
- href 속성 및 일반 텍스트에서 유튜브 링크 추출
- 썸네일 + 재생 버튼 형태로 표시
- 클릭 시 자동 재생 (autoplay=1)

#### 2. YoutubeEmbed 컴포넌트
- 유튜브 썸네일 이미지 표시
- 빨간색 재생 버튼 (hover 효과)
- 클릭 시 iframe으로 전환되어 재생

### 적용된 페이지
- `src/components/church/FeedCard.tsx` - 피드 카드
- `src/app/church/[code]/page.tsx` - 교회 메인
- `src/app/church/[code]/sharing/page.tsx` - 나눔 페이지
- `src/app/church/[code]/groups/[groupId]/page.tsx` - 소그룹

### 수정/생성된 파일
```
src/components/ui/rich-editor.tsx
- RichViewerWithEmbed 컴포넌트 추가
- YoutubeEmbed 컴포넌트 추가
- extractYoutubeUrls 함수 추가
```

---

## ✅ 통독일정 연동 핫픽스 (2024-12-30)

### 문제점
- 묵상 리더기, 나눔 페이지에서 작성한 묵상에 통독일정(`day_number`)이 저장되지 않음
- 홈 페이지에서는 자동 연동되어야 하는데 `day_number` 필드가 누락됨
- 나눔 페이지 통독일정 선택 UI가 365개 드롭다운으로 사용성 불편

### 해결 방법

#### 1. ReadingDayPicker 컴포넌트 생성
**새 파일:** `src/components/church/ReadingDayPicker.tsx`
- 검색 가능한 콤보박스 형태
- 일차, 날짜, 성경으로 검색
- "오늘 일정" 빠른 선택 버튼
- 선택된 항목으로 자동 스크롤
- Popover + 검색 + 스크롤 리스트 UI

#### 2. 홈 페이지 (`/church/[code]`)
**수정 파일:** `src/app/church/[code]/page.tsx`
- `findDayByDate()` 유틸리티 함수로 날짜 → day_number 변환
- 묵상 등록 시 `day_number` 필드 자동 저장
- `ReadingSchedule` 인터페이스에 `day?: number` 추가

#### 3. 묵상 리더기 (`/church/[code]/bible/reader`)
**수정 파일:** `src/app/church/[code]/bible/reader/page.tsx`
- `MeditationEditor`에 `showDayPicker={true}` 전달
- `handleMeditationSubmit`에서 `data.dayNumber` DB 저장
- PC/모바일 모두 통독일정 선택 가능

#### 4. MeditationEditor 컴포넌트
**수정 파일:** `src/components/meditation/MeditationEditor.tsx`
- `showDayPicker`, `initialDayNumber` props 추가
- `MeditationSubmitData`에 `dayNumber` 필드 추가
- ReadingDayPicker UI 추가 (조건부 렌더링)

#### 5. MeditationPanel 컴포넌트
**수정 파일:** `src/components/meditation/MeditationPanel.tsx`
- `showDayPicker` prop 추가
- 모바일/데스크톱 에디터 모두에 전달

#### 6. 나눔 페이지 (`/church/[code]/sharing`)
**수정 파일:** `src/app/church/[code]/sharing/page.tsx`
- 기존 Select 컴포넌트 → ReadingDayPicker로 교체
- 검색 가능한 UI로 사용성 개선

#### 7. 묵상 수정 다이얼로그
**수정 파일:** `src/components/church/EditPostDialog.tsx`
- `EditPostData`에 `dayNumber` 필드 추가
- ReadingDayPicker로 통독일정 변경 가능
- 묵상 수정 시 `day_number` DB 업데이트

#### 8. 수정 저장 핸들러
**수정 파일:** `src/app/church/[code]/page.tsx`
- `handleSaveEdit`에서 `day_number` 업데이트 추가
- 묵상/QT 모두 통독일정 변경 저장

### 새로 생성된 파일
```
src/components/church/ReadingDayPicker.tsx   # 통독일정 선택 컴포넌트
src/components/ui/popover.tsx                # Radix Popover 컴포넌트
```

### 새로 설치된 패키지
```
@radix-ui/react-popover
```

### 수정된 파일 목록
```
src/app/church/[code]/page.tsx
src/app/church/[code]/sharing/page.tsx
src/app/church/[code]/bible/reader/page.tsx
src/components/meditation/MeditationEditor.tsx
src/components/meditation/MeditationPanel.tsx
src/components/church/EditPostDialog.tsx
```

---

## ✅ QT JSON 데이터 수정 및 묵상 질문 배열 지원 (2024-12-30)

### 문제점
1. **PDF 추출 오류**: QT JSON 데이터가 PDF 줄바꿈으로 인해 중간중간 끊어진 내용 존재
2. **묵상 질문 1개 제한**: 일부 날짜에 묵상 질문이 2개 있으나 데이터 구조가 단일 문자열만 지원
3. **가독성 문제**: `meditationGuide` 필드에 문단 구분이 없어 읽기 어려움

### 해결 방법

#### 1. QT JSON 데이터 수정
**수정 파일:** `data/qt-january-2026.json`
- PDF 원본과 비교하여 모든 truncated 필드 완성
- `meditationQuestion` (string) → `meditationQuestions` (string[]) 배열로 변경
- 묵상 질문이 2개인 날짜: 13, 15, 16, 26, 27, 30일
- 모든 `meditationGuide`에 `\n\n` 문단 구분 추가

#### 2. TypeScript 타입 수정
**수정 파일:** `src/types/index.ts`
```typescript
export interface QTMeditation {
  // ... 기존 필드들
  meditationQuestions: string[];    // 묵상 질문 (1~2개) - 기존: meditationQuestion: string | null
  // ... 기존 필드들
}
```

#### 3. QT 유틸리티 함수 수정
**수정 파일:** `src/lib/qt-content.ts`
- `qtToMarkdown()` 함수: 묵상 질문 배열 처리
- `createQTWritingTemplate()` 함수: 묵상 질문 배열 처리
- 질문이 여러 개면 번호 붙여서 표시

#### 4. QTViewer 컴포넌트 수정
**수정 파일:** `src/components/qt/QTViewer.tsx`
- 묵상 질문 섹션에서 배열 렌더링
- 질문이 2개 이상이면 "(2개)" 표시
- 각 질문에 "질문 1", "질문 2" 레이블 추가

#### 5. QTCardSlider 컴포넌트 수정
**수정 파일:** `src/components/church/QTCardSlider.tsx`
- QT 원문 모달에서 묵상 질문 배열 렌더링
- QTViewer와 동일한 UI 패턴 적용

#### 6. 나눔 페이지 수정
**수정 파일:** `src/app/church/[code]/sharing/page.tsx`
- 피드 아이템 생성 시 첫 번째 묵상 질문 사용
- QT 작성 다이얼로그에서 묵상 질문 배열 렌더링

### 수정된 파일 목록
```
data/qt-january-2026.json                     # QT JSON 데이터 전체 수정
src/types/index.ts                            # QTMeditation 타입 변경
src/lib/qt-content.ts                         # 유틸리티 함수 수정
src/components/qt/QTViewer.tsx                # 묵상 질문 배열 렌더링
src/components/church/QTCardSlider.tsx        # 모달 내 묵상 질문 배열 렌더링
src/app/church/[code]/sharing/page.tsx        # 나눔 페이지 수정
```

### 데이터 구조 변경 예시
**변경 전:**
```json
{
  "meditation": {
    "meditationQuestion": "단일 질문 문자열"
  }
}
```

**변경 후:**
```json
{
  "meditation": {
    "meditationQuestions": [
      "첫 번째 묵상 질문",
      "두 번째 묵상 질문 (있는 경우)"
    ]
  }
}
```

---

## ✅ QT 묵상질문 다중 답변 지원 및 통합 뷰어 (2024-12-31)

### 요구사항
1. **QT VIEW 버튼**: QT 원문 + 사용자 작성 답변을 함께 표시
2. **QT 슬라이더 필터링**: 선택된 통독일정(날짜)에 맞는 QT만 표시
3. **통합 답변 뷰어**: QTCardSlider와 sharing 페이지에서 동일한 UI 사용
4. **다중 묵상질문 지원**: 질문이 2개면 입력칸도 2개 생성, 뷰어에서 질문을 답변 위에 표시

### 구현 내역

#### 1. QTAnswerView 통합 컴포넌트 생성 ✅
**신규 파일:** `src/components/church/QTAnswerView.tsx`
- 재사용 가능한 QT 답변 뷰어 컴포넌트
- 작성자 정보 (아바타, 이름, 시간)
- 색상별 카드 디자인:
  - 🟠 한 단어 동그라미 (coral)
  - 🟡 내 말로 한 문장 (amber)
  - 🟣 묵상 질문 답변 (purple) - 다중 질문/답변 지원
  - 🟢 감사와 적용 (green)
  - 🔵 나의 기도 (blue)
  - 🟣 하루 점검 (indigo)
- JSON 배열 또는 단일 문자열 파싱 지원 (하위 호환)

```typescript
// 답변 문자열을 배열로 파싱 (JSON 또는 단일 문자열)
function parseAnswers(answer: string | null | undefined): string[] {
  if (!answer) return [];
  try {
    const parsed = JSON.parse(answer);
    if (Array.isArray(parsed)) return parsed;
    return [answer];
  } catch {
    return [answer];
  }
}
```

#### 2. QT 작성 폼 - 다중 질문 지원 ✅
**수정 파일:** `src/app/church/[code]/sharing/page.tsx`
- `qtFormData.meditationAnswer` (string) → `meditationAnswers` (string[]) 배열로 변경
- 묵상 질문별 개별 입력 필드 생성
- 질문이 입력칸 위에 표시되는 UI
- DB 저장 시 JSON.stringify로 배열 저장

```typescript
// 폼 데이터 구조 변경
const [qtFormData, setQtFormData] = useState({
  // ...
  meditationAnswers: [] as string[], // 묵상질문별 답변 배열
  // ...
});

// DB 저장 시
const filteredAnswers = qtFormData.meditationAnswers.filter(a => a.trim());
const meditationAnswerJson = filteredAnswers.length > 0
  ? JSON.stringify(filteredAnswers)
  : null;
```

#### 3. QTCardSlider 수정 ✅
**수정 파일:** `src/components/church/QTCardSlider.tsx`
- QTAnswerView 컴포넌트 import 및 사용
- QT VIEW 모달에서 QT 원문 + 사용자 답변 표시
- selectedItem 상태로 현재 선택된 아이템 추적
- QTSliderItem 인터페이스에 답변 필드 추가

#### 4. QT 슬라이더 날짜 필터링 ✅
**수정 파일:** `src/app/church/[code]/page.tsx`
- `.limit(20)` → `.eq('qt_date', selectedDate)` 변경
- 선택된 통독일정 날짜에 맞는 QT만 조회

### 수정된 파일 목록
```
src/components/church/QTAnswerView.tsx       # 신규 - 통합 답변 뷰어
src/app/church/[code]/sharing/page.tsx       # 다중 질문 폼 + QTAnswerView 사용
src/components/church/QTCardSlider.tsx       # QTAnswerView 사용, 모달 개선
src/app/church/[code]/page.tsx               # QT 슬라이더 날짜 필터링
```

### DB 저장 형식
**단일 답변 (기존 호환):**
```json
"한 개의 답변 문자열"
```

**다중 답변 (새 형식):**
```json
["첫 번째 질문에 대한 답변", "두 번째 질문에 대한 답변"]
```

---

## ✅ QT 뷰 통일 - QTContentRenderer 확장 (2024-12-31)

### 요구사항
- 교회 홈의 QT VIEW 버튼으로 보는 뷰와 교회 나눔 페이지의 QT글 더보기 뷰가 다름
- 두 뷰를 교회 홈 스타일(QTContentRenderer)로 통일
- 묵상 질문이 답변 위에 표시되도록 개선

### 구현 내역

#### 1. QTContentRenderer 컴포넌트 확장 ✅
**수정 파일:** `src/components/church/QTContentRenderer.tsx`
- `qtContent?: QTDailyContent | null` prop 추가 (QT 원문 참조용)
- `parseAnswers()` 함수 추가 (JSON 배열 또는 단일 문자열 파싱)
- 묵상 질문 답변 섹션에서 다중 질문/답변 지원
- 각 답변 위에 해당 묵상 질문 표시

```typescript
// 답변 문자열을 배열로 파싱 (JSON 또는 단일 문자열)
function parseAnswers(answer: string | null | undefined): string[] {
  if (!answer) return [];
  try {
    const parsed = JSON.parse(answer);
    if (Array.isArray(parsed)) return parsed;
    return [answer];
  } catch {
    return [answer];
  }
}
```

#### 2. QTCardSlider 수정 ✅
**수정 파일:** `src/components/church/QTCardSlider.tsx`
- QTAnswerView 제거, QTContentRenderer로 교체
- QT VIEW 모달에서 qtContent 전달
- 이미 구현되어 있던 기능 확인

#### 3. 나눔 페이지 상세 다이얼로그 수정 ✅
**수정 파일:** `src/app/church/[code]/sharing/page.tsx`
- `selectedItemQtContent` 상태 추가
- `handleViewDetail` 함수에서 QT 타입일 때 QT 원문 로드
- QTContentRenderer에 `qtContent={selectedItemQtContent}` 전달

```typescript
const handleViewDetail = async (item: FeedItem) => {
  setSelectedItem(item);
  setDetailDialogOpen(true);

  // QT 타입일 때 QT 원문 로드 (묵상 질문 표시용)
  if (item.type === 'qt' && item.qtDate) {
    try {
      const qtData = await getQTByDate(item.qtDate);
      setSelectedItemQtContent(qtData);
    } catch (error) {
      console.error('QT 원문 로드 실패:', error);
      setSelectedItemQtContent(null);
    }
  } else {
    setSelectedItemQtContent(null);
  }
};
```

### 수정된 파일 목록
```
src/components/church/QTContentRenderer.tsx  # qtContent prop 추가, 다중 질문/답변 지원
src/components/church/QTCardSlider.tsx       # QTContentRenderer 사용 확인
src/app/church/[code]/sharing/page.tsx       # 상세 다이얼로그에 qtContent 전달
```

### 결과
- 교회 홈 QT VIEW 모달과 나눔 페이지 상세 다이얼로그가 동일한 UI 사용
- 묵상 질문이 각 답변 위에 표시됨
- 기존 단일 문자열 답변과 새 JSON 배열 답변 모두 호환

### 배포
- ✅ Vercel 배포 완료 (https://www.reading-jesus.com)

---

## ✅ 그룹 페이지 통독일정 묵상글 필터링 버그 수정 (2024-12-31)

### 문제점
- 그룹 페이지(`/church/[code]/groups/[groupId]`)에서 통독일정 Day와 묵상글 매칭이 제대로 안됨
- 모든 Day의 묵상글이 섞여서 표시됨

### 원인
- `guest_comments` 테이블에서 교회 묵상을 로드할 때 `day_number` 필터가 누락됨
- `comments` 테이블은 `.eq('day_number', currentDay)`로 필터링했으나
- `guest_comments` 테이블은 필터 없이 모든 묵상을 가져옴

### 수정 내용
**수정 파일:** `src/app/church/[code]/groups/[groupId]/page.tsx`

```typescript
// 수정 전
const { data: linkedComments } = await supabase
  .from('guest_comments')
  .select('*')
  .eq('church_id', church.id)
  .in('linked_user_id', memberUserIds)
  .order('created_at', { ascending: false });

// 수정 후
const { data: linkedComments } = await supabase
  .from('guest_comments')
  .select('*')
  .eq('church_id', church.id)
  .eq('day_number', currentDay)  // ← 추가된 필터
  .in('linked_user_id', memberUserIds)
  .order('created_at', { ascending: false });
```

### 배포
- ✅ Vercel 배포 완료 (https://www.reading-jesus.com)

---

## ✅ 나눔 페이지 QT 상세보기 UI 통일 (2024-12-31)

### 요구사항
- 나눔 페이지의 QT 상세보기가 홈페이지 QT VIEW 모달과 동일한 형태여야 함
- QT 원문 전체(헤더, 오늘의 말씀, 묵상 길잡이, 묵상 질문, 오늘의 기도)가 먼저 표시
- 그 아래 "나의 묵상" 구분선과 함께 사용자 답변 표시

### 수정 내용
**수정 파일:** `src/app/church/[code]/sharing/page.tsx`

QT 타입 상세보기 다이얼로그에 다음 섹션 추가:
1. **QT 헤더**: 날짜, 제목, 통독 범위, ONE WORD
2. **오늘의 말씀**: 성경 본문 구절들
3. **묵상 길잡이**: 묵상 안내 + 예수님 연결
4. **묵상 질문**: 다중 질문 지원
5. **오늘의 기도**: QT 제공 기도문
6. **구분선**: "나의 묵상" 구분
7. **작성자 정보**: 아바타, 이름, 작성 시간
8. **QTContentRenderer**: 사용자 답변 (기존 컴포넌트)

### UI 구조
```
┌─────────────────────────────────────┐
│  오늘의 QT 원문 (헤더)               │
├─────────────────────────────────────┤
│  QT 헤더 (날짜, 제목, ONE WORD)      │
├─────────────────────────────────────┤
│  오늘의 말씀 (성경 구절)             │
├─────────────────────────────────────┤
│  묵상 길잡이 + 예수님 연결           │
├─────────────────────────────────────┤
│  묵상 질문                          │
├─────────────────────────────────────┤
│  오늘의 기도                        │
├─────────────────────────────────────┤
│  ─────── 나의 묵상 ───────          │
├─────────────────────────────────────┤
│  작성자 정보 (아바타, 이름)          │
├─────────────────────────────────────┤
│  QTContentRenderer (사용자 답변)     │
│  - 내 말로 한 문장 (amber)          │
│  - 묵상 질문 답변 (purple)          │
│  - 감사와 적용 (green)              │
│  - 나의 기도 (blue)                 │
│  - 하루 점검 (indigo)               │
└─────────────────────────────────────┘
```

### 결과
- 홈페이지 QT VIEW 모달과 나눔 페이지 QT 상세보기가 완전히 동일한 형태로 통일됨
- QT 원문과 사용자 답변이 명확히 구분되어 표시됨

### 배포
- ✅ Vercel 배포 완료 (https://www.reading-jesus.com)

---

## ✅ FeedCard 펼쳐보기에 QT 원문 표시 (2024-12-31)

### 요구사항
- 나눔 페이지에서 QT 카드 펼쳐보기 시 QT 원문 전체가 함께 표시되어야 함
- 홈페이지 QT VIEW 모달 / 상세 다이얼로그와 동일한 형태

### 수정 내용

#### 1. FeedCard 컴포넌트 수정
**수정 파일:** `src/components/church/FeedCard.tsx`
- `qtContent?: QTDailyContent | null` prop 추가
- 펼쳐보기 시 QT 원문 표시:
  - QT 헤더 (날짜, 제목, 통독 범위, ONE WORD)
  - 오늘의 말씀 (성경 구절)
  - 묵상 길잡이 (축약)
  - 묵상 질문
  - "나의 묵상" 구분선
  - 사용자 QT 답변 (QTContentRenderer)

#### 2. 나눔 페이지 수정
**수정 파일:** `src/app/church/[code]/sharing/page.tsx`
- `qtContentCache` 상태 추가 (Map<string, QTDailyContent>)
- QT 타입 피드 아이템 로드 시 QT 원문 캐시 병렬 로드
- FeedCard에 `qtContent` prop 전달

```typescript
// QT 원문 캐시
const [qtContentCache, setQtContentCache] = useState<Map<string, QTDailyContent>>(new Map());

// 피드 로드 후 QT 원문 자동 로드
useEffect(() => {
  // QT 타입 아이템들의 qtDate로 원문 로드
  // 병렬 처리로 성능 최적화
}, [feedItems]);

// FeedCard에 qtContent 전달
<FeedCard
  item={item}
  qtContent={item.type === 'qt' && item.qtDate ? qtContentCache.get(item.qtDate) : undefined}
  ...
/>
```

### 결과
- 나눔 페이지에서 QT 카드 "더보기" 클릭 시 QT 원문 전체가 함께 표시됨
- 홈페이지 QT VIEW, 상세 다이얼로그, FeedCard 펼쳐보기 모두 동일한 형태로 통일

### 배포
- ✅ Vercel 배포 완료 (https://www.reading-jesus.com)

---

## ✅ 성경 저작권 보호: 접근 제한 기능 (2026-01-01)

### 배경
- 성경 본문은 대한성서공회의 저작권이 있어 무분별한 접근을 제한할 필요가 있음
- 로그인하거나 QR 토큰이 있는 사용자만 성경 본문을 열람할 수 있도록 제한

### 접근 조건
성경 본문을 읽기 위해서는 다음 조건 중 하나를 만족해야 함:
1. **로그인한 사용자**: 카카오/구글 계정으로 로그인
2. **유효한 QR 토큰**: 교회에서 제공하는 QR 코드 스캔 (교회 페이지에서만)

### 구현 내용

#### 1. useBibleAccess 훅
**신규 파일:** `src/hooks/useBibleAccess.ts`
- 로그인 상태 확인 (Supabase Auth)
- QR 토큰 유효성 검증 (URL 파라미터 + DB 비교)
- 토큰 만료일 확인
- 접근 권한 상태 관리 (hasAccess, isLoading, isLoggedIn, hasValidToken)

```typescript
interface BibleAccessResult {
  hasAccess: boolean;       // 접근 가능 여부
  isLoading: boolean;       // 로딩 중
  isLoggedIn: boolean;      // 로그인 상태
  hasValidToken: boolean;   // 유효한 QR 토큰 보유
  checkAccess: () => Promise<void>;
}
```

#### 2. BibleAccessGuard 컴포넌트
**신규 파일:** `src/components/bible/BibleAccessGuard.tsx`
- 접근 권한이 없을 때 로그인/QR 스캔 안내 화면 표시
- 로그인 페이지로 리다이렉트 버튼
- 저작권 안내 문구 표시
- 로딩 상태 처리

#### 3. 적용 페이지

**일반 바이블 리더:**
- `src/app/(main)/bible-reader/page.tsx`
- `BibleAccessGuard`로 래핑

**교회 바이블 리더:**
- `src/app/church/[code]/bible/reader/page.tsx`
- `BibleAccessGuard`에 `churchCode` 전달하여 QR 토큰 검증

### 사용 예시
```tsx
// 일반 바이블 리더
<BibleAccessGuard>
  <BibleReaderContent />
</BibleAccessGuard>

// 교회 바이블 리더 (QR 토큰 검증 포함)
<BibleAccessGuard churchCode={churchCode}>
  <ChurchBibleReaderContent />
</BibleAccessGuard>
```

### 사용자 경험
- **접근 불가 시**: 로그인 유도 화면 표시
- **로그인 버튼**: 클릭 시 로그인 페이지로 이동 (원래 페이지로 리다이렉트)
- **교회 QR 스캔**: 교회 페이지에서는 QR 스캔 안내 추가

### 파일 구조
```
src/
├── hooks/
│   └── useBibleAccess.ts        # 접근 권한 확인 훅
└── components/
    └── bible/
        └── BibleAccessGuard.tsx  # 접근 제한 가드 컴포넌트
```

---

## ✅ 메인 홈 통합 피드 구축 (2026-01-01)

### 개요
`www.reading-jesus.com` 루트 페이지를 **전체 공개 피드**로 변경하여 인스타그램 탐색탭처럼 모든 교회의 공개 콘텐츠를 통합 표시

### 요구사항
- **피드 범위**: 모든 교회의 공개 QT/묵상 콘텐츠
- **비로그인 처리**: 5개까지 미리보기, 이후 블러 + 로그인 유도
- **UI 스타일**: 인스타 피드 스타일 (FeedCard 재사용)

### 구현 내용

#### 1. 타입 정의 추가 ✅
**수정 파일:** `src/types/index.ts`

```typescript
// 공개 피드 아이템 (교회 정보 포함)
export interface PublicFeedItem {
  id: string;
  type: 'meditation' | 'qt';
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
  churchId: string;
  churchCode: string;
  churchName: string;
  content?: string;
  mySentence?: string | null;
  meditationAnswer?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
  qtDate?: string | null;
  dayNumber?: number | null;
  bibleRange?: string | null;
  likesCount: number;
  repliesCount: number;
}

export interface PublicFeedFilters {
  type?: 'all' | 'qt' | 'meditation';
  period?: 'all' | 'today' | 'week';
  churchId?: string;
}

export interface PublicFeedResponse {
  items: PublicFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

#### 2. 피드 API 함수 생성 ✅
**신규 파일:** `src/lib/feed-api.ts`

- `fetchPublicFeed(options)`: 전체 공개 피드 조회
  - guest_comments + church_qt_posts 병합
  - churches 테이블 JOIN (code, name)
  - cursor 기반 페이지네이션 (20개씩)
  - 필터링: churchId, type, period
- `fetchPopularChurches(limit)`: 인기 교회 목록 조회
- `toggleFeedLike(id, type)`: 좋아요 토글

#### 3. React Query 훅 생성 ✅
**신규 파일:** `src/hooks/usePublicFeed.ts`

- `usePublicFeed(filters)`: 메인 피드 훅
  - 필터링, 페이지네이션, 좋아요 상태 관리
  - Intersection Observer로 무한 스크롤
- `usePopularChurches(limit)`: 인기 교회 훅
- `useInfiniteScroll(callback)`: 무한 스크롤 훅

#### 4. 컴포넌트 생성 ✅

**`src/components/feed/PublicFeedCard.tsx`**
- 기존 FeedCard 확장
- 교회 정보 헤더 추가 (교회명 + 링크)
- 블러 상태 지원 (비로그인 5개 이후)
- QT/묵상 타입별 렌더링

**`src/components/feed/LoginPromptOverlay.tsx`**
- 5번째 이후 피드에 그라데이션 오버레이
- "더 많은 묵상을 보려면 로그인하세요" 메시지
- `LoginRequiredModal`: 좋아요/댓글 클릭 시 표시

**`src/components/feed/FeedFilters.tsx`**
- 칩 형태의 필터 (전체, 오늘, 이번 주, QT, 묵상)
- 인기 교회 필터 (확장 패널)
- 활성 필터 표시 및 초기화

**`src/components/feed/PublicFeed.tsx`**
- 메인 피드 컴포넌트
- FeedFilters + 피드 목록 통합
- 무한 스크롤 구현
- 로딩/에러/빈 상태 처리

**`src/components/feed/index.ts`**
- 컴포넌트 배럴 export

#### 5. 루트 페이지 변경 ✅
**수정 파일:** `src/app/page.tsx`

- 랜딩 페이지 → 공개 피드로 완전 변경
- 로그인 여부만 확인 (리다이렉트 없음)
- 헤더: 로고 + 로그인/마이페이지 버튼
- PublicFeed 컴포넌트 통합
- 로그인 사용자: "오늘의 말씀" 플로팅 버튼 표시

```tsx
export default function HomePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header>
        <h1>리딩지저스</h1>
        {user ? <Link href="/home">마이페이지</Link> : <Link href="/login">로그인</Link>}
      </header>
      <PublicFeed isLoggedIn={!!user} previewLimit={5} />
      {user && <FloatingButton href="/home" />}
    </div>
  );
}
```

### 생성된 파일 (6개)
| 파일 | 설명 |
|------|------|
| `src/lib/feed-api.ts` | 공개 피드 API 함수 |
| `src/hooks/usePublicFeed.ts` | React Query 훅 |
| `src/components/feed/PublicFeed.tsx` | 메인 피드 컴포넌트 |
| `src/components/feed/PublicFeedCard.tsx` | 교회 정보 포함 피드 카드 |
| `src/components/feed/FeedFilters.tsx` | 필터 UI |
| `src/components/feed/LoginPromptOverlay.tsx` | 로그인 유도 오버레이 |

### 수정된 파일 (2개)
| 파일 | 변경 내용 |
|------|----------|
| `src/app/page.tsx` | 랜딩 → 공개 피드로 변경 |
| `src/types/index.ts` | PublicFeedItem, PublicFeedFilters, PublicFeedResponse 타입 추가 |

### 페이지 구조
```
┌─────────────────────────────────────┐
│  헤더 (로고 + 로그인/마이페이지)      │
├─────────────────────────────────────┤
│  필터 (기간, 타입, 교회)             │
│  [오늘] [이번주] | [QT] [묵상] | [교회] │
├─────────────────────────────────────┤
│  공개 피드 카드 1                    │
│  공개 피드 카드 2                    │
│  공개 피드 카드 3                    │
│  공개 피드 카드 4                    │
│  공개 피드 카드 5                    │
├─────────────────────────────────────┤
│  [블러] 공개 피드 카드 6             │
│  ┌─────────────────────────────┐   │
│  │  더 많은 묵상을 보려면       │   │
│  │  로그인하세요              │   │
│  │  [로그인] [회원가입]        │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  [블러] 공개 피드 카드 7...          │
└─────────────────────────────────────┘
```

### 사용자 경험

**비로그인 사용자:**
1. `www.reading-jesus.com` 접속
2. 공개 피드 5개 표시
3. 6번째부터 블러 + "로그인하세요" 오버레이
4. 좋아요/댓글 클릭 시 로그인 모달

**로그인 사용자:**
1. `www.reading-jesus.com` 접속
2. 전체 공개 피드 무제한 스크롤
3. 상단에 "마이페이지" 버튼 → /home으로 이동
4. 하단에 "오늘의 말씀" 플로팅 버튼
5. 좋아요/댓글 정상 작동

### 빌드 확인
- ✅ `npm run build` 성공 (2026-01-01)

---

## ✅ 마이페이지 통합 (2026-01-01)

### 개요
`/mypage`(메인)와 `/church/[code]/my`(교회) 두 개의 마이페이지를 하나의 통합 컴포넌트로 관리하도록 리팩토링

### 문제점
- **메인 마이페이지** (`src/app/(main)/mypage/page.tsx`): 1,090줄, Supabase 전용, 로그인 필수
- **교회 마이페이지** (`src/app/church/[code]/my/page.tsx`): 729줄, Supabase + localStorage, 게스트 허용
- 두 페이지가 유사한 기능을 갖지만 완전히 분리되어 중복 코드 많음

### 결정 사항
1. **완전 통합 방식**: 하나의 마이페이지에서 교회/개인 컨텍스트 모두 표시
2. **비로그인 처리**: 로그인 유도 (마이페이지 접근 시 로그인 필요)
3. **localStorage 마이그레이션**: 로그인 시 기존 localStorage 데이터를 Supabase로 동기화

### 구현 내용

#### 1. 타입 정의 추가 ✅
**수정 파일:** `src/types/index.ts`

```typescript
export interface ChurchContext {
  churchCode: string;
  church: Church;
}

export interface MyPageStats {
  completedDays: number;
  totalDays: number;
  progressPercentage: number;
  currentStreak: number;
  commentCount?: number;
}

export interface MyPageUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface MyPageContextType {
  isChurchContext: boolean;
  churchContext?: ChurchContext | null;
}
```

#### 2. 섹션 컴포넌트 생성 ✅ (8개)
**신규 디렉토리:** `src/components/mypage/`

| 파일 | 역할 |
|------|------|
| `ProfileSection.tsx` | 아바타, 닉네임, 상태 배지 (익명/등록/방문자) |
| `StatsSection.tsx` | 통계 카드 3개 (완료일, 연속일수, 진행률) |
| `ProgressSection.tsx` | 진행바 + 남은 일수 |
| `ChurchInfoSection.tsx` | 교회 정보, 등록 교인 전환 버튼 |
| `ChurchMenuSection.tsx` | 교회 전용 메뉴 (성경읽기, 묵상나눔, 소그룹) |
| `MainMenuSection.tsx` | 메인 메뉴 7개 |
| `PersonalProjectsSection.tsx` | 개인 프로젝트 목록 |
| `GroupSelectorSection.tsx` | 활성 그룹 선택 드롭다운 |
| `index.ts` | 배럴 export |

#### 3. localStorage 마이그레이션 유틸리티 ✅
**신규 파일:** `src/lib/migrate-local-data.ts`

```typescript
// 주요 함수
export async function migrateLocalStorageToCloud(
  userId: string,
  churchId: string,
  churchCode: string
): Promise<{ success: boolean; migratedCount: number }>;

export function needsMigration(churchCode: string): boolean;
export function getGuestName(): string;
export function getOrCreateDeviceId(): string;
```

- 로그인 후 자동 호출
- localStorage의 통독 체크 데이터를 Supabase로 이전
- 충돌 시 upsert로 처리

#### 4. 통합 마이페이지 컨테이너 ✅
**신규 파일:** `src/components/mypage/UnifiedMyPage.tsx` (~800줄)

```typescript
interface UnifiedMyPageProps {
  churchContext?: ChurchContext | null;
}

export function UnifiedMyPage({ churchContext }: UnifiedMyPageProps) {
  const isChurchContext = !!churchContext;
  // ...
}
```

**레이아웃 구조:**
```
┌─────────────────────────────────────┐
│ [Header] 교회 컨텍스트: 뒤로가기    │
├─────────────────────────────────────┤
│ [ProfileSection]                    │
├─────────────────────────────────────┤
│ [ChurchInfoSection] (교회 컨텍스트) │
│ [소속 교회 카드] (메인 컨텍스트)    │
├─────────────────────────────────────┤
│ [GroupSelectorSection] (다중 그룹)  │
├─────────────────────────────────────┤
│ [StreakHeader] (스트릭 > 0)         │
├─────────────────────────────────────┤
│ [StatsSection] - 3개 통계           │
├─────────────────────────────────────┤
│ [ProgressSection] - 진행바          │
├─────────────────────────────────────┤
│ [PersonalProjectsSection] (메인)    │
├─────────────────────────────────────┤
│ [ChurchMenuSection] (교회 컨텍스트) │
│ [MainMenuSection] (메인 컨텍스트)   │
├─────────────────────────────────────┤
│ [로그아웃 버튼]                     │
│ [앱 마이페이지 링크] (교회 컨텍스트)│
└─────────────────────────────────────┘
```

#### 5. 페이지 연결 ✅

**메인 마이페이지 수정:** `src/app/(main)/mypage/page.tsx`
```typescript
'use client';
import { UnifiedMyPage } from '@/components/mypage';

export default function MyPage() {
  return <UnifiedMyPage churchContext={null} />;
}
```
- 기존 1,090줄 → 5줄로 단순화

**교회 마이페이지 수정:** `src/app/church/[code]/my/page.tsx`
```typescript
export default function ChurchMyPage() {
  // 교회 데이터 로드
  return (
    <>
      <UnifiedMyPage churchContext={{ churchCode, church }} />
      <ChurchBottomNav churchCode={churchCode} />
    </>
  );
}
```
- 기존 729줄 → ~100줄로 단순화
- ChurchBottomNav 유지

### 생성된 파일 목록 (11개)
```
src/components/mypage/
├── ProfileSection.tsx
├── StatsSection.tsx
├── ProgressSection.tsx
├── ChurchInfoSection.tsx
├── ChurchMenuSection.tsx
├── MainMenuSection.tsx
├── PersonalProjectsSection.tsx
├── GroupSelectorSection.tsx
├── UnifiedMyPage.tsx
├── index.ts
src/lib/
└── migrate-local-data.ts
```

### 수정된 파일 목록 (3개)
| 파일 | 변경 내용 |
|------|----------|
| `src/types/index.ts` | ChurchContext, MyPageStats, MyPageUser, MyPageContextType 타입 추가 |
| `src/app/(main)/mypage/page.tsx` | 통합 컴포넌트 사용으로 수정 (1,090줄 → 5줄) |
| `src/app/church/[code]/my/page.tsx` | 통합 컴포넌트 사용으로 수정 (729줄 → ~100줄) |

### 기능 매핑

#### 메인 마이페이지 기능 (유지)
- [x] 프로필 표시
- [x] 소속 교회 등록/검색/탈퇴
- [x] 활성 그룹 선택
- [x] 통계 3개 표시
- [x] 진행바
- [x] 개인 프로젝트
- [x] 메뉴 7개
- [x] 익명 사용자 로그인 유도

#### 교회 마이페이지 기능 (통합)
- [x] 교회 정보 표시
- [x] 등록 교인/방문자 배지
- [x] 스트릭 배지
- [x] 통계 3개
- [x] 진행바
- [x] 교회 전용 메뉴 3개
- [x] ChurchBottomNav (페이지 레벨에서 유지)

### 주요 변경점
1. **비로그인 게스트 제거**: 교회 마이페이지에서도 로그인 필수
2. **통합 데이터 훅**: 컨텍스트에 따라 다른 데이터 소스 사용
3. **조건부 렌더링**: churchContext 유무에 따라 섹션 표시/숨김
4. **URL 유지**: 기존 URL 구조 그대로 유지 (호환성)
5. **localStorage 마이그레이션**: 로그인 시 기존 localStorage 데이터를 Supabase로 동기화

### 코드 중복 제거 효과
- 총 1,819줄 (1,090 + 729) → 약 1,000줄 (통합 컴포넌트 + 섹션 컴포넌트)
- **약 45% 코드 감소**
- 스타일 및 기능 일관성 보장

### 빌드 확인
- ✅ `npm run build` 성공 (2026-01-01)

---

## Phase 17: PC Split View & 사이드 패널 ✅

> **구현일**: 2026-01-01
> **목적**: PC(lg 이상)에서 화면 분할 및 사이드 패널로 공간 활용도 극대화

### 개요
PC 환경에서 넓은 화면을 효율적으로 활용하기 위한 두 가지 주요 기능:
1. **Split View**: 사이드바 메뉴를 드래그하여 화면 분할, 두 페이지 동시 표시
2. **사이드 패널**: 오른쪽에 읽기 진도, 통계, 캘린더 등 부가 정보 표시

### 아키텍처

```
┌────────────────────────────────────────────────────────────────────┐
│  Split View 비활성화 시 (기본):                                    │
│  ┌────────────────────────────────┬─────────────────┐              │
│  │      메인 콘텐츠 영역          │  사이드 패널    │              │
│  │      (flex-1)                  │  (w-80, 320px)  │              │
│  │                                │  - 읽기 진도    │              │
│  │                                │  - 오늘 통계    │              │
│  │                                │  - 캘린더       │              │
│  └────────────────────────────────┴─────────────────┘              │
├────────────────────────────────────────────────────────────────────┤
│  Split View 활성화 시:                                              │
│  ┌──────────────┬────┬──────────────┐                              │
│  │ HomeContent  │ ▐  │ BibleContent │                              │
│  │              │ ▐  │              │                              │
│  │   (50%)      │ ▐  │    (50%)     │   (사이드 패널 숨김)        │
│  └──────────────┴────┴──────────────┘                              │
│                  ↑ 드래그 가능한 divider (30%~70%)                  │
└────────────────────────────────────────────────────────────────────┘
```

### 생성된 파일 목록 (20개)

#### 1. Context & Hooks
```
src/contexts/
└── SplitViewContext.tsx      # Split View 전역 상태 관리

src/hooks/
└── useSplitViewDnD.ts        # HTML5 Drag & Drop 로직
```

#### 2. 사이드 패널 (xl: 1280px 이상)
```
src/components/church/sidepanel/
├── SidePanel.tsx             # 사이드 패널 컨테이너
├── ReadingProgress.tsx       # 읽기 진도 위젯 (연간/주간)
├── TodayStats.tsx            # 오늘 통계 위젯
├── ReadingCalendar.tsx       # 미니 월간 캘린더
├── QuickActions.tsx          # 빠른 액션 & 최근 방문
└── index.ts                  # 배럴 export
```

#### 3. Split View 컴포넌트
```
src/components/church/splitview/
├── SplitViewContainer.tsx    # 분할 화면 컨테이너
├── SplitViewPanel.tsx        # 좌/우 패널 래퍼
├── SplitViewDivider.tsx      # 드래그 가능한 경계선
├── DropZoneOverlay.tsx       # 드롭 영역 오버레이
├── DraggableSidebar.tsx      # 드래그 가능한 PC 사이드바
└── index.ts                  # 배럴 export
```

#### 4. Content 컴포넌트 (Split View용)
```
src/components/church/contents/
├── HomeContent.tsx           # 홈 콘텐츠
├── BibleContent.tsx          # 성경 읽기 콘텐츠
├── SharingContent.tsx        # 나눔 피드 콘텐츠
├── GroupsContent.tsx         # 소그룹 콘텐츠
├── MyContent.tsx             # 마이페이지 콘텐츠
└── index.ts                  # 배럴 export
```

### 수정된 파일 목록 (2개)

| 파일 | 변경 내용 |
|------|----------|
| `src/components/church/ChurchLayout.tsx` | SplitViewProvider 감싸기, SidePanel/SplitView 조건부 렌더링 |
| `src/components/bible/BibleAccessGuard.tsx` | 미사용 변수 `isLoggedIn` 제거 |

### 주요 기능

#### 1. SplitViewContext 상태 관리
```typescript
interface SplitViewState {
  isEnabled: boolean;           // Split View 활성화 여부
  leftMenu: MenuType | null;    // 왼쪽 패널 메뉴
  rightMenu: MenuType | null;   // 오른쪽 패널 메뉴
  splitRatio: number;           // 분할 비율 (30~70)
  isDraggingMenu: boolean;      // 메뉴 드래그 중
  isDraggingDivider: boolean;   // Divider 드래그 중
}

type MenuType = 'home' | 'bible' | 'sharing' | 'groups' | 'my';
```

#### 2. 사이드 패널 위젯
- **ReadingProgress**: 연간 진도 (예: 15/365일), 주간 목표, 연속 읽기 스트릭
- **TodayStats**: 오늘 묵상 수, QT 수, 활성 교인 수
- **ReadingCalendar**: 미니 월간 캘린더, 읽기 완료일 체크 표시
- **QuickActions**: QT 작성/성경 읽기 버튼, 최근 방문 페이지 (localStorage)

#### 3. Split View 동작
- **드래그 시작**: 사이드바 메뉴 아이콘 드래그
- **드롭 영역 표시**: 전체 화면 오버레이로 좌/우 영역 표시
- **드롭**: Split View 활성화, 기존 페이지는 반대편으로 이동
- **비율 조절**: 중앙 Divider 드래그 (30%~70%)
- **종료**: ESC 키 또는 패널 X 버튼

#### 4. 키보드 접근성
- `ESC`: Split View 종료
- `←/→`: Divider 비율 미세 조절 (1%씩)
- 더블클릭: 50:50 비율 리셋

### UX 흐름

1. PC 사용자가 사이드바의 메뉴 아이콘을 드래그 시작
2. 화면에 좌/우 드롭 영역 오버레이 표시
3. 드롭하면 Split View 활성화 (사이드 패널 숨김)
4. 경계선을 드래그하여 비율 조절
5. 다른 메뉴를 드래그해서 패널 교체 가능
6. X 버튼 또는 ESC로 Split View 종료

### 반응형 동작

| 화면 크기 | 사이드바 | Split View | 사이드 패널 |
|-----------|----------|------------|-------------|
| < 1024px (모바일/태블릿) | 하단 네비게이션 | 불가 | 불가 |
| >= 1024px (lg) | 좌측 사이드바 | 가능 | 불가 |
| >= 1280px (xl) | 좌측 사이드바 | 가능 | 가능 |

### 기술적 특징

1. **HTML5 Native Drag & Drop**: 외부 라이브러리 없이 구현
2. **React.lazy**: Content 컴포넌트 지연 로딩으로 번들 최적화
3. **LocalStorage 영속화**: 분할 비율 저장, 세션 간 유지
4. **독립적 스크롤**: 각 패널 별도 스크롤 영역
5. **URL 비반영**: Split View 상태는 URL에 저장하지 않음 (복잡도 감소)

### 빌드 확인
- ✅ `npm run dev` 성공 (2026-01-01)

---

*마지막 업데이트: 2026-01-01*
