import { TrendingUp, Users, Phone, Calendar, DollarSign } from 'lucide-react';

export default function AgentDashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold mb-2">Agent Overview</h1>
                <p className="text-foreground/60">Welcome back, Sarah. Here's your performance for today.</p>
            </div>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-primary/10 p-3 rounded-lg text-primary">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <h3 className="text-2xl font-bold">$2.4M</h3>
                    <p className="text-sm text-foreground/60">Sales Volume (YTD)</p>
                </div>

                <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-secondary/10 p-3 rounded-lg text-secondary">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">+5</span>
                    </div>
                    <h3 className="text-2xl font-bold">142</h3>
                    <p className="text-sm text-foreground/60">Active Leads</p>
                </div>

                <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-500/10 p-3 rounded-lg text-blue-500">
                            <Phone className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">-2</span>
                    </div>
                    <h3 className="text-2xl font-bold">18/30</h3>
                    <p className="text-sm text-foreground/60">Daily Calls Goal</p>
                </div>

                <div className="p-6 bg-card border border-border rounded-xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-500/10 p-3 rounded-lg text-purple-500">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Today</span>
                    </div>
                    <h3 className="text-2xl font-bold">4</h3>
                    <p className="text-sm text-foreground/60">Appointments Booked</p>
                </div>
            </div>

            {/* Pipeline & Tasks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Upcoming Appointments</h3>
                    <div className="space-y-4">
                        {[
                            { time: '10:00 AM', client: 'John Doe', type: 'Viewing', loc: '123 Palm Ave' },
                            { time: '1:30 PM', client: 'Jane Smith', type: 'Listing Pres', loc: '456 Oak Ln' },
                            { time: '4:00 PM', client: 'Mike Johnson', type: 'Closing', loc: 'Office' },
                        ].map((apt, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
                                <div className="w-16 text-center">
                                    <div className="font-bold text-sm">{apt.time}</div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold">{apt.client}</div>
                                    <div className="text-xs text-foreground/60">{apt.type} • {apt.loc}</div>
                                </div>
                                <button className="text-xs bg-primary text-white px-3 py-1 rounded-md">View</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
                    <div className="relative border-l border-border ml-3 space-y-6 pl-6 pb-2">
                        {[
                            { text: 'Logged 15 calls for Prospecting', time: '2 hours ago' },
                            { text: 'Added new listing: Sunset Villa', time: '4 hours ago' },
                            { text: 'Contract signed with Alice Brown', time: 'Yesterday' },
                            { text: 'Updated valuation for Penthouse', time: 'Yesterday' },
                        ].map((act, i) => (
                            <div key={i} className="relative">
                                <div className="absolute -left-[29px] top-1 w-3 h-3 bg-secondary rounded-full border-2 border-card"></div>
                                <div className="text-sm text-foreground/80">{act.text}</div>
                                <div className="text-xs text-foreground/40">{act.time}</div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 text-sm text-center text-primary font-medium hover:underline">View All History</button>
                </div>
            </div>
        </div>
    );
}
