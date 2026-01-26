import { cn } from "@/lib/utils"
import { AlertCircle, RefreshCw, WifiOff, ServerCrash } from "lucide-react"
import { Button } from "./button"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  variant?: "default" | "network" | "server"
  className?: string
}

export function ErrorState({
  title,
  message,
  onRetry,
  variant = "default",
  className,
}: ErrorStateProps) {
  const variants = {
    default: {
      icon: AlertCircle,
      defaultTitle: "오류가 발생했습니다",
      defaultMessage: "잠시 후 다시 시도해주세요",
    },
    network: {
      icon: WifiOff,
      defaultTitle: "네트워크 오류",
      defaultMessage: "인터넷 연결을 확인해주세요",
    },
    server: {
      icon: ServerCrash,
      defaultTitle: "서버 오류",
      defaultMessage: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요",
    },
  }

  const { icon: Icon, defaultTitle, defaultMessage } = variants[variant]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4">
        <Icon className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {title || defaultTitle}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {message || defaultMessage}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </Button>
      )}
    </div>
  )
}

// 인라인 에러 (작은 에러 표시)
interface InlineErrorProps {
  message: string
  onRetry?: () => void
  className?: string
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg",
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-700 hover:text-red-800 font-medium underline"
        >
          재시도
        </button>
      )}
    </div>
  )
}

// 폼 에러 (입력 필드 아래 표시)
interface FormErrorProps {
  message: string
  className?: string
}

export function FormError({ message, className }: FormErrorProps) {
  return (
    <p className={cn("text-sm text-destructive mt-1", className)}>
      {message}
    </p>
  )
}

// 전체 화면 에러 (페이지 전체를 덮는 에러)
interface FullPageErrorProps {
  title?: string
  message?: string
  onRetry?: () => void
  onGoHome?: () => void
}

export function FullPageError({
  title = "페이지를 불러올 수 없습니다",
  message = "문제가 지속되면 관리자에게 문의해주세요",
  onRetry,
  onGoHome,
}: FullPageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 mb-6">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-6">{message}</p>
      <div className="flex gap-3">
        {onGoHome && (
          <Button variant="outline" onClick={onGoHome}>
            홈으로 가기
          </Button>
        )}
        {onRetry && (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        )}
      </div>
    </div>
  )
}
