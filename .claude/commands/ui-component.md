# UI 컴포넌트 생성

shadcn/ui 스타일로 새 UI 컴포넌트를 생성합니다.

## 입력
- 컴포넌트 이름: $ARGUMENTS

## 작업
1. `src/components/ui/` 폴더에 컴포넌트 파일 생성
2. shadcn/ui 패턴 준수:
   - `cva`로 variants 정의
   - `cn()` 유틸리티 사용
   - `forwardRef` 적용
   - TypeScript 타입 정의

## 템플릿
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const componentVariants = cva(
  "기본 클래스들",
  {
    variants: {
      variant: {
        default: "기본 스타일",
      },
      size: {
        default: "기본 크기",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {}

const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        className={cn(componentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Component.displayName = "Component"

export { Component, componentVariants }
```

## 규칙
- Tailwind CSS 클래스만 사용
- CSS 변수 색상 사용 (text-primary, bg-muted 등)
- 접근성 고려 (aria 속성, 키보드 네비게이션)
