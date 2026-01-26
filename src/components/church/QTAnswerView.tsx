'use client';

/**
 * QT 답변 통합 뷰어 컴포넌트
 * QTCardSlider와 sharing 페이지에서 공통으로 사용
 */

import { formatRelativeTime, getInitials, getAvatarColor } from '@/lib/date-utils';
import type { QTDailyContent } from '@/types';

export interface QTAnswerData {
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
  // 사용자 QT 답변 필드
  selectedWord?: string | null;
  oneSentence?: string | null; // mySentence
  questionAnswer?: string | null; // meditationAnswer (JSON 문자열 또는 단일 문자열)
  meditationQuestion?: string | null; // 원본 묵상 질문 (단일)
  gratitude?: string | null;
  prayer?: string | null; // myPrayer
  dayReview?: string | null;
}

interface QTAnswerViewProps {
  data: QTAnswerData;
  qtContent?: QTDailyContent | null; // QT 원문 (묵상 질문 등 참조용)
  showAuthor?: boolean; // 작성자 정보 표시 여부
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

export function QTAnswerView({
  data,
  qtContent,
  showAuthor = true,
  className = ''
}: QTAnswerViewProps) {
  const hasContent = data.selectedWord || data.oneSentence || data.questionAnswer ||
                     data.gratitude || data.prayer || data.dayReview;

  if (!hasContent) return null;

  const displayName = data.isAnonymous ? '익명' : data.authorName;
  const avatarColor = data.isAnonymous ? 'bg-muted' : getAvatarColor(data.authorName);
  const initials = data.isAnonymous ? '?' : getInitials(data.authorName);

  // 묵상 질문들 가져오기 (QT 원문에서)
  const meditationQuestions = qtContent?.meditation?.meditationQuestions || [];

  // 답변들 파싱 (JSON 배열 또는 단일 문자열)
  const answers = parseAnswers(data.questionAnswer);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 작성자 정보 */}
      {showAuthor && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/60">
          <div className={`w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center shrink-0 shadow-sm`}>
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(data.createdAt)}
            </p>
          </div>
        </div>
      )}

      {/* 한 단어 동그라미 */}
      {data.selectedWord && (
        <div className="rounded-lg border border-border bg-accent/10 p-3">
          <p className="text-xs font-medium text-accent-foreground flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-[10px] font-bold">○</span>
            한 단어 동그라미
          </p>
          <p className="text-sm text-foreground font-medium">{data.selectedWord}</p>
        </div>
      )}

      {/* 내 말로 한 문장 */}
      {data.oneSentence && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 bg-primary text-primary-foreground rounded flex items-center justify-center text-[10px] font-bold">1</span>
            내 말로 한 문장
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{data.oneSentence}</p>
        </div>
      )}

      {/* 묵상 질문 답변 - 다중 질문/답변 지원 */}
      {answers.length > 0 && (
        <div className="space-y-3">
          {answers.map((answer, index) => {
            // 해당 인덱스의 질문 가져오기 (없으면 data.meditationQuestion 사용)
            const question = meditationQuestions[index] || (index === 0 ? data.meditationQuestion : null);

            return (
              <div key={index} className="rounded-lg border border-border bg-accent/10 p-3">
                {/* 질문 표시 */}
                {question && (
                  <div className="mb-2 pb-2 border-b border-border">
                    {meditationQuestions.length > 1 && (
                      <span className="text-xs font-semibold text-accent-foreground mb-1 block">
                        질문 {index + 1}
                      </span>
                    )}
                    <p className="text-sm text-muted-foreground italic">{question}</p>
                  </div>
                )}
                {/* 답변 표시 */}
                <p className="text-xs font-medium text-accent-foreground flex items-center gap-1.5 mb-1.5">
                  <span className="w-5 h-5 bg-accent text-accent-foreground rounded flex items-center justify-center text-[10px] font-bold">A</span>
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
      {data.prayer && (
        <div className="rounded-lg border border-border bg-accent/10 p-3">
          <p className="text-xs font-medium text-accent-foreground flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 bg-accent text-accent-foreground rounded flex items-center justify-center text-[10px]">🙏</span>
            나의 기도
          </p>
          <p className="text-sm whitespace-pre-wrap italic text-foreground">{data.prayer}</p>
        </div>
      )}

      {/* 하루 점검 */}
      {data.dayReview && (
        <div className="rounded-lg border border-border bg-gradient-to-br from-accent/5 to-muted/50 p-3">
          <p className="text-xs font-medium text-accent-foreground flex items-center gap-1.5 mb-1.5">
            <span className="w-5 h-5 bg-gradient-to-br from-accent to-primary text-accent-foreground rounded flex items-center justify-center text-[10px]">✦</span>
            하루 점검
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{data.dayReview}</p>
        </div>
      )}
    </div>
  );
}
