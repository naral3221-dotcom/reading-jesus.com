'use client';

import { useState } from 'react';
import { Heart, Loader2, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { ENCOURAGEMENT_TEMPLATES } from '@/types';
import { cn } from '@/lib/utils';
import { useSendEncouragement } from '@/presentation/hooks/queries/useEncouragement';

interface EncouragementButtonProps {
  groupId: string;
  receiverId: string;
  receiverName: string;
  currentUserId: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md';
  className?: string;
}

export function EncouragementButton({
  groupId,
  receiverId,
  receiverName,
  currentUserId,
  variant = 'icon',
  size = 'sm',
  className,
}: EncouragementButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [customMessage, setCustomMessage] = useState('');

  const sendEncouragement = useSendEncouragement();

  // 자기 자신에게는 보낼 수 없음
  if (currentUserId === receiverId) {
    return null;
  }

  const handleSend = async () => {
    const message = selectedTemplate !== null
      ? `${ENCOURAGEMENT_TEMPLATES[selectedTemplate].emoji} ${ENCOURAGEMENT_TEMPLATES[selectedTemplate].text}`
      : customMessage.trim();

    if (!message) {
      toast({
        title: '메시지를 선택하거나 입력해주세요',
        variant: 'error',
      });
      return;
    }

    const result = await sendEncouragement.mutateAsync({
      groupId,
      senderId: currentUserId,
      receiverId,
      message,
    });

    if (result.isDuplicate) {
      toast({
        title: '오늘은 이미 격려를 보냈어요',
        description: '내일 다시 보낼 수 있어요',
      });
    } else if (!result.success) {
      toast({
        title: '격려 메시지 전송 실패',
        variant: 'error',
      });
    } else {
      toast({
        title: '격려 메시지를 보냈어요!',
        description: `${receiverName}님에게 전달됩니다`,
      });
    }

    setIsOpen(false);
    setSelectedTemplate(null);
    setCustomMessage('');
  };

  const sending = sendEncouragement.isPending;

  const sizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-8 w-8',
  };

  return (
    <>
      {/* 트리거 버튼 */}
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            'rounded-full flex items-center justify-center transition-colors',
            'text-muted-foreground hover:text-accent hover:bg-accent/10',
            sizeClasses[size],
            className
          )}
          title={`${receiverName}님에게 격려 보내기`}
        >
          <Heart className="w-4 h-4" />
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={cn('gap-1.5', className)}
        >
          <Heart className="w-4 h-4" />
          격려하기
        </Button>
      )}

      {/* 격려 메시지 선택 모달 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-background rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-xl animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">
                {receiverName}님에게 격려 보내기
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 템플릿 목록 */}
            <div className="p-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                메시지를 선택하세요
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ENCOURAGEMENT_TEMPLATES.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(index);
                      setCustomMessage('');
                    }}
                    className={cn(
                      'p-3 rounded-xl text-left transition-all',
                      'border hover:border-primary/50 hover:bg-primary/5',
                      selectedTemplate === index && 'border-primary bg-primary/10'
                    )}
                  >
                    <span className="text-xl block mb-1">{template.emoji}</span>
                    <span className="text-sm">{template.text}</span>
                  </button>
                ))}
              </div>

              {/* 직접 입력 */}
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  또는 직접 작성하기
                </p>
                <textarea
                  value={customMessage}
                  onChange={(e) => {
                    setCustomMessage(e.target.value);
                    setSelectedTemplate(null);
                  }}
                  placeholder="격려 메시지를 입력하세요..."
                  className={cn(
                    'w-full p-3 rounded-xl border text-sm resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50',
                    customMessage && 'border-primary bg-primary/5'
                  )}
                  rows={2}
                  maxLength={100}
                />
              </div>
            </div>

            {/* 전송 버튼 */}
            <div className="p-4 border-t">
              <Button
                onClick={handleSend}
                disabled={sending || (selectedTemplate === null && !customMessage.trim())}
                className="w-full gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    보내는 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    격려 보내기
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
