
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase/client';
import { Calendar, Trash2, Plus, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Event {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    event_type: string;
}

export default function EventClient({ propertyId }: { propertyId: string }) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newEvent, setNewEvent] = useState({
        title: 'Open House',
        start_time: '',
        end_time: '',
        event_type: 'open_house'
    });
    const router = useRouter();

    useEffect(() => {
        fetchEvents();
    }, [propertyId]);

    async function fetchEvents() {
        setLoading(true);
        const { data, error } = await supabase
            .from('property_events')
            .select('*')
            .eq('property_id', propertyId)
            .order('start_time', { ascending: true });

        if (!error && data) {
            setEvents(data);
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this event?')) return;

        const { error } = await supabase
            .from('property_events')
            .delete()
            .eq('id', id);

        if (!error) {
            setEvents(events.filter(e => e.id !== id));
            router.refresh();
        } else {
            alert('Error deleting event');
        }
    }

    async function handleAdd() {
        if (!newEvent.start_time || !newEvent.end_time) {
            alert('Please select start and end times');
            return;
        }

        const { data, error } = await supabase
            .from('property_events')
            .insert([{
                property_id: propertyId,
                title: newEvent.title,
                start_time: new Date(newEvent.start_time).toISOString(),
                end_time: new Date(newEvent.end_time).toISOString(),
                event_type: newEvent.event_type
            }])
            .select()
            .single();

        if (!error && data) {
            setEvents([...events, data].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
            setIsAdding(false);
            setNewEvent({ title: 'Open House', start_time: '', end_time: '', event_type: 'open_house' });
            router.refresh();
        } else {
            alert('Error adding event: ' + error?.message);
        }
    }

    if (loading) return <div className="text-slate-500 text-sm">Loading events...</div>;

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            {/* Ambient Shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-violet-400" />
                    Property Events aka "Open House"
                </h3>
                <button
                    type="button"
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-sm bg-violet-600/20 text-violet-400 px-4 py-2 rounded-xl font-bold hover:bg-violet-600/30 transition-all flex items-center gap-1 border border-violet-500/30"
                >
                    <Plus className="w-4 h-4" /> Add Event
                </button>
            </div>

            {isAdding && (
                <div className="mb-6 bg-slate-950/50 p-6 rounded-xl border border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Event Title</label>
                        <input
                            type="text"
                            value={newEvent.title}
                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="w-full bg-slate-900/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600"
                            placeholder="e.g. Weekend Open House"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Start Time</label>
                            <div
                                className="relative group/input cursor-pointer"
                                onClick={(e) => {
                                    const input = e.currentTarget.querySelector('input');
                                    if (input && 'showPicker' in input) {
                                        try { input.showPicker(); } catch (err) { }
                                    }
                                }}
                            >
                                <input
                                    type="datetime-local"
                                    value={newEvent.start_time}
                                    onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white [color-scheme:dark] cursor-pointer"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">End Time</label>
                            <div
                                className="relative group/input cursor-pointer"
                                onClick={(e) => {
                                    const input = e.currentTarget.querySelector('input');
                                    if (input && 'showPicker' in input) {
                                        try { input.showPicker(); } catch (err) { }
                                    }
                                }}
                            >
                                <input
                                    type="datetime-local"
                                    value={newEvent.end_time}
                                    onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white [color-scheme:dark] cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="text-slate-400 text-sm font-medium px-4 py-2 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold px-6 py-2 rounded-xl hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/20 transition-all border border-violet-500/20"
                        >
                            Save Event
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-3 relative z-10">
                {events.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                        No upcoming events scheduled.
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-800 rounded-xl hover:border-violet-500/30 transition-all group/item">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-lg border border-violet-500/20">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-bold text-white text-sm">{event.title}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDelete(event.id)}
                                className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all opacity-0 group-hover/item:opacity-100 border border-transparent hover:border-red-500/20"
                                title="Delete Event"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
