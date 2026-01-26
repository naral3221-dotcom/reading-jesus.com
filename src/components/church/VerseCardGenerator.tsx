'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/toast';
import {
  Download,
  Share2,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  Type,
  Palette,
  Check,
  Sparkles,
  ZoomIn,
} from 'lucide-react';
import {
  searchPhotos,
  toUnsplashFormat,
  VERSE_CARD_CATEGORIES,
  FALLBACK_GRADIENTS,
  createGradientStyle,
} from '@/lib/pixabay';

interface VerseCardGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  verse: string; // 성경 구절 내용
  reference: string; // 예: "시편 23:1"
  churchName?: string; // 교회 이름 (선택)
  /** 카드 이미지 생성 후 호출되는 콜백 (base64 이미지 URL 전달) */
  onCardCreated?: (imageDataUrl: string, reference: string) => void;
}

type FontStyle = 'serif' | 'sans' | 'handwriting';
type TextPosition = 'center' | 'top' | 'bottom';

const FONT_STYLES: { value: FontStyle; label: string; className: string }[] = [
  { value: 'serif', label: '명조', className: 'font-serif' },
  { value: 'sans', label: '고딕', className: 'font-sans' },
  { value: 'handwriting', label: '손글씨', className: 'font-serif italic' },
];

const TEXT_POSITIONS: { value: TextPosition; label: string }[] = [
  { value: 'top', label: '상단' },
  { value: 'center', label: '중앙' },
  { value: 'bottom', label: '하단' },
];

// 텍스트 크기 프리셋 (캔버스 기준 px)
const TEXT_SIZE_PRESETS = {
  small: { verse: 40, reference: 24, label: '작게' },
  medium: { verse: 52, reference: 28, label: '보통' },
  large: { verse: 64, reference: 32, label: '크게' },
  xlarge: { verse: 80, reference: 40, label: '아주 크게' },
};

// 카드 비율 프리셋 (SNS 최적화)
type AspectRatioKey = 'story' | 'square' | 'feed' | 'wide';
const ASPECT_RATIOS: {
  value: AspectRatioKey;
  label: string;
  ratio: number; // width / height
  width: number;
  height: number;
  desc: string;
}[] = [
  { value: 'story', label: '스토리', ratio: 9/16, width: 1080, height: 1920, desc: '인스타/카톡 스토리' },
  { value: 'square', label: '정사각', ratio: 1, width: 1080, height: 1080, desc: '인스타 피드' },
  { value: 'feed', label: '세로형', ratio: 4/5, width: 1080, height: 1350, desc: '인스타 세로 피드' },
  { value: 'wide', label: '가로형', ratio: 16/9, width: 1920, height: 1080, desc: '유튜브/PC 배경' },
];

