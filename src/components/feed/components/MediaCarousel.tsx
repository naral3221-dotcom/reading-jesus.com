'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaCarouselProps {
    images: string[];
    className?: string;
    onImageClick?: (index: number) => void;
}

export function MediaCarousel({ images, className, onImageClick }: MediaCarouselProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    if (!images || images.length === 0) return null;

    // 단일 이미지
    if (images.length === 1) {
        return (
            <div
                className={cn("relative w-full overflow-hidden bg-muted/20", className)}
                onClick={() => onImageClick?.(0)}
            >
                <div className="relative aspect-[4/5] w-full">
                    <Image
                        src={images[0]}
                        alt="Feed content"
                        fill
                        className="object-cover"
                        unoptimized
                    />
                </div>
            </div>
        );
    }

    // 다중 이미지 (캐러셀)
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const index = Math.round(scrollLeft / clientWidth);
            setCurrentIndex(index);
        }
    };

    const scrollTo = (index: number) => {
        if (scrollContainerRef.current) {
            const width = scrollContainerRef.current.clientWidth;
            scrollContainerRef.current.scrollTo({
                left: width * index,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className={cn("relative group", className)}>
            {/* 이미지 컨테이너 */}
            <div
                ref={scrollContainerRef}
                className="flex w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-[4/5]"
                onScroll={handleScroll}
            >
                {images.map((src, index) => (
                    <div
                        key={index}
                        className="relative w-full flex-shrink-0 snap-center h-full bg-muted/20"
                        onClick={() => onImageClick?.(index)}
                    >
                        <Image
                            src={src}
                            alt={`Feed content ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                ))}
            </div>

            {/* 인디케이터 ( dots ) */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm",
                                index === currentIndex
                                    ? "bg-white scale-125"
                                    : "bg-white/50"
                            )}
                        />
                    ))}
                </div>
            )}

            {/* 인디케이터 ( 1/N ) - 우상단 */}
            {images.length > 1 && (
                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium z-10">
                    {currentIndex + 1}/{images.length}
                </div>
            )}

            {/* 네비게이션 화살표 (PC hover시에만) */}
            {images.length > 1 && (
                <>
                    {currentIndex > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                scrollTo(currentIndex - 1);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 text-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                    {currentIndex < images.length - 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                scrollTo(currentIndex + 1);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 text-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
