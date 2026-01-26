import { cn } from "@/lib/utils"
import { LucideIcon, Inbox, MessageSquare, Users, BookOpen, Calendar } from "lucide-react"
import { Button } from "./button"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="default">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// 자주 사용되는 빈 상태 프리셋
export function NoCommentsEmpty({ onWrite }: { onWrite?: () => void }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="아직 묵상이 없습니다"
      description="첫 번째 묵상을 나눠보세요"
      action={onWrite ? { label: "묵상 작성하기", onClick: onWrite } : undefined}
    />
  )
}

export function NoGroupsEmpty({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="참여 중인 그룹이 없습니다"
      description="그룹을 만들거나 초대 코드로 참여하세요"
      action={onCreate ? { label: "그룹 만들기", onClick: onCreate } : undefined}
    />
  )
}

export function NoReadingEmpty() {
  return (
    <EmptyState
      icon={BookOpen}
      title="읽기 분량이 없습니다"
      description="그룹에 참여하면 통독 일정이 표시됩니다"
    />
  )
}

export function NoCalendarDataEmpty() {
  return (
    <EmptyState
      icon={Calendar}
      title="통독 기록이 없습니다"
      description="성경을 읽으면 캘린더에 기록됩니다"
    />
  )
}

export function NoMembersEmpty() {
  return (
    <EmptyState
      icon={Users}
      title="멤버가 없습니다"
      description="초대 코드를 공유하여 멤버를 초대하세요"
    />
  )
}

export function NoSearchResultsEmpty({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Inbox}
      title="검색 결과가 없습니다"
      description={`"${query}"에 대한 결과를 찾을 수 없습니다`}
    />
  )
}
