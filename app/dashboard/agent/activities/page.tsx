"use client";
import { useState } from 'react';
import { Plus, Check, Phone, Calendar, FileText } from 'lucide-react';

export default function AgentActivities() {
    // Mock State
    const [metrics, setMetrics] = useState({
        calls: 18,
        callsGoal: 30,
        appointmentsBooked: 4,
        appointmentsGoal: 5,
        appointmentsRealised: 2,
        contractsSigned: 0,
        contractsGoal: 1
    });

    const increment = (key: keyof typeof metrics) => {
        setMetrics(prev => ({ ...prev, [key]: prev[key] + 1 }));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold mb-2">Daily Activity Tracker</h1>
                <p className="text-foreground/60">Log your daily actions to track performance against goals.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Phone Calls */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <Phone className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Phone Calls</h3>
                                <p className="text-sm text-foreground/60">Prospecting & Follow-ups</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{metrics.calls} <span className="text-sm text-foreground/40 font-normal">/ {metrics.callsGoal}</span></div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
                        <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((metrics.calls / metrics.callsGoal) * 100, 100)}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => increment('calls')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 active:scale-95 transition-all">
                            <Plus className="w-4 h-4" /> Log Call
                        </button>
                    </div>
                </div>

                {/* Appointments */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Appointments</h3>
                                <p className="text-sm text-foreground/60">Booked & Realised showings</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{metrics.appointmentsBooked} <span className="text-sm text-foreground/40 font-normal">/ {metrics.appointmentsGoal}</span></div>
                        </div>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
                        <div
                            className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((metrics.appointmentsBooked / metrics.appointmentsGoal) * 100, 100)}%` }}
                        ></div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                        <button onClick={() => increment('appointmentsBooked')} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 active:scale-95 transition-all">
                            <Plus className="w-4 h-4" /> Booked
                        </button>
                        <button onClick={() => increment('appointmentsRealised')} className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 active:scale-95 transition-all">
                            <Check className="w-4 h-4" /> Mark Realised ({metrics.appointmentsRealised})
                        </button>
                    </div>
                </div>

                {/* Contracts */}
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Contracts Signed</h3>
                                <p className="text-sm text-foreground/60">Listings or Sales closed</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{metrics.contractsSigned} <span className="text-sm text-foreground/40 font-normal">/ {metrics.contractsGoal}</span></div>
                        </div>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
                        <div
                            className="bg-green-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((metrics.contractsSigned / metrics.contractsGoal) * 100, 100)}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => increment('contractsSigned')} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 active:scale-95 transition-all">
                            <Plus className="w-4 h-4" /> Log Contract
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
