'use client';

import Link from 'next/link';
import { Building, Users, TrendingUp, Search, Plus, MessageSquare, BarChart, ArrowUpRight, Hammer, Briefcase } from 'lucide-react';

export default function DeveloperDashboard() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Stripe */}
            <div className="bg-[#1e293b] text-white py-8 px-4 sm:px-6 lg:px-8 mt-16">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                            <Hammer className="w-3 h-3" /> Developer Workspace
                        </div>
                        <h1 className="text-3xl font-bold">Welcome back, Developer</h1>
                        <p className="text-slate-400 mt-1">Track your projects and development progress</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="w-full bg-white text-slate-900 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                        </div>
                        <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors whitespace-nowrap text-sm shadow-lg shadow-cyan-500/20">
                            <Plus className="w-4 h-4" /> New Project
                        </button>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">

                {/* 1. Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Active Projects */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Active Projects</div>
                            <div className="text-3xl font-bold text-slate-900">3</div>
                            <div className="text-xs text-slate-400 mt-1">1 planning, 2 under construction</div>
                        </div>
                        <div className="w-10 h-10 bg-cyan-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <Building className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Total Units */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Total Units</div>
                            <div className="text-3xl font-bold text-slate-900">142</div>
                            <div className="text-xs text-slate-400 mt-1">Across all projects</div>
                        </div>
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Hammer className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Project Inquiries */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Project Inquiries</div>
                            <div className="text-3xl font-bold text-slate-900">28</div>
                            <div className="text-xs text-green-500 mt-1 font-bold flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> +12% this week
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Investment Value */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-slate-500 mb-1">Investment Value</div>
                            <div className="text-3xl font-bold text-slate-900">$12.4M</div>
                            <div className="text-xs text-slate-400 mt-1">Total estimated value</div>
                        </div>
                        <div className="w-10 h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Briefcase className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* 2. Portfolio Banner */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg mb-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-sm font-medium text-cyan-300 mb-1">Project Milestones</div>
                        <div className="text-3xl font-bold text-white">Next Phase: Completion</div>
                        <p className="text-slate-400 text-sm mt-1">Skyline Tower - Exterior Work (85% done)</p>
                    </div>

                    <div className="flex gap-12 mt-4 md:mt-0 relative z-10 text-center">
                        <div className="relative">
                            <div className="text-3xl font-bold text-cyan-400">85%</div>
                            <div className="text-xs text-slate-400">Completion</div>
                        </div>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-32 pointer-events-none"></div>
                </div>

                {/* 3. Tools & Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Market Analysis */}
                    <Link href="#" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <BarChart className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">Market Analysis</h3>
                            <p className="text-slate-500 text-sm">Analyze demand for new developments.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </Link>

                    {/* Cost Estimation */}
                    <Link href="#" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Briefcase className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">Cost Planner</h3>
                            <p className="text-slate-500 text-sm">Estimate construction and material costs.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </Link>

                    {/* Messages / Chat */}
                    <Link href="/dashboard/developer/chat" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex items-center gap-6 hover:shadow-md transition-all group">
                        <div className="w-16 h-16 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-cyan-600 transition-colors">Team Chat</h3>
                            <p className="text-slate-500 text-sm">Collaborate with architects and agents.</p>
                        </div>
                    </Link>
                </div>

                {/* 4. Active Projects List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 text-lg">Active Projects</h3>
                        <button className="text-sm font-bold text-cyan-600 hover:text-cyan-700">View All Projects</button>
                    </div>

                    <div className="space-y-4">
                        {/* Project 1 */}
                        <div className="flex flex-col md:flex-row items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="w-full md:w-48 h-32 bg-slate-200 rounded-lg overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400" alt="Project" className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">Construction</div>
                            </div>
                            <div className="flex-1 w-full text-center md:text-left">
                                <h4 className="font-bold text-slate-900 text-lg">Skyline Tower</h4>
                                <p className="text-slate-500 text-sm mb-2">120 Units • Downtown District</p>
                                <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                                    <div className="bg-green-500 h-2 rounded-full w-[85%]"></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Progress</span>
                                    <span>85%</span>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <button className="flex-1 md:flex-none border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:border-slate-300 transition-colors">Details</button>
                                <button className="flex-1 md:flex-none bg-cyan-500 px-4 py-2 rounded-lg text-sm font-bold text-white hover:bg-cyan-600 transition-colors">Manage</button>
                            </div>
                        </div>

                        {/* Project 2 */}
                        <div className="flex flex-col md:flex-row items-center gap-4 p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="w-full md:w-48 h-32 bg-slate-200 rounded-lg overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400" alt="Project" className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">Planning</div>
                            </div>
                            <div className="flex-1 w-full text-center md:text-left">
                                <h4 className="font-bold text-slate-900 text-lg">Riverside Estates</h4>
                                <p className="text-slate-500 text-sm mb-2">22 Luxury Villas • Riverside</p>
                                <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                                    <div className="bg-blue-500 h-2 rounded-full w-[30%]"></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>Progress</span>
                                    <span>30%</span>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                <button className="flex-1 md:flex-none border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:border-slate-300 transition-colors">Details</button>
                                <button className="flex-1 md:flex-none bg-cyan-500 px-4 py-2 rounded-lg text-sm font-bold text-white hover:bg-cyan-600 transition-colors">Manage</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
