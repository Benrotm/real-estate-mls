import { impersonateRole } from '@/app/lib/admin';
import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { Shield, Eye, BarChart } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
    const profile = await getUserProfile();

    // Security Check
    if (!profile || profile.role !== 'super_admin') {
        redirect('/dashboard'); // Kick out non-admins
    }



    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Shield className="w-8 h-8 text-red-500" />
                            Super Admin Console
                        </h1>
                        <p className="text-slate-400 mt-2">System Controls & Configuration</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
                            Logged in as <span className="text-red-400 font-bold">{profile.full_name || 'Admin'}</span>
                        </div>
                    </div>
                </header>

                {/* 1. Impersonation System */}
                <section className="mb-12 bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Eye className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Impersonation Mode</h2>
                            <p className="text-sm text-slate-400">View the platform as a specific user role.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['owner', 'client', 'agent', 'developer'].map((role) => (
                            <form key={role} action={async () => {
                                'use server';
                                await impersonateRole(role as any);
                            }}>
                                <button className="w-full p-4 rounded-xl border border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-left group">
                                    <div className="font-bold capitalize group-hover:text-blue-400 flex items-center justify-between">
                                        {role}
                                        <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">View as {role}</div>
                                </button>
                            </form>
                        ))}
                    </div>
                </section>

                {/* 2. Market Systems */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-cyan-500/10 rounded-lg">
                            <BarChart className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Market Systems</h2>
                            <p className="text-sm text-slate-400">Manage and view market data analytics.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/dashboard/admin/analytics" className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-cyan-500 hover:bg-cyan-500/5 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                    <BarChart className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold group-hover:text-cyan-400 transition-colors">Market Analytics</h3>
                            <p className="text-sm text-slate-500 mt-1">Deep market data & system-wide trends.</p>
                        </Link>
                    </div>
                </section>

                {/* 2. Feature Management Moved to /dashboard/admin/plans */}

            </div>
        </div>
    );
}


