'use client'

/**
 * PublicMeditationEditor - 공개 묵상 작성 폼
 *
 * 자유 형식으로 공개 묵상을 작성하는 컴포넌트
 */

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Send, ChevronDown, BookOpen, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PublicMeditationEditorProps {
  onSubmit: (data: {
    title?: string
    content: string
    bibleReference?: string
    isAnonymous: boolean
  }) => Promise<void>
  isSubmitting?: boolean
  className?: string
}

export function PublicMeditationEditor({
  onSubmit,
  isSubmitting,
  className,
}: PublicMeditationEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [bibleReference, setBibleReference] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    await onSubmit({
      title: title.trim() || undefined,
      content: content.trim(),
      bibleReference: bibleReference.trim() || undefined,
      isAnonymous,
    })

    // 폼 초기화
    setTitle('')
    setContent('')
    setBibleReference('')
    setIsAnonymous(false)
    setIsExpanded(false)
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardContent className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {isExpanded ? '묵상 작성하기' : '새 묵상을 나눠보세요...'}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-muted-foreground transition-transform',
                  isExpanded && 'rotate-180'
                )}
              />
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 성경 구절 참조 (선택) */}
              <div className="space-y-2">
                <Label htmlFor="bible-reference" className="text-xs text-muted-foreground flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  성경 구절 (선택)
                </Label>
                <Input
                  id="bible-reference"
                  value={bibleReference}
                  onChange={(e) => setBibleReference(e.target.value)}
                  placeholder="예: 요한복음 3:16, 시편 23편"
                  className="h-9"
                />
              </div>

              {/* 제목 (선택) */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs text-muted-foreground">
                  제목 (선택)
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="h-9"
                  maxLength={100}
                />
              </div>

              {/* 내용 */}
              <div className="space-y-2">
                <Label htmlFor="content" className="text-xs text-muted-foreground">
                  묵상 내용 *
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="오늘 말씀을 통해 받은 은혜를 나눠주세요..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* 익명 옵션 */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                />
                <Label
                  htmlFor="anonymous"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  익명으로 작성
                </Label>
              </div>

              {/* 제출 버튼 */}
              <Button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                나누기
              </Button>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
