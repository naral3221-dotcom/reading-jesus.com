import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Apple 스타일: 부드러운 라운드, 미묘한 트랜지션
  "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:shadow hover:brightness-105",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:shadow hover:brightness-105",
        outline:
          "border-border/60 text-foreground bg-background/50 hover:bg-muted/50",
        // 새로운 variants
        success:
          "border-transparent bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-foreground",
        warning:
          "border-transparent bg-muted text-foreground dark:bg-primary/40 dark:text-accent",
        info:
          "border-transparent bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-foreground",
        subtle:
          "border-transparent bg-muted/60 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
