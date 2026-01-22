'use client';

import { useState, useTransition } from 'react';
import { updateUserBonus, sendNotification } from '@/app/lib/admin';
import { Gift, MessageSquare, Check, X } from 'lucide-react';

interface UserActionsProps {
    user: any;
}

export default function UserActions({ user }: UserActionsProps) {
    const [showBonusModal, setShowBonusModal] = useState(false);
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [bonusAmount, setBonusAmount] = useState(user.bonus_listings || 0);
    const [msgTitle, setMsgTitle] = useState('');
    const [msgBody, setMsgBody] = useState('');

    const handleBonusSave = () => {
        startTransition(async () => {
            try {
                await updateUserBonus(user.id, Number(bonusAmount));
                alert('Bonus listings updated!');
                setShowBonusModal(false);
            } catch (e: any) {
                alert('Failed: ' + e.message);
            }
        });
    };

    const handleSendMsg = () => {
        startTransition(async () => {
            try {
                await sendNotification(user.id, msgTitle, msgBody);
                alert('Message sent!');
                setShowMsgModal(false);
                setMsgTitle('');
                setMsgBody('');
            } catch (e: any) {
                alert('Failed: ' + e.message);
            }
        });
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => setShowBonusModal(true)}
                className="p-2 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg transition-colors border border-purple-500/30"
                title="Add Bonus Listings"
            >
                <Gift size={16} />
            </button>

            <button
                onClick={() => setShowMsgModal(true)}
                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors border border-blue-500/30"
                title="Send Message"
            >
                <MessageSquare size={16} />
            </button>

            {/* Bonus Modal */}
            {showBonusModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Gift className="text-purple-500" /> Manage Bonus
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Grant extra listings to <strong>{user.full_name || 'User'}</strong> beyond their plan limit.
                        </p>
                        <div className="mb-4">
                            <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Bonus Listings</label>
                            <input
                                type="number"
                                value={bonusAmount}
                                onChange={(e) => setBonusAmount(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-purple-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowBonusModal(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBonusSave}
                                disabled={isPending}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold flex items-center gap-2"
                            >
                                {isPending ? 'Saving...' : <><Check size={16} /> Save</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Modal */}
            {showMsgModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <MessageSquare className="text-blue-500" /> Message User
                        </h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={msgTitle}
                                    onChange={(e) => setMsgTitle(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Important Update..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Message</label>
                                <textarea
                                    value={msgBody}
                                    onChange={(e) => setMsgBody(e.target.value)}
                                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors resize-none"
                                    placeholder="Type your message here..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowMsgModal(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendMsg}
                                disabled={isPending}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2"
                            >
                                {isPending ? 'Sending...' : <><Check size={16} /> Send Message</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
