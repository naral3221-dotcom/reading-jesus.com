'use client'

import * as React from 'react'
import { Lock, Users, Building2, Globe, ChevronDown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ContentVisibility } from '@/domain/entities/PublicMeditation'

export type { ContentVisibility }

interface VisibilityOption {
  value: ContentVisibility
  label: string
  description: string
  icon: React.ElementType
}

const visibilityOptions: VisibilityOption[] = [
  {
    value: 'private',
    label: '나만 보기',
    description: '나만 볼 수 있습니다',
    icon: Lock,
  },
  {
    value: 'group',
    label: '그룹 공개',
    description: '그룹 멤버만 볼 수 있습니다',
    icon: Users,
  },
  {
    value: 'church',
    label: '교회 공개',
    description: '교회 멤버만 볼 수 있습니다',
    icon: Building2,
  },
  {
    value: 'public',
    label: '전체 공개',
    description: '모든 사람이 볼 수 있습니다',
    icon: Globe,
  },
]

interface VisibilitySelectorProps {
  value: ContentVisibility
  onChange: (value: ContentVisibility) => void
  allowedOptions?: ContentVisibility[]
  className?: string
  disabled?: boolean
  variant?: 'default' | 'compact' | 'inline'
}

/**
 * 공개 범위 선택 컴포넌트
 * @param value - 현재 선택된 공개 범위
 * @param onChange - 공개 범위 변경 시 호출되는 콜백
 * @param allowedOptions - 허용되는 옵션 목록 (기본: 모든 옵션)
 * @param variant - UI 스타일 변형 (default: 라디오 버튼, compact: 드롭다운, inline: 인라인 버튼)
 */
export function VisibilitySelector({
  value,
  onChange,
  allowedOptions = ['private', 'group', 'church', 'public'],
  className,
  disabled = false,
  variant = 'default',
}: VisibilitySelectorProps) {
  const filteredOptions = visibilityOptions.filter((opt) =>
    allowedOptions.includes(opt.value)
  )

  const selectedOption = filteredOptions.find((opt) => opt.value === value)

  // Compact variant: 드롭다운 메뉴
  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            size="sm"
            className={cn('gap-2 text-muted-foreground', className)}
          >
            {selectedOption && (
              <>
                <selectedOption.icon className="w-4 h-4" />
                <span className="text-xs">{selectedOption.label}</span>
              </>
            )}
            <ChevronDown className="w-3 h-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {filteredOptions.map((option) => {
            const Icon = option.icon
            const isSelected = value === option.value
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  'flex items-center gap-2 cursor-pointer',
                  isSelected && 'bg-accent'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4',
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <div className="flex-1">
                  <p
                    className={cn(
                      'text-sm',
                      isSelected && 'font-medium text-primary'
                    )}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Inline variant: 가로 버튼 그룹
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {filteredOptions.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value
          return (
            <Button
              key={option.value}
              type="button"
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={cn(
                'gap-1.5 h-8 px-2.5',
                isSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}
              title={option.description}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-xs">{option.label}</span>
            </Button>
          )
        })}
      </div>
    )
  }

  // Default variant: 라디오 버튼 스타일 그리드
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium">공개 범위</Label>
      <div className="grid grid-cols-2 gap-2">
        {filteredOptions.map((option) => {
          const Icon = option.icon
          const isSelected = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors text-left',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isSelected && 'text-primary'
                  )}
                >
                  {option.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {option.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * 공개 범위 아이콘 표시 컴포넌트 (읽기 전용)
 */
export function VisibilityBadge({
  visibility,
  className,
  showLabel = false,
}: {
  visibility: ContentVisibility
  className?: string
  showLabel?: boolean
}) {
  const option = visibilityOptions.find((opt) => opt.value === visibility)
  if (!option) return null

  const Icon = option.icon

  return (
    <div
      className={cn('flex items-center gap-1 text-muted-foreground', className)}
      title={option.description}
    >
      <Icon className="w-3.5 h-3.5" />
      {showLabel && <span className="text-xs">{option.label}</span>}
    </div>
  )
}
