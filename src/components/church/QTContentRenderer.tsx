'use client';

import { cn } from '@/lib/utils';
import type { QTDailyContent } from '@/types';

// QT 콘텐츠 데이터 타입
export interface QTContentData {
  mySentence?: string | null;
  meditationAnswer?: string | null;
  meditationQuestion?: string | null;
  gratitude?: string | null;
  myPrayer?: string | null;
  dayReview?: string | null;
}

interface QTContentRendererProps {
  data: QTContentData;
  qtContent?: QTDailyContent | null; // QT 원문 (다중 묵상 질문 참조용)
  className?: string;
}

// 답변 문자열을 배열로 파싱 (JSON 또는 단일 문자열)
function parseAnswers(answer: string | null | undefined): string[] {
  if (!answer) return [];
  try {
    const parsed = JSON.parse(answer);
    if (Array.isArray(parsed)) return parsed;
    return [answer];
  } catch {
    return [answer];
  }
}

/**
 * QT 콘텐츠를 컬러 박스 스타일로 렌더링하는 공통 컴포넌트
 * - 내 말로 한 문장: 앰버(노란색)
 * - 묵상 질문 답변: 퍼플(보라색) - 다중 질문/답변 지원
 * - 감사와 적용: 그린(녹색)
 * - 나의 기도: 블루(파란색)
 * - 하루 점검: 인디고 그라데이션
 */
export function QTContentRenderer({ data, qtContent, className }: QTContentRendererProps) {
  const hasContent = data.mySentence || data.meditationAnswer || data.gratitude || data.myPrayer || data.dayReview;

  if (!hasContent) {
    return null;
  }

  // 묵상 질문들 가져오기 (QT 원문에서)
  const meditationQuestions = qtContent?.meditation?.meditationQuestions || [];
  // 답변들 파싱 (JSON 배열 또는 단일 문자열)
  const answers = parseAnswers(data.meditationAnswer);

  return (
    <div className={cn('space-y-3', className)}>
      {/* 내 말로 한 문장 */}
      {data.mySentence && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 bg-primary text-primary-foreground rounded flex items-center justify-center text-[10px] font-bold">1</span>
            내 말로 한 문장
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{data.mySentence}</p>
        </div>
      )}

      {/* 묵상 질문 답변 - 퍼플 (다중 질문/답변 지원) */}
      {answers.length > 0 && (
        <div className="space-y-3">
          {answers.map((answer, index) => {
            // 해당 인덱스의 질문 가져오기 (없으면 data.meditationQuestion 사용)
            const question = meditationQuestions[index] || (index === 0 ? data.meditationQuestion : null);

            return (
              <div key={index} className="rounded-lg border border-border bg-primary/10 p-3">
                {/* 질문 표시 */}
                {question && (
                  <div className="mb-2 pb-2 border-b border-border">
                    {meditationQuestions.length > 1 && (
                      <span className="text-xs font-semibold text-primary mb-1 block">
                        질문 {index + 1}
                      </span>
                    )}
                    <p className="text-sm text-muted-foreground italic">{question}</p>
                  </div>
                )}
                {/* 답변 표시 */}
                <p className="text-xs font-medium text-primary flex items-center gap-1.5 mb-1.5">
                  <span className="w-5 h-5 bg-primary text-primary-foreground rounded flex items-center justify-center text-[10px] font-bold">A</span>
                  {meditationQuestions.length > 1 ? `답변 ${index + 1}` : '나의 답변'}
                </p>
                <p className="text-sm whitespace-pre-wrap text-foreground">{answer}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 감사와 적용 */}
      {data.gratitude && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 bg-primary text-primary-foreground rounded flex items-center justify-center text-[10px] font-bold">♥</span>
            감사와 적용
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{data.gratitude}</p>
        </div>
      )}

      {/* 나의 기도 */}
      {data.myPrayer && (
        <div className="rounded-lg border border-border bg-primary/10 p-3">
          <p className="text-xs font-medium text-primary flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 bg-primary text-primary-foreground rounded flex items-center justify-center text-[10px]">🙏</span>
            나의 기도
          </p>
          <p className="text-sm whitespace-pre-wrap italic text-foreground">{data.myPrayer}</p>
        </div>
      )}

      {/* 하루 점검 */}
      {data.dayReview && (
        <div className="rounded-lg border border-border bg-gradient-to-br from-primary/5 to-muted/50 p-3">
          <p className="text-xs font-medium text-primary flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 bg-gradient-to-br from-primary to-primary-dark text-primary-foreground rounded flex items-center justify-center text-[10px]">✦</span>
            하루 점검
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{data.dayReview}</p>
        </div>
      )}
    </div>
  );
}

/**
 * QT 콘텐츠가 있는지 확인하는 유틸 함수
 */
export function hasQTContent(data: QTContentData): boolean {
  return !!(data.mySentence || data.meditationAnswer || data.gratitude || data.myPrayer || data.dayReview);
}
