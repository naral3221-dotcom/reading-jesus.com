# 스테이징 환경 구축 가이드

> **최종 업데이트**: 2026-02-02
> **목적**: 프로덕션 배포 전 안전한 테스트 환경 구축

---

## 목차

1. [개요](#개요)
2. [비용](#비용)
3. [구축 단계](#구축-단계)
4. [사용 방법](#사용-방법)
5. [데이터 동기화](#데이터-동기화)
6. [문제 해결](#문제-해결)
7. [비유로 이해하기](#비유로-이해하기)

---

## 개요

### 현재 문제

```
코드 수정 → 바로 프로덕션 배포 → 버그 발생!
```

### 해결책: 스테이징 환경

```
코드 수정 → 스테이징에서 테스트 → 확인 후 프로덕션 배포
```

### 환경 구성

| 환경 | 프론트엔드 | 백엔드 (DB) | 용도 |
|------|-----------|-------------|------|
| **로컬** | localhost:3000 | 스테이징 DB | 개발 중 확인 |
| **스테이징** | staging-xxx.vercel.app | 스테이징 Supabase | 실제 테스트 |
| **프로덕션** | reading-jesus.vercel.app | 프로덕션 Supabase | 실 서비스 |

---

## 비용

### Supabase

| 항목 | Free tier | Pro ($25/월) |
|------|-----------|--------------|
| 프로젝트 수 | 2개 | 무제한 |
| DB 용량 | 500MB | 8GB |
| 스토리지 | 1GB | 100GB |

**결론**: Free tier로 스테이징 프로젝트 생성 가능 (프로덕션 1개 + 스테이징 1개 = 2개)

### Vercel

| 항목 | Free tier (Hobby) | Pro ($20/월) |
|------|-------------------|--------------|
| Preview 배포 | 무제한 | 무제한 |
| 빌드 시간 | 100시간/월 | 400시간/월 |
| 팀 협업 | 1명 | 팀 |

**결론**: Free tier로 Preview 배포 가능. 혼자 개발 시 Pro 불필요.

### 총 비용

| 시나리오 | 월 비용 |
|----------|---------|
| Free tier만 사용 | **$0** |
| Supabase Pro만 | $25 |
| 둘 다 Pro | $45 |

---

## 구축 단계

### 1단계: Supabase 스테이징 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. "New Project" 클릭
3. 프로젝트 이름: `reading-jesus-staging`
4. 리전: 프로덕션과 동일하게 (Northeast Asia - Tokyo)
5. 비밀번호 설정 (기억해두기!)

### 2단계: 환경 변수 파일 생성

```bash
# .env.staging 파일 생성
```

```env
# .env.staging
NEXT_PUBLIC_SUPABASE_URL=https://[스테이징-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[스테이징 anon key]
SUPABASE_SERVICE_ROLE_KEY=[스테이징 service role key]
```

### 3단계: npm 스크립트 추가

`package.json`에 추가:

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:staging": "cp .env.staging .env.local && next dev",
    "db:push:staging": "supabase db push --db-url \"postgresql://postgres:[비밀번호]@db.[스테이징-ref].supabase.co:5432/postgres\"",
    "db:push:prod": "supabase db push",
    "db:sync-to-staging": "tsx scripts/sync-to-staging.ts"
  }
}
```

### 4단계: Supabase 프로젝트 연결

```bash
# 기본 프로젝트 연결 (프로덕션)
supabase link --project-ref jfxbkjohppqmyjyhzolx
```

### 5단계: 스테이징에 스키마 적용

```bash
# 모든 마이그레이션을 스테이징에 적용
npm run db:push:staging
```

### 6단계: Vercel Preview 설정

1. Vercel Dashboard → 프로젝트 설정
2. Environment Variables → Preview 환경 추가
3. 스테이징 Supabase 키 입력

---

## 사용 방법

### 일반 개발 워크플로우

```bash
# 1. 로컬에서 개발 (스테이징 DB 연결)
npm run dev:staging

# 2. 백엔드 변경 시 스테이징에 적용
npm run db:push:staging

# 3. 커밋 & 푸시 → Vercel Preview 자동 배포
git add .
git commit -m "feat: 새 기능"
git push

# 4. Preview URL에서 테스트
# https://reading-jesus-[branch]-[username].vercel.app

# 5. 테스트 통과 후 프로덕션 배포
npm run db:push:prod  # 백엔드
# Vercel에서 Production 배포
```

### 백엔드 변경 워크플로우 (마이그레이션)

```bash
# 1. 마이그레이션 파일 작성
# supabase/migrations/20260202_new_feature.sql

# 2. 스테이징에 적용
npm run db:push:staging

# 3. 스테이징에서 테스트
npm run dev:staging
# 기능 테스트...

# 4. 문제 없으면 프로덕션에 적용
npm run db:push:prod

# 5. 정합성 검사
npm run check:backend
```

---

## 데이터 동기화

### 왜 필요한가?

스테이징에서 **실제 데이터**로 테스트해야 정확한 검증이 가능합니다.

### 동기화 스크립트

`scripts/sync-to-staging.ts`:

```typescript
/**
 * 프로덕션 → 스테이징 데이터 동기화
 * 실행: npm run db:sync-to-staging
 */

// 1. 프로덕션에서 데이터 백업
// 2. 스테이징 데이터 초기화
// 3. 백업 데이터 복원

// 주의: 개인정보 마스킹 처리 권장
```

### 동기화 주기

| 상황 | 권장 주기 |
|------|----------|
| 일반 개발 | 주 1회 |
| 대규모 변경 전 | 테스트 직전 |
| 버그 재현 필요 | 즉시 |

---

## 문제 해결

### Q: 스테이징과 프로덕션 스키마가 다르면?

```bash
# 스테이징 스키마 초기화 후 재적용
supabase db reset --db-url "[스테이징 URL]"
npm run db:push:staging
```

### Q: 마이그레이션이 스테이징에서 실패하면?

1. 마이그레이션 수정
2. 스테이징에서 다시 테스트
3. 프로덕션에는 적용하지 않음 (안전!)

### Q: 데이터 동기화 중 오류?

```bash
# 부분 동기화 시도
npm run db:sync-to-staging -- --tables=profiles,churches
```

---

## 비유로 이해하기

### 레스토랑 비유

당신은 **레스토랑 주방장**입니다.

```
┌─────────────────────────────────────────────────────────────┐
│  주방 (로컬 개발)                                            │
│                                                             │
│  새 레시피를 실험하는 곳                                      │
│  재료를 다듬고, 조리법을 시험해봄                              │
│  실패해도 손님에게 영향 없음                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  시식 테이블 (스테이징)                                       │
│                                                             │
│  실제 재료(=실제 데이터)로 요리해서                           │
│  직원들이 먼저 시식해보는 곳                                   │
│  "이거 맛이 이상한데?" → 다시 주방으로                         │
│  "오, 맛있다!" → 손님에게 서빙 OK                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  손님 테이블 (프로덕션)                                       │
│                                                             │
│  실제 손님(=사용자)에게 서빙되는 곳                            │
│  여기서 실패하면 손님이 화남!                                  │
│  시식 테이블에서 검증된 요리만 나감                            │
└─────────────────────────────────────────────────────────────┘
```

### 핵심 포인트

| 비유 | 실제 |
|------|------|
| 새 레시피 | 새 코드/마이그레이션 |
| 주방 | 로컬 개발 환경 |
| 시식 테이블 | 스테이징 환경 |
| 손님 테이블 | 프로덕션 환경 |
| 실제 재료 | 실제 데이터 |
| 직원 시식 | 스테이징 테스트 |
| 손님 서빙 | 프로덕션 배포 |

### 왜 시식 테이블(스테이징)이 필요한가?

**시식 테이블 없이:**
```
새 레시피 → 바로 손님에게 서빙 → 맛없음 → 손님 화남 → 리뷰 테러
```

**시식 테이블 있으면:**
```
새 레시피 → 직원이 먼저 시식 → 맛없음 발견 → 수정 → 다시 시식 → 맛있음! → 손님 서빙
```

### 데이터 동기화는?

```
매일 아침, 오늘 사용할 재료(프로덕션 데이터)를
시식용 재료함(스테이징 DB)에 똑같이 채워두는 것

→ 실제 재료로 테스트해야 진짜 맛(버그)을 알 수 있음!
```

---

## 체크리스트

### 구축 완료 확인

- [ ] Supabase 스테이징 프로젝트 생성
- [ ] `.env.staging` 파일 생성
- [ ] `package.json` 스크립트 추가
- [ ] 스테이징에 마이그레이션 적용
- [ ] Vercel Preview 환경 변수 설정
- [ ] 데이터 동기화 스크립트 작성

### 배포 전 확인

- [ ] 스테이징에서 기능 테스트 완료
- [ ] `npm run check:backend` 통과
- [ ] 다른 기능에 영향 없음 확인

---

## 관련 문서

- [BACKEND_ARCHITECTURE.md](../. claude/guides/core/BACKEND_ARCHITECTURE.md) - 백엔드 구조
- [CODE_ARCHITECTURE.md](../.claude/guides/core/CODE_ARCHITECTURE.md) - 코드 아키텍처

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-02 | 초안 작성 |
