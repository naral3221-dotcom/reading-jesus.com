import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - Apple 스타일: 부드러운 트랜지션, 둥근 모서리
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        // Primary: 부드러운 그림자, 호버 시 밝아짐
        default:
          "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:brightness-105 active:shadow-sm",
        // Destructive: 빨간색 계열
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:brightness-105 active:shadow-sm",
        // Outline: 테두리만, 호버 시 배경 채움
        outline:
          "border-2 border-border bg-transparent hover:bg-muted/50 hover:border-muted-foreground/30",
        // Secondary: 연한 배경
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Ghost: 배경 없음, 호버 시 연한 배경
        ghost:
          "hover:bg-muted/60",
        // Link: 텍스트 링크 스타일
        link:
          "text-primary underline-offset-4 hover:underline",
        // Accent: 강조 색상 (CTA)
        accent:
          "bg-accent text-accent-foreground shadow-sm hover:shadow-md hover:brightness-105 active:shadow-sm",
        // Soft: 부드러운 배경 (Apple 스타일)
        soft:
          "bg-primary/10 text-primary hover:bg-primary/20",
      },
      size: {
        default: "h-11 px-5 py-2.5 min-h-[44px]",
        sm: "h-9 rounded-lg px-3.5 text-xs min-h-[36px]",
        lg: "h-12 rounded-xl px-8 text-base min-h-[48px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl",
        // 작은 아이콘 버튼
        "icon-sm": "h-9 w-9 min-h-[36px] min-w-[36px] rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
