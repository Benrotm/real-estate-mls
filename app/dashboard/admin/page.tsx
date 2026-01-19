import Link from 'next/link';
import { Shield, Users, DollarSign, Activity, AlertTriangle, Settings, Lock, Database, ArrowUpRight, Search, Globe } from 'lucide-react';

export default function SuperAdminDashboard() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Stripe */}
            <div className="bg-[#0f172a] text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider mb-1">
                            <Shield className="w-3 h-3" /> Super Admin Control
                        </div>
                        <h1 className="text-3xl font-bold">System Overview</h1>
                        <p className="text-slate-400 mt-1">Manage users, permissions, and global settings</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                            <Activity className="w-3 h-3" /> System Healthy
                        </span>
                        <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Global Config
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">

                {/* 1. Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Users */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Total Users</div>
                            <div className="text-3xl font-bold text-slate-900">1,248</div>
                            <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" /> +12% this month
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Revenue */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Total Revenue</div>
                            <div className="text-3xl font-bold text-slate-900">$48.2k</div>
                            <div className="text-xs text-slate-400 mt-1">YTD Earnings</div>
                        </div>
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Active Sessions</div>
                            <div className="text-3xl font-bold text-slate-900">342</div>
                            <div className="text-xs text-slate-400 mt-1">Current traffic</div>
                        </div>
                        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5" />
                        </div>
                    </div>

                    {/* System Issues */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Open Tickets</div>
                            <div className="text-3xl font-bold text-slate-900">3</div>
                            <div className="text-xs text-red-500 mt-1">Action required</div>
                        </div>
                        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 2. Management Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* User Permissions (Span 2) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* User List */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                                    <Lock className="w-4 h-4 text-red-500" /> User Permissions & Roles
                                </h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search user..."
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-red-500"
                                    />
                                    <button className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold">
                                        Manage Roles
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 rounded-l-lg">User</th>
                                            <th className="px-4 py-3">Role</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 rounded-r-lg">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">BS</div>
                                                <div>
                                                    <div>ben.silion</div>
                                                    <div className="text-xs text-slate-400">bensilion@gmail.com</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">Super Admin</span>
                                            </td>
                                            <td className="px-4 py-3 text-green-600 font-medium">Active</td>
                                            <td className="px-4 py-3">
                                                <button className="text-slate-400 hover:text-slate-900 font-medium">Edit</button>
                                            </td>
                                        </tr>
                                        <tr className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 font-bold">JD</div>
                                                <div>
                                                    <div>John Doe</div>
                                                    <div className="text-xs text-slate-400">john@example.com</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded">Agent</span>
                                            </td>
                                            <td className="px-4 py-3 text-green-600 font-medium">Active</td>
                                            <td className="px-4 py-3">
                                                <button className="text-slate-400 hover:text-slate-900 font-medium">Edit</button>
                                            </td>
                                        </tr>
                                        <tr className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold">AS</div>
                                                <div>
                                                    <div>Alice Smith</div>
                                                    <div className="text-xs text-slate-400">alice@example.com</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded">Owner</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 font-medium">Inactive</td>
                                            <td className="px-4 py-3">
                                                <button className="text-slate-400 hover:text-slate-900 font-medium">Edit</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Activity Logs */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-6">
                                <Database className="w-4 h-4 text-slate-500" /> System Logs
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { msg: 'User bansilion@gmail.com updated global settings', time: '2 mins ago', type: 'Config' },
                                    { msg: 'New property listing pending approval: ID #8493', time: '15 mins ago', type: 'Listing' },
                                    { msg: 'Failed login attempt from IP 192.168.1.1', time: '1 hour ago', type: 'Security' }
                                ].map((log, i) => (
                                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                        <div className={`w-2 h-2 mt-2 rounded-full ${log.type === 'Security' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-slate-900">{log.msg}</div>
                                            <div className="text-xs text-slate-400">{log.time} • {log.type}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1/3 width) */}
                    <div className="space-y-8">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-6">Admin Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Users className="w-4 h-4" /> Manage All Users
                                </button>
                                <button className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Lock className="w-4 h-4" /> Reset Permissions
                                </button>
                                <button className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Database className="w-4 h-4" /> Backup Database
                                </button>
                            </div>
                        </div>

                        {/* System Status */}
                        <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white">
                            <h3 className="font-bold mb-6 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-400" /> System Status
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-400">CPU Usage</span>
                                        <span className="font-bold text-green-400">12%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                                        <div className="bg-green-400 h-1.5 rounded-full w-[12%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-400">Memory</span>
                                        <span className="font-bold text-blue-400">48%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                                        <div className="bg-blue-400 h-1.5 rounded-full w-[48%]"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-400">Storage</span>
                                        <span className="font-bold text-orange-400">76%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                                        <div className="bg-orange-400 h-1.5 rounded-full w-[76%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
