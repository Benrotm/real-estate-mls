'use client';

import { useState, useCallback } from 'react';
import PannellumViewer from './PannellumViewer';
import { VirtualTour, TourData, Scene, Hotspot } from '@/app/lib/tours';
import { saveTourData } from '@/app/lib/actions/tours';
import { Plus, Save, Image as ImageIcon, MapPin, Trash2, ArrowRight } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function TourEditor({ tour }: { tour: VirtualTour }) {
    const [tourData, setTourData] = useState<TourData>(tour.tour_data || { scenes: [] });
    const [currentSceneId, setCurrentSceneId] = useState<string | undefined>(
        tour.tour_data?.defaultSceneId || tour.tour_data?.scenes?.[0]?.id
    );
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [linkingMode, setLinkingMode] = useState(false); // If true, next click creates a hotspot

    // Modal State
    const [hotspotModal, setHotspotModal] = useState<{
        isOpen: boolean;
        pitch: number;
        yaw: number;
    } | null>(null);
    const [hotspotText, setHotspotText] = useState('');
    const [hotspotTarget, setHotspotTarget] = useState('');

    const currentScene = tourData.scenes.find(s => s.id === currentSceneId);

    const handleSave = async () => {
        setSaving(true);
        await saveTourData(tour.id, tourData);
        setSaving(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        const file = e.target.files[0];

        const fileName = `${tour.id}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from('virtual-tours').upload(fileName, file);

        if (error) {
            console.error(error);
            alert('Upload failed');
            setUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('virtual-tours').getPublicUrl(fileName);

        const newScene: Scene = {
            id: crypto.randomUUID(),
            title: file.name.split('.')[0],
            image_url: publicUrl,
            hotspots: []
        };

        const newScenes = [...tourData.scenes, newScene];
        setTourData({
            ...tourData,
            scenes: newScenes,
            defaultSceneId: tourData.defaultSceneId || newScene.id
        });

        if (!currentSceneId) setCurrentSceneId(newScene.id);
        setUploading(false);
    };

    const onMapClick = (pitch: number, yaw: number) => {
        setHotspotText('');
        setHotspotTarget('');
        setHotspotModal({ isOpen: true, pitch, yaw });
        setLinkingMode(false);
    };

    const confirmAddHotspot = () => {
        if (!hotspotModal || !currentScene) return;

        const newHotspot: Hotspot = {
            id: crypto.randomUUID(),
            pitch: hotspotModal.pitch,
            yaw: hotspotModal.yaw,
            type: hotspotTarget ? 'scene' : 'info',
            text: hotspotText || 'Info',
            targetSceneId: hotspotTarget || undefined
        };

        const updatedScenes = tourData.scenes.map(s => {
            if (s.id === currentSceneId) {
                return { ...s, hotspots: [...s.hotspots, newHotspot] };
            }
            return s;
        });

        setTourData({ ...tourData, scenes: updatedScenes });
        setHotspotModal(null);
    };

    const handleDeleteScene = (sceneId: string) => {
        if (!confirm('Are you sure you want to delete this scene?')) return;
        const newScenes = tourData.scenes.filter(s => s.id !== sceneId);
        setTourData({ ...tourData, scenes: newScenes });
        if (currentSceneId === sceneId) setCurrentSceneId(newScenes[0]?.id);
    };

    return (
        <div className="flex h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800">Scenes</h2>
                    <label className="cursor-pointer bg-indigo-50 text-indigo-600 p-2 rounded-lg hover:bg-indigo-100 transition-colors">
                        <Plus className="w-5 h-5" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {tourData.scenes.map(scene => (
                        <div
                            key={scene.id}
                            onClick={() => setCurrentSceneId(scene.id)}
                            className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${scene.id === currentSceneId ? 'bg-indigo-50 border-indigo-200 border' : 'hover:bg-slate-50 border border-transparent'
                                }`}
                        >
                            <img src={scene.image_url} alt="" className="w-12 h-8 object-cover rounded bg-slate-200" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{scene.title}</p>
                                <p className="text-xs text-slate-400">{scene.hotspots.length} hotspots</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteScene(scene.id); }}
                                className="text-slate-400 hover:text-red-500 p-1"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {tourData.scenes.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No scenes yet. Upload a panorama.
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Tour</>}
                    </button>
                </div>
            </div>

            {/* Main Viewer Area */}
            <div className="flex-1 relative bg-slate-100">
                {currentScene ? (
                    <>
                        <PannellumViewer
                            sceneId={currentScene.id}
                            image={currentScene.image_url}
                            hotspots={currentScene.hotspots.map(h => ({
                                ...h,
                                sceneId: h.targetSceneId
                            }))}
                            onClick={(e, coords) => {
                                if (linkingMode) {
                                    onMapClick(coords.pitch, coords.yaw);
                                }
                            }}
                        />

                        {/* Editor Controls Overlay */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg flex gap-2">
                            <button
                                onClick={() => setLinkingMode(!linkingMode)}
                                className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-colors ${linkingMode ? 'bg-indigo-600 text-white' : 'bg-transparent text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                <MapPin className="w-4 h-4" />
                                {linkingMode ? 'Click to Place Hotspot' : 'Add Hotspot'}
                            </button>
                        </div>

                        {/* Custom Centered Modal */}
                        {hotspotModal && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setHotspotModal(null)}>
                                <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-w-full m-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Add Hotspot</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Label Text</label>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={hotspotText}
                                                onChange={e => setHotspotText(e.target.value)}
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="e.g. Kitchen, Exit..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Target Scene (Optional)</label>
                                            <select
                                                value={hotspotTarget}
                                                onChange={e => setHotspotTarget(e.target.value)}
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">(Info Only - No Link)</option>
                                                {tourData.scenes.filter(s => s.id !== currentSceneId).map(s => (
                                                    <option key={s.id} value={s.id}>{s.title}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => setHotspotModal(null)}
                                                className="flex-1 px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={confirmAddHotspot}
                                                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <p>Select or upload a scene to begin editing</p>
                    </div>
                )}
            </div>
        </div>
    );
}
