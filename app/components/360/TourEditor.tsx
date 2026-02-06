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
            title: file.name,
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

    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="relative h-[calc(100vh-64px)] w-full bg-slate-900 overflow-hidden font-sans">

            {/* Top Bar (Floating) */}
            <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
                <div className="pointer-events-auto bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/10 shadow-xl flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-white/20 rounded-full transition">
                        <ArrowRight className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <span className="font-semibold text-sm tracking-wide">
                        {currentScene ? currentScene.title : 'No Scene Selected'}
                    </span>
                    {saving && <span className="text-xs text-blue-400 animate-pulse">Saving...</span>}
                </div>

                <div className="pointer-events-auto flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-indigo-900/40 transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Scenes Drawer (Left) */}
            <div
                className={`absolute top-20 bottom-8 left-4 w-72 z-20 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-[110%]'} pointer-events-none`}
            >
                <div className="pointer-events-auto h-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <h2 className="font-bold text-white text-sm uppercase tracking-wider">Scenes</h2>
                        <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg transition-colors shadow-lg">
                            <Plus className="w-4 h-4" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                        </label>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {tourData.scenes.map(scene => (
                            <div
                                key={scene.id}
                                onClick={() => setCurrentSceneId(scene.id)}
                                className={`group p-2 rounded-xl cursor-pointer flex items-center gap-3 transition-all border ${scene.id === currentSceneId
                                    ? 'bg-indigo-600/20 border-indigo-500/50 shadow-inner'
                                    : 'hover:bg-white/5 border-transparent'
                                    }`}
                            >
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shadow-sm shrink-0">
                                    <img src={scene.image_url} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium text-sm truncate ${scene.id === currentSceneId ? 'text-white' : 'text-slate-300'}`}>
                                        {scene.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded-md">
                                            {scene.hotspots.length} hotspots
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteScene(scene.id); }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-white/5 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {tourData.scenes.length === 0 && (
                            <div className="text-center py-12 text-slate-500 text-sm flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                    <ImageIcon className="w-6 h-6 opacity-30" />
                                </div>
                                <span className="opacity-60">No scenes uploaded</span>
                            </div>
                        )}
                    </div>

                    {uploading && (
                        <div className="p-3 bg-indigo-900/30 border-t border-indigo-500/30">
                            <p className="text-xs text-indigo-300 text-center animate-pulse">Uploading panorama...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Viewer Area (Full Screen) */}
            <div className="absolute inset-0 z-0 bg-slate-900">
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

                        {/* Bottom Actions Floating Bar */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
                            <div className="bg-black/70 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl flex gap-1">
                                <button
                                    onClick={() => setLinkingMode(!linkingMode)}
                                    className={`px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2.5 transition-all ${linkingMode
                                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                        }`}
                                >
                                    <MapPin className={`w-4 h-4 ${linkingMode ? 'fill-black' : ''}`} />
                                    {linkingMode ? 'Click Scene to Place' : 'Add Hotspot'}
                                </button>
                            </div>
                        </div>

                        {/* Custom Centered Modal */}
                        {hotspotModal && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setHotspotModal(null)}>
                                <div className="bg-slate-900 border border-white/10 text-white rounded-2xl shadow-2xl p-6 w-96 max-w-full m-4 scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-6">New Hotspot</h3>

                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Label Text</label>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={hotspotText}
                                                onChange={e => setHotspotText(e.target.value)}
                                                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                                placeholder="e.g. Living Room"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Scene</label>
                                            <div className="relative">
                                                <select
                                                    value={hotspotTarget}
                                                    onChange={e => setHotspotTarget(e.target.value)}
                                                    className="w-full p-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-slate-200"
                                                >
                                                    <option value="" className="bg-slate-800 text-slate-400">Info Only (No Navigation)</option>
                                                    {tourData.scenes.filter(s => s.id !== currentSceneId).map(s => (
                                                        <option key={s.id} value={s.id} className="bg-slate-800">{s.title}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                    <ArrowRight className="w-4 h-4 rotate-90" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <button
                                                onClick={() => setHotspotModal(null)}
                                                className="flex-1 px-4 py-3 text-slate-400 font-medium hover:bg-white/5 rounded-xl transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={confirmAddHotspot}
                                                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-900/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                Save Hotspot
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                            <ImageIcon className="w-10 h-10 opacity-50" />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-medium text-white mb-2">No Scene Selected</p>
                            <p className="text-slate-500">Upload a 360° panorama on the left to get started.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
