import { createClient } from '@/app/lib/supabase/server';
import { verifySoldHistory, rejectSoldHistory } from '@/app/lib/actions/admin-valuation';
import { Check, X, ShieldAlert, TrendingUp, AlertCircle } from 'lucide-react';

export default async function AdminValuationPage() {
    const supabase = await createClient();

    // Fetch Verification Queue
    const { data: pendingReviews } = await supabase
        .from('property_sold_history')
        .select(`
            *,
            properties (title, address, location_city),
            reporter:reporter_id (email)
        `)
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

    // Fetch Analytics (Mock or Real)
    // Count total reports
    const { count: totalReports } = await supabase
        .from('property_sold_history')
        .select('*', { count: 'exact', head: true });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Valuation Engine</h1>
                    <p className="text-slate-500">Manage smart valuation parameters and verify data.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Total Price Reports</p>
                            <p className="text-2xl font-bold text-slate-900">{totalReports || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Pending Verification</p>
                            <p className="text-2xl font-bold text-slate-900">{pendingReviews?.length || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verification Queue */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        Verification Queue
                    </h2>
                    <p className="text-sm text-slate-500">Review reported sold prices before they impact valuation models.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Property</th>
                                <th className="px-6 py-4">Reported Price</th>
                                <th className="px-6 py-4">Sold Date</th>
                                <th className="px-6 py-4">Reporter</th>
                                <th className="px-6 py-4">Notes</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {pendingReviews?.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{item.properties?.title || 'Unknown Property'}</div>
                                        <div className="text-xs text-slate-500">{item.properties?.address}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-emerald-600">
                                        € {item.sold_price}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(item.sold_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {/* @ts-ignore - Supabase type/join quirk */}
                                        {item.reporter?.email || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">
                                        {item.notes || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <form action={async () => {
                                                'use server';
                                                await verifySoldHistory(item.id);
                                            }}>
                                                <button className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors" title="Verify">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </form>
                                            <form action={async () => {
                                                'use server';
                                                await rejectSoldHistory(item.id);
                                            }}>
                                                <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="Reject">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {pendingReviews?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No pending verifications. Good job!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
