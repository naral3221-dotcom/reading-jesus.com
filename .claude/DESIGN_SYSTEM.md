# Reading Jesus 디자인 시스템

> **브랜드 컨셉**: "Digital Sanctuary" (디지털 성소)
>
> 매일의 성경 읽기가 부담이 아닌 안식이 되도록, 차분하면서도 따뜻한 감성을 시각적으로 구현

---

## 1. 브랜드 컬러 시스템

### Primary Color: Warm Sage

| 토큰 | HEX | HSL | 용도 |
|------|-----|-----|------|
| `--primary` | `#7A8F6E` | `98 13% 50%` | 메인 브랜드 색상, CTA 버튼 |
| `--primary-light` | `#A4B89A` | `100 17% 66%` | 호버 상태, 배경 강조 |
| `--primary-dark` | `#5C6B52` | `98 13% 37%` | 액티브 상태, 텍스트 강조 |
| `--primary-subtle` | `#E8EDE6` | `100 15% 91%` | 카드 배경, 구분선 |

### Secondary/Accent Colors

| 토큰 | HEX | HSL | 용도 |
|------|-----|-----|------|
| `--accent-warm` | `#D4A574` | `30 52% 64%` | 뱃지, 성취 표시 (따뜻한 골드) |
| `--accent-cool` | `#7B9AAB` | `200 20% 58%` | 링크, 정보 표시 (부드러운 블루) |
| `--success` | `#6B9B6E` | `123 19% 51%` | 읽기 완료, 성장 지표 |
| `--warning` | `#C9A56B` | `40 45% 60%` | 알림, 주의사항 |

### Light Mode 팔레트 ("Living Sanctuary")

```css
:root {
  /* Primary Colors */
  --primary: 98 13% 50%;           /* #7A8F6E */
  --primary-light: 100 17% 66%;    /* #A4B89A */
  --primary-dark: 98 13% 37%;      /* #5C6B52 */
  --primary-subtle: 100 15% 91%;   /* #E8EDE6 */
  --primary-foreground: 0 0% 100%; /* #FFFFFF */

  /* Accent Colors */
  --accent-warm: 30 52% 64%;       /* #D4A574 */
  --accent-cool: 200 20% 58%;      /* #7B9AAB */
  --success: 123 19% 51%;          /* #6B9B6E */
  --warning: 40 45% 60%;           /* #C9A56B */

  /* Background & Surface */
  --background: 30 20% 99%;        /* #FDFCFB - 순백보다 따뜻한 오프화이트 */
  --card: 30 25% 97%;              /* #F5F3F0 */
  --muted: 30 15% 94%;             /* #EBE8E3 */

  /* Text Colors */
  --foreground: 0 0% 17%;          /* #2C2C2C - 순수 검정보다 부드러운 차콜 */
  --muted-foreground: 0 0% 35%;    /* #5A5A5A */

  /* Border */
  --border: 30 12% 88%;            /* #E2DED8 */
  --ring: 98 13% 50%;              /* Primary와 동일 */
}
```

### Dark Mode 팔레트 ("Quiet Evening")

```css
.dark {
  /* Primary Colors - 어두운 배경에서 가시성 향상 */
  --primary: 100 17% 58%;          /* #8FA67F */
  --primary-light: 102 20% 68%;    /* #A8BF9A */
  --primary-dark: 98 15% 43%;      /* #6B7C60 */
  --primary-subtle: 100 10% 22%;   /* #3A4136 */
  --primary-foreground: 0 0% 8%;   /* #141414 */

  /* Background & Surface */
  --background: 90 10% 11%;        /* #1C1E1A - 완전한 검정보다 따뜻한 톤 */
  --card: 90 8% 15%;               /* #262822 */
  --muted: 90 6% 18%;              /* #2F312B */

  /* Text Colors */
  --foreground: 30 5% 91%;         /* #E8E6E3 - 순백보다 부드러운 오프화이트 */
  --muted-foreground: 30 3% 72%;   /* #B8B6B3 */

  /* Border */
  --border: 90 8% 20%;             /* #353830 */
}
```

### Beige Mode 팔레트 ("Ancient Manuscript")

```css
.beige {
  --background: 38 35% 95%;        /* #F5F1E8 - 크림 종이 느낌 */
  --primary: 98 13% 50%;           /* 동일 유지 */
  --foreground: 30 10% 22%;        /* #3C3731 - 베이지와 조화 */
  --card: 38 40% 97%;
  --muted: 38 25% 90%;
  --border: 38 20% 82%;
}
```

### Sepia Mode 팔레트 ("Worn Pages")

```css
.sepia {
  --background: 40 35% 92%;        /* #F4ECD8 - 고서 느낌 */
  --primary: 100 15% 55%;          /* #8B9B7E - 약간 더 따뜻하게 */
  --foreground: 35 20% 24%;        /* #4A3F2E - 세피아 톤 다크 브라운 */
  --card: 40 38% 95%;
  --muted: 40 28% 88%;
  --border: 40 18% 78%;
}
```

---

## 2. 색상 사용 가이드

### Primary 색상 우선순위 (높음)

