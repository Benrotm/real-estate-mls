'use client';

import { useState } from 'react';
import { Flag, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { submitPropertyReport } from '@/app/lib/actions/tickets';

interface ReportListingButtonProps {
    propertyId: string;
    propertyTitle: string;
}

export default function ReportListingButton({ propertyId, propertyTitle }: ReportListingButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [reportType, setReportType] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New fields for "Broker not Owner"
    const [brokerName, setBrokerName] = useState('');
    const [agencyName, setAgencyName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportType) return;

        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('propertyId', propertyId);
        formData.append('reportType', reportType);

        let finalDescription = description;
        if (reportType === 'not_owner') {
            finalDescription = `Broker Name: ${brokerName}\nAgency: ${agencyName}\n\n${description}`;
        }
        formData.append('description', finalDescription);

        const res = await submitPropertyReport(formData);

        if (res.success) {
            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
                resetForm();
            }, 2000);
        } else {
            setError(res.error || 'Failed to submit report');
        }

        setIsSubmitting(false);
    };

    const resetForm = () => {
        setReportType(null);
        setDescription('');
        setBrokerName('');
        setAgencyName('');
        setError(null);
        setSuccess(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex flex-col items-center gap-1 min-w-[60px] text-slate-500 hover:text-slate-900 transition-colors"
            >
                <div className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                    <Flag className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">Report</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Report Listing</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Report Submitted</h3>
                            <p className="text-slate-500">Thank you for helping us maintain platform quality.</p>
                        </div>
                    ) : !reportType ? (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 mb-4">
                                What would you like to do regarding <strong>{propertyTitle}</strong>?
                            </p>

                            <button
                                onClick={() => setReportType('irregularity')}
                                className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all text-left group"
                            >
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-200 transaction-colors">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-red-700">Report Irregularity</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Incorrect price, fake photos, misleading info.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => setReportType('sold_rented')}
                                className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left group"
                            >
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-200 transaction-colors">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-orange-700">Sold/Rented - Not Available</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Property is no longer on the market.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => setReportType('not_owner')}
                                className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                            >
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200 transaction-colors">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-blue-700">Broker not Owner</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Listing posted by broker, not the owner.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => setReportType('claim')}
                                className="w-full flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-left group"
                            >
                                <div className="p-2 bg-violet-100 text-violet-600 rounded-lg group-hover:bg-violet-200 transaction-colors">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 group-hover:text-violet-700">Claim Ownership</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        This property belongs to my portfolio and I want to manage it.
                                    </p>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-sm text-slate-500">
                                <button type="button" onClick={() => setReportType(null)} className="hover:text-slate-800 underline">Back</button>
                                <span>/</span>
                                <span className="font-medium capitalize text-slate-900">
                                    {reportType === 'irregularity' ? 'Report Issue' : reportType?.replace('_', ' ')}
                                </span>
                            </div>

                            {reportType === 'not_owner' && (
                                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Broker Name</label>
                                        <input
                                            type="text"
                                            value={brokerName}
                                            onChange={(e) => setBrokerName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Agency Name</label>
                                        <input
                                            type="text"
                                            value={agencyName}
                                            onChange={(e) => setAgencyName(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm"
                                            placeholder="Best Realty"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    {reportType === 'claim' ? 'Proof of Ownership / Details' : 'Description'}
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    className="w-full h-32 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none text-sm"
                                    placeholder={reportType === 'claim' ? "Please provide details verifying your ownership..." : "Please describe the issue..."}
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReportType(null)}
                                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !description.trim()}
                                    className={`flex-1 py-2.5 rounded-lg font-medium text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${reportType === 'claim'
                                        ? 'bg-violet-600 hover:bg-violet-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
