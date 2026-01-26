# Supabase 마이그레이션 가이드

## 📁 파일 구조

```
supabase/
├── migrations/                    # 개별 마이그레이션 파일 (42개)
│   ├── 20241218*.sql             # 12월 18일 마이그레이션
│   ├── 20241219*.sql             # 12월 19일 마이그레이션
│   ├── ...
│   └── CONSOLIDATED_V1.sql       # ⭐ 통합 마이그레이션 (신규 환경용)
├── CHECK_DB_STATUS.sql           # DB 상태 확인 (테이블 목록)
├── CHECK_MISSING_MIGRATIONS.sql  # ⭐ 누락 마이그레이션 체크
├── MIGRATION_CHECKLIST.md        # 마이그레이션 체크리스트
└── README.md                     # 이 파일
```

## 🚀 신규 프로젝트 설정

새 Supabase 프로젝트에서는 **통합 마이그레이션** 하나만 실행하면 됩니다:

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `migrations/CONSOLIDATED_V1.sql` 내용 복사
4. 실행

## 🔍 DB 상태 확인

### 방법 1: 테이블 목록만 확인
1. SQL Editor에서 `CHECK_DB_STATUS.sql` 실행
2. 결과 확인:
   - `✅ 존재`: 테이블 있음
   - `❌ 없음`: 테이블 없음

### 방법 2: 누락된 마이그레이션 확인 ⭐
1. SQL Editor에서 `CHECK_MISSING_MIGRATIONS.sql` 실행
2. 결과에서 확인:
   - `issue_type`: 문제 유형 (테이블/컬럼/트리거/함수)
   - `missing_item`: 누락된 항목
   - `required_migration`: **실행해야 할 마이그레이션 파일**

결과 예시:
```
issue_type      | missing_item                    | required_migration
----------------|---------------------------------|------------------------------------
❌ 테이블 없음  | badge_definitions               | 20251227000001_add_badge_system.sql
❌ 테이블 없음  | user_badges                     | 20251227000001_add_badge_system.sql
⚠️ 컬럼 없음   | groups.schedule_mode            | 20241221000008_add_schedule_mode.sql
🔧 트리거 없음  | trigger_check_meditation_badges | 20251227000001_add_badge_system.sql
```

## 📋 필수 테이블 목록 (25개)

| 카테고리 | 테이블 | 설명 |
|---------|--------|------|
| **기본** | profiles | 사용자 프로필 |
| | groups | 그룹 |
| | group_members | 그룹 멤버 |
| | daily_checks | 일일 체크 |
| **묵상** | comments | 묵상 글 |
| | comment_likes | 좋아요 |
| | comment_replies | 답글 |
| | comment_attachments | 첨부파일 |
| **그룹** | group_notices | 공지사항 |
| | group_meetings | 모임 |
| | meeting_participants | 모임 참가자 |
| | member_ranks | 멤버 등급 |
| **알림** | notifications | 알림 |
| | notification_settings | 알림 설정 |
| **교회** | churches | 교회 |
| | church_members | 교인 |
| | church_qt_posts | QT 게시물 |
| | church_qt_comments | QT 댓글 |
| | guest_comment_likes | 게스트 좋아요 |
| **기도** | prayer_requests | 기도제목 |
| | prayer_support | 함께 기도 |
| **배지** | badge_definitions | 배지 정의 |
| | user_badges | 사용자 배지 |
| **개인** | personal_projects | 개인 프로젝트 |
| | project_daily_checks | 프로젝트 체크 |

## 🔧 누락된 테이블 추가하기

특정 테이블만 누락된 경우:

### 배지 시스템 (badge_definitions, user_badges)
```sql
-- migrations/20251227000001_add_badge_system.sql 실행
```

### 기도제목 (prayer_requests, prayer_support)
```sql
-- migrations/20251227000002_add_prayer_requests.sql 실행
```

## ⚠️ 주의사항

1. **마이그레이션 순서**: 통합 마이그레이션 사용 시 순서 고려 불필요
2. **중복 실행 방지**: `IF NOT EXISTS`, `ON CONFLICT DO NOTHING` 사용
3. **RLS 정책**: `DROP POLICY IF EXISTS` 후 생성하여 중복 에러 방지

## 🆘 문제 해결

### "relation does not exist" 에러
→ 해당 테이블 마이그레이션 실행 필요

### "policy already exists" 에러
→ 마이그레이션 파일에 `DROP POLICY IF EXISTS` 추가 후 재실행

### Supabase CLI 마이그레이션 히스토리 불일치
→ Dashboard SQL Editor에서 직접 SQL 실행
