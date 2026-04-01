"use client";
import React, { useState, useEffect } from 'react';
import { Users, Mail, UserMinus, Plus, ShieldCheck } from 'lucide-react';

export default function AgencyTeamManagement() {
    const [members, setMembers] = useState<any[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/team/members');
            const data = await res.json();
            if (res.ok) {
                setMembers(data.members || []);
                setInvites(data.pendingInvites || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        try {
            const res = await fetch('/api/team/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail })
            });
            if (res.ok) {
                setInviteEmail('');
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to send invite');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setInviting(false);
        }
    };

    const removeMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this agent from your team? They will lose access to team features.')) return;
        try {
            const res = await fetch('/api/team/members', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberId })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-8">Loading team...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Team</h1>
                    <p className="text-slate-500 mt-1">Manage your agents and send invitations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Invite Form & Pending */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Invite Agent</h2>
                        </div>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Email Address</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={inviteEmail} 
                                    onChange={(e) => setInviteEmail(e.target.value)} 
                                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none" 
                                    placeholder="agent@example.com"
                                />
                            </div>
                            <button 
                                disabled={inviting} 
                                type="submit" 
                                className="w-full bg-slate-900 text-white font-medium py-2 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {inviting ? 'Inviting...' : <><Plus className="w-4 h-4"/> Send Invite</>}
                            </button>
                        </form>
                    </div>

                    {invites.length > 0 && (
                        <div className="bg-white border rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">Pending Invites ({invites.length})</h3>
                            <div className="space-y-3">
                                {invites.map(inv => (
                                    <div key={inv.id} className="text-sm bg-slate-50 p-3 rounded-lg border flex justify-between items-center">
                                        <div className="truncate text-slate-600 font-medium">{inv.invitee_email}</div>
                                        <div className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded">Pending</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Active Members */}
                <div className="lg:col-span-2">
                    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Users className="w-5 h-5 text-slate-400" /> Active Team Members ({members.length})
                            </h2>
                        </div>
                        
                        {members.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                You haven't added any agents to your team yet. Use the invite form to get started.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {members.map(member => (
                                    <div key={member.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
                                                        {member.full_name?.charAt(0) || 'A'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                                    {member.full_name}
                                                    {member.plan_tier === 'enterprise' && <span title="Agency Manager"><ShieldCheck className="w-4 h-4 text-orange-500" /></span>}
                                                </div>
                                                {member.email && (
                                                    <div className="text-xs text-slate-500 mt-0.5">{member.email}</div>
                                                )}
                                                <div className="text-sm text-slate-500 flex gap-4 mt-1">
                                                    <span>{member.listings_count} Listings</span>
                                                    <span className="capitalize">{member.plan_tier || 'Free'} Plan</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Don't let the manager remove themselves */}
                                        {member.plan_tier !== 'enterprise' ? (
                                            <button 
                                                onClick={() => removeMember(member.id)}
                                                className="text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center gap-2"
                                                title="Remove from team"
                                            >
                                                <UserMinus className="w-4 h-4" /> <span className="hidden sm:inline">Remove</span>
                                            </button>
                                        ) : (
                                            <span className="text-xs font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded">Manager</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
