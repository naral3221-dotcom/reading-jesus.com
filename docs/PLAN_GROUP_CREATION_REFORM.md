# 그룹 생성 기능 개편 계획

## 개요
그룹 생성 UI를 통합하고 커스텀 플랜 기능을 추가하는 대규모 개편

---

## 1. 새 그룹 생성 UI 설계

### 1.1 소속 교회 선택 (필수)
```
┌─────────────────────────────────────────┐
│ 소속 교회 선택                     [v] │
├─────────────────────────────────────────┤
│ ○ [교회이름] 소속 그룹 생성             │
│ ○ 일반 그룹 생성                        │
└─────────────────────────────────────────┘
```
- 드롭다운/라디오 형태
- 사용자의 `profiles.church_id` 조회하여 교회명 표시
- 교회 소속이 없으면 "일반 그룹 생성"만 표시

### 1.2 소속 부서 (교회 선택 시, 선택)
```
┌─────────────────────────────────────────┐
│ 소속 부서 (선택)                        │
│ ┌─────────────────────────────────────┐ │
│ │ 예: 청년부, 초등부, 성가대         │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 1.3 그룹 이름 (필수)
```
┌─────────────────────────────────────────┐
│ 그룹 이름 *                             │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 1.4 그룹 설명 (선택)
```
┌─────────────────────────────────────────┐
│ 그룹 설명                               │
│ ┌─────────────────────────────────────┐ │
│ │ [Rich Editor]                       │ │
│ │ B I U • 목록 • 링크                  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 1.5 읽기 플랜 (필수)
```
┌─────────────────────────────────────────┐
│ 읽기 플랜 *                             │
├─────────────────────────────────────────┤
│ ○ 리딩지저스 플랜                   [i] │
│   └─ 선택 시 설명 표시:                 │
│      "리딩지저스 2026년 플랜           │
│       - 시작일: 2026년 1월 12일        │
│       - 기간: 365일                    │
│       - 전용 QT 가이드 제공            │
│       - 일요일 휴식"                   │
│                                         │
│ ○ 커스텀 플랜                           │
│   └─ 선택 시 Step UI 펼침              │
└─────────────────────────────────────────┘
```

---

## 2. 커스텀 플랜 Step UI

### Step 1: 읽을 말씀 선택하기
```
┌─────────────────────────────────────────┐
│ Step 1. 읽을 말씀 선택하기              │
├─────────────────────────────────────────┤
│ ○ 전체 성경 (66권, 1,189장)            │
│ ○ 구약만 (39권, 929장)                 │
│ ○ 신약만 (27권, 260장)                 │
│ ○ 직접 선택하기                         │
│   └─ [성경책 선택 UI]                   │
│      ☑ 창세기 (50장)                   │
│      ☑ 출애굽기 (40장)                 │
│      ...                                │
│      선택: 5권, 총 150장                │
└─────────────────────────────────────────┘
```

### Step 2: 통독 요일 선택하기
```
┌─────────────────────────────────────────┐
│ Step 2. 통독 요일 선택하기              │
├─────────────────────────────────────────┤
│ [월] [화] [수] [목] [금] [토] [일]      │
│  ☑    ☑    ☑    ☑    ☑    ☐    ☐       │
│                                         │
│ 선택: 주 5일 (월~금)                    │
└─────────────────────────────────────────┘
```

### Step 3: 통독 방식 선택하기
```
┌─────────────────────────────────────────┐
│ Step 3. 통독 방식 선택하기              │
├─────────────────────────────────────────┤
│ ○ 하루에 [  3  ] 장씩 읽기             │
│                                         │
│ ○ 직접 만들기 (준비 중)                 │
│   └─ 클릭 시: "이 기능은 추후 개발      │
│      완료 후 추가될 예정입니다"         │
│                                         │
│ ─────────────────────────────────────── │
│ 📊 계산 결과:                           │
│ 선택하신 통독 플랜은                    │
│ 총 63일의 여정이 필요합니다             │
│ (150장 ÷ 3장 = 50일 × 7/5 = 70일)      │
└─────────────────────────────────────────┘
```

### Step 4: 통독 시작일 선택하기
```
┌─────────────────────────────────────────┐
│ Step 4. 통독 시작일 선택하기            │
├─────────────────────────────────────────┤
│ 시작일: [2026-01-01]                    │
│                                         │
│ ─────────────────────────────────────── │
│ 📅 일정 안내:                           │
│ • 시작일: 2026년 1월 1일 (수)           │
│ • 종료일: 2026년 3월 11일 (수)          │
│ • 기간: 70일 (실제 읽기 50일)           │
└─────────────────────────────────────────┘
```

### Step 5: 플랜 확인 및 생성
```
┌─────────────────────────────────────────┐
│ Step 5. 플랜 확인 및 생성               │
├─────────────────────────────────────────┤
│ 📋 플랜 요약                            │
│ ───────────────────────────────────────│
│ • 읽을 말씀: 창세기 외 4권 (150장)      │
│ • 통독 요일: 월~금 (주 5일)             │
│ • 하루 분량: 3장                        │
│ • 기간: 70일                            │
│ • 시작: 2026.01.01 → 종료: 2026.03.11  │
│                                         │
│ 플랜 이름:                              │
│ ┌─────────────────────────────────────┐ │
│ │ 모세오경 50일 완독                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [        플랜 생성하기        ]         │
└─────────────────────────────────────────┘
```

---

## 3. Bible 페이지 플랜 선택기

### 위치: "오늘은 Day N입니다" 상단
```
┌─────────────────────────────────────────┐
│ [통독 일정 선택하기 ▼]                  │
├─────────────────────────────────────────┤
│ [교회] 사랑의교회                       │
│        리딩지저스 2026 플랜            │
│        시작: 2026.01.12                │
│                                         │
│ [그룹] 청년부 성경읽기                  │
│        리딩지저스 2026 플랜            │
│        시작: 2026.01.12                │
│                                         │
│ [그룹] 개인 통독 프로젝트               │
│        모세오경 50일 플랜              │
│        시작: 2026.02.01                │
└─────────────────────────────────────────┘
```

---

## 4. DB 스키마

### 4.1 groups 테이블 수정
```sql
ALTER TABLE groups ADD COLUMN IF NOT EXISTS department TEXT;
-- 소속 부서 (교회 그룹 전용)

