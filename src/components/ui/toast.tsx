"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground",
        success: "border-accent/30 bg-accent/10 text-foreground",
        error: "border-red-200 bg-red-50 text-red-900",
        info: "border-accent/30 bg-accent/10 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconMap = {
  default: null,
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string
  description?: string
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", title, description, onClose, ...props }, ref) => {
    const Icon = iconMap[variant || "default"]

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          {Icon && (
            <Icon className={cn(
              "h-5 w-5 shrink-0",
              variant === "success" && "text-accent",
              variant === "error" && "text-red-600",
              variant === "info" && "text-accent"
            )} />
          )}
          <div className="flex flex-col gap-1">
            {title && <p className="text-sm font-semibold">{title}</p>}
            {description && (
              <p className="text-sm opacity-90">{description}</p>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Toast.displayName = "Toast"

// Toast Context와 Provider
interface ToastItem {
  id: string
  variant?: "default" | "success" | "error" | "info"
  title?: string
  description?: string
}

interface ToastContextValue {
  toasts: ToastItem[]
  toast: (options: Omit<ToastItem, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const toast = React.useCallback((options: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...options, id }])

    // 3초 후 자동 제거
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            title={t.title}
            description={t.description}
            onClose={() => dismiss(t.id)}
            className="animate-in slide-in-from-bottom-5 fade-in-0 max-w-sm"
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export { Toast, toastVariants }
