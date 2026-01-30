'use client';

import { useState, useEffect } from 'react';
import { QTDailyContent } from '@/types';
import { ChevronDown, ChevronUp, BookOpen, MessageCircle, Heart, PenLine, Headphones } from 'lucide-react';
import { MeditationAudioPlayer } from './MeditationAudioPlayer';

interface QTViewerProps {
  qt: QTDailyContent;
  showWriteButton?: boolean;
  onWrite?: () => void;
  /** 오디오 URL (외부에서 전달) */
  audioUrl?: string;
  /** Supabase Storage 기반 오디오 자동 로드 여부 */
  autoLoadAudio?: boolean;
}

// Supabase Storage URL 생성 헬퍼
function getMeditationAudioUrl(date: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return '';
  return `${supabaseUrl}/storage/v1/object/public/meditations/${date}-meditation.wav`;
}

export default function QTViewer({
  qt,
  showWriteButton = false,
  onWrite,
  audioUrl: externalAudioUrl,
  autoLoadAudio = true,
}: QTViewerProps) {
  const [expandedSections, setExpandedSections] = useState({
    verses: true,
    guide: true,
    question: true,
  });

  // 오디오 URL 결정 (외부 전달 > 자동 생성)
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioAvailable, setAudioAvailable] = useState(false);

  useEffect(() => {
    if (externalAudioUrl) {
      setAudioUrl(externalAudioUrl);
      setAudioAvailable(true);
      return;
    }

    if (autoLoadAudio && qt.date) {
      const url = getMeditationAudioUrl(qt.date);
      if (url) {
        // HEAD 요청으로 파일 존재 여부 확인
        fetch(url, { method: 'HEAD' })
          .then((res) => {
            if (res.ok) {
              setAudioUrl(url);
              setAudioAvailable(true);
            } else {
              setAudioAvailable(false);
            }
          })
          .catch(() => {
            setAudioAvailable(false);
          });
      }
    }
  }, [externalAudioUrl, autoLoadAudio, qt.date]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-muted to-muted/50 rounded-xl p-5 border">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-primary font-medium">
              {qt.date} ({qt.dayOfWeek})
            </p>
            <h1 className="text-xl font-bold text-foreground mt-1">
              {qt.title || '오늘의 QT'}
            </h1>
            {qt.bibleRange && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                통독: {qt.bibleRange}
              </p>
            )}
          </div>
          {qt.meditation?.oneWord && (
            <div className="bg-background rounded-lg px-3 py-2 shadow-sm border">
              <p className="text-xs text-primary font-medium">ONE WORD</p>
              <p className="text-lg font-bold text-primary">{qt.meditation.oneWord}</p>
              {qt.meditation.oneWordSubtitle && (
                <p className="text-xs text-muted-foreground">{qt.meditation.oneWordSubtitle}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 성경 본문 */}
      {qt.verses.length > 0 && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('verses')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-foreground">오늘의 말씀</h2>
                <p className="text-sm text-muted-foreground">{qt.verseReference}</p>
              </div>
            </div>
            {expandedSections.verses ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {expandedSections.verses && (
            <div className="px-4 pb-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                {qt.verses.map((verse) => (
                  <div key={verse.verse} className="flex gap-3">
                    <span className="text-sm font-bold text-primary shrink-0 w-6">
                      {verse.verse}
                    </span>
                    <p className="text-foreground leading-relaxed">{verse.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 묵상 길잡이 */}
      {qt.meditation?.meditationGuide && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('guide')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground">묵상 길잡이</h2>
            </div>
            {expandedSections.guide ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {expandedSections.guide && (
            <div className="px-4 pb-4 space-y-4">
              {/* 오디오 플레이어 */}
              {audioAvailable && audioUrl && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Headphones className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">묵상 길잡이 듣기</span>
                  </div>
                  <MeditationAudioPlayer
                    audioUrl={audioUrl}
                    title={`${qt.title} - 묵상 길잡이`}
                  />
                </div>
              )}

              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {qt.meditation.meditationGuide}
              </p>

              {/* 예수님 연결 */}
              {qt.meditation.jesusConnection && (
                <div className="mt-4 p-4 bg-primary/10 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">예수님 연결</span>
                  </div>
                  <p className="text-sm text-foreground">{qt.meditation.jesusConnection}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 묵상 질문 */}
      {qt.meditation?.meditationQuestions && qt.meditation.meditationQuestions.length > 0 && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <button
            onClick={() => toggleSection('question')}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold">?</span>
              </div>
              <h2 className="font-semibold text-foreground">
                묵상 질문
                {qt.meditation.meditationQuestions.length > 1 && (
                  <span className="ml-1 text-sm font-normal text-primary">
                    ({qt.meditation.meditationQuestions.length}개)
                  </span>
                )}
              </h2>
            </div>
            {expandedSections.question ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {expandedSections.question && (
            <div className="px-4 pb-4 space-y-3">
              {qt.meditation.meditationQuestions.map((question, index) => (
                <div key={index} className="bg-primary/10 rounded-lg p-4 border-l-4 border-primary">
                  {qt.meditation!.meditationQuestions.length > 1 && (
                    <span className="text-xs font-semibold text-primary mb-1 block">
                      질문 {index + 1}
                    </span>
                  )}
                  <p className="text-foreground italic">{question}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 오늘의 기도 */}
      {qt.meditation?.prayer && (
        <div className="bg-gradient-to-r from-muted to-muted/50 rounded-xl p-4 border">
          <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
            🙏 오늘의 기도
          </h3>
          <p className="text-foreground text-sm italic leading-relaxed">
            {qt.meditation.prayer}
          </p>
        </div>
      )}

      {/* 묵상 작성 버튼 */}
      {showWriteButton && onWrite && (
        <button
          onClick={onWrite}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/25"
        >
          <PenLine className="w-5 h-5" />
          QT 작성하기
        </button>
      )}
    </div>
  );
}
