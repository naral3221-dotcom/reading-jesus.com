'use client'

/**
 * FreeMeditationForm - 자유 형식 묵상 폼
 */

import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FreeMeditationFormProps {
  title: string
  content: string
  bibleReference: string
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onBibleReferenceChange: (value: string) => void
}

export function FreeMeditationForm({
  title,
  content,
  bibleReference,
  onTitleChange,
  onContentChange,
  onBibleReferenceChange,
}: FreeMeditationFormProps) {
  return (
    <div className="space-y-4">
      {/* 제목 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="title">제목 (선택)</Label>
        <Input
          id="title"
          placeholder="묵상 제목을 입력하세요"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      {/* 성경 구절 */}
      <div className="space-y-2">
        <Label htmlFor="bibleReference">성경 구절</Label>
        <Input
          id="bibleReference"
          placeholder="예: 창세기 1:1-10"
          value={bibleReference}
          onChange={(e) => onBibleReferenceChange(e.target.value)}
        />
      </div>

      {/* 묵상 내용 */}
      <div className="space-y-2">
        <Label htmlFor="content">묵상 내용 *</Label>
        <Textarea
          id="content"
          placeholder="오늘 말씀을 통해 느낀 점, 깨달은 점을 자유롭게 작성해주세요..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[200px] resize-none"
        />
      </div>
    </div>
  )
}
