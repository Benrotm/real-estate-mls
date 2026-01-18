"use client";
import { MoreHorizontal } from 'lucide-react';

const STAGES = [
    { id: 'new', title: 'New Leads', color: 'bg-blue-500' },
    { id: 'contacted', title: 'Contacted', color: 'bg-yellow-500' },
    { id: 'viewing', title: 'Viewing', color: 'bg-purple-500' },
    { id: 'negotiation', title: 'Negotiation', color: 'bg-orange-500' },
    { id: 'closed', title: 'Closed', color: 'bg-green-500' },
];

const MOCK_LEADS = [
    { id: 1, name: 'Alice Brown', stage: 'new', interest: 'Modern Villa', price: '$5.4M' },
    { id: 2, name: 'Bob Smith', stage: 'new', interest: 'Downtown Condo', price: '$850k' },
    { id: 3, name: 'Charlie Davis', stage: 'contacted', interest: 'Seaside Manor', price: '$2.1M' },
    { id: 4, name: 'Diana Evans', stage: 'viewing', interest: 'Penthouse', price: '$8.2M' },
    { id: 5, name: 'Evan Wright', stage: 'negotiation', interest: 'Eco Retreat', price: '$2.1M' },
    { id: 6, name: 'Fiona Green', stage: 'closed', interest: 'Suburban House', price: '$1.2M' },
];

export default function AgentPipeline() {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Sales Pipeline</h1>
                    <p className="text-foreground/60">Drag and drop leads to move them across stages.</p>
                </div>
                <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90">
                    + Add Lead
                </button>
            </div>

            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-6 min-w-max h-full pb-4">
                    {STAGES.map(stage => (
                        <div key={stage.id} className="w-80 flex flex-col bg-gray-50/50 rounded-xl border border-border h-full">
                            {/* Header */}
                            <div className="p-4 border-b border-border flex items-center justify-between bg-white rounded-t-xl">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                                    <h3 className="font-bold text-sm">{stage.title}</h3>
                                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                        {MOCK_LEADS.filter(l => l.stage === stage.id).length}
                                    </span>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
                            </div>

                            {/* Cards */}
                            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                                {MOCK_LEADS.filter(l => l.stage === stage.id).map(lead => (
                                    <div key={lead.id} className="bg-white p-4 rounded-lg shadow-sm border border-border cursor-grab hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold">{lead.name}</h4>
                                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{lead.price}</span>
                                        </div>
                                        <p className="text-xs text-foreground/60 mb-3">Interested in: {lead.interest}</p>
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 text-xs flex items-center justify-center font-bold text-gray-500">
                                                {lead.name[0]}
                                            </div>
                                            <button className="text-xs text-primary font-medium hover:underline">View Details</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
