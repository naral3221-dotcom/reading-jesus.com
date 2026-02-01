# 성경 읽기 가이드

> 365일 통독, 읽음 체크 관련 작업 시 참조하세요.

---

## 1. 개요

### 성경 읽기 시스템

```
┌─────────────────────────────────────────────────────────────┐
│                    성경 읽기 시스템                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  /bible         │    │  /bible-reader  │                 │
│  │  365일 통독 일정  │ →  │  성경 본문 뷰어  │                 │
│  └─────────────────┘    └─────────────────┘                 │
│         │                       │                           │
│         ▼                       ▼                           │
│  읽음 체크 토글            성경 구절 표시                     │
│         │                       │                           │
│         ▼                       ▼                           │
│  unified_reading_checks    bible_data.json                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 관련 페이지

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 365일 통독 | `/bible` | 일정 목록, 읽음 체크 |
| 성경 뷰어 | `/bible-reader` | 성경 본문 읽기 |
| 교회 성경 | `/church/[code]/bible` | 교회 컨텍스트 통독 |

---

## 2. 핵심 파일

### 페이지

| 파일 | 역할 |
|------|------|
| `src/app/(main)/bible/page.tsx` | 365일 통독 일정 페이지 |
| `src/app/(main)/bible-reader/page.tsx` | 성경 본문 뷰어 |
| `src/app/church/[code]/bible/page.tsx` | 교회 성경 통독 |

### 데이터 파일

| 파일 | 역할 |
|------|------|
| `src/data/reading_plan.json` | 365일 통독 일정 데이터 |
| `src/data/bible_data.json` | 성경 전체 본문 데이터 |
| `src/data/bible_books.json` | 성경 책 목록 |

### 컴포넌트

| 파일 | 역할 |
|------|------|
| `src/components/bible/BibleAccessGuard.tsx` | 성경 접근 권한 확인 |
| `src/components/bible/BibleVerseSelector.tsx` | 성경 구절 선택기 |
| `src/components/bible/PlanSelector.tsx` | 통독 플랜 선택 |
| `src/components/church/ReadingDayFilter.tsx` | 읽기 날짜 필터 |
| `src/components/church/ReadingDayPicker.tsx` | 날짜 선택기 |

---

## 3. 사용하는 훅

| 훅 | 파일 | 용도 |
|----|------|------|
| `useReadingChecks` | `useReadingCheck.ts` | 읽음 체크 목록 조회 |
| `useCheckedDayNumbers` | `useReadingCheck.ts` | 체크된 일차 목록 |
| `useToggleReadingCheck` | `useReadingCheck.ts` | 읽음 체크 토글 |
| `useReadingProgress` | `useReadingCheck.ts` | 읽기 진도율 |
| `useReadingStreak` | `useReadingCheck.ts` | 연속 읽음 (스트릭) |
| `useWeeklyReadingSchedule` | `useReadingSchedule.ts` | 주간 통독 일정 |

### Query Key Factory

```typescript
const readingCheckKeys = {
  all: ['reading-checks'] as const,
  bySource: (sourceType: string, sourceId: string) =>
    [...readingCheckKeys.all, sourceType, sourceId] as const,
  checkedDays: (sourceType: string, sourceId: string) =>
    [...readingCheckKeys.all, 'checked-days', sourceType, sourceId] as const,
  progress: (sourceType: string, sourceId: string) =>
    [...readingCheckKeys.all, 'progress', sourceType, sourceId] as const,
};
```

### 사용 예시

```typescript
import {
  useCheckedDayNumbers,
  useToggleReadingCheck
} from '@/presentation/hooks/queries/useReadingCheck';

function BibleDayCard({ dayNumber, groupId }) {
  const { data: checkedDays } = useCheckedDayNumbers('group', groupId);
  const toggleCheck = useToggleReadingCheck();

  const isChecked = checkedDays?.includes(dayNumber);

  const handleToggle = () => {
    toggleCheck.mutate({
      sourceType: 'group',
      sourceId: groupId,
      dayNumber,
    });
  };

  return (
    <div onClick={handleToggle}>
      {isChecked ? '✅' : '⬜'} Day {dayNumber}
    </div>
  );
}
```

---

## 4. 데이터 흐름

### 읽음 체크 흐름

```
사용자가 Day 카드 클릭 (Long Press)
    ↓
useToggleReadingCheck() 훅
    ↓
ToggleReadingCheck Use Case
    ↓
unified_reading_checks 테이블 INSERT/DELETE
    ↓
캐시 무효화 → UI 업데이트
```

### Day 계산 로직

```typescript
// Calendar 모드: 실제 날짜 기준
const today = new Date();
const dayNumber = getDayOfYear(today); // 1~365

// Relative 모드: 그룹 시작일 기준
const startDate = group.start_date;
const daysSinceStart = differenceInDays(today, startDate);
const dayNumber = daysSinceStart + 1; // 1부터 시작
```

### 테이블 구조

```sql
unified_reading_checks
├── id: UUID (PK)
├── user_id: UUID (FK → profiles)
├── source_type: TEXT ('group' | 'church')
├── source_id: UUID (group_id 또는 church_id)
├── day_number: INTEGER (1~365)
├── checked_at: TIMESTAMPTZ
├── created_at: TIMESTAMPTZ
└── UNIQUE(user_id, source_type, source_id, day_number)
```

### reading_plan.json 구조

```json
{
  "1": {
    "day": 1,
    "date": "2026-01-01",
    "title": "창세기 1-3장",
    "range": "창세기 1:1-3:24",
    "books": ["창세기"],
    "chapters": [1, 2, 3]
  },
  "2": { ... }
}
```

---

## 5. 작업 체크리스트

### 읽음 체크 기능 수정 시

- [ ] `useToggleReadingCheck` 훅 확인
- [ ] `unified_reading_checks` 테이블 구조 확인
- [ ] UI 피드백 (체크 애니메이션) 확인
- [ ] 캐시 무효화 확인

### 통독 일정 수정 시

- [ ] `reading_plan.json` 데이터 수정
- [ ] Day 계산 로직 확인
- [ ] 구약/신약 탭 필터 확인

### 성경 뷰어 수정 시

- [ ] `bible-reader/page.tsx` 수정
- [ ] `bible_data.json` 데이터 확인
- [ ] 폰트 크기 설정 반영 확인

---

## 6. Day 계산 모드

### Calendar 모드

- 실제 날짜 기준 (1월 1일 = Day 1)
- 연도별 고정 일정
- 개인 통독에 적합

### Relative 모드 (Day Count)

- 그룹 시작일 기준
- 시작일 + n일 = Day n+1
- 그룹 통독에 적합

### 모드 설정

```typescript
// 그룹 설정에서 schedule_mode 확인
const group = {
  schedule_mode: 'calendar' | 'day_count',
  start_date: '2026-01-01',
};

// Day 계산
const dayNumber = group.schedule_mode === 'calendar'
  ? getDayOfYear(today)
  : calculateRelativeDay(today, group.start_date);
```

---

## 7. 주의사항

1. **UNIQUE 제약**: 같은 사용자가 같은 Day를 중복 체크할 수 없음
2. **그룹 vs 교회**: `source_type`으로 구분
3. **365일 범위**: `day_number`는 1~365 사이 값

---

## 8. 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-02-01 | 초기 문서 작성 |
