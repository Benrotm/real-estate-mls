'use client';

import { Users, Shield, Database, LayoutGrid, Mail, Phone, Star, Search, Filter, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import UserActions from './UserActions';

interface UserTableProps {
    users: any[];
}

export default function UserTable({ users }: UserTableProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [planFilter, setPlanFilter] = useState('all');

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch =
                user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.id.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRole = roleFilter === 'all' || user.role === roleFilter;
            const matchesPlan = planFilter === 'all' || user.plan_tier?.toLowerCase() === planFilter.toLowerCase();

            return matchesSearch && matchesRole && matchesPlan;
        });
    }, [users, searchQuery, roleFilter, planFilter]);

    if (!users || users.length === 0) {
        return (
            <div className="p-8 text-center text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters UI */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-10 py-2.5 text-white focus:border-blue-500 outline-none transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-40">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Shield size={16} />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            <option value="owner">Owner</option>
                            <option value="agent">Agent</option>
                            <option value="developer">Developer</option>
                            <option value="client">Client</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>

                    <div className="relative flex-1 md:w-40">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            <Filter size={16} />
                        </div>
                        <select
                            value={planFilter}
                            onChange={(e) => setPlanFilter(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-blue-500 outline-none appearance-none transition-all cursor-pointer"
                        >
                            <option value="all">All Plans</option>
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="professional">Professional</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950 border-b border-slate-800 text-xs uppercase text-slate-400 tracking-wider">
                                <th className="p-4 font-bold">User</th>
                                <th className="p-4 font-bold">Contact</th>
                                <th className="p-4 font-bold">Role</th>
                                <th className="p-4 font-bold">Plan</th>
                                <th className="p-4 font-bold">Listings</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-slate-500">
                                        <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No users match your filters.</p>
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setRoleFilter('all');
                                                setPlanFilter('all');
                                            }}
                                            className="mt-4 text-blue-500 hover:text-blue-400 font-bold"
                                        >
                                            Clear all filters
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700 overflow-hidden">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                                    ) : user.full_name ? (
                                                        user.full_name[0]
                                                    ) : (
                                                        <Users size={16} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-blue-400 transition-colors">
                                                        {user.full_name || 'Unknown User'}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                                                        ID: {user.id.slice(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Mail size={12} className="text-slate-500" />
                                                    <span>{user.email || 'No Email'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Phone size={12} className="text-slate-500" />
                                                    <span>{user.phone || 'No Phone'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.role === 'admin' || user.role === 'super_admin'
                                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                : user.role === 'agent'
                                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                }`}>
                                                {user.role === 'super_admin' && <Shield size={10} />}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-slate-300 font-medium capitalize">
                                                {user.plan_tier || 'Free'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <LayoutGrid size={14} className="text-slate-500" />
                                                    <span className="font-mono text-slate-300">
                                                        {user.listings_count || 0} / {(user.listings_limit || 0) + (user.bonus_listings || 0)}
                                                    </span>
                                                    {user.bonus_listings > 0 && (
                                                        <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                                                            +{user.bonus_listings} Bonus
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Star size={14} className="text-orange-500" />
                                                    <span className="text-xs text-slate-400">
                                                        {user.featured_limit || 0} Featured
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end">
                                                <UserActions user={user} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