ALTER TABLE groups ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES reading_plans(id);
-- 연결된 플랜 ID
```

### 4.2 새 테이블: reading_plans
```sql
CREATE TABLE reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('reading_jesus', 'custom')),

  -- 커스텀 플랜 설정
  bible_scope TEXT CHECK (bible_scope IN ('full', 'old', 'new', 'custom')),
  selected_books TEXT[],
  reading_days INTEGER[],  -- [1,2,3,4,5] = 월~금
  chapters_per_day INTEGER,

  -- 계산된 값
  total_chapters INTEGER,
  total_reading_days INTEGER,
  total_calendar_days INTEGER,
  start_date DATE NOT NULL,
  end_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reading_plans_group ON reading_plans(group_id);
```

### 4.3 새 테이블: plan_schedules
```sql
CREATE TABLE plan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  reading_date DATE,
  book_name TEXT NOT NULL,
  start_chapter INTEGER NOT NULL,
  end_chapter INTEGER NOT NULL,
  chapter_count INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plan_id, day_number)
);

CREATE INDEX idx_plan_schedules_plan ON plan_schedules(plan_id);
CREATE INDEX idx_plan_schedules_date ON plan_schedules(reading_date);
```

---

## 5. 다중 플랜 체크 시스템

### 5.1 핵심 원칙

1. **동일 플랜 통합**: 교회와 그룹이 같은 플랜(예: 리딩지저스)을 사용하면, 한 번 체크로 모두 적용
2. **다른 플랜 분리**: 서로 다른 플랜은 각각 표시하고 개별 체크
3. **소속 표시**: 각 플랜이 어디에 적용되는지 명확히 표시

### 5.2 홈 화면 "오늘의 읽기" UI

```
┌─────────────────────────────────────────┐
│ 📖 오늘의 읽기                          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🔥 리딩지저스 2026                  │ │
│ │ Day 15 - 창세기 43-46장 (4장)       │ │
│ │                                     │ │
│ │ 📍 적용: 사랑의교회, 청년부그룹     │ │
│ │ [      ✅ 읽었어요      ]           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📘 신약 50일 통독                   │ │
│ │ Day 8 - 마태복음 10-12장 (3장)      │ │
│ │                                     │ │
│ │ 📍 적용: 개인통독프로젝트           │ │
│ │ [      ☐ 읽기 시작      ]          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 5.3 데이터 구조

```typescript
// 사용자의 모든 플랜을 그룹핑
interface UserDailyReading {
  plan_type: string;           // 'reading_jesus' | plan_id
  plan_name: string;           // '리딩지저스 2026' | '신약 50일 통독'
  day_number: number;
  reading_info: {
    book: string;
    start_chapter: number;
    end_chapter: number;
  }[];
  applied_to: {                // 이 플랜이 적용되는 곳들
    type: 'church' | 'group';
    id: string;
    name: string;
  }[];
  is_checked: boolean;         // 모든 적용처 중 하나라도 체크했으면 true
}
```

### 5.4 체크 로직

```
IF 사용자가 플랜 A 체크
  THEN 플랜 A를 사용하는 모든 그룹/교회에 daily_check 기록

예시:
- 리딩지저스 체크 → 사랑의교회(daily_check), 청년부그룹(daily_check) 모두 기록
- 신약통독 체크 → 개인통독프로젝트(daily_check)만 기록
```

