import React from 'react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { Check, X, CalendarDays } from 'lucide-react';

interface Props {
    activities: any[];
    agents: any[];
    startDateStr: string;
    endDateStr: string;
}

export default function ActivityConsistencyTable({ activities, agents, startDateStr, endDateStr }: Props) {
    if (!startDateStr || !endDateStr) return null;

    let days: Date[] = [];
    try {
        const start = parseISO(startDateStr);
        const end = parseISO(endDateStr);
        if (end >= start) {
            days = eachDayOfInterval({ start, end });
        }
    } catch (e) {
        return null;
    }

    if (days.length === 0) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/40 overflow-hidden relative mt-8">
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 tracking-tight text-lg">Logging Consistency</h3>
                        <p className="text-xs text-slate-500 font-medium">Checkmarks indicate days where ANY activity was logged.</p>
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap text-sm">
                    <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                        <tr>
                            <th className="p-4 sticky left-0 bg-slate-50 border-r border-slate-200 z-20 shadow-[1px_0_0_0_#e2e8f0]">Agent Name</th>
                            {days.map((d, i) => (
                                <th key={i} className="p-3 text-center border-r border-slate-100 min-w-[75px]">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-slate-600 font-bold">{format(d, 'EEE')}</span>
                                        <span className="text-slate-400 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-sm">{format(d, 'dd MMM')}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {agents.map((agent, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="p-4 font-bold text-slate-800 flex items-center gap-3 sticky left-0 bg-white border-r border-slate-100 z-10 shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50/80 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 shadow-inner flex items-center justify-center text-xs text-slate-600 shrink-0 font-bold">
                                        {agent.id === 'user' ? 'Me' : agent.full_name?.charAt(0) || agent.name?.charAt(0)}
                                    </div>
                                    <span className="truncate max-w-[150px]">{agent.full_name || agent.name || 'Agent'}</span>
                                </td>
                                {days.map((d, i) => {
                                    const dateStr = format(d, 'yyyy-MM-dd');
                                    const hasActivity = activities.some(a => (a.agent_id === agent.id || agent.id === 'user') && a.date === dateStr && a.quantity > 0);
                                    
                                    return (
                                        <td key={i} className="p-3 text-center border-r border-slate-100 bg-white group-hover:bg-slate-50/80 transition-colors">
                                            {hasActivity ? (
                                                <div className="mx-auto flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-green-50 to-green-100 border border-green-200 text-green-600 shadow-sm shadow-green-500/20">
                                                    <Check className="w-4 h-4 stroke-[3]" />
                                                </div>
                                            ) : (
                                                <div className="mx-auto flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 border border-slate-200 text-slate-300">
                                                    <X className="w-4 h-4 stroke-[2]" />
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
