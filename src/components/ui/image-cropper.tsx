'use client';

import React, { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';

// react-easy-crop 동적 로드 (번들 최적화)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Cropper: any = dynamic(() => import('react-easy-crop').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="w-full h-[300px] bg-muted/50 rounded-lg animate-pulse" />
});
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn } from 'lucide-react';

// ============================================================
// 타입 정의
// ============================================================
type CropShape = 'round' | 'rect';

interface ImageCropperProps {
  imageSrc: string;
  onComplete: (blob: Blob) => void;
  onCancel?: () => void;
  cropShape?: CropShape;
  aspect?: number;
  initialZoom?: number;
  zoomMin?: number;
  zoomMax?: number;
  className?: string;
  labels?: {
    zoom: string;
    cancel: string;
    crop: string;
    processing: string;
  };
  onError?: (error: Error) => void;
}

// ============================================================
// 유틸리티 함수 (이미지 크롭)
// ============================================================
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  shape: CropShape = 'round'
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러오는데 실패했습니다'));
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(pixelCrop.width));
  canvas.height = Math.max(1, Math.round(pixelCrop.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 컨텍스트를 생성할 수 없습니다');

  // 부드러운 렌더링
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 이미지 크롭 영역 그리기
  ctx.drawImage(
    image,
    Math.round(pixelCrop.x),
    Math.round(pixelCrop.y),
    Math.round(pixelCrop.width),
    Math.round(pixelCrop.height),
    0,
    0,
    Math.round(pixelCrop.width),
    Math.round(pixelCrop.height)
  );

  // 원형일 때만 마스킹 처리
  if (shape === 'round') {
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2;
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
  }

  // Blob으로 변환 (PNG - 투명도 보존)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png', 1)
  );

  if (!blob) throw new Error('이미지 변환에 실패했습니다');
  return blob;
}

// ============================================================
// ImageCropper 컴포넌트
// ============================================================
export default function ImageCropper({
  imageSrc,
  onComplete,
  onCancel,
  cropShape = 'round',
  aspect = 1,
  initialZoom = 1,
  zoomMin = 1,
  zoomMax = 3,
  className = '',
  labels = {
    zoom: '확대/축소',
    cancel: '취소',
    crop: '적용',
    processing: '처리 중...',
  },
  onError,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(initialZoom);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixelsParam: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsParam);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) return;

    try {
      setLoading(true);
      const blob = await getCroppedImg(
        imageSrc,
        {
          x: Math.max(0, Math.round(croppedAreaPixels.x)),
          y: Math.max(0, Math.round(croppedAreaPixels.y)),
          width: Math.max(1, Math.round(croppedAreaPixels.width)),
          height: Math.max(1, Math.round(croppedAreaPixels.height)),
        },
        cropShape
      );
      onComplete(blob);
    } catch (e) {
      console.error('Crop failed:', e);
      if (onError && e instanceof Error) {
        onError(e);
      }
    } finally {
      setLoading(false);
    }
  }, [croppedAreaPixels, imageSrc, onComplete, cropShape, onError]);

  return (
    <div className={`w-full ${className}`}>
      {/* 크롭 영역 */}
      <div
        className="relative w-full h-[300px] bg-muted/50 rounded-lg overflow-hidden"
        role="img"
        aria-label="이미지 자르기 영역"
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          cropShape={cropShape}
          showGrid={false}
        />
      </div>

      {/* 줌 슬라이더 */}
      <div className="mt-4 flex items-center gap-3">
        <ZoomIn className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {labels.zoom}
        </span>
        <Slider
          value={[zoom]}
          min={zoomMin}
          max={zoomMax}
          step={0.01}
          onValueChange={(value) => setZoom(value[0])}
          className="flex-1"
          aria-label={labels.zoom}
        />
      </div>

      {/* 버튼 */}
      <div className="mt-4 flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {labels.cancel}
          </Button>
        )}
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {labels.processing}
            </>
          ) : (
            labels.crop
          )}
        </Button>
      </div>
    </div>
  );
}

// Named export도 제공
export { ImageCropper };
export type { ImageCropperProps, CropShape };
