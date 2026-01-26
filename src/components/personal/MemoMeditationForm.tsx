'use client'

/**
 * MemoMeditationForm - 간단 메모 형식 폼
 */

import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MemoMeditationFormProps {
  content: string
  bibleReference: string
  onContentChange: (value: string) => void
  onBibleReferenceChange: (value: string) => void
}

export function MemoMeditationForm({
  content,
  bibleReference,
  onContentChange,
  onBibleReferenceChange,
}: MemoMeditationFormProps) {
  return (
    <div className="space-y-4">
      {/* 성경 구절 */}
      <div className="space-y-2">
        <Label htmlFor="bibleReference">성경 구절 (선택)</Label>
        <Input
          id="bibleReference"
          placeholder="예: 창세기 1:1"
          value={bibleReference}
          onChange={(e) => onBibleReferenceChange(e.target.value)}
        />
      </div>

      {/* 메모 내용 */}
      <div className="space-y-2">
        <Label htmlFor="content">메모 *</Label>
        <Textarea
          id="content"
          placeholder="간단한 메모를 남겨주세요..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        <p className="text-xs text-muted-foreground">
          짧은 생각, 기도제목, 암송할 구절 등을 메모하세요
        </p>
      </div>
    </div>
  )
}
