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
    const [reportType, setReportType] = useState<'irregularity' | 'claim' | null>(null);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportType) return;

        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('propertyId', propertyId);
        formData.append('reportType', reportType);
        formData.append('description', description);

        const res = await submitPropertyReport(formData);

        if (res.success) {
            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
                setReportType(null);
                setDescription('');
            }, 2000);
        } else {
            setError(res.error || 'Failed to submit report');
        }
        setIsSubmitting(false);
    };

    const resetForm = () => {
        setReportType(null);
        setDescription('');
        setError(null);
        setSuccess(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-3 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                title="Report Listing"
            >
                <Flag className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900">Report Listing</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {success ? (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 mb-2">Report Submitted</h4>
                                    <p className="text-slate-500 text-sm">
                                        Thank you. Our team will review your report shortly.
                                    </p>
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
                                                Incorrect price, wrong location, fake photos, or duplicate listing.
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
                                        <button type="button" onClick={resetForm} className="hover:text-slate-800 underline">Back</button>
                                        <span>/</span>
                                        <span className="font-medium capitalize text-slate-900">
                                            {reportType === 'irregularity' ? 'Report Issue' : 'Claim Ownership'}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            {reportType === 'irregularity'
                                                ? 'Please describe the issue'
                                                : 'Please provide proof or details of ownership'}
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                            className="w-full h-32 p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none text-sm"
                                            placeholder={reportType === 'irregularity'
                                                ? "e.g., The price is incorrect, photos don't match..."
                                                : "e.g., I have the exclusive contract for this property..."}
                                        />
                                    </div>

                                    {error && (
                                        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !description.trim()}
                                            className={`flex-1 py-2.5 rounded-lg font-medium text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${reportType === 'irregularity'
                                                    ? 'bg-red-600 hover:bg-red-700'
                                                    : 'bg-violet-600 hover:bg-violet-700'
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
            )}
        </>
    );
}
