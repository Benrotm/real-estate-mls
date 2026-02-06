import { getVirtualTourById } from '@/app/lib/actions/tours';
import { notFound } from 'next/navigation';
import PannellumViewer from '@/app/components/360/PannellumViewer';
import { MapPin, Home } from 'lucide-react';
import Link from 'next/link';

export default async function PublicTourPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const tour = await getVirtualTourById(id);

    if (!tour) {
        notFound();
    }

    // Use a client component wrapper if we need state for scene transitions (PannellumViewer handles it internally via props usually, but for page level title updates we might want state)
    // For now, simple wrapper.

    // Default scene
    const defaultSceneId = tour.tour_data?.defaultSceneId || tour.tour_data?.scenes?.[0]?.id;
    const defaultScene = tour.tour_data?.scenes?.find(s => s.id === defaultSceneId);

    if (!defaultScene) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Tour Incomplete</h1>
                    <p className="text-slate-400">This virtual tour has no scenes yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen relative bg-black">
            {/* We use a Client Component Wrapper for the actual Viewer to handle scene state if needed, 
                 but PannellumViewer component already is 'use client'. 
                 However, to handle switching scenes cleanly without re-mounting the whole page if we want URL state,
                 or just internal state. PannellumViewer handles internal state if we don't force re-render.
             */}

            {/* For public viewer, we really want a full client component that manages the "current scene" 
                 so we can show the scene title in an overlay.
             */}
            <PublicTourClient tour={tour} />
        </div>
    );
}

// Inline Client Component for the viewer logic
import PublicTourClient from './PublicTourClient';
