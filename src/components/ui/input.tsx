import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Apple 스타일: 둥근 모서리, 깔끔한 포커스, 부드러운 트랜지션
          "flex h-11 min-h-[44px] w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-base shadow-sm transition-all duration-200",
          // 파일 입력 스타일
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // 플레이스홀더
          "placeholder:text-muted-foreground/70",
          // 포커스 스타일 - Apple 스타일
          "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          // 비활성화 상태
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          // 반응형 텍스트 크기
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
