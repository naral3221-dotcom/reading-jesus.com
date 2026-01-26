'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SignUpPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  feature?: string;
}

export function SignUpPrompt({
  open,
  onOpenChange,
  title = '로그인이 필요합니다',
  description = '이 기능을 사용하려면 로그인이 필요합니다.',
  feature,
}: SignUpPromptProps) {
  const router = useRouter();

  const handleLogin = () => {
    onOpenChange(false);
    router.push('/login');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
            {feature && (
              <span className="block mt-2 font-medium text-foreground">
                {feature}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handleLogin} className="w-full">
            로그인하기
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            둘러보기 계속하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
