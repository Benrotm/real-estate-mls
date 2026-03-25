import React from 'react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { Check, X } from 'lucide-react';

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
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden mt-8">
            <div className="p-4 border-b bg-slate-50">
                <h3 className="font-bold text-slate-800">Logging Consistency</h3>
                <p className="text-xs text-slate-500 mt-1">Checkmarks indicate days where ANY activity was logged.</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap text-sm">
                    <thead className="bg-slate-50 border-b text-slate-500 font-bold text-xs uppercase tracking-wide">
                        <tr>
                            <th className="p-4 sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0]">Agent Name</th>
                            {days.map((d, i) => (
                                <th key={i} className="p-3 text-center border-l min-w-[70px]">
                                    <div className="flex flex-col items-center">
                                        <span>{format(d, 'EEEEEE')}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">{format(d, 'dd MMM')}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                        {agents.map((agent, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-4 font-bold text-slate-900 flex items-center gap-3 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-slate-50">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 shrink-0">{agent.id === 'user' ? 'Me' : agent.full_name?.charAt(0) || agent.name?.charAt(0)}</div>
                                    <span className="truncate max-w-[150px]">{agent.full_name || agent.name || 'Agent'}</span>
                                </td>
                                {days.map((d, i) => {
                                    const dateStr = format(d, 'yyyy-MM-dd');
                                    const hasActivity = activities.some(a => (a.agent_id === agent.id || agent.id === 'user') && a.date === dateStr && a.quantity > 0);
                                    
                                    return (
                                        <td key={i} className="p-3 text-center border-l bg-white group-hover:bg-slate-50">
                                            {hasActivity ? (
                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-50 border border-green-200 text-green-600 shadow-sm">
                                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 border border-rose-200 text-rose-500 shadow-sm opacity-60">
                                                    <X className="w-3.5 h-3.5 stroke-[3]" />
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
