import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { User, Mail, Shield, Building } from 'lucide-react';
import AvatarUpload from '../components/AvatarUpload';

export default async function ProfilePage() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect('/auth/login');
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 mt-16">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-slate-900 px-6 py-8 sm:p-10">
                    <div className="flex items-center gap-6">
                        <AvatarUpload
                            userId={profile.id}
                            currentAvatarUrl={profile.avatar_url}
                            fullName={profile.full_name}
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-white">{profile.full_name || 'User'}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium text-cyan-300 backdrop-blur-sm border border-white/10 uppercase tracking-wider">
                                    {profile.role}
                                </span>
                                <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium text-orange-300 backdrop-blur-sm border border-white/10 uppercase tracking-wider">
                                    {profile.plan_tier} Plan
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-8 sm:p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-orange-600" />
                                Personal Information
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                                    <div className="text-slate-900 font-medium">{profile.full_name || 'Not set'}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> Email
                                    </label>
                                    <div className="text-slate-900 font-medium">{profile.full_name ? `${profile.full_name.toLowerCase().replace(' ', '.')}@example.com` : 'user@example.com'}</div>
                                    <p className="text-xs text-slate-400 mt-1">*Email masked for privacy in this demo</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-orange-600" />
                                Account Details
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">User ID</label>
                                    <div className="text-slate-600 font-mono text-sm">{profile.id}</div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Building className="w-3 h-3" /> Listings
                                    </label>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-slate-900">{profile.listings_count}</span>
                                        <span className="text-sm text-slate-500">/ {profile.listings_limit} used</span>
                                    </div>
                                    <div className="mt-2 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-orange-500 h-2 rounded-full transition-all"
                                            style={{ width: `${Math.min((profile.listings_count / profile.listings_limit) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-8 flex justify-end">
                        <form action="/auth/signout" method="post">
                            <button className="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                                Sign Out
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
