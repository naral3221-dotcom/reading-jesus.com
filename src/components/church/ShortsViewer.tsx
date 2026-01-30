'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Play, ChevronUp, ChevronDown, X, Maximize2 } from 'lucide-react';

interface ShortItem {
  id: string;
  videoId: string;
  title?: string | null;
  thumbnailUrl?: string | null;
}

interface ShortsViewerProps {
  shorts: ShortItem[];
  churchName?: string;
}

// YouTube Video ID 추출 함수
export function extractYouTubeVideoId(url: string): string | null {
  // Shorts URL: https://youtube.com/shorts/VIDEO_ID
  // 일반 URL: https://www.youtube.com/watch?v=VIDEO_ID
  // 단축 URL: https://youtu.be/VIDEO_ID

  const patterns = [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// 썸네일 URL 생성
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

// YouTube embed URL 생성
function getYouTubeEmbedUrl(videoId: string): string {
  // autoplay=1: 자동재생
  // mute=0: 소리 켜기 (사용자가 클릭해서 열었으므로 가능)
  // controls=1: YouTube 기본 컨트롤 표시
  // loop=1 & playlist=videoId: 반복재생
  // playsinline=1: 모바일에서 인라인 재생
  // rel=0: 관련 영상 숨김
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&loop=1&playlist=${videoId}&playsinline=1&rel=0&modestbranding=1`;
}

export function ShortsViewer({ shorts, churchName }: ShortsViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 이전 영상
  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // 다음 영상
  const goToNext = () => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // 전체화면 토글
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 터치/스와이프 핸들링
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // 위로 스와이프 - 다음 영상
        goToNext();
      } else {
        // 아래로 스와이프 - 이전 영상
        goToPrev();
      }
    }
  };

  if (shorts.length === 0) {
    return null;
  }

  const currentShort = shorts[currentIndex];

  // 전체화면 모드
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* YouTube embed iframe */}
        <div className="absolute inset-0 flex items-center justify-center">
          <iframe
            key={currentShort.videoId} // key 변경으로 iframe 재생성
            src={getYouTubeEmbedUrl(currentShort.videoId)}
            className="w-full h-full max-w-[500px]"
            style={{ aspectRatio: '9/16' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={currentShort.title || 'YouTube Shorts'}
          />
        </div>

        {/* 상단 바 */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-[60]">
          <div className="flex items-center justify-between">
            <div className="text-white font-medium">
              {churchName || '교회'} Shorts
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* 우측 컨트롤 - 이전/다음 */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-[60]">
          <Button
            variant="ghost"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="w-14 h-14 text-white hover:bg-white/20 disabled:opacity-30 bg-black/50 rounded-full"
          >
            <ChevronUp className="w-10 h-10" />
          </Button>
          <Button
            variant="ghost"
            onClick={goToNext}
            disabled={currentIndex === shorts.length - 1}
            className="w-14 h-14 text-white hover:bg-white/20 disabled:opacity-30 bg-black/50 rounded-full"
          >
            <ChevronDown className="w-10 h-10" />
          </Button>
        </div>

      </div>
    );
  }

  // 미니 플레이어 (홈 페이지용)
  return (
    <div className="space-y-3">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between px-1">
        <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
            <Play className="w-3.5 h-3.5 text-white" />
          </div>
          교회 Shorts
          <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-xs font-medium">
            {shorts.length}
          </span>
        </h2>
      </div>

      {/* 가로 스크롤 썸네일 목록 */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {shorts.map((short, index) => (
          <button
            key={short.id}
            onClick={() => {
              setCurrentIndex(index);
              setIsFullscreen(true);
            }}
            className={`flex-shrink-0 relative rounded-xl overflow-hidden transition-all ${
              index === currentIndex ? 'ring-2 ring-primary' : ''
            }`}
          >
            {/* 썸네일 */}
            <div className="w-28 h-48 bg-muted relative">
              <Image
                src={short.thumbnailUrl || getYouTubeThumbnail(short.videoId)}
                alt={short.title || `Shorts ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              {/* 재생 오버레이 */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-5 h-5 text-foreground ml-0.5" />
                </div>
              </div>
              {/* 제목 */}
              {short.title && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-white text-xs line-clamp-2 font-medium">
                    {short.title}
                  </p>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* 전체화면 버튼 */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsFullscreen(true);
          }}
          className="text-xs gap-1.5"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          전체화면으로 보기
        </Button>
      </div>
    </div>
  );
}
