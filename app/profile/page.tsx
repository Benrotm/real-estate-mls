import { getUserProfile } from '../lib/auth';
import { User, Mail, Shield, Award } from 'lucide-react';

export default async function ProfilePage() {
    const profile = await getUserProfile();

    if (!profile) {
        return (
            <div className="min-h-screen pt-24 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Please Log In</h1>
                    <p className="text-slate-600 mt-2">You need to be logged in to view your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#1e293b] px-6 py-8 text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/20">
                                {profile.full_name?.charAt(0) || <User />}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                                <p className="text-slate-300 flex items-center gap-2 mt-1">
                                    <Shield className="w-4 h-4" /> {profile.role} account
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="px-6 py-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account ID</label>
                                <p className="text-slate-900 font-mono text-sm mt-1">{profile.id}</p>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Plan</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Award className="w-5 h-5 text-orange-500" />
                                    <span className="text-slate-900 font-bold capitalize">{profile.plan_tier}</span>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Listings Usage</label>
                                <p className="text-slate-900 font-medium mt-1">
                                    {profile.listings_count} / {profile.listings_limit} used
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-orange-500 h-2 rounded-full"
                                        style={{ width: `${Math.min(100, (profile.listings_count / profile.listings_limit) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Account Settings</h3>
                            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors">
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
