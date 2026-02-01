# 관리자 가이드

> 시스템/교회 관리자 기능 관련 작업 시 참조하세요.

---

## 1. 개요

### 관리자 유형

| 유형 | 경로 | 설명 |
|------|------|------|
| 시스템 관리자 | `/admin/*` | 전체 시스템 관리 |
| 교회 관리자 | `/church/[code]/admin` | 교회별 관리 |

---

## 2. 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/app/admin/page.tsx` | 관리자 대시보드 |
| `src/app/admin/users/page.tsx` | 사용자 관리 |
| `src/app/admin/churches/page.tsx` | 교회 관리 |
| `src/app/admin/groups/page.tsx` | 그룹 관리 |
| `src/app/church/[code]/admin/page.tsx` | 교회 관리자 |

---

## 3. 사용하는 훅

| 훅 | 파일 | 용도 |
|----|------|------|
| `useSystemStats` | `useSystemAdmin.ts` | 시스템 통계 |
| `useAdminChurches` | `useSystemAdmin.ts` | 교회 목록 |
| `useChurchAdminLogin` | `useChurchAdmin.ts` | 교회 관리자 로그인 |
| `usePlatformStats` | `usePlatformStats.ts` | 플랫폼 통계 |

---

## 4. 테이블 구조

```sql
system_admins
├── id: UUID (PK)
├── user_id: UUID (UNIQUE)
├── role: TEXT ('super' | 'admin')
└── created_at: TIMESTAMPTZ

church_admins
├── id: UUID (PK)
├── church_id: UUID
├── user_id: UUID
└── UNIQUE(church_id, user_id)
```

---

## 5. 권한 레벨

| 역할 | 권한 |
|------|------|
| `super` | 모든 기능 + 관리자 관리 |
| `admin` | 사용자/교회/그룹 관리 |
| 교회 관리자 | 해당 교회만 관리 |

---

## 6. 작업 체크리스트

- [ ] 시스템 관리자 기능 수정 시 권한 체크 확인
- [ ] 교회 관리자 기능 수정 시 `admin_token` 검증 확인
- [ ] 데이터 삭제 시 소프트 삭제 권장

---

## 7. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-01 | 초기 문서 작성 |
