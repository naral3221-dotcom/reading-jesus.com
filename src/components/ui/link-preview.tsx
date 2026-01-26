'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ExternalLink, Play, Youtube, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

// 유튜브 URL에서 비디오 ID 추출
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// URL 유형 감지
export type LinkType = 'youtube' | 'general';

export function detectLinkType(url: string): LinkType {
  if (extractYoutubeId(url)) return 'youtube';
  return 'general';
}

// URL 유효성 검사
export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// 텍스트에서 URL 추출
export function extractUrls(text: string): string[] {
  const urls: string[] = [];

  // URL 패턴: http:// 또는 https://로 시작하고, 공백이나 특정 문자로 끝남
  const urlPattern = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;

  // 일반 텍스트에서 URL 추출
  const matches = text.match(urlPattern);
  if (matches) {
    urls.push(...matches);
  }

  // HTML href 속성에서 URL 추출 (a 태그, 링크 등)
  const hrefPattern = /href=["']?(https?:\/\/[^"'\s>]+)["']?/gi;
  let hrefMatch;
  while ((hrefMatch = hrefPattern.exec(text)) !== null) {
    urls.push(hrefMatch[1]);
  }

  // 중복 제거 및 끝의 구두점 제거
  const cleanedUrls = urls.map(url => {
    // URL 끝의 구두점(.,!?)과 닫는 괄호, 따옴표 제거
    return url.replace(/[.,!?)'"]+$/, '');
  });

  return Array.from(new Set(cleanedUrls));
}

interface LinkPreviewData {
  url: string;
  type: LinkType;
  title?: string;
  description?: string;
  thumbnail?: string;
  videoId?: string;
}

interface LinkPreviewCardProps {
  data: LinkPreviewData;
  onRemove?: () => void;
  className?: string;
  compact?: boolean;
}

// 유튜브 미리보기 카드
export function YoutubeLinkPreview({
  data,
  onRemove,
  className,
  compact = false,
}: LinkPreviewCardProps) {
  const [showEmbed, setShowEmbed] = useState(false);

  if (!data.videoId) return null;

  const thumbnailUrl = `https://img.youtube.com/vi/${data.videoId}/mqdefault.jpg`;

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-2 bg-muted/50 rounded-lg group',
        className
      )}>
        <Youtube className="w-4 h-4 text-red-500 flex-shrink-0" />
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline truncate flex-1"
        >
          {data.title || data.url}
        </a>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden bg-muted/30 group relative',
      className
    )}>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 h-7 w-7 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {showEmbed ? (
        <div className="aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${data.videoId}?autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          onClick={() => setShowEmbed(true)}
          className="relative w-full aspect-video bg-black cursor-pointer group/play"
        >
          <Image
            src={thumbnailUrl}
            alt={data.title || 'YouTube video'}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/play:bg-black/30 transition-colors">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover/play:scale-110 transition-transform">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <span className="text-white text-sm font-medium truncate">
                {data.title || 'YouTube 동영상'}
              </span>
            </div>
          </div>
        </button>
      )}

      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        <span className="truncate">{data.url}</span>
      </a>
    </div>
  );
}

// 일반 링크 미리보기 카드
export function GeneralLinkPreview({
  data,
  onRemove,
  className,
  compact = false,
}: LinkPreviewCardProps) {
  let hostname = '';
  try {
    hostname = new URL(data.url).hostname;
  } catch {
    hostname = data.url;
  }

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-2 bg-muted/50 rounded-lg group',
        className
      )}>
        <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline truncate flex-1"
        >
          {data.title || hostname}
        </a>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group relative',
        className
      )}
    >
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <Link2 className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {data.title || hostname}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {hostname}
        </p>
      </div>

      <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </a>
  );
}

// 통합 링크 미리보기 컴포넌트
interface LinkPreviewProps {
  url: string;
  onRemove?: () => void;
  className?: string;
  compact?: boolean;
}

export function LinkPreview({ url, onRemove, className, compact = false }: LinkPreviewProps) {
  const [data, setData] = useState<LinkPreviewData | null>(null);

  useEffect(() => {
    if (!isValidUrl(url)) return;

    const type = detectLinkType(url);
    const videoId = extractYoutubeId(url);

    setData({
      url,
      type,
      videoId: videoId || undefined,
    });
  }, [url]);

  if (!data) return null;

  if (data.type === 'youtube') {
    return <YoutubeLinkPreview data={data} onRemove={onRemove} className={className} compact={compact} />;
  }

  return <GeneralLinkPreview data={data} onRemove={onRemove} className={className} compact={compact} />;
}

// 여러 링크를 관리하는 컴포넌트
interface LinkPreviewListProps {
  urls: string[];
  onRemove?: (url: string) => void;
  className?: string;
  compact?: boolean;
  maxDisplay?: number;
}

export function LinkPreviewList({
  urls,
  onRemove,
  className,
  compact = false,
  maxDisplay = 3,
}: LinkPreviewListProps) {
  const displayUrls = urls.slice(0, maxDisplay);
  const remainingCount = urls.length - maxDisplay;

  if (urls.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {displayUrls.map((url) => (
        <LinkPreview
          key={url}
          url={url}
          onRemove={onRemove ? () => onRemove(url) : undefined}
          compact={compact}
        />
      ))}
      {remainingCount > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          + {remainingCount}개 링크 더 있음
        </p>
      )}
    </div>
  );
}

// 텍스트에서 링크를 자동 감지하는 훅
export function useDetectLinks(text: string) {
  const [links, setLinks] = useState<string[]>([]);

  useEffect(() => {
    const detected = extractUrls(text);
    setLinks(detected);
  }, [text]);

  return links;
}
