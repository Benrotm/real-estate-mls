'use client';

import { useState } from 'react';
import { Send, Phone, Calendar, Check, ExternalLink, Loader2 } from 'lucide-react';
import { submitContactForm, scheduleAppointment } from '../lib/actions';

interface ContactFormProps {
    propertyTitle: string;
    propertyAddress: string;
    agentName: string;
}

export default function ContactForm({ propertyTitle, propertyAddress, agentName }: ContactFormProps) {
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleMessage, setScheduleMessage] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        formData.append('propertyId', '1'); // For demo, we'd pass this as prop ideally
        formData.append('notes', scheduleMessage);
        formData.append('date', scheduleDate);
        formData.append('clientName', formData.get('name') as string);
        formData.append('clientPhone', formData.get('phone') as string);

        const result = await scheduleAppointment(formData);

        if (result.success) {
            setIsScheduled(true);
        } else {
            setError(result.error || 'Failed to schedule appointment');
        }
        setIsLoading(false);
    };

    const handleContact = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        formData.append('propertyId', '1'); // Demo ID
        formData.append('propertyTitle', propertyTitle);

        const result = await submitContactForm(formData);

        if (result.success) {
            alert('Message sent successfully!');
            (e.target as HTMLFormElement).reset();
        } else {
            setError(result.error || 'Failed to send message');
        }
        setIsLoading(false);
    };

    const getGoogleCalendarUrl = () => {
        if (!scheduleDate) return '#';

        const date = new Date(scheduleDate);
        const endTime = new Date(date.getTime() + 60 * 60 * 1000); // 1 hour duration

        const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const start = formatTime(date);
        const end = formatTime(endTime);

        const details = `Property visit for ${propertyTitle} at ${propertyAddress}. Agent: ${agentName}\n\nMessage: ${scheduleMessage}`;

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Property+Visit:+${encodeURIComponent(propertyTitle)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(propertyAddress)}`;
    };

    return (
        <div className="space-y-4">
            {/* Standard Contact Fields */}
            {!isScheduling && !isScheduled && (
                <form className="space-y-4" onSubmit={handleContact}>
                    {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</div>}
                    <input name="name" type="text" placeholder="Your Name" required className="w-full p-3 bg-secondary/5 border border-border rounded-lg text-sm focus:border-secondary outline-none" />
                    <input name="email" type="email" placeholder="Email Address" required className="w-full p-3 bg-secondary/5 border border-border rounded-lg text-sm focus:border-secondary outline-none" />
                    <input name="phone" type="tel" placeholder="Phone Number" required className="w-full p-3 bg-secondary/5 border border-border rounded-lg text-sm focus:border-secondary outline-none" />
                    <textarea name="message" rows={3} placeholder="I am interested in this property..." required className="w-full p-3 bg-secondary/5 border border-border rounded-lg text-sm focus:border-secondary outline-none"></textarea>

                    <button
                        type="button"
                        onClick={() => setIsScheduling(true)}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        <Calendar className="w-4 h-4" /> Schedule Viewing
                    </button>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-secondary text-secondary-foreground py-3 rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Message
                    </button>
                </form>
            )}

            {/* Scheduling View */}
            {isScheduling && !isScheduled && (
                <form className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300" onSubmit={handleSchedule}>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-md">Select a Time</h4>
                        <button type="button" onClick={() => setIsScheduling(false)} className="text-xs text-foreground/50 hover:text-foreground">Cancel</button>
                    </div>

                    {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</div>}

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground/70 uppercase">Date & Time</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full p-3 bg-white border border-border rounded-lg text-sm focus:border-secondary outline-none text-slate-900"
                            onChange={(e) => setScheduleDate(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground/70 uppercase">Your Info</label>
                        <input name="name" type="text" placeholder="Your Name" required className="w-full p-3 bg-secondary/5 border border-border rounded-lg text-sm focus:border-secondary outline-none" />
                        <input name="phone" type="tel" placeholder="Phone Number" required className="w-full p-3 bg-secondary/5 border border-border rounded-lg text-sm focus:border-secondary outline-none" />
                        <textarea
                            rows={2}
                            placeholder="Any specific requests? (e.g. Gate code, specific questions)"
                            className="w-full p-3 bg-secondary/5 border border-border rounded-lg text-sm focus:border-secondary outline-none"
                            onChange={(e) => setScheduleMessage(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm Appointment
                    </button>
                </form>
            )}

            {/* Success View */}
            {isScheduled && (
                <div className="text-center space-y-4 animate-in zoom-in duration-300 py-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Check className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-lg">Request Sent!</h4>
                    <p className="text-sm text-foreground/60">
                        The agent will confirm your appointment shortly.
                    </p>

                    <a
                        href={getGoogleCalendarUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
                    >
                        <Calendar className="w-4 h-4" />
                        Add to Google Calendar
                        <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </a>

                    <button
                        onClick={() => {
                            setIsScheduled(false);
                            setIsScheduling(false);
                            setScheduleDate('');
                            setScheduleMessage('');
                        }}
                        className="text-sm text-primary hover:underline mt-4"
                    >
                        Back to property
                    </button>
                </div>
            )}
        </div>
    );
}
