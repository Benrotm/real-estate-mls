'use client';

import { useState, TouchEvent } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import FavoriteButton from '../property/FavoriteButton';

interface PropertyCarouselProps {
    images: string[];
    title: string;
    propertyId?: string;
}

export default function PropertyCarousel({ images, title, propertyId }: PropertyCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Filter out invalid images if necessary
    const validImages = images.length > 0 ? images : ['/placeholder.jpg'];

    const minSwipeDistance = 50;

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

    return (
        <div
            className="relative w-full h-[50vh] md:h-[60vh] bg-slate-900 overflow-hidden group touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* Main Image */}
            <div className="absolute inset-0 flex items-center justify-center">
                <img
                    src={validImages[currentIndex]}
                    alt={`${title} - Image ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300 select-none"
                    draggable={false}
                />
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
                        onClick={(e) => { e.preventDefault(); prevImage(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-4 rounded-full backdrop-blur-sm transition-all transform hover:scale-105 active:scale-95 border border-white/10 shadow-lg z-20"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-4 rounded-full backdrop-blur-sm transition-all transform hover:scale-105 active:scale-95 border border-white/10 shadow-lg z-20"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
                    </button>
                </>
            )}

            {/* Image Counter Badge */}
            <div className="absolute bottom-6 right-6 bg-black/60 text-white px-4 py-2 rounded-lg backdrop-blur-md text-sm font-bold flex items-center gap-2 border border-white/10">
                <ImageIcon className="w-4 h-4" />
                {currentIndex + 1} / {validImages.length}
            </div>

            {/* Thumbnails / Dots */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {validImages.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => { e.preventDefault(); goToImage(idx); }}
                        className={`transition-all shadow-sm ${idx === currentIndex ? 'bg-white w-8 h-2 rounded-full' : 'bg-white/50 w-2 h-2 rounded-full hover:bg-white/80'
                            }`}
                        aria-label={`Go to image ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
