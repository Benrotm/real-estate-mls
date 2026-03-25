"use client";
import React, { useState, useEffect } from 'react';
import { format, endOfMonth, parseISO } from 'date-fns';
import ActivityConsistencyTable from './ActivityConsistencyTable';
import { Filter } from 'lucide-react';

export default function PersonalConsistencyWidget() {
    const [filterType, setFilterType] = useState<'monthly' | 'custom'>('monthly');
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            try {
                let url = `/api/activities?`;
                if (filterType === 'monthly') url += `month=${month}`;
                else url += `startDate=${startDate}&endDate=${endDate}`;

                const res = await fetch(url);
                const data = await res.json();
                
                if (data.activities) {
                    setActivities(data.activities);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, [filterType, month, startDate, endDate]);

    let derivedStartDate = startDate;
    let derivedEndDate = endDate;
    if (filterType === 'monthly') {
        derivedStartDate = `${month}-01`;
        try { derivedEndDate = format(endOfMonth(parseISO(`${month}-01`)), 'yyyy-MM-dd'); } catch(e){}
    }

    return (
        <div className="mt-12 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Activity Consistency</h2>
            
            <div className="bg-white border rounded-xl overflow-visible shadow-sm">
                <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-700">Timeframe Filter</h3>
                </div>
                <div className="p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex gap-2">
                        <button onClick={()=>setFilterType('monthly')} className={`px-4 py-2 text-sm font-medium rounded-lg border ${filterType === 'monthly' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Monthly</button>
                        <button onClick={()=>setFilterType('custom')} className={`px-4 py-2 text-sm font-medium rounded-lg border ${filterType === 'custom' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Custom Period</button>
                    </div>
                    
                    <div className="flex gap-3">
                        {filterType === 'monthly' && (
                            <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                        )}
                        {filterType === 'custom' && (
                            <>
                                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                <span className="flex items-center text-slate-400">to</span>
                                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                        <div className="px-3 py-1 bg-white border shadow-md rounded-full text-xs font-bold text-slate-600 animate-pulse">Loading...</div>
                    </div>
                )}
                <div className="mt-[-2rem]">
                    <ActivityConsistencyTable 
                        activities={activities} 
                        agents={[{ id: 'user', full_name: 'My Activities' }]} 
                        startDateStr={derivedStartDate} 
                        endDateStr={derivedEndDate} 
                    />
                </div>
            </div>
        </div>
    );
}
