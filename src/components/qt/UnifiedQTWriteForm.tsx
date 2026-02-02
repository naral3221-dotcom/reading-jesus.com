'use client';

/**
 * UnifiedQTWriteForm - 통합 QT 작성 폼
 *
 * 모든 QT 작성 위치에서 사용할 수 있는 통합 컴포넌트:
 * - 교회 공유 페이지 (sharing)
 * - 개인 묵상 에디터 (PersonalMeditationEditor)
 * - 피드 수정 다이얼로그 (EditPostDialog)
 *
 * 특징:
 * - QT 원문 표시 (옵션)
 * - 오디오 플레이어 (옵션)
 * - 다중 질문/답변 지원
 * - 브랜드 컬러 적용
 */

import { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BookOpen, MessageCircle, Heart, Headphones, Lock, Youtube, Plus, X } from 'lucide-react';
import { QTDailyContent } from '@/types';
import { MeditationAudioPlayer } from './MeditationAudioPlayer';
import { cn } from '@/lib/utils';

// 유튜브 URL 유효성 검사
function isValidYoutubeUrl(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
  return youtubeRegex.test(url);
}

// 유튜브 비디오 ID 추출
export function extractYoutubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// 스타일 변형
export type QTFormVariant = 'default' | 'compact' | 'colorful';

// QT 폼 데이터
export interface UnifiedQTFormData {
  oneWord: string;
  meditationAnswers: string[];
  gratitude: string;
  myPrayer: string;
  dayReview: string;
  youtubeLinks: string[];
}

// 초기값 생성 헬퍼
export function createInitialQTFormData(questionsCount: number = 1): UnifiedQTFormData {
  return {
    oneWord: '',
    meditationAnswers: Array(questionsCount).fill(''),
    gratitude: '',
    myPrayer: '',
    dayReview: '',
    youtubeLinks: [],
  };
}

interface UnifiedQTWriteFormProps {
  // QT 데이터 (원문 표시용)
  qtContent?: QTDailyContent | null;
  // 오디오 URL (옵션)
  audioUrl?: string;
  // 폼 데이터
  formData: UnifiedQTFormData;
  onFormDataChange: (data: UnifiedQTFormData) => void;
  // 스타일 옵션
  variant?: QTFormVariant;
  // QT 원문 표시 여부
  showQTContent?: boolean;
  // 원문 섹션 기본 펼침 여부
  defaultExpandedSections?: {
    verses?: boolean;
    guide?: boolean;
    questions?: boolean;
  };
  // 하루 점검 표시 여부
  showDayReview?: boolean;
  // 추가 클래스
  className?: string;
}

// 색상 뱃지 스타일
const badgeStyles = {
  oneWord: 'w-6 h-6 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm',
  question: 'w-6 h-6 bg-primary/80 text-primary-foreground rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm',
  gratitude: 'w-6 h-6 bg-primary/70 text-primary-foreground rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm',
  prayer: 'w-6 h-6 bg-primary/60 text-primary-foreground rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm',
  review: 'w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm',
};

