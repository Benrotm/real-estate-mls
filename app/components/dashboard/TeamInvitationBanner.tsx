"use client";
import React, { useState, useEffect } from 'react';
import { Users, Check, X } from 'lucide-react';

export default function TeamInvitationBanner() {
    const [invites, setInvites] = useState<any[]>([]);

    const fetchInvites = async () => {
        try {
            const res = await fetch('/api/team/invites');
            const data = await res.json();
            if (data.invites) {
                setInvites(data.invites);
            }
        } catch (e) {
            console.error('Failed to fetch invites', e);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleInvite = async (inviteId: string, action: 'accept' | 'decline') => {
        try {
            await fetch(`/api/team/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId })
            });
            // Refresh invites after action
            fetchInvites();
            // Optional: force router refresh if agency_id changes impact the whole layout
            if (action === 'accept') {
                window.location.reload();
            }
        } catch (e) {
            console.error(`Failed to ${action} invite`, e);
        }
    };

    if (invites.length === 0) return null;

    return (
        <div className="space-y-4 mb-8 relative z-10 w-full mt-4">
            {invites.map((invite) => (
                <div key={invite.id} className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 border border-blue-400/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Team Invitation</h3>
                            <p className="text-blue-100 text-sm">You have been invited to join <strong>{invite.profiles?.full_name || 'an Agency'}&apos;s</strong> team.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button 
                            onClick={() => handleInvite(invite.id, 'accept')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-sm"
                        >
                            <Check className="w-4 h-4" /> Accept
                        </button>
                        <button 
                            onClick={() => handleInvite(invite.id, 'decline')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-700/50 text-white border border-blue-400/30 px-5 py-2.5 rounded-lg font-bold hover:bg-blue-700/70 transition-colors shadow-sm"
                        >
                            <X className="w-4 h-4" /> Decline
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
