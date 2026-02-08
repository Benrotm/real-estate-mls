'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import FavoriteButton from '../property/FavoriteButton';

interface PropertyCarouselProps {
    images: string[];
    title: string;
    propertyId?: string;
}

export default function PropertyCarousel({ images, title, propertyId }: PropertyCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter out invalid images if necessary
    const validImages = images.length > 0 ? images : ['/placeholder.jpg'];

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
        <div className="relative w-full h-[50vh] md:h-[60vh] bg-slate-900 overflow-hidden group">
            {/* Main Image */}
            <div className="absolute inset-0 flex items-center justify-center">
                <img
                    src={validImages[currentIndex]}
                    alt={`${title} - Image ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                />
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

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
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); nextImage(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Image Counter Badge */}
            <div className="absolute bottom-6 right-6 bg-black/60 text-white px-4 py-2 rounded-lg backdrop-blur-md text-sm font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {currentIndex + 1} / {validImages.length}
            </div>

            {/* Thumbnails / Dots (Optional - using dots for simplicity on overlay) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {validImages.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => { e.preventDefault(); goToImage(idx); }}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                            }`}
                        aria-label={`Go to image ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
