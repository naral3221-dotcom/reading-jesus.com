'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { BookOpen, Users, MessageCircle, Calendar, CheckCircle } from 'lucide-react';

interface OnboardingSlide {
  icon: React.ElementType;
  title: string;
  description: string;
  image?: string;
}

const slides: OnboardingSlide[] = [
  {
    icon: BookOpen,
    title: '365일 성경 통독',
    description: '하루하루 정해진 분량을 읽으며 1년 동안 성경 전체를 통독하세요. 오늘의 말씀을 확인하고 읽음 체크를 하세요.',
  },
  {
    icon: Users,
    title: '함께하는 통독',
    description: '그룹을 만들거나 초대 코드로 참여하세요. 친구, 가족, 교회 공동체와 함께 성경을 읽어나갈 수 있습니다.',
  },
  {
    icon: MessageCircle,
    title: '묵상 나눔',
    description: '오늘 읽은 말씀에 대한 묵상을 나누고, 다른 사람의 묵상에 댓글과 좋아요로 격려하세요. 익명으로도 작성할 수 있습니다.',
  },
  {
    icon: Calendar,
    title: '진행 상황 추적',
    description: '통독 캘린더로 읽은 날을 한눈에 확인하고, 연속 읽기 일수와 진행률을 확인하세요. 나만의 읽기 프로젝트도 만들 수 있습니다.',
  },
  {
    icon: CheckCircle,
    title: '시작할 준비가 되었습니다!',
    description: '이제 리딩지저스와 함께 성경 통독을 시작해보세요. 그룹을 만들거나 참여하여 여정을 시작하세요.',
  },
];

interface OnboardingTutorialProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingTutorial({ open, onComplete }: OnboardingTutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onComplete()}>
      <DialogContent className="max-w-md p-0 gap-0">
        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="w-10 h-10 text-primary" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-4">{slide.title}</h2>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">{slide.description}</p>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`
                  w-2 h-2 rounded-full transition-all
                  ${index === currentSlide ? 'bg-primary w-6' : 'bg-muted-foreground/30'}
                `}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t flex items-center justify-between">
          <div>
            {currentSlide > 0 && (
              <Button variant="ghost" onClick={handlePrev}>
                이전
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {!isLastSlide && (
              <Button variant="ghost" onClick={handleSkip}>
                건너뛰기
              </Button>
            )}
            <Button onClick={handleNext}>
              {isLastSlide ? '시작하기' : '다음'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
