'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';

interface HelpContent {
  title: string;
  sections: {
    heading: string;
    content: string | string[];
  }[];
}

interface HelpButtonProps {
  helpContent: HelpContent;
  className?: string;
}

export function HelpButton({ helpContent, className }: HelpButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className={className}
        title="도움말"
      >
        <Info className="w-5 h-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{helpContent.title}</DialogTitle>
            <DialogDescription>
              이 페이지의 사용법을 안내합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {helpContent.sections.map((section, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-medium text-sm">{section.heading}</h4>
                {Array.isArray(section.content) ? (
                  <ul className="space-y-1.5 pl-4">
                    {section.content.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="flex-1">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{section.content}</p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
