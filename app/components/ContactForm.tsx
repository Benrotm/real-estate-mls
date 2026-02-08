'use client';

import { useState } from 'react';
import { Mail, Calendar, Loader2, Check } from 'lucide-react';
import { scheduleAppointment } from '../lib/actions';
import { submitPropertyInquiry } from '../lib/actions/propertyAnalytics';

interface ContactFormProps {
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
    agentName: string;
}

export default function ContactForm({ propertyId, propertyTitle, propertyAddress, agentName }: ContactFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const message = formData.get('message') as string;

        // Record the inquiry in analytics
        await submitPropertyInquiry(propertyId, { name, email, phone, message });

        // Ensure required fields for the action
        formData.append('propertyId', propertyId);
        formData.append('propertyTitle', propertyTitle);
        // adapt fields to what action likely expects or just rely on generic handling
        formData.append('notes', message);
        formData.append('clientName', name);
        formData.append('clientEmail', email);
        formData.append('clientPhone', phone);

        try {
            const result = await scheduleAppointment(formData);
            if (result.success) {
                setIsSuccess(true);
            } else {
                setError(result.error || 'Failed to send inquiry');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
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

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg">

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Full Name</label>
                    <input
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        required
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Email <span className="text-red-500">*</span></label>
                    <input
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        required
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Phone</label>
                    <input
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-400"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Schedule a Tour</label>
                    <div className="relative">
                        <input
                            name="date"
                            type="date"
                            className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-400"
                        />
                        {/* Default date input usually has an icon, but if not we can position one, standard inputs are fine for now */}
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
            </form>
        </div>
    );
}
