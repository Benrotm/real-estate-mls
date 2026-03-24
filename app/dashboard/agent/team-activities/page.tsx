"use client";
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Users, BarChart2, Plus, Phone, Calendar as CalendarIcon, FileText, Check } from 'lucide-react';

export default function TeamActivities() {
    const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamActivities = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/activities/team?month=${month}`);
                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTeamActivities();
    }, [month]);

    if (loading) return <div className="p-8">Loading team activities...</div>;
    if (!data) return null;

    // Process data to aggregate by agent
    const agents = data.members || [];
    const activities = data.teamActivities || [];
    const autoListings = data.autoListingsRaw || [];
    const autoLeads = data.autoLeadsRaw || [];

    const agentMap: Record<string, any> = {};
    agents.forEach((a: any) => {
        agentMap[a.id] = { 
            name: a.full_name, 
            calls: 0, 
            appts: 0, 
            contracts: 0, 
            listings: autoListings.filter((l:any)=>l.owner_id===a.id).length,
            leads: autoLeads.filter((l:any)=>l.agent_id===a.id).length 
        };
    });

    activities.forEach((act: any) => {
        if (!agentMap[act.agent_id]) return;
        if (act.activity_type.includes('call')) agentMap[act.agent_id].calls += act.quantity;
        if (act.activity_type.includes('appt')) agentMap[act.agent_id].appts += act.quantity;
        if (act.activity_type.includes('contract')) agentMap[act.agent_id].contracts += act.quantity;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Team Activities</h1>
                    <p className="text-slate-500 mt-1">Monitor the daily and monthly output of your entire team.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="month" 
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-bold text-slate-800">Activity Leaderboard ({format(new Date(`${month}-01`), 'MMMM yyyy')})</h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b text-slate-500 font-bold text-xs uppercase tracking-wide">
                            <tr>
                                <th className="p-4">Agent Name</th>
                                <th className="p-4 text-center">New Listings</th>
                                <th className="p-4 text-center">New Leads</th>
                                <th className="p-4 text-center">Total Calls</th>
                                <th className="p-4 text-center">Appts Handled</th>
                                <th className="p-4 text-center">Contracts signed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-slate-700">
                            {Object.values(agentMap).map((agent: any, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">{agent.name.charAt(0)}</div>
                                        {agent.name}
                                    </td>
                                    <td className="p-4 text-center font-medium">
                                        <div className="inline-flex items-center justify-center bg-blue-100 text-blue-700 min-w-[2rem] h-8 rounded-lg px-2 text-sm">{agent.listings}</div>
                                    </td>
                                    <td className="p-4 text-center font-medium">
                                        <div className="inline-flex items-center justify-center bg-orange-100 text-orange-700 min-w-[2rem] h-8 rounded-lg px-2 text-sm">{agent.leads}</div>
                                    </td>
                                    <td className="p-4 text-center font-medium text-sm">{agent.calls}</td>
                                    <td className="p-4 text-center font-medium text-sm">{agent.appts}</td>
                                    <td className="p-4 text-center font-medium">
                                        <div className="inline-flex items-center justify-center bg-green-100 text-green-700 min-w-[2rem] h-8 rounded-lg px-2 text-sm">{agent.contracts}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {agents.length === 0 && (
                        <div className="p-8 text-center text-slate-500">No agents found in your team.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
