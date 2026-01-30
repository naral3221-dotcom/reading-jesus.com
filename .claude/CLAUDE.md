# 프로젝트 규칙

> 이 파일은 Claude Code가 **자동으로** 읽습니다. 별도 지시 불필요.

---

## 기본 규칙 (항상 적용)

### 코딩 컨벤션
- **스타일**: Tailwind CSS 클래스 사용 권장, 전역 CSS 최소화
- **컴포넌트**: 재사용 가능한 구조로 설계
- **타입**: TypeScript 사용 시 `any` 지양
- **상태**: 로딩/에러 상태 항상 처리

### Tailwind 클래스 순서 (사용 시)
```
[레이아웃] flex flex-col items-center
[크기] w-full h-12
[여백] p-4 mt-2
[배경/테두리] bg-primary border rounded-lg
[텍스트] text-sm font-medium
[상태] hover:bg-primary/90 disabled:opacity-50
```

### 금지 사항
- `!important` 사용 금지
- `console.log` 배포 코드에 남기기 금지
- 하드코딩된 민감 정보 금지

---

## 작업 프로토콜

### 작업 시작 시
1. 관련 파일 먼저 읽기
2. 기존 패턴 파악 후 작업
3. `IMPLEMENTATION.md` 확인하여 현재 진행 상황 파악

### 작업 완료 시
1. 테스트 실행 (가능한 경우)
2. 빌드 확인 (가능한 경우)
3. **`IMPLEMENTATION.md` 업데이트 (필수)**

---

## IMPLEMENTATION.md 업데이트 규칙 (필수)

**모든 작업 완료 시 반드시 `IMPLEMENTATION.md`에 기록:**

### 기록 항목

1. **완료된 작업**
   - 해당 Phase/기능에 `✅ 완료` 표시
   - 체크리스트 `[x]` 업데이트
   - 완료 날짜 기록

2. **새로 발견한 이슈**
   ```markdown
   ## 🐛 알려진 이슈
   - [ ] 이슈 설명 (발견일: YYYY-MM-DD)
   ```

3. **다음에 해야 할 작업**
   ```markdown
   ## 📋 다음 작업 (TODO)
   - [ ] 작업 설명
   ```

4. **놓친 작업 (나중에 발견한 것)**
   ```markdown
   ## ⚠️ 놓친 작업 (보완 필요)
   - [ ] 작업 설명 (원래 Phase: X)
   ```

### 업데이트 타이밍
- 기능 구현 완료 직후
- 버그 수정 완료 직후
- 세션 종료 전 (종합 정리)

---

## AI 팀 사용 (선택적)

복잡한 작업이 필요할 때만 슬래시 커맨드 사용:
- `/ai 리뷰 [파일]` - AI 팀 코드 리뷰 (GPT + Gemini)
- `/ai 디버그 [에러]` - AI 팀 에러 분석

> 일반 작업은 슬래시 커맨드 없이 그냥 요청하세요 (비용 절약)

### AI 협업 로깅 규칙 (필수)

**외부 AI 호출 시 반드시 `AI_COLLABORATION_LOG.md`에 기록:**

```markdown
### [날짜] 작업명

**호출된 AI**: Gemini Pro / GPT-5 mini / Gemini Flash
**용도**: (라이브러리 비교 / 코드 생성 / 코드 리뷰 / 에러 분석 등)
**입력 요약**: (무엇을 요청했는지)
**출력 요약**: (어떤 결과를 받았는지)
**예상 비용**: $X.XXXX
```

**로깅 대상 MCP 함수:**
- `mcp__gemini__*` (모든 Gemini 호출)
- `mcp__gpt__*` (모든 GPT 호출)

**로깅 타이밍:**
- 외부 AI 호출 직후 즉시 기록
- 세션 종료 시 총 비용 업데이트

---

## 🤖 전문 에이전트 자동 호출 (필수)

**에이전트는 Sonnet 모델로 실행되어 비용 효율적이고, 컨텍스트 분리로 품질이 높습니다.**

### 자동 호출 규칙

| 상황 | 에이전트 | 트리거 키워드 |
|------|----------|---------------|
| 버그/에러 발생 | `bug-analyzer-fixer` | 버그, 에러, 안됨, 안돼, 깨짐, error, bug |
| 코드 작성 완료 후 | `code-review-expert` | 리뷰해줘, 코드 검토, 개선, 리팩토링 |
| Supabase 에러 | `supabase-debugger` | Supabase 에러, DB 문제, 저장 안됨, 400/403 에러, RLS |
| DB 스키마 변경 | `supabase-migration-expert` | 테이블 추가, 컬럼 추가, 마이그레이션 |
| 새 페이지 생성 | `nextjs-page-generator` | 페이지 만들어, 라우트 추가, 새 화면 |

### 병렬 호출 조합

