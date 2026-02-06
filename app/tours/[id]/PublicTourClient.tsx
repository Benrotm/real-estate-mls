'use client';

import { useState } from 'react';
import PannellumViewer from '@/app/components/360/PannellumViewer';
import { VirtualTour } from '@/app/lib/tours';
import { MapPin, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PublicTourClient({ tour }: { tour: VirtualTour }) {
    const [currentSceneId, setCurrentSceneId] = useState<string>(
        tour.tour_data?.defaultSceneId || tour.tour_data?.scenes?.[0]?.id || ''
    );

    const currentScene = tour.tour_data.scenes.find(s => s.id === currentSceneId);

    if (!currentScene) return null;

    return (
        <div className="w-full h-full relative">
            <PannellumViewer
                sceneId={currentScene.id}
                image={currentScene.image_url}
                hotspots={currentScene.hotspots.map(h => ({
                    ...h,
                    sceneId: h.targetSceneId
                }))}
                onSceneChange={(newId) => setCurrentSceneId(newId)}
                pitch={currentScene.initialViewParameters?.pitch}
                yaw={currentScene.initialViewParameters?.yaw}
                hfov={currentScene.initialViewParameters?.hfov}
            />

            {/* Overlay UI */}
            <div className="absolute top-0 left-0 w-full p-6 bg-gradient-to-b from-black/60 to-transparent pointer-events-none flex justify-between items-start">
                <div className="flex flex-col text-white pointer-events-auto">
                    <h1 className="text-2xl font-bold drop-shadow-md">{tour.title}</h1>
                    <p className="text-sm opacity-80 flex items-center gap-2 drop-shadow-md">
                        <MapPin className="w-3 h-3" />
                        {currentScene.title}
                    </p>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    {tour.property && (
                        <Link
                            href={`/properties/${tour.property.id}`}
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            View Property
                        </Link>
                    )}
                </div>
            </div>

            {/* Scene Selector / Navigation Thumbnails (Optional enhancement) */}
            {tour.tour_data.scenes.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md p-2 rounded-2xl flex gap-2 overflow-x-auto max-w-[90vw] pointer-events-auto">
                    {tour.tour_data.scenes.map(scene => (
                        <button
                            key={scene.id}
                            onClick={() => setCurrentSceneId(scene.id)}
                            className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${scene.id === currentSceneId ? 'border-indigo-500 scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                                }`}
                            title={scene.title}
                        >
                            <img src={scene.image_url} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
