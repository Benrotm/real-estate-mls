'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { togglePropertyFavorite, checkPropertyFavorite } from '@/app/lib/actions/propertyAnalytics';

interface FavoriteButtonProps {
    propertyId: string;
    className?: string;
    variant?: 'icon' | 'with-label';
}

export default function FavoriteButton({ propertyId, className = '', variant = 'icon' }: FavoriteButtonProps) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const status = await checkPropertyFavorite(propertyId);
                setIsFavorited(status);
            } catch (error) {
                console.error('Error checking favorite status:', error);
            } finally {
                setIsLoading(false);
            }
        };
        checkStatus();
    }, [propertyId]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isActionLoading) return;

        setIsActionLoading(true);
        try {
            const result = await togglePropertyFavorite(propertyId);
            if (result.success) {
                setIsFavorited(result.isFavorited || false);
            } else if (result.error) {
                // If the error indicates not logged in, we can show a more specific message
                if (result.error.toLowerCase().includes('logged in')) {
                    alert('Please log in to save properties to your favorites.');
                } else {
                    alert(`Error: ${result.error}`);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        if (variant === 'with-label') {
            return (
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin"></div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Loading</span>
                </div>
            );
        }
        return (
            <div className={`w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center ${className}`}>
                <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (variant === 'with-label') {
        return (
            <button
                onClick={handleToggle}
                disabled={isActionLoading}
                className={`flex flex-col items-center gap-1 min-w-[60px] group transition-all ${className}`}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
                <div className={`p-3 rounded-full transition-all duration-300 ${isFavorited
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-slate-100 text-red-500 group-hover:bg-slate-200'
                    } ${isActionLoading ? 'opacity-70 animate-pulse' : 'hover:scale-110 active:scale-95'}`}>
                    <Heart
                        className={`w-5 h-5 transition-colors ${isFavorited ? 'fill-current' : 'fill-transparent group-hover:fill-red-500/20'}`}
                    />
                </div>
                <span className={`text-xs font-medium transition-colors ${isFavorited ? 'text-red-600' : 'text-slate-500 group-hover:text-slate-900'
                    }`}>
                    Favorites
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isActionLoading}
            className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all group ${isFavorited
                ? '!bg-red-500 text-white hover:!bg-red-600 scale-110'
                : 'bg-white/90 backdrop-blur-sm text-slate-400 hover:text-red-500 hover:bg-white scale-100'
                } ${isActionLoading ? 'opacity-70 animate-pulse' : 'hover:scale-110 active:scale-95'} ${className}`}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
            <Heart
                className={`w-5 h-5 transition-colors ${isFavorited ? 'fill-current' : 'fill-transparent group-hover:fill-red-500/20'}`}
            />
        </button>
    );
}
