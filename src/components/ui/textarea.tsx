import * as React from "react"

import { cn } from "@/lib/utils"

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          // Apple 스타일: 둥근 모서리, 깔끔한 포커스, 부드러운 트랜지션
          "flex min-h-[80px] w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm shadow-sm transition-all duration-200",
          "placeholder:text-muted-foreground/70",
          "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          "resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
