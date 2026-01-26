# 마이그레이션 체크리스트

## 사용 방법
1. Supabase Dashboard → SQL Editor
2. `CHECK_MISSING_MIGRATIONS.sql` 실행
3. 결과에서 `required_migration` 컬럼 확인
4. 해당 파일을 `migrations/` 폴더에서 찾아 실행

---

## 마이그레이션 파일별 내용

### 기본 (초기 설정)
- [ ] **profiles** - 사용자 프로필
- [ ] **groups** - 그룹
- [ ] **group_members** - 그룹 멤버
- [ ] **daily_checks** - 일일 체크
- [ ] **comments** - 묵상 글
- [ ] **comment_likes** - 좋아요

### 2024-12-18
| 파일 | 내용 | 체크 |
|------|------|------|
| `20241218000001_add_anonymous_comment.sql` | comments.is_anonymous 컬럼 | [ ] |
| `20241218000002_add_attachments_storage.sql` | 첨부파일 스토리지 버킷 | [ ] |
| `20241218000003_add_avatars_storage.sql` | 아바타 스토리지 버킷 | [ ] |
| `20241218000004_add_comment_attachments.sql` | comment_attachments 테이블 | [ ] |
| `20241218000005_add_comment_replies.sql` | comment_replies 테이블 | [ ] |

### 2024-12-19
| 파일 | 내용 | 체크 |
|------|------|------|
| `20241219000001_add_comment_pin.sql` | comments.is_pinned 컬럼 | [ ] |
| `20241219000002_add_group_meetings.sql` | group_meetings, meeting_participants | [ ] |
| `20241219000003_add_group_notices.sql` | group_notices 테이블 | [ ] |
| `20241219000004_add_group_settings.sql` | 그룹 설정 관련 | [ ] |
| `20241219000005_add_member_ranks.sql` | member_ranks, group_members.rank_id | [ ] |
| `20241219000006_add_notification_settings.sql` | notification_settings 테이블 | [ ] |
| `20241219000007_add_notification_triggers.sql` | 알림 트리거 | [ ] |
| `20241219000008_add_notifications.sql` | notifications 테이블 | [ ] |
| `20241219000009_add_onboarding_field.sql` | profiles.has_completed_onboarding | [ ] |
| `20241219000010_add_personal_projects.sql` | personal_projects, project_daily_checks | [ ] |

### 2024-12-20
| 파일 | 내용 | 체크 |
|------|------|------|
| `20241220000001_add_bible_range.sql` | groups.bible_range_type/books | [ ] |
| `20241220000002_add_meeting_purpose.sql` | group_meetings.purpose | [ ] |
| `20241220000003_add_qt_posts.sql` | QT 관련 | [ ] |
| `20241220000004_add_rank_permissions.sql` | 등급 권한 | [ ] |

### 2024-12-21
| 파일 | 내용 | 체크 |
|------|------|------|
| `20241221000003_add_churches.sql` | churches 테이블 | [ ] |
| `20241221000005_add_profile_email.sql` | profiles.email | [ ] |
| `20241221000008_add_schedule_mode.sql` | groups.schedule_mode/total_days | [ ] |
| 기타 RLS 수정 파일들 | 정책 수정 | [ ] |

### 2025-12-22 ~ 12-26
| 파일 | 내용 | 체크 |
|------|------|------|
| `20251222000002_add_church_admin_token.sql` | churches.admin_token | [ ] |
| `20251222000003_add_church_membership.sql` | church_members 테이블 | [ ] |
| `20251224000001_add_church_qt_posts.sql` | church_qt_posts, church_qt_comments | [ ] |
| `20251225000001_add_guest_comment_likes.sql` | guest_comment_likes 테이블 | [ ] |
| `20251226000001_add_church_group_integration.sql` | 교회-그룹 통합 | [ ] |

### 2025-12-27 (최신)
| 파일 | 내용 | 체크 |
|------|------|------|
| `20251227000001_add_badge_system.sql` | badge_definitions, user_badges, 트리거 | [ ] |
| `20251227000002_add_prayer_requests.sql` | prayer_requests, prayer_support | [ ] |

---

## 빠른 체크 명령어

```sql
-- 테이블 수 확인
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';

-- 필수 테이블 25개 중 몇 개 있는지
SELECT COUNT(*) as existing_count FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'profiles', 'groups', 'group_members', 'daily_checks',
  'comments', 'comment_likes', 'comment_replies', 'comment_attachments',
  'group_notices', 'group_meetings', 'meeting_participants', 'member_ranks',
  'notifications', 'notification_settings',
  'personal_projects', 'project_daily_checks',
  'churches', 'church_members', 'church_qt_posts', 'church_qt_comments', 'guest_comment_likes',
  'prayer_requests', 'prayer_support',
  'badge_definitions', 'user_badges'
);
```

---

## 문제 해결

### "relation does not exist" 에러
→ 해당 테이블의 마이그레이션 파일 실행

### "column does not exist" 에러
→ 해당 컬럼의 마이그레이션 파일 실행

### "policy already exists" 에러
→ 마이그레이션 실행 전 기존 정책 삭제:
```sql
DROP POLICY IF EXISTS "정책이름" ON 테이블명;
```

### 배지가 안 보임
→ `badge_definitions` 테이블에 데이터가 있는지 확인:
```sql
SELECT COUNT(*) FROM badge_definitions;
-- 13개 미만이면 20251227000001_add_badge_system.sql의 INSERT 부분 재실행
```
