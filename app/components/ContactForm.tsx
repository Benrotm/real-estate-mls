'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Calendar, Loader2, Check, Lock } from 'lucide-react';
import Link from 'next/link';
import { scheduleAppointment } from '../lib/actions';
import { submitPropertyInquiry } from '../lib/actions/propertyAnalytics';
import { supabase } from '../lib/supabase/client';
import MakeOfferButton from './property/MakeOfferButton';

interface ContactFormProps {
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
    agentName: string;
    showMakeOffer?: boolean;
    currency?: string;
}

export default function ContactForm({ propertyId, propertyTitle, propertyAddress, agentName, showMakeOffer = false, currency = 'EUR' }: ContactFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // UseRef for immediate synchronous blocking of double-submits
    const isSubmitting = useRef(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email, phone')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserProfile({
                        ...profile,
                        email: profile.email || user.email // Fallback to auth email
                    });
                } else {
                    // Fallback to auth user metadata if profile missing
                    setUserProfile({
                        full_name: user.user_metadata?.full_name,
                        email: user.email,
                        phone: user.phone
                    });
                }
            }
            setIsCheckingAuth(false);
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Immediate check against ref
        if (isSubmitting.current) return;
        isSubmitting.current = true;

        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData(e.currentTarget);

            // Resolve contact info (profile vs form input)
            const name = userProfile?.full_name || formData.get('name') as string;
            const email = userProfile?.email || formData.get('email') as string;
            const phone = userProfile?.phone || formData.get('phone') as string;

            const message = formData.get('message') as string;
            const date = formData.get('date') as string;

            // 1. Submit Inquiry (Primary Action - Chat & Analytics)
            const inquiryResult = await submitPropertyInquiry(propertyId, {
                name,
                email,
                phone,
                message
            });

            if (!inquiryResult.success) {
                throw new Error(inquiryResult.error || 'Failed to send inquiry');
            }

            // 2. Schedule Appointment (Optional - Only if date selected)
            if (date) {
                const appointmentData = new FormData();
                appointmentData.append('clientName', name);
                appointmentData.append('clientPhone', phone);
                appointmentData.append('clientEmail', email);
                appointmentData.append('notes', message);
                appointmentData.append('date', date);
                appointmentData.append('propertyId', propertyId);

                await scheduleAppointment(appointmentData);
            }

            setIsSuccess(true);
        } catch (err: any) {
            console.error('Inquiry submission error:', err);
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            isSubmitting.current = false;
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-4 animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Inquiry Sent!</h3>
                    <p className="text-slate-500 mt-2">
                        Your request for <span className="font-semibold">{propertyTitle}</span> has been sent to {agentName}.
                    </p>
                </div>
                <button
                    onClick={() => setIsSuccess(false)}
                    className="text-orange-500 font-bold hover:underline"
                >
                    Send another inquiry
                </button>
            </div>
        );
    }

    if (!userProfile && !isCheckingAuth) {
        return (
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg text-center space-y-6">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                    <Lock className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Contact Agent</h3>
                    <p className="text-slate-500 mt-2">
                        Please sign in to send inquiries, schedule tours, and view property documents.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <Link
                        href="/auth/login"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all hover:bg-slate-50"
                    >
                        Create Account
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">
            {isCheckingAuth ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Schedule a Tour</label>
                        <div className="relative">
                            <input
                                name="date"
                                type="date"
                                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700">Your Message <span className="text-red-500">*</span></label>
                        <textarea
                            name="message"
                            rows={3}
                            placeholder="I'm interested in this property..."
                            required
                            className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                        Send Inquiry
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-slate-100"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or</span>
                        <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    <MakeOfferButton
                        propertyId={propertyId}
                        propertyTitle={propertyTitle}
                        currency={currency}
                        showMakeOffer={showMakeOffer}
                        fullWidth={true}
                        variant="outline"
                    />
                </form>
            )}
        </div>
    );
}
