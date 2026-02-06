'use client';

import { useEffect, useRef, useState } from 'react';
import 'pannellum/build/pannellum.css';

// Declare Pannellum on window
declare global {
    interface Window {
        pannellum: any;
    }
}

interface Hotspot {
    pitch: number;
    yaw: number;
    type: 'scene' | 'info';
    text: string;
    sceneId?: string;
    clickHandlerFunc?: any;
    clickHandlerArgs?: any;
}

interface PannellumViewerProps {
    sceneId: string;
    image: string;
    pitch?: number;
    yaw?: number;
    hfov?: number;
    hotspots?: Hotspot[];
    onLoad?: () => void;
    onSceneChange?: (sceneId: string) => void;
    onViewChange?: (pitch: number, yaw: number, hfov: number) => void;
    onClick?: (e: MouseEvent, args: { pitch: number, yaw: number }) => void;
}

export default function PannellumViewer({
    sceneId,
    image,
    pitch = 0,
    yaw = 0,
    hfov = 110,
    hotspots = [],
    onLoad,
    onSceneChange,
    onViewChange,
    onClick
}: PannellumViewerProps) {
    const viewerContainer = useRef<HTMLDivElement>(null);
    const viewerInstance = useRef<any>(null);
    const [libLoaded, setLibLoaded] = useState(false);

    const onClickRef = useRef(onClick);
    const onViewChangeRef = useRef(onViewChange);
    const onSceneChangeRef = useRef(onSceneChange);

    // Update refs whenever props change
    useEffect(() => {
        onClickRef.current = onClick;
        onViewChangeRef.current = onViewChange;
        onSceneChangeRef.current = onSceneChange;
    }, [onClick, onViewChange, onSceneChange]);

    useEffect(() => {
        // Dynamically import pannellum to avoid SSR issues
        import('pannellum').then(() => {
            setLibLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (!libLoaded || !viewerContainer.current || !window.pannellum) return;

        // Destroy existing instance if any (though usually we update scenes)
        if (viewerInstance.current) {
            viewerInstance.current.destroy();
        }

        const config = {
            type: 'equirectangular',
            panorama: image,
            autoLoad: true,
            pitch,
            yaw,
            hfov,
            hotSpots: hotspots.map(h => ({
                ...h,
                clickHandlerFunc: h.type === 'scene' ? (e: any, args: any) => {
                    if (onSceneChangeRef.current) onSceneChangeRef.current(args.targetSceneId);
                } : undefined,
                clickHandlerArgs: h.type === 'scene' ? { targetSceneId: h.sceneId } : undefined
            })),
            showControls: true
        };

        viewerInstance.current = window.pannellum.viewer(viewerContainer.current, config);

        // Event listeners
        viewerInstance.current.on('load', () => {
            if (onLoad) onLoad();
        });

        viewerInstance.current.on('mouseup', (e: MouseEvent) => {
            if (onClickRef.current) {
                const [pitch, yaw] = viewerInstance.current.mouseEventToCoords(e);
                onClickRef.current(e, { pitch, yaw });
            }
        });

        // Pannellum doesn't have a direct 'viewchange' event that fires continuously efficiently in all versions,
        // but we can poll or use 'mouseup'/'touchend' to sync view state if needed.
        const handleViewUpdate = () => {
            if (onViewChangeRef.current && viewerInstance.current) {
                const p = viewerInstance.current.getPitch();
                const y = viewerInstance.current.getYaw();
                const f = viewerInstance.current.getHfov();
                onViewChangeRef.current(p, y, f);
            }
        };

        viewerContainer.current.addEventListener('mouseup', handleViewUpdate);
        viewerContainer.current.addEventListener('touchend', handleViewUpdate);

        return () => {
            if (viewerInstance.current) {
                viewerInstance.current.destroy();
                viewerInstance.current = null;
            }
        };
    }, [libLoaded, sceneId, image]); // Re-init if scene/image changes for now. Optimally we'd use loadScene but re-init is safer for simple wrapper.

    return (
        <div ref={viewerContainer} className="w-full h-full bg-slate-100" />
    );
}
