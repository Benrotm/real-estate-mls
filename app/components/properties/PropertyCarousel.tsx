'use client';

import { useState, useEffect, TouchEvent } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import FavoriteButton from '../property/FavoriteButton';

interface PropertyCarouselProps {
    images: string[];
    title: string;
    propertyId?: string;
}

export default function PropertyCarousel({ images, title, propertyId }: PropertyCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Filter out invalid images if necessary
    const validImages = images.length > 0 ? images : ['/placeholder.jpg'];

    const minSwipeDistance = 50;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                prevImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            } else if (e.key === 'Escape' && isFullScreen) {
                setIsFullScreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen, validImages.length]);

    const onTouchStart = (e: TouchEvent) => {
        setTouchEnd(null); // otherwise the swipe is fired even with usual touch events
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) {
            nextImage();
        }
        if (isRightSwipe) {
            prevImage();
        }
    };

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    };

    const goToImage = (index: number) => {
        setCurrentIndex(index);
    };

    const slideWidthPercent = 100 / validImages.length;
    const translateOffsetPercent = (currentIndex * 100) / validImages.length;

    return (
        <>
            <div
                className="relative w-full h-[60vh] md:h-[75vh] bg-slate-950 overflow-hidden group touch-pan-y select-none"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Sliding Container */}
                <div
                    className="flex h-full transition-transform duration-500 ease-out will-change-transform"
                    style={{
                        width: `${validImages.length * 100}%`,
                        transform: `translateX(-${translateOffsetPercent}%)`
                    }}
                >
                    {validImages.map((src, index) => (
                        <div
                            key={index}
                            className="h-full relative flex items-center justify-center bg-slate-950 shrink-0 cursor-zoom-in overflow-hidden p-2"
                            style={{ width: `${slideWidthPercent}%` }}
                            onClick={() => setIsFullScreen(true)}
                        >
                            <img
                                src={src}
                                alt={`${title} - Image ${index + 1}`}
                                className="max-w-full max-h-full w-auto h-auto object-contain select-none transition-opacity duration-300 pointer-events-none"
                                draggable={false}
                                loading={index === 0 ? "eager" : "lazy"}
                            />
                        </div>
                    ))}
                </div>

                {/* Overlay Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                {/* Favorite Button Overlay */}
                {propertyId && (
                    <div className="absolute top-6 right-6 z-10">
                        <FavoriteButton propertyId={propertyId} />
                    </div>
                )}

                {/* Navigation Arrows */}
                {validImages.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevImage(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 md:p-4 rounded-full backdrop-blur-sm transition-all transform hover:scale-105 active:scale-95 border border-white/10 shadow-lg z-20"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-6 h-6 md:w-10 md:h-10" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextImage(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 md:p-4 rounded-full backdrop-blur-sm transition-all transform hover:scale-105 active:scale-95 border border-white/10 shadow-lg z-20"
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-6 h-6 md:w-10 md:h-10" />
                        </button>
                    </>
                )}

                {/* Image Counter Badge */}
                <div className="absolute bottom-6 right-6 bg-black/60 text-white px-3 py-1 md:px-4 md:py-2 rounded-lg backdrop-blur-md text-xs md:text-sm font-bold flex items-center gap-2 border border-white/10 z-20">
                    <ImageIcon className="w-3 h-3 md:w-4 md:h-4" />
                    {currentIndex + 1} / {validImages.length}
                </div>

                {/* Thumbnails / Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {validImages.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToImage(idx); }}
                            className={`transition-all shadow-sm ${idx === currentIndex ? 'bg-white w-6 md:w-8 h-1.5 md:h-2 rounded-full' : 'bg-white/50 w-1.5 md:w-2 h-1.5 md:h-2 rounded-full hover:bg-white/80'
                                }`}
                            aria-label={`Go to image ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Full Screen Lightbox */}
            {isFullScreen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
                    onClick={() => setIsFullScreen(false)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-white/10 rounded-full backdrop-blur-md transition-colors z-[110]"
                        onClick={(e) => { e.stopPropagation(); setIsFullScreen(false); }}
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Full Screen Image Navigation */}
                    {validImages.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-md transition-all z-[110]"
                            >
                                <ChevronLeft className="w-10 h-10" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-md transition-all z-[110]"
                            >
                                <ChevronRight className="w-10 h-10" />
                            </button>
                        </>
                    )}

                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={validImages[currentIndex]}
                            alt={title}
                            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Caption Area in Full Screen */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-white/80 text-sm md:text-base font-medium bg-gradient-to-t from-black/80 to-transparent">
                            {title} — {currentIndex + 1} of {validImages.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
