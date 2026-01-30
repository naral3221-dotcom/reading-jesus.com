'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeditationAudioPlayerProps {
  /** 오디오 파일 URL */
  audioUrl: string;
  /** 오디오 제목 (접근성용) */
  title?: string;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 묵상 길잡이 오디오 플레이어
 * - 재생/일시정지, 진행바, 음소거, 배속 조절
 * - 브랜드 컬러 적용 (Warm Sage)
 */
export function MeditationAudioPlayer({
  audioUrl,
  title = '묵상 길잡이',
  compact = false,
  className,
}: MeditationAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // 시간 포맷팅 (MM:SS)
  const formatTime = (time: number): string => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 오디오 이벤트 핸들러
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('오디오를 불러올 수 없습니다');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  // 재생/일시정지
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      console.error('재생 오류:', err);
      setError('재생할 수 없습니다');
    }
  }, [isPlaying]);

  // 음소거 토글
  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // 배속 변경
  const cyclePlaybackRate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const rates = [1, 1.25, 1.5, 1.75, 2, 0.75];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];

    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  }, [playbackRate]);

  // 처음으로
  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  }, []);

  // 프로그레스 바 클릭
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;

    const rect = progress.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // 진행률 계산
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 에러 상태
  if (error) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm',
        className
      )}>
        <VolumeX className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-accent/5 transition-colors',
        compact ? 'px-3 py-2' : 'px-4 py-3',
        className
      )}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* 재생/일시정지 버튼 */}
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={cn(
            'flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50',
            compact ? 'w-8 h-8' : 'w-10 h-10',
            isLoading && 'opacity-50 cursor-wait'
          )}
          aria-label={isPlaying ? '일시정지' : '재생'}
          title={title}
        >
          {isLoading ? (
            <Loader2 className={cn('animate-spin', compact ? 'w-4 h-4' : 'w-5 h-5')} />
          ) : isPlaying ? (
            <Pause className={cn(compact ? 'w-4 h-4' : 'w-5 h-5')} />
          ) : (
            <Play className={cn('ml-0.5', compact ? 'w-4 h-4' : 'w-5 h-5')} />
          )}
        </button>

        {/* 프로그레스 영역 */}
        <div className="flex-1 min-w-0">
          {/* 프로그레스 바 */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="relative h-2 bg-muted rounded-full cursor-pointer group"
            role="slider"
            aria-label="재생 위치"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={duration}
          >
            {/* 진행 상태 */}
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
            {/* 핸들 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>

          {/* 시간 표시 */}
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* 컨트롤 버튼들 */}
        <div className="flex items-center gap-1">
          {/* 처음으로 */}
          <button
            onClick={restart}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="처음으로"
            title="처음으로"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* 배속 */}
          <button
            onClick={cyclePlaybackRate}
            className="px-1.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-w-[40px]"
            aria-label={`재생 속도 ${playbackRate}배`}
            title="재생 속도"
          >
            {playbackRate}x
          </button>

          {/* 음소거 */}
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={isMuted ? '음소거 해제' : '음소거'}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MeditationAudioPlayer;