export function UnifiedQTWriteForm({
  qtContent,
  audioUrl,
  formData,
  onFormDataChange,
  variant = 'default',
  showQTContent = true,
  defaultExpandedSections = { verses: true, guide: true, questions: true },
  showDayReview = true,
  className,
}: UnifiedQTWriteFormProps) {
  const isColorful = variant === 'colorful';
  const isCompact = variant === 'compact';

  // 섹션 펼침 상태
  const [expandedSections, setExpandedSections] = useState({
    verses: defaultExpandedSections.verses ?? true,
    guide: defaultExpandedSections.guide ?? true,
    questions: defaultExpandedSections.questions ?? true,
  });

  // 오디오 가용성 체크
  const [audioAvailable, setAudioAvailable] = useState(false);

  useEffect(() => {
    if (audioUrl) {
      fetch(audioUrl, { method: 'HEAD' })
        .then((res) => setAudioAvailable(res.ok))
        .catch(() => setAudioAvailable(false));
    }
  }, [audioUrl]);

  // 섹션 토글
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // 폼 데이터 변경 핸들러들
  const handleOneWordChange = useCallback((value: string) => {
    onFormDataChange({ ...formData, oneWord: value });
  }, [formData, onFormDataChange]);

  const handleAnswerChange = useCallback((index: number, value: string) => {
    const newAnswers = [...formData.meditationAnswers];
    newAnswers[index] = value;
    onFormDataChange({ ...formData, meditationAnswers: newAnswers });
  }, [formData, onFormDataChange]);

  const handleGratitudeChange = useCallback((value: string) => {
    onFormDataChange({ ...formData, gratitude: value });
  }, [formData, onFormDataChange]);

  const handlePrayerChange = useCallback((value: string) => {
    onFormDataChange({ ...formData, myPrayer: value });
  }, [formData, onFormDataChange]);

  const handleDayReviewChange = useCallback((value: string) => {
    onFormDataChange({ ...formData, dayReview: value });
  }, [formData, onFormDataChange]);

  // 유튜브 링크 추가
  const handleAddYoutubeLink = useCallback(() => {
    onFormDataChange({ ...formData, youtubeLinks: [...formData.youtubeLinks, ''] });
  }, [formData, onFormDataChange]);

  // 유튜브 링크 변경
  const handleYoutubeLinkChange = useCallback((index: number, value: string) => {
    const newLinks = [...formData.youtubeLinks];
    newLinks[index] = value;
    onFormDataChange({ ...formData, youtubeLinks: newLinks });
  }, [formData, onFormDataChange]);

  // 유튜브 링크 삭제
  const handleRemoveYoutubeLink = useCallback((index: number) => {
    const newLinks = formData.youtubeLinks.filter((_, i) => i !== index);
    onFormDataChange({ ...formData, youtubeLinks: newLinks });
  }, [formData, onFormDataChange]);

  // 묵상 질문 목록
  const questions = qtContent?.meditation?.meditationQuestions || [];

  return (
    <div className={cn('space-y-5', className)}>
      {/* QT 원문 섹션 */}
      {showQTContent && qtContent && (
        <div className="space-y-4">
          {/* QT 헤더 */}
          <div className="bg-gradient-to-r from-muted to-muted/50 rounded-xl p-4 border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-primary font-medium">
                  {qtContent.date} ({qtContent.dayOfWeek})
                </p>
                <h2 className="text-lg font-bold text-foreground mt-1">
                  {qtContent.title || '오늘의 QT'}
                </h2>
                {qtContent.bibleRange && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    통독: {qtContent.bibleRange}
                  </p>
                )}
              </div>
              {qtContent.meditation?.oneWord && (
                <div className="bg-background rounded-lg px-3 py-2 shadow-sm border">
                  <p className="text-xs text-primary font-medium">ONE WORD</p>
                  <p className="font-bold text-foreground">{qtContent.meditation.oneWord}</p>
                </div>
              )}
            </div>
          </div>

          {/* 성경 본문 */}
          {qtContent.verses.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('verses')}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">오늘의 말씀: {qtContent.verseReference}</span>
                </div>
                {expandedSections.verses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSections.verses && (
                <div className="px-3 pb-3">
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm max-h-[200px] overflow-y-auto">
                    {qtContent.verses.map((v) => (
                      <div key={v.verse} className="flex gap-2">
                        <span className="font-bold text-primary shrink-0 w-5">{v.verse}</span>
                        <p className="text-foreground">{v.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 묵상 길잡이 */}
          {qtContent.meditation?.meditationGuide && (
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('guide')}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">묵상 길잡이</span>
                </div>
                {expandedSections.guide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {expandedSections.guide && (
                <div className="px-3 pb-3 space-y-3">
                  {/* 오디오 플레이어 */}
                  {audioAvailable && audioUrl && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Headphones className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">묵상 길잡이 듣기</span>
                      </div>
                      <MeditationAudioPlayer audioUrl={audioUrl} title={`${qtContent.title} - 묵상 길잡이`} compact />
                    </div>
                  )}

                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {qtContent.meditation.meditationGuide}
                  </p>

                  {qtContent.meditation.jesusConnection && (
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Heart className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary">예수님 연결</span>
                      </div>
                      <p className="text-xs text-foreground">{qtContent.meditation.jesusConnection}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 구분선 */}
      {showQTContent && qtContent && <div className="border-t pt-5" />}

      {/* 내 말로 한 문장 */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          {isColorful && <span className={badgeStyles.oneWord}>1</span>}
          내 말로 한 문장
          {!isColorful && <span className="text-xs text-muted-foreground font-normal">(오늘의 핵심 말씀)</span>}
        </Label>
        <Textarea
          value={formData.oneWord}
          onChange={(e) => handleOneWordChange(e.target.value)}
          placeholder={isColorful ? '오늘 본문을 내 말로 정리해보세요...' : '오늘 말씀에서 가장 와닿는 한 문장을 적어주세요'}
          rows={isCompact ? 2 : 3}
          className="resize-none"
        />
      </div>

      {/* 묵상 질문 답변 */}
      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={index} className="space-y-2">
              {/* 질문 표시 */}
              <div className="bg-primary/10 rounded-lg p-3 border-l-4 border-primary">
                {questions.length > 1 && (
                  <span className="text-xs font-semibold text-primary mb-1 block">
                    질문 {index + 1}
                  </span>
                )}
                <p className="text-sm text-foreground italic">{question}</p>
              </div>
              {/* 답변 입력 */}
              <Textarea
                value={formData.meditationAnswers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="이 질문에 대한 나의 생각을 적어보세요"
                rows={isCompact ? 2 : 3}
                className="resize-none"
              />
            </div>
          ))}
        </div>
      )}

      {/* 질문이 없을 때 기본 묵상 입력 */}
      {questions.length === 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            {isColorful && <span className={badgeStyles.question}>?</span>}
            묵상
            {!isColorful && <span className="text-xs text-muted-foreground font-normal">(말씀을 통한 깨달음)</span>}
          </Label>
          <Textarea
            value={formData.meditationAnswers[0] || ''}
            onChange={(e) => handleAnswerChange(0, e.target.value)}
            placeholder="오늘 말씀을 통해 깨달은 점, 적용할 점을 적어주세요"
            rows={isCompact ? 2 : 3}
            className="resize-none"
          />
        </div>
      )}

      {/* 감사와 적용 */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          {isColorful && <span className={badgeStyles.gratitude}>♥</span>}
          감사와 적용
          {!isColorful && <span className="text-xs text-muted-foreground font-normal">(선택)</span>}
        </Label>
        <Textarea
          value={formData.gratitude}
          onChange={(e) => handleGratitudeChange(e.target.value)}
          placeholder={isColorful ? '감사한 점과 적용할 점을 적어주세요...' : '오늘 말씀을 통해 감사한 것, 삶에 적용할 것'}
          rows={isCompact ? 2 : 3}
          className="resize-none"
        />
      </div>

      {/* 나의 기도 */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          {isColorful && <span className={badgeStyles.prayer}>🙏</span>}
          나의 기도
          {!isColorful && <span className="text-xs text-muted-foreground font-normal">(선택)</span>}
        </Label>
        <Textarea
          value={formData.myPrayer}
          onChange={(e) => handlePrayerChange(e.target.value)}
          placeholder="오늘 말씀을 붙들고 드리는 나의 기도"
          rows={isCompact ? 2 : 3}
          className="resize-none"
        />
      </div>

      {/* 하루 점검 */}
      {showDayReview && (
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl opacity-10" />
          <div className="relative bg-background rounded-xl border-2 border-accent/30 p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0",
                isColorful ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-accent"
              )}>
                <span className="text-white text-lg">!</span>
              </div>
              <div>
                <h4 className="font-semibold text-foreground">
                  말씀과 함께한 하루 점검
                </h4>
                <p className="text-xs text-accent mt-0.5">
                  하루를 돌아보며 말씀이 어떻게 적용되었는지 점검해보세요
                </p>
              </div>
            </div>
            <Textarea
              value={formData.dayReview}
              onChange={(e) => handleDayReviewChange(e.target.value)}
              placeholder="예) 오늘 직장에서 힘든 일이 있었는데, 아침 묵상에서 읽은 '평안' 이라는 말씀을 떠올리며 마음을 다잡을 수 있었습니다..."
              rows={4}
              className="resize-none border-accent/30 focus:border-accent focus:ring-accent"
            />

            {/* 유튜브 링크 입력 섹션 */}
            <div className="mt-4 pt-4 border-t border-accent/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-foreground">첨부 영상 링크</span>
                  <span className="text-xs text-muted-foreground">(선택)</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddYoutubeLink}
                  className="h-7 px-2 text-xs gap-1 text-accent hover:text-accent"
                >
                  <Plus className="w-3.5 h-3.5" />
                  추가
                </Button>
              </div>

              {formData.youtubeLinks.length > 0 && (
                <div className="space-y-2">
                  {formData.youtubeLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={link}
                          onChange={(e) => handleYoutubeLinkChange(index, e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className={cn(
                            "pr-8 text-sm",
                            link && !isValidYoutubeUrl(link) && "border-red-300 focus:border-red-500"
                          )}
                        />
                        {link && isValidYoutubeUrl(link) && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500 text-xs">
                            ✓
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveYoutubeLink(index)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.youtubeLinks.some(link => link && !isValidYoutubeUrl(link)) && (
                    <p className="text-xs text-red-500">올바른 유튜브 URL을 입력해주세요</p>
                  )}
                </div>
              )}

              {formData.youtubeLinks.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  묵상과 관련된 유튜브 영상이 있다면 링크를 추가해보세요
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnifiedQTWriteForm;
