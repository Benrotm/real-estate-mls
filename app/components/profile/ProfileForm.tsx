'use client';

import { useState } from 'react';
import { User, Phone, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { updateUserProfile } from '@/app/lib/actions/user';

interface ProfileFormProps {
    initialFullName: string;
    initialPhone: string;
    email: string;
}

export default function ProfileForm({ initialFullName, initialPhone, email }: ProfileFormProps) {
    const [fullName, setFullName] = useState(initialFullName);
    const [phone, setPhone] = useState(initialPhone || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            const result = await updateUserProfile({ full_name: fullName, phone });

            if (result.error) {
                setStatus('error');
                setErrorMessage(result.error);
            } else {
                setStatus('success');
                // Status message will auto-hide after 3 seconds
                setTimeout(() => setStatus('idle'), 3000);
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-orange-600" />
                        Personal Information
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label htmlFor="fullName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User className="w-4 h-4" />
                                </div>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                disabled
                                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-500 cursor-not-allowed"
                            />
                            <p className="text-[10px] text-slate-400 font-medium italic">Email cannot be changed directly for security reasons.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Save className="w-5 h-5 text-orange-600" />
                        Save Changes
                    </h3>
                    <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Keeping your profile information up to date ensures that potential buyers or agents can reach you easily.
                            Your name and phone number will be visible to users who view your listings or contact you.
                        </p>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg ${isSubmitting
                                    ? 'bg-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25 hover:-translate-y-0.5'
                                }`}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {isSubmitting ? 'Updating...' : 'Save Changes'}
                        </button>

                        {status === 'success' && (
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-sm font-bold">Profile updated successfully!</span>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm font-bold">{errorMessage}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}