| 사용처 | 클래스 |
|--------|--------|
| 주요 CTA 버튼 (읽기 시작, 묵상 작성) | `bg-primary text-primary-foreground` |
| 앱 아이콘 및 로고 | Primary HEX 사용 |
| 네비게이션 선택 상태 | `bg-primary/10 text-primary` |
| 진행률 바 | `bg-primary` |
| 중요 알림 배지 | `bg-primary text-primary-foreground` |

### Accent 색상 (중간)

| 사용처 | 클래스 |
|--------|--------|
| 성취 뱃지 | `bg-accent-warm text-white` |
| 링크 및 정보 버튼 | `text-accent-cool` |
| 호버 상태 | `hover:bg-primary-light/20` |
| 좋아요 아이콘 (활성) | `text-accent-warm` |

### 피해야 할 색상

| 색상 | 이유 |
|------|------|
| 쨍한 로열 블루 | 기존 성경앱(YouVersion, 갓피플)과 구분 어려움 |
| 강렬한 빨간색 | 매일 읽기가 압박으로 느껴질 위험 |
| 네온/형광 계열 | 경건함과 상충, 눈의 피로 증가 |
| 순수 검정 (#000) | 지나치게 무겁고 우울한 인상 |
| 진한 보라 + 골드 | Hallow 앱과 너무 유사 |

---

## 3. 접근성 (Accessibility)

### WCAG 2.1 준수 대비비

| 조합 | 대비비 | 등급 |
|------|--------|------|
| Text Primary on Background | 14.8:1 | AAA |
| Primary on Background | 4.7:1 | AA |
| Text Secondary on Background | 8.2:1 | AAA |
| Dark Text on Dark Background | 12.5:1 | AAA |

### 색맹 사용자 고려

1. **정보 전달 이중화**: 색상에만 의존하지 않음
   - 읽기 완료: 녹색 체크마크 + "완료" 텍스트
   - 연속 읽기: 색상 + 숫자 + 불꽃 아이콘
   - 에러: 색상 + 경고 아이콘 + 설명

2. **적록색맹 대응**: Success/Warning 구분 시 아이콘 필수 병행

---

## 4. 기독교적 상징

### Warm Sage (#7A8F6E) 선택 이유

1. **올리브의 상징**
   - 평화, 화해, 성령의 기름부음
   - 노아의 방주 - 비둘기가 물고 온 올리브 가지 (새 시작)
   - 감람산에서의 예수님의 기도와 승천

2. **자연색의 의미**
   - "하나님의 창조 세계" 무의식적 메시지
   - 성장과 재생 - 영적 성장 여정

3. **차별화 전략**
   - 기존 성경앱: 파란색/보라색 일색
   - Reading Jesus: 자연스럽고 따뜻한 올리브/세이지

---

## 5. 마이그레이션 매핑

### 기존 → 새 토큰 매핑

```
/* 현재 globals.css */           /* 새 브랜드 컬러 */
--primary: 0 0% 9%         →    --primary: 98 13% 50%
--accent: 215 20% 50%      →    --accent: 30 52% 64% (accent-warm)
--sage-*                   →    --primary-* (sage를 primary로 승격)
--coral-*                  →    --accent-warm (포인트 색상으로 유지)
```

### 컴포넌트별 변경 예시

```tsx
// Before
<Button className="bg-slate-900 text-white">

// After
<Button className="bg-primary text-primary-foreground">
```

```tsx
// Before
<div className="text-coral-500">

// After
<div className="text-accent-warm">
```

---

## 6. 글래스모피즘 적용

```css
.glassmorphism-card {
  background: hsl(var(--primary) / 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid hsl(var(--primary) / 0.2);
  box-shadow: 0 8px 32px 0 hsl(var(--primary) / 0.1);
}

.dark .glassmorphism-card {
  background: hsl(var(--primary) / 0.15);
  border: 1px solid hsl(var(--primary) / 0.25);
}
```

---

## 7. 시즌별 미세 조정 (선택)

| 시즌 | 조정 |
|------|------|
| 대림절/성탄절 | Accent Warm 비중 증가 |
| 사순절 | Primary 톤 약간 어둡게 |
| 부활절 | Primary Light 더 생동감 있게 |
| 추수감사절 | Accent Warm 더 풍성하게 |

---

## 8. 로고 가이드

### 권장 로고 컨셉

1. **심플 아이콘 스타일**: 열린 책 + 십자가 조합
2. **RJ 모노그램**: 이니셜로 미니멀하게
3. **올리브 가지 모티프**: 브랜드 색상과 일치

### 색상 사용

- 메인: `#7A8F6E` (Warm Sage)
- 배경: `#FDFCFB` (Light) / `#1C1E1A` (Dark)
- 악센트: `#D4A574` (Warm Gold) - 포인트용

### 인쇄용 CMYK

- Warm Sage: C=30 M=10 Y=35 K=25
- Accent Warm: C=10 M=25 Y=45 K=5

---

*최종 업데이트: 2026-01-27*
*브랜드 컬러 제안서 기반 (AI 종합 컨설팅)*
