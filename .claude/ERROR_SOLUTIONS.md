# 에러 해결 기록

> 이 문서는 프로젝트에서 발생한 에러와 해결 방법을 기록합니다.
> 새 에러 해결 시 자동으로 추가됩니다.

---

## 📋 목차

- [Supabase 관련](#supabase-관련)
- [Next.js / React 관련](#nextjs--react-관련)
- [TypeScript 관련](#typescript-관련)
- [Tailwind CSS 관련](#tailwind-css-관련)
- [빌드 / 배포 관련](#빌드--배포-관련)

---

## Supabase 관련

### RLS 정책 오류
**에러**: `new row violates row-level security policy`

**원인**: RLS 정책이 활성화되어 있지만 해당 작업을 허용하는 정책이 없음

**해결**:
```sql
-- 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- 정책 추가 예시
CREATE POLICY "Users can insert own data"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

### 인증 세션 없음
**에러**: `auth.uid() returns null` 또는 `User not authenticated`

**원인**: 로그인하지 않은 상태에서 인증이 필요한 작업 시도

**해결**:
```tsx
// 사용자 확인 후 작업 진행
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  // 로그인 페이지로 리다이렉트 또는 에러 처리
  return;
}
```

---

## Next.js / React 관련

### Hydration 불일치
**에러**: `Hydration failed because the initial UI does not match`

**원인**: 서버/클라이언트 렌더링 결과가 다름 (주로 날짜, localStorage 등)

**해결**:
```tsx
// useEffect에서 클라이언트 전용 데이터 설정
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return null; // 또는 스켈레톤
```

---

### useEffect 무한 루프
**에러**: 컴포넌트가 무한 리렌더링

**원인**: useEffect 의존성 배열에 매번 새로 생성되는 객체/배열 포함

**해결**:
```tsx
// ❌ 문제
useEffect(() => {
  fetchData();
}, [{ id: 1 }]); // 매번 새 객체 생성

// ✅ 해결
const id = 1;
useEffect(() => {
  fetchData();
}, [id]); // primitive 값 사용
```

---

## TypeScript 관련

### 타입 추론 실패
**에러**: `Property 'x' does not exist on type 'y'`

**원인**: Supabase 쿼리 결과 타입이 자동 추론되지 않음

**해결**:
```tsx
// 타입 명시
interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
}

const { data } = await supabase
  .from('profiles')
  .select('*')
  .single();

const profile = data as Profile;
```

---

### null 체크 필요
**에러**: `Object is possibly 'null'`

**원인**: optional 값에 대한 null 체크 누락

**해결**:
```tsx
// Optional chaining 사용
const name = user?.profile?.nickname ?? '익명';

// 또는 early return
if (!user) return null;
```

---

## Tailwind CSS 관련

### 동적 클래스 미적용
**에러**: 동적으로 생성한 클래스가 적용되지 않음

**원인**: Tailwind는 빌드 타임에 클래스를 추출하므로 동적 문자열 인식 불가

**해결**:
```tsx
// ❌ 문제
<div className={`text-${color}-500`}>  // 작동 안함

// ✅ 해결 1: 전체 클래스명 사용
const colorClass = {
  red: 'text-red-500',
  blue: 'text-blue-500',
}[color];

// ✅ 해결 2: safelist에 추가 (tailwind.config.ts)
safelist: ['text-red-500', 'text-blue-500']
```

---

## 빌드 / 배포 관련

### 빌드 실패 - 타입 에러
**에러**: `Type error: ...`

**원인**: 개발 중에는 무시되던 타입 에러가 빌드 시 실패

**해결**:
```bash
# 타입 체크 먼저 실행
npm run type-check  # 또는 npx tsc --noEmit

# 에러 수정 후 빌드
npm run build
```

---

## 에러 기록 템플릿

새 에러 발생 시 아래 형식으로 추가:

```markdown
### [에러 제목]
**에러**: `에러 메시지`

**원인**: 원인 설명

**해결**:
\`\`\`tsx
// 해결 코드
\`\`\`

**관련 파일**: `파일 경로`

**날짜**: YYYY-MM-DD
```

---

*마지막 업데이트: 2025-12-18*
