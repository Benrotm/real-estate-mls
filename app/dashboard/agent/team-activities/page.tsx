"use client";
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, BarChart2, Filter, Calendar, Settings } from 'lucide-react';

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
            <div className="bg-white border rounded-xl overflow-visible shadow-sm">
                <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-500" />
                    <h3 className="font-bold text-slate-800">Analytics Filters</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Timeframe Filter */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold tracking-wide uppercase text-slate-500">1. Select Timeframe</label>
                        <div className="flex gap-2">
                            <button onClick={()=>setFilterType('monthly')} className={`flex-1 py-2 text-sm font-medium rounded-lg border ${filterType === 'monthly' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Monthly</button>
                            <button onClick={()=>setFilterType('daily')} className={`flex-1 py-2 text-sm font-medium rounded-lg border ${filterType === 'daily' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Daily</button>
                            <button onClick={()=>setFilterType('custom')} className={`flex-1 py-2 text-sm font-medium rounded-lg border ${filterType === 'custom' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Custom Period</button>
                        </div>
                        <div className="pt-2 flex gap-3">
                            {filterType === 'monthly' && (
                                <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                            )}
                            {filterType === 'daily' && (
                                <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm shadow-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                            )}
                            {filterType === 'custom' && (
                                <>
                                    <div className="flex-1 relative">
                                        <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] uppercase font-bold text-slate-400">Start Date</label>
                                        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                    </div>
                                    <div className="flex-1 relative">
                                        <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] uppercase font-bold text-slate-400">End Date</label>
                                        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Agent Filter */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold tracking-wide uppercase text-slate-500 flex justify-between">
                            <span>2. Filter by Agents</span>
                            <button onClick={()=>setSelectedAgents([])} className="text-blue-600 hover:underline capitalize font-medium">Select All</button>
                        </label>
                        <div className="border border-slate-200 rounded-lg p-3 max-h-[120px] overflow-y-auto bg-slate-50 flex flex-wrap gap-2">
                            {agents.length === 0 && <span className="text-sm text-slate-400 p-2">No agents in agency.</span>}
                            {agents.map((ag: any) => {
                                const isSelected = selectedAgents.length === 0 || selectedAgents.includes(ag.id);
                                return (
                                    <label key={ag.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm cursor-pointer transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
                                        <input type="checkbox" className="hidden" checked={selectedAgents.includes(ag.id)} onChange={() => toggleAgent(ag.id)} />
                                        <span className="truncate max-w-[120px] font-medium">{ag.full_name}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="px-4 py-2 bg-white border shadow-lg rounded-full text-sm font-bold text-slate-700 animate-pulse">Refreshing Metrics...</div>
                    </div>
                )}
                <div className="p-4 border-b bg-slate-50 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-slate-500" />
                    <h2 className="text-lg font-bold text-slate-800">
                        Detailed Breakdown 
                        <span className="text-sm font-normal text-slate-500 ml-2">
                            ({filterType === 'monthly' ? format(new Date(`${month}-01`), 'MMMM yyyy') : filterType === 'daily' ? format(new Date(date), 'MMM do, yyyy') : 'Custom Period'})
                        </span>
                    </h2>
                </div>
                
                <div className="overflow-x-auto pb-4">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50 border-b text-slate-500 font-bold text-xs uppercase tracking-wide">
                            <tr>
                                <th className="p-4 sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">Agent Name</th>
                                <th className="p-4 border-l text-center bg-slate-50 text-blue-800" colSpan={2}>Auto-Gen</th>
                                <th className="p-4 border-l text-center bg-indigo-50 text-indigo-800" colSpan={4}>Prospecting Activity</th>
                                <th className="p-4 border-l text-center bg-orange-50 text-orange-800" colSpan={3}>Lead Follow-ups</th>
                            </tr>
                            <tr className="border-t text-[10px]">
                                <th className="p-3 sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0]"></th>
                                <th className="p-3 border-l text-center text-blue-600">Listings</th>
                                <th className="p-3 text-center text-blue-600">Leads</th>
                                
                                <th className="p-3 border-l text-center text-indigo-600">Calls</th>
                                <th className="p-3 text-center text-indigo-600">Appts Sch.</th>
                                <th className="p-3 text-center text-indigo-600">Appts Real.</th>
                                <th className="p-3 text-center text-green-600">Contracts</th>

                                <th className="p-3 border-l text-center text-orange-600">Calls</th>
                                <th className="p-3 text-center text-orange-600">Appts Sch.</th>
                                <th className="p-3 text-center text-rose-600">Appts Real.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-slate-700 text-sm">
                            {Object.values(agentMap).map((agent: any, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-900 flex items-center gap-3 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-slate-50">
                                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 shrink-0">{agent.name.charAt(0)}</div>
                                        {agent.name}
                                    </td>
                                    <td className="p-3 text-center border-l bg-blue-50/30 font-medium">{agent.listings}</td>
                                    <td className="p-3 text-center bg-blue-50/30 font-medium">{agent.leads}</td>
                                    
                                    <td className="p-3 text-center border-l bg-indigo-50/30 font-medium">{agent.p_calls}</td>
                                    <td className="p-3 text-center bg-indigo-50/30 font-medium">{agent.p_appts_sch}</td>
                                    <td className="p-3 text-center bg-indigo-50/30 font-medium">{agent.p_appts_real}</td>
                                    <td className="p-3 text-center bg-green-50/30 font-bold text-green-700">{agent.p_contracts}</td>

                                    <td className="p-3 text-center border-l bg-orange-50/30 font-medium">{agent.l_calls}</td>
                                    <td className="p-3 text-center bg-orange-50/30 font-medium">{agent.l_appts_sch}</td>
                                    <td className="p-3 text-center bg-orange-50/30 font-medium">{agent.l_appts_real}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {agents.length === 0 && (
                        <div className="p-12 text-center text-slate-500">No agents found in your team. Send invites from the "My Team" tab.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
