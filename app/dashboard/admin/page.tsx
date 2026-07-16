import { impersonateRole } from '@/app/lib/admin';
import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { Shield, Eye, BarChart } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
    const profile = await getUserProfile();

    // Security Check
    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin')) {
        redirect('/dashboard'); // Kick out non-admins
    }

    const isSuperAdmin = profile.role === 'super_admin';

    return (
        <div className="min-h-screen bg-slate-950 text-white px-0 py-2 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-12 border-b border-slate-800 pb-4 md:pb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                            <Shield className="w-8 h-8 text-red-500" />
                            {isSuperAdmin ? 'Super Admin Console' : 'Admin Console'}
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">System Controls & Configuration</p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 text-xs md:text-sm w-full sm:w-auto text-center sm:text-left">
                            Logged in as <span className="text-red-400 font-bold">{profile.full_name || 'Admin'}</span>
                        </div>
                    </div>
                </header>

                {/* 1. Impersonation System (Super Admin Only) */}
                {isSuperAdmin && (
                    <section className="mb-6 md:mb-12 bg-slate-900/50 p-3 md:p-8 rounded-xl md:rounded-2xl border border-slate-800 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-500/10 rounded-lg">
                                <Eye className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-bold">Impersonation Mode</h2>
                                <p className="text-xs md:text-sm text-slate-400">View the platform as a specific user role.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                            {['owner', 'client', 'agent', 'developer'].map((role) => (
                                <form key={role} action={async () => {
                                    'use server';
                                    await impersonateRole(role as any);
                                }}>
                                    <button className="w-full p-3 md:p-4 rounded-lg md:rounded-xl border border-slate-700 hover:border-blue-500 hover:bg-blue-500/5 transition-all text-left group">
                                        <div className="font-bold capitalize text-sm md:text-base group-hover:text-blue-400 flex items-center justify-between">
                                            {role}
                                            <Eye className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="text-[10px] md:text-xs text-slate-500 mt-1">View as {role}</div>
                                    </button>
                                </form>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. Access Control System (Super Admin Only) */}
                {isSuperAdmin && (
                    <section className="mb-6 md:mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-500/10 rounded-lg">
                                <Shield className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg md:text-xl font-bold">Access Control & Security</h2>
                                <p className="text-xs md:text-sm text-slate-400">Manage user role definitions and system capabilities matrix.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <Link href="/dashboard/admin/permissions" className="bg-slate-900/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-800 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                        <Shield className="w-6 h-6" />
                                    </div>
                                </div>
                                <h3 className="text-base md:text-lg font-bold group-hover:text-indigo-400 transition-colors">User Permission Matrix</h3>
                                <p className="text-xs md:text-sm text-slate-500 mt-1">Full view of system capabilities mapped to plans & roles, plus user role manager.</p>
                            </Link>
                        </div>
                    </section>
                )}

                {/* 3. Market Systems */}
                <section className="mb-6 md:mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-cyan-500/10 rounded-lg">
                            <BarChart className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold">Market Systems</h2>
                            <p className="text-xs md:text-sm text-slate-400">Manage and view market data analytics.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <Link href="/dashboard/admin/analytics" className="bg-slate-900/50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-800 hover:border-cyan-500 hover:bg-cyan-500/5 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                                    <BarChart className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-base md:text-lg font-bold group-hover:text-cyan-400 transition-colors">Market Analytics</h3>
                            <p className="text-xs md:text-sm text-slate-500 mt-1">Deep market data & system-wide trends.</p>
                        </Link>
                    </div>
                </section>

                {/* 2. Feature Management Moved to /dashboard/admin/plans */}

            </div>
        </div>
    );
}


