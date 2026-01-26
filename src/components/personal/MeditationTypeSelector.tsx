'use client'

/**
 * MeditationTypeSelector - 묵상 형식 선택 탭
 */

import { cn } from '@/lib/utils'
import type { MeditationType } from '@/domain/entities/PublicMeditation'

interface MeditationTypeSelectorProps {
  value: MeditationType
  onChange: (type: MeditationType) => void
}

const MEDITATION_TYPES = [
  {
    value: 'free' as MeditationType,
    label: '자유',
    description: '자유롭게 묵상 작성',
  },
  {
    value: 'qt' as MeditationType,
    label: 'QT',
    description: '구조화된 QT 형식',
  },
  {
    value: 'memo' as MeditationType,
    label: '메모',
    description: '간단한 메모',
  },
]

export function MeditationTypeSelector({
  value,
  onChange,
}: MeditationTypeSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {MEDITATION_TYPES.map((type) => (
        <button
          key={type.value}
          onClick={() => onChange(type.value)}
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all',
            value === type.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}
