'use client';

/**
 * FeedCardImages - 피드 카드 이미지 그리드 컴포넌트
 */

import Image from 'next/image';

interface FeedCardImagesProps {
  images: string[];
  onImageClick?: (src: string, index: number) => void;
}

export function FeedCardImages({ images, onImageClick }: FeedCardImagesProps) {
  if (images.length === 0) {
    return null;
  }

  const handleImageClick = (e: React.MouseEvent, src: string, index: number) => {
    e.stopPropagation();
    if (onImageClick) {
      onImageClick(src, index);
    } else {
      window.open(src, '_blank');
    }
  };

  if (images.length === 1) {
    return (
      <div className="-mx-4 mb-3">
        <div
          className="relative aspect-square max-h-[500px] cursor-pointer"
          onClick={(e) => handleImageClick(e, images[0], 0)}
        >
          <Image
            src={images[0]}
            alt="첨부 이미지"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 mb-3">
      <div className="grid grid-cols-2 gap-0.5">
        {images.slice(0, 4).map((src, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer"
            onClick={(e) => handleImageClick(e, src, index)}
          >
            <Image
              src={src}
              alt={`이미지 ${index + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            {index === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">+{images.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
