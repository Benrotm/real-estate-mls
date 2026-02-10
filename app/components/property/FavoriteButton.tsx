'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { togglePropertyFavorite, checkPropertyFavorite } from '@/app/lib/actions/propertyAnalytics';

interface FavoriteButtonProps {
    propertyId: string;
    className?: string;
}

export default function FavoriteButton({ propertyId, className = '' }: FavoriteButtonProps) {
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
                    alert(`Error: ${result.error}`); // Show full error for debugging
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center ${className}`}>
                <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isActionLoading}
            className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all group ${isFavorited
                ? 'bg-red-500 text-white hover:bg-red-600 scale-110'
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
