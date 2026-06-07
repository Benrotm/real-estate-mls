"use client";
import React, { useState, useEffect } from 'react';
import { format, endOfMonth, parseISO } from 'date-fns';
import { Users, BarChart2, Filter, Calendar, Settings } from 'lucide-react';
import ActivityConsistencyTable from '@/app/components/dashboard/ActivityConsistencyTable';

export default function TeamActivities() {
    const [filterType, setFilterType] = useState<'monthly' | 'daily' | 'custom'>('monthly');
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-01'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchTeamActivities = async () => {
        setLoading(true);
        try {
            let url = `/api/activities/team?`;
            if (filterType === 'monthly') url += `month=${month}&`;
            else if (filterType === 'daily') url += `date=${date}&`;
            else url += `startDate=${startDate}&endDate=${endDate}&`;

            if (selectedAgents.length > 0) {
                url += `agentIds=${selectedAgents.join(',')}`;
            }

            const res = await fetch(url);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamActivities();
    }, [filterType, month, date, startDate, endDate, selectedAgents]); // any change triggers refetch

    if (loading && !data) return <div className="p-8">Loading team activities...</div>;

    // Process data to aggregate by agent
    // Note: To show agents, we show what is returned in members OR we can always show all members if we cache the first fetch.
    // The backend ALWAYS returns the full members list regardless of `agentIds` filter.
    const agents = data?.members || [];
    const activities = data?.teamActivities || [];
    const autoListings = data?.autoListingsRaw || [];
    const autoLeads = data?.autoLeadsRaw || [];

    const agentMap: Record<string, any> = {};

    // Only populate agentMap with agents that are currently "selected", or ALL if none selected
    const activeAgents = selectedAgents.length > 0 ? agents.filter((a:any) => selectedAgents.includes(a.id)) : agents;

    activeAgents.forEach((a: any) => {
        agentMap[a.id] = { 
            name: a.full_name, 
            listings: autoListings.filter((l:any)=>l.owner_id===a.id).length,
            leads: autoLeads.filter((l:any)=>l.agent_id===a.id).length,
            p_calls: 0,
            p_appts_sch: 0,
            p_appts_real: 0,
            p_contracts: 0,
            l_calls: 0,
            l_appts_sch: 0,
            l_appts_real: 0
        };
    });

    activities.forEach((act: any) => {
        if (!agentMap[act.agent_id]) return; // if filtered out

        switch(act.activity_type) {
            case 'prospecting_call': agentMap[act.agent_id].p_calls += act.quantity; break;
            case 'prospecting_appt_scheduled': agentMap[act.agent_id].p_appts_sch += act.quantity; break;
            case 'prospecting_appt_realised': agentMap[act.agent_id].p_appts_real += act.quantity; break;
            case 'prospecting_contract': agentMap[act.agent_id].p_contracts += act.quantity; break;
            case 'lead_call': agentMap[act.agent_id].l_calls += act.quantity; break;
            case 'lead_appt_scheduled': agentMap[act.agent_id].l_appts_sch += act.quantity; break;
            case 'lead_appt_realised': agentMap[act.agent_id].l_appts_real += act.quantity; break;
        }
    });

    const toggleAgent = (id: string) => {
        if (selectedAgents.includes(id)) {
            setSelectedAgents(selectedAgents.filter(a => a !== id));
        } else {
            setSelectedAgents([...selectedAgents, id]);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Team Activities</h1>
                    <p className="text-slate-500 mt-1">Monitor daily, monthly, and custom output of your team.</p>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-visible shadow-lg shadow-slate-200/50">
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Filter className="w-4 h-4 text-slate-600" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg tracking-tight">Analytics Filters</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Timeframe Filter */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold tracking-widest uppercase text-slate-400">1. Select Timeframe</label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button onClick={()=>setFilterType('monthly')} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${filterType === 'monthly' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Monthly</button>
                            <button onClick={()=>setFilterType('daily')} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${filterType === 'daily' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Daily</button>
                            <button onClick={()=>setFilterType('custom')} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${filterType === 'custom' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>Custom Period</button>
                        </div>
                        <div className="pt-2 flex gap-3">
                            {filterType === 'monthly' && (
                                <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-700 font-medium" />
                            )}
                            {filterType === 'daily' && (
                                <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-700 font-medium" />
                            )}
                            {filterType === 'custom' && (
                                <>
                                    <div className="flex-1 relative">
                                        <label className="absolute -top-2.5 left-3 bg-white px-2 text-[10px] uppercase font-bold text-slate-400">Start Date</label>
                                        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-700 font-medium" />
                                    </div>
                                    <div className="flex-1 relative">
                                        <label className="absolute -top-2.5 left-3 bg-white px-2 text-[10px] uppercase font-bold text-slate-400">End Date</label>
                                        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-700 font-medium" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Agent Filter */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold tracking-widest uppercase text-slate-400 flex justify-between items-center">
                            <span>2. Filter by Agents</span>
                            <button onClick={()=>setSelectedAgents([])} className="text-blue-600 hover:text-blue-700 hover:underline capitalize font-semibold tracking-normal text-sm">Select All</button>
                        </label>
                        <div className="border-2 border-slate-100 rounded-xl p-4 max-h-[140px] overflow-y-auto bg-slate-50/50 flex flex-wrap gap-2 shadow-inner">
                            {agents.length === 0 && <span className="text-sm text-slate-400 p-2 font-medium">No agents in agency.</span>}
                            {agents.map((ag: any) => {
                                const isSelected = selectedAgents.length === 0 || selectedAgents.includes(ag.id);
                                return (
                                    <label key={ag.id} className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                                        <input type="checkbox" className="hidden" checked={selectedAgents.includes(ag.id)} onChange={() => toggleAgent(ag.id)} />
                                        <span className="truncate max-w-[140px]">{ag.full_name}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-30 flex items-center justify-center transition-all duration-300">
                        <div className="px-6 py-3 bg-white border-2 border-slate-200 shadow-xl rounded-full text-sm font-bold text-slate-700 animate-pulse flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                            Refreshing Metrics...
                        </div>
                    </div>
                )}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <BarChart2 className="w-4 h-4 text-slate-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                        Detailed Breakdown 
                        <span className="text-sm font-medium text-slate-400 ml-3">
                            ({filterType === 'monthly' ? format(new Date(`${month}-01`), 'MMMM yyyy') : filterType === 'daily' ? format(new Date(date), 'MMM do, yyyy') : 'Custom Period'})
                        </span>
                    </h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="text-xs uppercase tracking-wider font-bold">
                            <tr>
                                <th className="p-4 sticky left-0 bg-slate-50 border-b border-r border-slate-200 z-20 text-slate-500 align-bottom shadow-[1px_0_0_0_#e2e8f0]">Agent Name</th>
                                <th className="p-4 border-b border-slate-200 text-center bg-blue-50/50 text-blue-700 border-r" colSpan={2}>Auto-Gen</th>
                                <th className="p-4 border-b border-slate-200 text-center bg-indigo-50/50 text-indigo-700 border-r" colSpan={4}>Prospecting Activity</th>
                                <th className="p-4 border-b border-slate-200 text-center bg-orange-50/50 text-orange-700" colSpan={3}>Lead Follow-ups</th>
                            </tr>
                            <tr className="border-b-2 border-slate-200 text-[10px] bg-slate-50/30">
                                <th className="p-3 sticky left-0 bg-white border-r border-slate-200 z-20 shadow-[1px_0_0_0_#e2e8f0]"></th>
                                <th className="p-3 border-r border-slate-100 text-center text-blue-500">Listings</th>
                                <th className="p-3 border-r border-slate-200 text-center text-blue-500">Leads</th>
                                
                                <th className="p-3 border-r border-slate-100 text-center text-indigo-500">Calls</th>
                                <th className="p-3 border-r border-slate-100 text-center text-indigo-500">Appts Sch.</th>
                                <th className="p-3 border-r border-slate-100 text-center text-indigo-500">Appts Real.</th>
                                <th className="p-3 border-r border-slate-200 text-center text-emerald-500">Contracts</th>

                                <th className="p-3 border-r border-slate-100 text-center text-orange-500">Calls</th>
                                <th className="p-3 border-r border-slate-100 text-center text-orange-500">Appts Sch.</th>
                                <th className="p-3 text-center text-rose-500">Appts Real.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm bg-white">
                            {Object.values(agentMap).map((agent: any, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-4 font-bold text-slate-800 flex items-center gap-3 sticky left-0 bg-white border-r border-slate-100 z-10 shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/80 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 shadow-inner flex items-center justify-center text-xs text-slate-600 shrink-0 font-bold">{agent.name.charAt(0)}</div>
                                        {agent.name}
                                    </td>
                                    <td className="p-3 text-center border-r border-slate-100 bg-blue-50/10 font-semibold text-slate-700">{agent.listings}</td>
                                    <td className="p-3 text-center border-r border-slate-100 bg-blue-50/10 font-semibold text-slate-700">{agent.leads}</td>
                                    
                                    <td className="p-3 text-center border-r border-slate-100 bg-indigo-50/10 font-semibold text-slate-700">{agent.p_calls}</td>
                                    <td className="p-3 text-center border-r border-slate-100 bg-indigo-50/10 font-semibold text-slate-700">{agent.p_appts_sch}</td>
                                    <td className="p-3 text-center border-r border-slate-100 bg-indigo-50/10 font-semibold text-slate-700">{agent.p_appts_real}</td>
                                    <td className="p-3 text-center border-r border-slate-100 bg-emerald-50/20 font-bold text-emerald-700">{agent.p_contracts}</td>

                                    <td className="p-3 text-center border-r border-slate-100 bg-orange-50/10 font-semibold text-slate-700">{agent.l_calls}</td>
                                    <td className="p-3 text-center border-r border-slate-100 bg-orange-50/10 font-semibold text-slate-700">{agent.l_appts_sch}</td>
                                    <td className="p-3 text-center bg-rose-50/10 font-semibold text-slate-700">{agent.l_appts_real}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {agents.length === 0 && (
                        <div className="p-16 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                <Users className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">No agents found</h3>
                            <p className="text-slate-500 mt-1 max-w-sm mx-auto">You do not have any active agents in your team. Send invites from the "My Team" tab.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Consistency Table Component */}
            {(() => {
                let derivedStartDate = startDate;
                let derivedEndDate = endDate;
                if (filterType === 'monthly') {
                    derivedStartDate = `${month}-01`;
                    derivedEndDate = format(endOfMonth(parseISO(`${month}-01`)), 'yyyy-MM-dd');
                } else if (filterType === 'daily') {
                    derivedStartDate = date;
                    derivedEndDate = date;
                }
                
                return (
                    <ActivityConsistencyTable 
                        activities={activities} 
                        agents={activeAgents} 
                        startDateStr={derivedStartDate} 
                        endDateStr={derivedEndDate} 
                        autoListings={autoListings}
                        autoLeads={autoLeads}
                    />
                );
            })()}
        </div>
    );
}
