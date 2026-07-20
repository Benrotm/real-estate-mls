import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { getDashboardData } from '@/app/lib/actions/admin-dashboard';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const profile = await getUserProfile();

    // Security Check
    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin')) {
        redirect('/dashboard');
    }

    const isSuperAdmin = profile.role === 'super_admin';
    const data = await getDashboardData();

    return (
        <div className="min-h-screen bg-slate-950 text-white px-3 py-4 md:p-8 pt-20">
            <div className="max-w-7xl mx-auto">
                <AdminDashboardClient 
                    data={data}
                    adminName={profile.full_name || 'Admin'}
                    isSuperAdmin={isSuperAdmin}
                />
            </div>
        </div>
    );
}