```
# 페이지 + DB 동시 작업
"프로필 페이지랑 테이블 만들어줘"
→ nextjs-page-generator + supabase-migration-expert (병렬)

# 버그 수정 후 리뷰
"이 에러 수정해줘"
→ bug-analyzer-fixer → code-review-expert (순차)

# 새 기능 전체 구현
"댓글 기능 추가해줘"
→ supabase-migration-expert → nextjs-page-generator → code-review-expert
```

### 에이전트 사용 원칙

1. **프로액티브 호출**: 키워드 감지 시 자동으로 에이전트 실행
2. **병렬 실행**: 독립적인 작업은 동시에 여러 에이전트 실행
3. **순차 실행**: 의존성 있는 작업은 순서대로 실행
4. **코드 리뷰**: 중요 코드 작성 후 `code-review-expert` 자동 실행 권장

---

## CLAUDE-TOOLKIT (스킬 저장소)

> 경로: `C:\Lacal_workspace\project\CLAUDE-TOOLKIT\`

**필요시 자동으로 참조하여 사용:**

| 카테고리 | 스킬 | 용도 |
|----------|------|------|
| **core** | ai-debug.md, ai-review.md | AI 팀 활용 |
| **dev** | page.md, ui-component.md, refactor-safe.md | 개발 작업 |
| **docs** | app-screens-doc.md, create-ppt.md | 문서화 |

**사용 방법:**
1. 복잡한 작업 요청 시 TOOLKIT에서 관련 스킬 확인
2. 필요한 스킬이 프로젝트에 없으면 TOOLKIT에서 복사하여 사용
3. 에이전트는 키워드 감지 시 자동 호출

---

## 프로젝트 정보

- **스택**: Next.js 14 (App Router) + TypeScript
- **스타일**: Tailwind CSS
- **UI**: shadcn/ui
- **백엔드**: Supabase (Auth, Database, Storage, RLS)
- **아키텍처**: Clean Architecture

---

## 🏗️ 클린 아키텍처 (필수) - 반드시 읽기!

> **⚠️ 코드 작성 전 반드시 읽어야 함:**
> **[.claude/ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)** - 바이브 코딩 아키텍처 완전 가이드

### 핵심 3원칙 (이것만 기억!)

1. **컴포넌트에서 Supabase 직접 호출 금지** → React Query 훅 사용
2. **새 기능 = Entity → Repository → Use Case → Hook → Component** 순서
3. **기존 훅 먼저 확인** → 있으면 재사용, 없으면 새로 생성

### 빠른 참조

```typescript
// ❌ 절대 금지
const supabase = getSupabaseBrowserClient();
const { data } = await supabase.from('table').select('*');

// ✅ 올바른 방법
const { data, isLoading } = useChurchByCode(churchCode);
```

### 기존 훅 목록 (재사용 우선!)

| 카테고리 | 훅 | 파일 |
|----------|-----|------|
| 교회 | `useChurch`, `useChurchByCode`, `useChurchMembers` | useChurch.ts |
| 사용자 | `useCurrentUser`, `useUserBadges`, `useUserPlans` | useUser.ts, useBadge.ts, useUserPlans.ts |
| 통계 | `useTodayStats`, `useChurchReadingProgress` | useChurchStats.ts |
| 그룹 | `useGroup`, `useGroupMembers`, `useChurchGroups` | useGroup.ts |
| 격려 | `useSendEncouragement`, `useReceivedEncouragements` | useEncouragement.ts |

**전체 목록과 사용법은 [ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md) 참조**

---

## 🎨 디자인 시스템 (필수) - 색상 작업 전 읽기!

> **⚠️ 색상/UI 작업 전 반드시 읽어야 함:**
> **[.claude/DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - 브랜드 컬러 & 디자인 가이드

### 브랜드 컬러 요약

| 토큰 | 색상 | HEX | 용도 |
|------|------|-----|------|
| `--primary` | Warm Sage | `#7A8F6E` | 메인 CTA, 버튼, 진행바 |
| `--accent-warm` | Warm Gold | `#D4A574` | 뱃지, 성취, 좋아요 |
| `--accent-cool` | Soft Blue | `#7B9AAB` | 링크, 정보 |

### 빠른 참조

```tsx
// ✅ 올바른 사용
<Button className="bg-primary text-primary-foreground">
<Badge className="bg-accent-warm text-white">
<Progress className="bg-primary" />

// ❌ 피해야 할 사용
<Button className="bg-slate-900">  // 브랜드 컬러 사용
<div className="text-blue-500">    // 디자인 토큰 사용
```

### 테마별 적용

- **Light Mode**: 따뜻한 오프화이트 배경 + Warm Sage Primary
- **Dark Mode**: 따뜻한 다크 배경 + 밝은 Sage Primary
- **Beige/Sepia**: 고서 느낌 배경 + 동일한 Primary

**전체 팔레트와 사용법은 [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) 참조**
