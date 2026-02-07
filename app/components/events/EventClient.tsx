
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
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Property Events aka "Open House"
                </h3>
                <button
                    type="button"
                    onClick={() => setIsAdding(!isAdding)}
                    className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                >
                    <Plus className="w-4 h-4" /> Add Event
                </button>
            </div>

            {isAdding && (
                <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Event Title</label>
                        <input
                            type="text"
                            value={newEvent.title}
                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="e.g. Weekend Open House"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time</label>
                            <input
                                type="datetime-local"
                                value={newEvent.start_time}
                                onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Time</label>
                            <input
                                type="datetime-local"
                                value={newEvent.end_time}
                                onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="text-slate-500 text-sm font-medium px-3 py-1.5 hover:text-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="bg-indigo-600 text-white text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-indigo-700"
                        >
                            Save Event
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {events.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No upcoming events scheduled.
                    </div>
                ) : (
                    events.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-indigo-100 transition-colors group">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{event.title}</div>
                                    <div className="text-xs text-slate-500">
                                        {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDelete(event.id)}
                                className="text-slate-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
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
