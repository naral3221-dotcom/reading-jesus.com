# Design System - Reading Jesus

## 개요

이 문서는 Reading Jesus 프로젝트의 디자인 시스템을 설명합니다.
테마, 색상, 폰트 크기 등의 설정 방법과 사용법을 안내합니다.

---

## 아키텍처

```
AppPreferencesProvider (통합 설정 관리)
├── next-themes (테마 전환)
└── Custom Context (폰트 크기)

globals.css (CSS 변수 정의)
└── :root, .dark, .beige, .sepia

tailwind.config.ts (Tailwind 연동)
└── hsl(var(--*)) 참조
```

---

## 테마 시스템

### 지원 테마

| 테마 | 클래스 | 설명 |
|------|--------|------|
| 시스템 | (자동) | OS 설정 따름 |
| 라이트 | `:root` | 미니멀 화이트/그레이 |
| 다크 | `.dark` | 어두운 화면 |
| 베이지 | `.beige` | 따뜻한 톤 |
| 세피아 | `.sepia` | 눈 보호용 |

### 사용법

```tsx
import { useTheme } from '@/components/providers/ThemeProvider';

function MyComponent() {
  const { theme, setTheme, resolvedTheme, mounted } = useTheme();

  if (!mounted) return null; // Hydration 방지

  return (
    <button onClick={() => setTheme('dark')}>
      다크 모드
    </button>
  );
}
```

---

## CSS 변수 네이밍 규칙

### 기본 시스템 색상 (시맨틱)

| 변수 | 용도 | Tailwind 클래스 |
|------|------|-----------------|
| `--background` | 페이지 배경 | `bg-background` |
| `--foreground` | 기본 텍스트 | `text-foreground` |
| `--card` | 카드 배경 | `bg-card` |
| `--card-foreground` | 카드 텍스트 | `text-card-foreground` |
| `--primary` | 주요 액션 | `bg-primary`, `text-primary` |
| `--primary-foreground` | 주요 액션 텍스트 | `text-primary-foreground` |
| `--secondary` | 보조 요소 | `bg-secondary` |
| `--muted` | 비활성/배경 | `bg-muted`, `text-muted-foreground` |
| `--accent` | 강조색 | `bg-accent`, `text-accent` |
| `--destructive` | 위험/삭제 | `bg-destructive` |
| `--border` | 테두리 | `border-border` |

### 사용 규칙

```tsx
// ✅ 올바른 사용 - 시맨틱 색상
<div className="bg-primary text-primary-foreground">버튼</div>
<div className="bg-muted text-muted-foreground">비활성 영역</div>
<div className="border-border">카드</div>

// ❌ 잘못된 사용 - 하드코딩 색상
<div className="bg-coral-500">버튼</div>  // 금지
<div className="text-amber-600">텍스트</div>  // 금지
```

### 색상 불투명도

```tsx
// 불투명도 적용
<div className="bg-primary/10">10% 불투명도</div>
<div className="bg-accent/20">20% 불투명도</div>
<div className="border-border/60">60% 불투명도</div>
```

---

## 폰트 크기 시스템

### 지원 크기

| 레벨 | 스케일 | 설명 |
|------|--------|------|
| `xs` | 0.85 | 아주 작게 |
| `sm` | 0.92 | 작게 |
| `base` | 1.0 | 보통 (기본) |
| `lg` | 1.1 | 크게 |
| `xl` | 1.2 | 아주 크게 |

### 사용법

```tsx
import { useFontSize } from '@/components/providers/ThemeProvider';

function MyComponent() {
  const { fontSize, fontScale, setFontSize, increaseFontSize, decreaseFontSize, mounted } = useFontSize();

  if (!mounted) return null;

  return (
    <div>
      <p style={{ fontSize: `calc(1rem * ${fontScale})` }}>
        스케일 적용 텍스트
      </p>
      <button onClick={increaseFontSize}>크게</button>
      <button onClick={decreaseFontSize}>작게</button>
    </div>
  );
}
```

### CSS 변수

```css
/* globals.css에 정의됨 */
--font-scale: 1;  /* 기본값 */

/* 사용 */
.my-text {
  font-size: calc(1rem * var(--font-scale, 1));
}
```

---

## 통합 설정 훅

### useAppPreferences

테마와 폰트 크기를 모두 관리하는 통합 훅

```tsx
import { useAppPreferences } from '@/components/providers/ThemeProvider';

function SettingsPage() {
  const {
    // 테마
    theme,
    resolvedTheme,
    setTheme,
    themes,
    // 폰트 크기
    fontSize,
    fontScale,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    // 공통
    mounted
  } = useAppPreferences();

  // ...
}
```

---

## 컴포넌트

### ThemeSelector

```tsx
import { ThemeSelector } from '@/components/ThemeSelector';

// 리스트 형태 (기본)
<ThemeSelector variant="list" showDescription />

// 그리드 형태
<ThemeSelector variant="grid" />
```

### ThemeToggle

```tsx
import { ThemeToggle } from '@/components/ThemeSelector';

// 순환형 토글 버튼
<ThemeToggle className="my-class" />
```

### FontSizeSelector

```tsx
import { FontSizeSelector } from '@/components/FontSizeSelector';

// 슬라이더 (기본)
<FontSizeSelector variant="slider" showPreview />

// 버튼형
<FontSizeSelector variant="buttons" />

// 컴팩트형
<FontSizeSelector variant="compact" />
```

---

## 다크 모드 대응

```tsx
// 라이트/다크 모드 분기
<div className="bg-muted dark:bg-muted/50">
  자동 다크 모드 대응
</div>

// 테마별 텍스트
<p className="text-foreground dark:text-accent-foreground">
  테마별 텍스트 색상
</p>
```

---

## 마이그레이션 가이드

### 하드코딩 색상 → 시맨틱 색상

| 기존 | 변경 |
|------|------|
| `bg-coral-500` | `bg-primary` |
| `bg-amber-50` | `bg-muted` |
| `text-orange-600` | `text-accent` |
| `border-slate-200` | `border-border` |
| `bg-green-100` | `bg-accent/10` |

### 다크 모드 색상

| 기존 | 변경 |
|------|------|
| `dark:bg-green-950` | `dark:bg-accent/20` |
| `dark:text-blue-300` | `dark:text-accent-foreground` |
| `dark:border-indigo-800` | `dark:border-accent/30` |

---

## 참고 파일

- **CSS 변수**: `src/app/globals.css`
- **Tailwind 설정**: `tailwind.config.ts`
- **Provider**: `src/components/providers/AppPreferencesProvider.tsx`
- **테마 선택**: `src/components/ThemeSelector.tsx`
- **폰트 선택**: `src/components/FontSizeSelector.tsx`