export function VerseCardGenerator({
  open,
  onOpenChange,
  verse,
  reference,
  churchName,
  onCardCreated,
}: VerseCardGeneratorProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // 상태
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(VERSE_CARD_CATEGORIES[0]);
  const [photos, setPhotos] = useState<ReturnType<typeof toUnsplashFormat>[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<ReturnType<typeof toUnsplashFormat> | null>(null);
  const [selectedGradient, setSelectedGradient] = useState<typeof FALLBACK_GRADIENTS[0] | null>(null);
  const [fontStyle, setFontStyle] = useState<FontStyle>('serif');
  const [textPosition, setTextPosition] = useState<TextPosition>('center');
  const [showGradients, setShowGradients] = useState(false);
  const [textColor, setTextColor] = useState<'white' | 'black'>('white');
  const [fontSize, setFontSize] = useState(52); // 캔버스 기준 기본 폰트 크기
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>('story'); // 기본: 스토리 비율

  // 이미지 검색 (Pixabay API)
  const searchImages = useCallback(async (query: string) => {
    setLoading(true);
    const result = await searchPhotos(query, 1, 12);
    if (result && result.hits.length > 0) {
      // Pixabay 결과를 Unsplash 형식으로 변환
      const convertedPhotos = result.hits.map(toUnsplashFormat);
      setPhotos(convertedPhotos);
      if (!selectedPhoto) {
        setSelectedPhoto(convertedPhotos[0]);
        setSelectedGradient(null);
      }
    } else {
      // API 키 없거나 결과 없으면 그라데이션 사용
      setShowGradients(true);
      if (!selectedGradient) {
        setSelectedGradient(FALLBACK_GRADIENTS[0]);
        setSelectedPhoto(null);
      }
    }
    setLoading(false);
  }, [selectedPhoto, selectedGradient]);

  // 카테고리 변경 시 이미지 검색
  useEffect(() => {
    if (open) {
      searchImages(selectedCategory.query);
    }
  }, [open, selectedCategory, searchImages]);

  // 선택된 사진 변경 시 이미지 미리 로드
  useEffect(() => {
    if (selectedPhoto) {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setLoadedImage(img);
      };
      img.onerror = () => {
        setLoadedImage(null);
      };
      img.src = selectedPhoto.urls.regular;
    } else {
      setLoadedImage(null);
    }
  }, [selectedPhoto]);

  // 단어 단위 텍스트 줄바꿈 (한글/영어 모두 지원)
  const wrapTextByWord = useCallback((ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    // 한글은 글자 단위로도 끊을 수 있지만, 자연스러운 읽기를 위해
    // 공백/구두점 기준으로 먼저 끊고, 너무 길면 글자 단위로 끊음
    const segments = text.split(/(\s+|[,.])/);
    const lines: string[] = [];
    let currentLine = '';

    // 글자 단위 줄바꿈 (긴 단어용)
    const wrapTextByChar = (charText: string, charMaxWidth: number): string[] => {
      const chars = charText.split('');
      const charLines: string[] = [];
      let charCurrentLine = '';

      for (const char of chars) {
        const testLine = charCurrentLine + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > charMaxWidth && charCurrentLine) {
          charLines.push(charCurrentLine);
          charCurrentLine = char;
        } else {
          charCurrentLine = testLine;
        }
      }

      if (charCurrentLine) {
        charLines.push(charCurrentLine);
      }

      return charLines;
    };

    for (const segment of segments) {
      if (!segment) continue;

      const testLine = currentLine + segment;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        // 현재 줄이 너무 길면 줄바꿈
        lines.push(currentLine.trim());

        // 새 세그먼트가 단독으로도 너무 길면 글자 단위로 분할
        if (ctx.measureText(segment).width > maxWidth) {
          const charLines = wrapTextByChar(segment, maxWidth);
          charLines.forEach((charLine, idx) => {
            if (idx === charLines.length - 1) {
              currentLine = charLine;
            } else {
              lines.push(charLine);
            }
          });
        } else {
          currentLine = segment;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }

    return lines;
  }, []);

  // 텍스트 그리기
  const drawText = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const padding = width * 0.07; // 7% 패딩
    const maxWidth = width - padding * 2;

    // 폰트 설정
    let fontFamily = 'Georgia, "Noto Serif KR", serif';
    if (fontStyle === 'sans') fontFamily = 'Arial, "Noto Sans KR", sans-serif';
    if (fontStyle === 'handwriting') fontFamily = 'Georgia, "Noto Serif KR", serif';

    ctx.textAlign = 'center';
    ctx.fillStyle = textColor === 'white' ? '#ffffff' : '#1a1a1a';

    // 크기 비율 계산 (기준: 1080px 너비)
    const scale = width / 1080;
    const scaledFontSize = fontSize * scale;
    const scaledRefSize = (fontSize * 0.54) * scale; // 참조 텍스트는 54% 크기
    const lineHeight = scaledFontSize * 1.5;

    // 텍스트 위치 계산
    let startY = height / 2;
    if (textPosition === 'top') startY = height * 0.25;
    if (textPosition === 'bottom') startY = height * 0.7;

    // 말씀 구절 그리기 (단어 단위 자동 줄바꿈)
    ctx.font = `${fontStyle === 'handwriting' ? 'italic ' : ''}${scaledFontSize}px ${fontFamily}`;
    const lines = wrapTextByWord(ctx, verse, maxWidth);
    const totalTextHeight = lines.length * lineHeight;
    let y = startY - totalTextHeight / 2 + scaledFontSize / 2;

    // 그림자 효과
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10 * scale;
    ctx.shadowOffsetX = 2 * scale;
    ctx.shadowOffsetY = 2 * scale;

    lines.forEach((line) => {
      ctx.fillText(line, width / 2, y);
      y += lineHeight;
    });

    // 성경 구절 출처
    ctx.font = `${scaledRefSize}px ${fontFamily}`;
    ctx.fillText(`- ${reference} -`, width / 2, y + 30 * scale);

    // 교회 이름 (하단)
    if (churchName) {
      ctx.font = `${18 * scale}px Arial, "Noto Sans KR", sans-serif`;
      ctx.fillStyle = textColor === 'white' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
      ctx.fillText(churchName, width / 2, height - 60 * scale);
    }

    // 그림자 초기화
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }, [fontStyle, textColor, fontSize, textPosition, verse, reference, churchName, wrapTextByWord]);

  // 캔버스에 카드 렌더링 (미리보기와 다운로드 모두 사용)
  const renderToCanvas = useCallback((
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    image: HTMLImageElement | null
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // 배경 그리기
    if (image) {
      // 이미지를 캔버스 크기에 맞게 커버
      const scale = Math.max(width / image.width, height / image.height);
      const x = (width - image.width * scale) / 2;
      const y = (height - image.height * scale) / 2;
      ctx.drawImage(image, x, y, image.width * scale, image.height * scale);

      // 어두운 오버레이 추가 (텍스트 가독성)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, width, height);
    } else if (selectedGradient) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, selectedGradient.colors[0]);
      gradient.addColorStop(1, selectedGradient.colors[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    // 텍스트 그리기
    drawText(ctx, width, height);
  }, [selectedGradient, drawText]);

  // 현재 선택된 비율 정보
  const currentAspectRatio = ASPECT_RATIOS.find(r => r.value === aspectRatio) || ASPECT_RATIOS[0];

  // 미리보기 캔버스 업데이트
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    // 미리보기는 비율에 맞게 크기 조정 (최대 높이 400px 기준)
    const maxPreviewHeight = 400;
    const previewHeight = Math.min(maxPreviewHeight, currentAspectRatio.ratio <= 1 ? maxPreviewHeight : maxPreviewHeight * currentAspectRatio.ratio);
    const previewWidth = previewHeight * currentAspectRatio.ratio;

    if (selectedPhoto && loadedImage) {
      renderToCanvas(canvas, previewWidth, previewHeight, loadedImage);
    } else if (selectedGradient) {
      renderToCanvas(canvas, previewWidth, previewHeight, null);
    }
  }, [loadedImage, selectedGradient, renderToCanvas, selectedPhoto, currentAspectRatio]);

  // 새로운 이미지 로드
  const handleRefresh = () => {
    searchImages(selectedCategory.query);
  };

  // 고해상도 이미지 생성 (다운로드용)
  const generateCardImage = async (): Promise<string | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // 다운로드용 고해상도 (선택된 비율 적용)
    const width = currentAspectRatio.width;
    const height = currentAspectRatio.height;

    return new Promise((resolve) => {
      if (selectedPhoto) {
        // 이미지가 이미 로드되어 있으면 사용, 아니면 새로 로드
        if (loadedImage) {
          renderToCanvas(canvas, width, height, loadedImage);
          resolve(canvas.toDataURL('image/png'));
        } else {
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            renderToCanvas(canvas, width, height, img);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = () => {
            // 이미지 로드 실패 시 그라데이션 사용
            renderToCanvas(canvas, width, height, null);
            resolve(canvas.toDataURL('image/png'));
          };
          img.src = selectedPhoto.urls.regular;
        }
      } else if (selectedGradient) {
        renderToCanvas(canvas, width, height, null);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(null);
      }
    });
  };

  // 이미지 다운로드
  const handleDownload = async () => {
    setGenerating(true);
    try {
      const dataUrl = await generateCardImage();
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `말씀카드_${reference.replace(/\s/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
        toast({
          variant: 'success',
          title: '말씀 카드가 저장되었습니다',
        });
      }
    } catch (error) {
      console.error('카드 생성 실패:', error);
      toast({
        variant: 'error',
        title: '카드 생성에 실패했습니다',
      });
    } finally {
      setGenerating(false);
    }
  };

  // 게시글에 삽입 (onCardCreated 콜백 호출)
  const handleInsertToPost = async () => {
    if (!onCardCreated) return;

    setGenerating(true);
    try {
      const dataUrl = await generateCardImage();
      if (dataUrl) {
        onCardCreated(dataUrl, reference);
        toast({
          variant: 'success',
          title: '말씀 카드가 게시글에 추가되었습니다',
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error('카드 생성 실패:', error);
      toast({
        variant: 'error',
        title: '카드 생성에 실패했습니다',
      });
    } finally {
      setGenerating(false);
    }
  };

  // 공유
  const handleShare = async () => {
    setGenerating(true);
    try {
      const dataUrl = await generateCardImage();
      if (dataUrl && navigator.share) {
        // Data URL을 Blob으로 변환
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `말씀카드_${reference}.png`, { type: 'image/png' });

        await navigator.share({
          title: `${reference} - 말씀 카드`,
          text: verse,
          files: [file],
        });
      } else if (dataUrl) {
        // 공유 미지원 시 다운로드
        handleDownload();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('공유 실패:', error);
        toast({
          variant: 'error',
          title: '공유에 실패했습니다',
        });
      }
    } finally {
      setGenerating(false);
    }
  };

  // 텍스트 크기 프리셋 적용
  const applyTextSizePreset = (preset: keyof typeof TEXT_SIZE_PRESETS) => {
    setFontSize(TEXT_SIZE_PRESETS[preset].verse);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            말씀 카드 만들기
          </DialogTitle>
          <DialogDescription className="sr-only">
            성경 구절을 아름다운 이미지 카드로 만들어 공유하세요
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 p-4">
          {/* 미리보기 - 캔버스 기반 */}
          <div className="order-1 md:order-2">
            <h3 className="text-sm font-medium mb-2">미리보기</h3>
            <div
              className="relative rounded-xl overflow-hidden shadow-lg bg-muted flex items-center justify-center mx-auto"
              style={{
                aspectRatio: `${currentAspectRatio.width} / ${currentAspectRatio.height}`,
                maxHeight: '400px',
                maxWidth: '100%',
                width: currentAspectRatio.ratio >= 1 ? '100%' : 'auto',
              }}
            >
              <canvas
                ref={previewCanvasRef}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'auto' }}
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-2 mt-4">
              {/* 게시글에 삽입 버튼 (onCardCreated가 있을 때만 표시) */}
              {onCardCreated && (
                <Button
                  className="w-full"
                  onClick={handleInsertToPost}
                  disabled={generating || (!selectedPhoto && !selectedGradient)}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  게시글에 삽입
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant={onCardCreated ? 'outline' : 'default'}
                  onClick={handleDownload}
                  disabled={generating || (!selectedPhoto && !selectedGradient)}
                >
                  {generating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  저장하기
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  disabled={generating || (!selectedPhoto && !selectedGradient)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 설정 */}
          <div className="order-2 md:order-1 space-y-4">
            {/* 카드 비율 선택 */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                카드 비율
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      aspectRatio === ratio.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <div className="text-xs font-medium">{ratio.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5">{ratio.desc.split(' ')[0]}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {currentAspectRatio.desc} ({currentAspectRatio.width}x{currentAspectRatio.height})
              </p>
            </div>

            {/* 텍스트 크기 조절 */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                <ZoomIn className="w-4 h-4" />
                텍스트 크기
              </h3>
              {/* 프리셋 버튼 */}
              <div className="flex gap-2 mb-3">
                {Object.entries(TEXT_SIZE_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyTextSizePreset(key as keyof typeof TEXT_SIZE_PRESETS)}
                    className={`flex-1 py-1.5 rounded-lg text-xs transition-colors ${
                      fontSize === preset.verse
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {/* 슬라이더로 세밀 조절 */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-8">A</span>
                <Slider
                  value={[fontSize]}
                  onValueChange={([value]) => setFontSize(value)}
                  min={28}
                  max={96}
                  step={2}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-8">A</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                현재 크기: {fontSize}px
              </p>
            </div>

            {/* 배경 카테고리 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  배경
                </h3>
                <div className="flex gap-1">
                  <Button
                    variant={showGradients ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => {
                      setShowGradients(false);
                      // 사진 모드로 전환 시, 기존 선택된 사진이 있으면 복원
                      if (photos.length > 0) {
                        if (!selectedPhoto) {
                          setSelectedPhoto(photos[0]);
                        }
                        setSelectedGradient(null);
                      }
                    }}
                  >
                    사진
                  </Button>
                  <Button
                    variant={showGradients ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setShowGradients(true);
                      // 그라데이션 모드로 전환 시, 기본 그라데이션 선택
                      if (!selectedGradient) {
                        setSelectedGradient(FALLBACK_GRADIENTS[0]);
                      }
                      setSelectedPhoto(null);
                    }}
                  >
                    그라데이션
                  </Button>
                </div>
              </div>

              {!showGradients ? (
                <>
                  {/* 카테고리 선택 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {VERSE_CARD_CATEGORIES.map((cat) => (
                      <button
                        key={cat.query}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          selectedCategory.query === cat.query
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                    <button
                      onClick={handleRefresh}
                      className="px-3 py-1.5 rounded-full text-sm bg-muted hover:bg-muted/80"
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* 이미지 그리드 */}
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : photos.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {photos.map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => {
                            setSelectedPhoto(photo);
                            setSelectedGradient(null);
                          }}
                          className={`relative aspect-[3/4] rounded-lg overflow-hidden ring-2 transition-all ${
                            selectedPhoto?.id === photo.id
                              ? 'ring-primary ring-offset-2'
                              : 'ring-transparent hover:ring-muted-foreground/30'
                          }`}
                        >
                          <Image
                            src={photo.urls.small}
                            alt={photo.alt_description || '배경 이미지'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          {selectedPhoto?.id === photo.id && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <Check className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      이미지를 불러오지 못했습니다. 그라데이션을 사용해보세요.
                    </p>
                  )}
                </>
              ) : (
                /* 그라데이션 선택 */
                <div className="grid grid-cols-5 gap-2">
                  {FALLBACK_GRADIENTS.map((grad) => (
                    <button
                      key={grad.id}
                      onClick={() => {
                        setSelectedGradient(grad);
                        setSelectedPhoto(null);
                      }}
                      className={`aspect-square rounded-lg ring-2 transition-all ${
                        selectedGradient?.id === grad.id
                          ? 'ring-primary ring-offset-2'
                          : 'ring-transparent hover:ring-muted-foreground/30'
                      }`}
                      style={{ background: createGradientStyle(grad.colors) }}
                      title={grad.name}
                    >
                      {selectedGradient?.id === grad.id && (
                        <Check className="w-5 h-5 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 폰트 스타일 */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Type className="w-4 h-4" />
                폰트 스타일
              </h3>
              <div className="flex gap-2">
                {FONT_STYLES.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setFontStyle(font.value)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${font.className} ${
                      fontStyle === font.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 텍스트 위치 */}
            <div>
              <h3 className="text-sm font-medium mb-2">텍스트 위치</h3>
              <div className="flex gap-2">
                {TEXT_POSITIONS.map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => setTextPosition(pos.value)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                      textPosition === pos.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 텍스트 색상 */}
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Palette className="w-4 h-4" />
                텍스트 색상
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setTextColor('white')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors border ${
                    textColor === 'white'
                      ? 'bg-gray-900 text-white border-primary'
                      : 'bg-gray-900 text-white border-transparent hover:border-muted-foreground/30'
                  }`}
                >
                  흰색
                </button>
                <button
                  onClick={() => setTextColor('black')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors border ${
                    textColor === 'black'
                      ? 'bg-white text-gray-900 border-primary'
                      : 'bg-white text-gray-900 border-transparent hover:border-muted-foreground/30'
                  }`}
                >
                  검정
                </button>
              </div>
            </div>

            {/* Pixabay 크레딧 */}
            {selectedPhoto && (
              <p className="text-xs text-muted-foreground">
                Image by{' '}
                <span className="font-medium">{selectedPhoto.user.name}</span>
                {' '}on{' '}
                <a
                  href="https://pixabay.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Pixabay
                </a>
              </p>
            )}
          </div>
        </div>

        {/* 숨겨진 캔버스 (고해상도 이미지 생성용) */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
