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
        <div className="mt-16 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Consistency</h2>
            
            <div className="bg-white border border-slate-200 rounded-2xl overflow-visible shadow-lg shadow-slate-200/50">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Filter className="w-4 h-4 text-slate-600" />
                    </div>
                    <h3 className="text-lg tracking-tight font-bold text-slate-800">Timeframe Filter</h3>
                </div>
                <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                        <button onClick={()=>setFilterType('monthly')} className={`flex-1 md:px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${filterType === 'monthly' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Monthly</button>
                        <button onClick={()=>setFilterType('custom')} className={`flex-1 md:px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${filterType === 'custom' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Custom Period</button>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        {filterType === 'monthly' && (
                            <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="w-full md:w-56 bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-700 transition-all" />
                        )}
                        {filterType === 'custom' && (
                            <div className="flex gap-2 items-center w-full">
                                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-700 transition-all" />
                                <span className="font-medium text-slate-400 px-1">to</span>
                                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-700 transition-all" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="relative pt-2">
                {loading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-30 flex items-center justify-center rounded-2xl transition-all duration-300">
                        <div className="px-6 py-3 bg-white border-2 border-slate-200 shadow-xl rounded-full text-sm font-bold text-slate-700 animate-pulse flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                            Refreshing Metrics...
                        </div>
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