### 5.5 DB 변경 사항

```sql
-- daily_checks에 plan_id 추가 (선택적)
ALTER TABLE daily_checks ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES reading_plans(id);

-- 같은 플랜이면 한 번 체크로 여러 그룹에 기록하는 함수
CREATE OR REPLACE FUNCTION check_plan_for_all_groups(
  p_user_id UUID,
  p_plan_type TEXT,  -- 'reading_jesus' 또는 plan_id
  p_day_number INTEGER
) RETURNS void AS $$
BEGIN
  -- 해당 플랜을 사용하는 모든 그룹에 체크 기록
  INSERT INTO daily_checks (user_id, group_id, day_number)
  SELECT
    p_user_id,
    g.id,
    p_day_number
  FROM groups g
  JOIN group_members gm ON gm.group_id = g.id
  WHERE gm.user_id = p_user_id
    AND (
      (p_plan_type = 'reading_jesus' AND g.plan_type = 'reading_jesus')
      OR g.plan_id::text = p_plan_type
    )
  ON CONFLICT (user_id, group_id, day_number) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. 제거할 기존 필드 (그룹 생성 UI)

- ❌ 일정 진행 방식 (schedule_mode) → 플랜에서 자동 결정
- ❌ 시작일 (리딩지저스 선택 시) → 플랜에 포함
- ❌ 읽기 플랜 일수 선택 (365/180/90) → 커스텀 플랜으로 대체

---

## 7. 영향받는 기능 및 수정 사항

### 7.1 Home 페이지
- 현재: `activeGroup`의 `start_date` + `day_number`로 오늘 읽기 계산
- 변경: 다중 플랜 UI로 교체 (섹션 5 참고)
- 같은 플랜은 통합 표시, 다른 플랜은 개별 표시

### 7.2 Daily Check
- 현재: `group_id + day_number`
- 변경: 플랜 단위 체크 → 같은 플랜을 사용하는 모든 그룹에 기록
- `check_plan_for_all_groups()` 함수 사용

### 7.3 그룹 상세 페이지
- 플랜 정보 표시 추가
- "우리 그룹 플랜 보기" 버튼

### 7.4 교회 그룹 페이지
- 그룹 생성 버튼 클릭 시 → `/group?church=CODE` 로 이동
- 교회가 자동 선택된 상태로 통합 그룹 생성 UI 표시

---

## 8. 구현 순서

### Phase 1: DB & 타입
1. 마이그레이션 파일 생성 (reading_plans, plan_schedules)
2. groups 테이블 수정 (department, plan_id 추가)
3. daily_checks 수정 (plan_id 추가)
4. 타입 정의 추가
5. 플랜 계산 유틸리티 함수

### Phase 2: 그룹 생성 UI 통합
1. 새 그룹 생성 컴포넌트 개발
2. 교회 선택 + 부서 입력 UI
3. 리딩지저스 플랜 설명 모달
4. 커스텀 플랜 5-Step 위자드
5. 기존 /group, /church/[code]/groups 페이지 교체

### Phase 3: 다중 플랜 체크 시스템
1. 홈 페이지 "오늘의 읽기" 다중 플랜 UI
2. 플랜별 그룹핑 로직
3. 통합 체크 함수 (check_plan_for_all_groups)

### Phase 4: Bible 플랜 선택기
1. 플랜 선택 드롭다운 컴포넌트
2. Bible 페이지 통합
3. 플랜별 일정 표시

### Phase 5: 연동 수정
1. 그룹 상세 페이지 플랜 정보 표시
2. 마이페이지 플랜 목록
3. 교회 그룹 페이지 연동

### Phase 6: 테스트 & 마무리
1. 전체 기능 테스트
2. 버그 수정
3. IMPLEMENTATION.md 업데이트

---

## 9. 리딩지저스 플랜 설명 (모달용)

```
📖 리딩지저스 2026 플랜

리딩지저스는 1년 365일 동안 성경 전체를 통독하는
체계적인 성경 읽기 프로그램입니다.

📅 일정
• 시작일: 2026년 1월 12일 (월요일)
• 종료일: 2027년 1월 11일
• 휴식일: 매주 일요일

📚 구성
• 총 313일 (일요일 52일 휴식)
• 매일 구약 + 신약 병행 읽기
• 하루 평균 3-4장

🎁 특전
• 전용 QT 가이드 제공
• 매일 묵상 질문
• 함께 나누는 커뮤니티

이 플랜은 2026년 1월 12일부터 시작되며,
그 전에는 Day 1부터 순차적으로 진행됩니다.
```

---

*작성일: 2024-12-27*
